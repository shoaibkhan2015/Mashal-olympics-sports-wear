import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  FolderOpen,
  LayoutTemplate,
  LogOut,
  MessagesSquare,
  Package,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingCmsSchemaError } from "@/lib/cms";
import type { Order, Product } from "@/lib/supabase/types";
import { MediaPicker } from "@/components/admin/media-picker";
import { ProductForm } from "@/components/admin/product-form";
import { CatalogRow } from "@/components/admin/catalog-row";
import { AdminSubmit } from "@/components/admin/admin-controls";
import "./admin.css";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { ProductAdminList } from "@/components/admin/product-admin-list";
import { PasswordField } from "@/components/admin/password-field";
import {
  isProductDetailsSchemaError,
  legacyProductColumns,
  productColumns,
  withProductDetails,
} from "@/lib/supabase/product-details";
import {
  createCategory,
  deleteCategory,
  saveStorefrontContent,
  signIn,
  signOut,
  updateCategory,
  updateOrder,
  updateQuote,
} from "./actions";

export const dynamic = "force-dynamic";

const sections = [
  { id: "products", label: "Products", Icon: Package },
  { id: "collections", label: "Collections", Icon: FolderOpen },
  { id: "pages", label: "Storefront pages", Icon: LayoutTemplate },
  { id: "orders", label: "Orders", Icon: ShoppingBag },
  { id: "quotes", label: "Quote requests", Icon: MessagesSquare },
] as const;

const errorMessages: Record<string, string> = {
  unauthorized: "Sign-in failed or this account is not an administrator.",
  credentials: "Enter your email and password.",
  signout: "Could not sign out. Please try again.",
  product:
    "Enter a valid product name, select a collection, and check the description, options and stock.",
  "product-details-schema":
    "Apply the product details database migration before saving optional product details.",
  image: "Use an image URL beginning with http://, https://, or a single /.",
  price: "Active products need a non-negative PKR price.",
  discount: "Enter a discount from 0 to 100 with up to two decimal places.",
  "product-save":
    "Product could not be saved. Check that the selected collection still exists and try again.",
  "product-delete": "Product could not be deleted.",
  collection: "Enter a valid collection name, tagline, and display order.",
  "collection-save": "Collection could not be saved.",
  "collection-delete":
    "This collection is in use by products or customer requests. Deactivate it instead of deleting it.",
  content: "Check the content fields and try again.",
  "content-url": "Social links must be complete http(s) URLs.",
  whatsapp: "Enter a valid WhatsApp number with its country code (7–15 digits).",
  "content-save": "Storefront content could not be saved.",
  order: "The order status is invalid.",
  "order-save": "The order could not be updated.",
  quote: "The quote status is invalid.",
  "quote-save": "The quote request could not be updated.",
};
const noticeMessages: Record<string, string> = {
  "product-created": "Product added.",
  "product-updated": "Product updated.",
  "product-deleted": "Product deleted.",
  "collection-created": "Collection created.",
  "collection-updated": "Collection updated.",
  "collection-deleted": "Collection deleted.",
  "content-updated": "Storefront changes published.",
  "order-updated": "Order updated.",
  "quote-updated": "Quote request updated.",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    section?: string;
    new?: string;
    editCollection?: string;
    editPage?: string;
    error?: string;
    notice?: string;
    expandedProduct?: string;
    productPageSize?: string;
    productsExpanded?: string;
  }>;
}) {
  const params = await searchParams;
  const active = sections.find(({ id }) => id === params.section) ?? sections[0];
  const section = active.id;
  const showCreate = params.new === "1";
  const requestedProductPageSize = Number(params.productPageSize ?? 10);
  const productPageSize =
    Number.isInteger(requestedProductPageSize) &&
    requestedProductPageSize >= 10 &&
    requestedProductPageSize <= 500
      ? requestedProductPageSize
      : 10;
  const productsExpanded = params.productsExpanded === "1";
  const initialProductLimit = productsExpanded ? productPageSize : 10;
  if (!isSupabaseConfigured()) {
    return (
      <AdminShell>
        <p>Set the Supabase project URL and anon key to enable staff sign-in.</p>
      </AdminShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError && authError.name !== "AuthSessionMissingError") {
    throw new Error(`Could not verify staff session: ${authError.message}`);
  }
  const user = auth.user;

  if (!user || user.app_metadata.role !== "admin") {
    return (
      <AdminShell>
        <p className="mb-6 text-sm text-muted-foreground">
          Sign in with your staff account to manage the store.
        </p>
        {params.error && errorMessages[params.error] && (
          <Notice error>{errorMessages[params.error]}</Notice>
        )}
        {user && <Notice error>This account does not have admin access.</Notice>}
        <form action={signIn} className="grid max-w-md gap-4">
          <label className="grid gap-2 text-sm">
            Email
            <input
              required
              type="email"
              name="email"
              autoComplete="username"
              className={inputClass}
            />
          </label>
          <label className="grid gap-2 text-sm">
            Password
            <PasswordField />
          </label>
          <AdminSubmit pendingLabel="Signing in…">Sign in</AdminSubmit>
        </form>
      </AdminShell>
    );
  }

  const [
    { data: categories, error: categoriesError },
    productQuery,
    { data: rawOrders, error: ordersError },
    { data: quotes, error: quotesError },
    { data: contentRows, error: contentError },
  ] = await Promise.all([
    section === "products" || section === "collections"
      ? supabase
          .from("categories")
          .select("id, slug, name, tagline, image_url, is_active, position")
          .order("position")
      : { data: null, error: null },
    section === "products"
      ? loadAdminProducts(supabase, initialProductLimit)
      : { data: null, error: null, count: 0, detailsAvailable: true },
    section === "orders"
      ? supabase
          .from("orders")
          .select(
            "id, order_number, customer_name, customer_email, customer_phone, customer_address, notes, status, payment_status, payment_method, currency, subtotal, created_at, order_items(id, product_name, unit_price, quantity, line_total, selected_size, selected_colour)",
          )
          .order("created_at", { ascending: false })
          .limit(50)
      : { data: null, error: null },
    section === "quotes"
      ? supabase
          .from("quote_requests")
          .select(
            "id, customer_name, customer_phone, product_name, quantity, needed_by, details, attachment_path, status, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(50)
      : { data: null, error: null },
    section === "pages"
      ? supabase
          .from("storefront_content")
          .select("content_key, content")
          .in("content_key", ["home", "about", "site", "shop", "contact"])
      : { data: null, error: null },
  ]);
  const {
    data: rawProducts,
    error: productsError,
    count: productCount,
    detailsAvailable: productDetailsAvailable,
  } = productQuery;
  const cmsMigrationMissing = contentError ? isMissingCmsSchemaError(contentError) : false;
  if (
    categoriesError ||
    productsError ||
    ordersError ||
    quotesError ||
    (contentError && !cmsMigrationMissing)
  ) {
    const message =
      categoriesError?.message ??
      productsError?.message ??
      ordersError?.message ??
      quotesError?.message ??
      contentError?.message;
    throw new Error(`Could not load the admin dashboard: ${message}`);
  }
  const products = (rawProducts ?? []) as Product[];
  let editedProduct: Product | null = null;
  if (
    section === "products" &&
    params.expandedProduct &&
    /^[0-9a-f-]{36}$/i.test(params.expandedProduct)
  ) {
    const editedProductResult = await supabase
      .from("products")
      .select(productColumns)
      .eq("id", params.expandedProduct)
      .maybeSingle();
    if (isProductDetailsSchemaError(editedProductResult.error)) {
      const legacy = await supabase
        .from("products")
        .select(legacyProductColumns)
        .eq("id", params.expandedProduct)
        .maybeSingle();
      if (legacy.error) {
        throw new Error(`Could not restore the edited product: ${legacy.error.message}`);
      }
      editedProduct = legacy.data ? (withProductDetails(legacy.data) as Product) : null;
    } else {
      if (editedProductResult.error) {
        throw new Error(
          `Could not restore the edited product: ${editedProductResult.error.message}`,
        );
      }
      editedProduct = editedProductResult.data as Product | null;
    }
  }
  const allCategories = categories ?? [];
  const content = Object.fromEntries(
    (contentRows ?? []).map((row) => [
      row.content_key,
      (row.content ?? {}) as Record<string, unknown>,
    ]),
  ) as Record<string, Record<string, unknown>>;
  const orders = (rawOrders ?? []) as Order[];
  const signedAttachments = await Promise.all(
    (quotes ?? [])
      .filter((quote) => quote.attachment_path)
      .map(async (quote) => {
        const { data, error } = await supabase.storage
          .from("quote-attachments")
          .createSignedUrl(quote.attachment_path, 60 * 60);
        if (error) throw new Error(`Could not create quote attachment link: ${error.message}`);
        return [quote.id, data.signedUrl] as const;
      }),
  );
  const attachmentUrls = new Map(signedAttachments);

  const feedback = (
    <>
      {params.error && errorMessages[params.error] && (
        <Notice error>{errorMessages[params.error]}</Notice>
      )}
      {params.notice && noticeMessages[params.notice] && (
        <Notice>{noticeMessages[params.notice]}</Notice>
      )}
    </>
  );
  const listHref = `/admin?section=${section}`;
  const createLabel = section === "products" ? "Add product" : "Add collection";
  const counts = {
    products: productCount ?? products.length,
    collections: allCategories.length,
    orders: orders.length,
    quotes: quotes?.length ?? 0,
    pages: null,
  };

  return (
    <AdminWorkspace section={section} email={user.email}>
      <header className="admin-heading">
        <div>
          <h1>
            {showCreate && (section === "products" || section === "collections")
              ? createLabel
              : active.label}
          </h1>
          {!showCreate && (
            <p>
              {counts[section] === null
                ? "Manage page content and store settings"
                : `${counts[section]} ${active.label.toLowerCase()}`}
            </p>
          )}
        </div>
        {(section === "products" || section === "collections") && (
          <Link
            className={showCreate ? "admin-button" : "admin-button admin-button-primary"}
            href={showCreate ? listHref : `${listHref}&new=1`}
          >
            {showCreate ? (
              "Back to list"
            ) : (
              <>
                <Plus size={18} aria-hidden="true" />
                {createLabel}
              </>
            )}
          </Link>
        )}
      </header>
      {feedback}
      {section === "collections" && (
        <section id="collections" aria-label="Collection management">
          {showCreate ? (
            <div className="admin-editor-card">
              <CollectionForm position={allCategories.length + 1} />
            </div>
          ) : (
            <div className="admin-list">
              {allCategories.length > 0 ? (
                <div className="admin-row-columns" aria-hidden="true">
                  <span>Collection</span>
                  <span>Display order</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
              ) : (
                <p className="admin-empty">No collections yet.</p>
              )}
              {allCategories.map((category) => (
                <CatalogRow
                  key={`${category.id}:${params.editCollection ?? ""}:${params.error ?? ""}`}
                  title={category.name}
                  subtitle={category.tagline || `/${category.slug}`}
                  imageUrl={category.image_url}
                  metadata={String(category.position)}
                  published={category.is_active}
                  initiallyOpen={params.editCollection === category.id}
                >
                  <CollectionForm category={category} position={category.position} />
                  <form action={deleteCategory} className="admin-delete-form">
                    <input type="hidden" name="id" value={category.id} />
                    <ConfirmDeleteButton label={`the ${category.name} collection`} />
                  </form>
                </CatalogRow>
              ))}
            </div>
          )}
        </section>
      )}
      {section === "products" && (
        <section id="products" aria-label="Product management">
          {!productDetailsAvailable && (
            <Notice error>
              Apply the product details migration to use fabric, fit, care, sizing and FAQ fields.
            </Notice>
          )}
          {showCreate ? (
            <div className="admin-editor-card">
              {allCategories.length === 0 ? (
                <p className="admin-empty">
                  Create a collection before adding a product.{" "}
                  <Link className="underline" href="/admin?section=collections&new=1">
                    Add collection
                  </Link>
                </p>
              ) : (
                <ProductForm
                  categories={allCategories}
                  detailsAvailable={productDetailsAvailable}
                />
              )}
            </div>
          ) : (
            <ProductAdminList
              key={JSON.stringify([
                params.notice,
                params.error,
                editedProduct,
                products.map(({ id }) => id),
              ])}
              initialProducts={products}
              total={productCount ?? products.length}
              categories={allCategories}
              editedProduct={editedProduct}
              initiallyExpanded={productsExpanded}
              productDetailsAvailable={productDetailsAvailable}
            />
          )}
        </section>
      )}

      {section === "pages" && (
        <section id="pages" aria-label={active.label}>
          <p className="mt-2 text-sm text-muted-foreground">
            Edit live page headings, calls to action, images, company information, and footer links.
          </p>
          {cmsMigrationMissing ? (
            <Notice error>
              The storefront CMS database migration is missing. Run{" "}
              <code>supabase/migrations/202611070001_storefront_cms.sql</code> in the Supabase SQL
              Editor to enable page editing and image uploads. Existing storefront content will keep
              using its defaults until then.
            </Notice>
          ) : (
            <div className="mt-5 grid gap-5">
              <ContentEditor
                open={params.editPage === "home"}
                contentKey="home"
                title="Home page"
                content={content.home ?? {}}
              />
              <ContentEditor
                open={params.editPage === "about"}
                contentKey="about"
                title="About page"
                content={content.about ?? {}}
              />
              <ContentEditor
                open={params.editPage === "shop"}
                contentKey="shop"
                title="Shop page"
                content={content.shop ?? {}}
              />
              <ContentEditor
                open={params.editPage === "contact"}
                contentKey="contact"
                title="Contact page"
                content={content.contact ?? {}}
              />
              <ContentEditor
                open={params.editPage === "site"}
                contentKey="site"
                title="Brand, navigation & footer"
                content={content.site ?? {}}
              />
            </div>
          )}
        </section>
      )}

      {section === "orders" && (
        <section id="orders" aria-label={active.label}>
          <div className="mt-4 grid gap-4">
            {orders.map((order) => (
              <article key={order.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap justify-between gap-3">
                  <h3 className="font-bold">
                    Order #{order.order_number} · {order.currency}{" "}
                    {Number(order.subtotal).toFixed(2)}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm">
                  {order.customer_name} · {order.customer_email} · {order.customer_phone}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  Delivery address: {order.customer_address}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Payment method: {order.payment_method.replaceAll("_", " ")} · Items subtotal:{" "}
                  {order.currency} {Number(order.subtotal).toFixed(2)}
                </p>
                <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground">
                  {order.order_items.map((item) => (
                    <li key={item.id}>
                      {item.quantity} × {item.product_name} — {order.currency}{" "}
                      {Number(item.line_total).toFixed(2)}
                      {(item.selected_size || item.selected_colour) &&
                        ` (${[
                          item.selected_size && `Size: ${item.selected_size}`,
                          item.selected_colour && `Colour: ${item.selected_colour}`,
                        ]
                          .filter(Boolean)
                          .join(", ")})`}
                    </li>
                  ))}
                </ul>
                {order.notes && (
                  <p className="mt-2 whitespace-pre-wrap text-sm">Notes: {order.notes}</p>
                )}
                <form action={updateOrder} className="mt-4 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={order.id} />
                  <label className="grid gap-1 text-xs">
                    Order status
                    <select name="status" defaultValue={order.status} className={inputClass}>
                      {["pending", "confirmed", "in_production", "completed", "cancelled"].map(
                        (status) => (
                          <option key={status} value={status}>
                            {status.replaceAll("_", " ")}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs">
                    Payment
                    <select
                      name="payment_status"
                      defaultValue={order.payment_status}
                      className={inputClass}
                    >
                      {["unpaid", "paid", "refunded"].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <AdminSubmit>Update order</AdminSubmit>
                </form>
              </article>
            ))}
            {orders.length === 0 && (
              <p className="rounded-xl border border-border p-5 text-sm text-muted-foreground">
                No orders yet.
              </p>
            )}
          </div>
        </section>
      )}

      {section === "quotes" && (
        <section id="quotes" aria-label={active.label}>
          <div className="mt-4 grid gap-4">
            {quotes?.map((quote) => (
              <article key={quote.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap justify-between gap-3">
                  <h3 className="font-bold">
                    {quote.product_name} · {quote.customer_name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(quote.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm">
                  {quote.customer_phone}
                  {quote.quantity ? ` · Quantity: ${quote.quantity}` : ""}
                  {quote.needed_by ? ` · Needed by: ${quote.needed_by}` : ""}
                </p>
                {quote.details && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {quote.details}
                  </p>
                )}
                {attachmentUrls.has(quote.id) && (
                  <a
                    className="mt-3 inline-block text-sm text-primary hover:underline"
                    href={attachmentUrls.get(quote.id)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View design attachment
                  </a>
                )}
                <form action={updateQuote} className="mt-4 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={quote.id} />
                  <label className="grid gap-1 text-xs">
                    Status
                    <select name="status" defaultValue={quote.status} className={inputClass}>
                      {["new", "contacted", "quoted", "accepted", "closed"].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <AdminSubmit>Update request</AdminSubmit>
                </form>
              </article>
            ))}
            {quotes?.length === 0 && (
              <p className="rounded-xl border border-border p-5 text-sm text-muted-foreground">
                No quote requests yet.
              </p>
            )}
          </div>
        </section>
      )}
    </AdminWorkspace>
  );
}

async function loadAdminProducts(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  limit: number,
) {
  const result = await supabase
    .from("products")
    .select(productColumns, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(0, limit - 1);
  if (!isProductDetailsSchemaError(result.error)) {
    return { ...result, detailsAvailable: true };
  }
  const legacy = await supabase
    .from("products")
    .select(legacyProductColumns, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(0, limit - 1);
  return {
    ...legacy,
    data: legacy.data?.map(withProductDetails),
    detailsAvailable: false,
  };
}

function AdminWorkspace({
  section,
  email,
  children,
}: {
  section: (typeof sections)[number]["id"];
  email?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-workspace">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Boxes size={22} aria-hidden="true" /> Store admin
        </div>
        <nav aria-label="Admin sections" className="admin-nav">
          {sections.map(({ id, label, Icon }) => (
            <Link
              key={id}
              href={`/admin?section=${id}`}
              aria-current={section === id ? "page" : undefined}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/shop" className="admin-store-link">
          View storefront <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </aside>
      <div className="admin-main">
        <div className="admin-account">
          <span title={email}>{email}</span>
          <form action={signOut}>
            <button className="admin-button">
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="admin-workspace admin-login">
      <div className="admin-login-card">
        <div className="admin-brand">
          <Boxes size={22} aria-hidden="true" /> Store admin
        </div>
        <h1>Staff sign-in</h1>
        {children}
        <Link href="/shop" className="admin-login-link">
          View storefront <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}

function CollectionForm({
  category,
  position,
}: {
  category?: { id: string; name: string; tagline: string; image_url: string; is_active: boolean };
  position: number;
}) {
  return (
    <form action={category ? updateCategory : createCategory} className="admin-catalog-form">
      {category && <input type="hidden" name="id" value={category.id} />}
      <fieldset className="admin-fieldset">
        <legend>Collection details</legend>
        <div className="admin-field-grid">
          <label>
            Collection name <span className="admin-required">Required</span>
            <input required name="name" maxLength={120} defaultValue={category?.name} />
          </label>
          <label>
            Display order
            <input
              name="position"
              type="number"
              min="0"
              max="10000"
              step="1"
              defaultValue={position}
              required
            />
            <small>Lower numbers appear first.</small>
          </label>
          <label className="admin-field-wide">
            Short description
            <input name="tagline" maxLength={300} defaultValue={category?.tagline} />
          </label>
        </div>
      </fieldset>
      <fieldset className="admin-fieldset">
        <legend>Cover image</legend>
        <MediaPicker
          name="image_url"
          initialUrl={category?.image_url}
          label="Collection cover image"
        />
      </fieldset>
      <div className="admin-form-actions">
        <label className="admin-checkbox">
          <input type="checkbox" name="is_active" defaultChecked={category?.is_active ?? true} />
          Publish collection
        </label>
        <AdminSubmit>{category ? "Save collection" : "Add collection"}</AdminSubmit>
      </div>
    </form>
  );
}

function Notice({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return (
    <p
      role={error ? "alert" : "status"}
      className={`admin-notice ${error ? "admin-notice-error" : ""}`}
    >
      {children}
    </p>
  );
}

function ContentEditor({
  open,
  contentKey,
  title,
  content,
}: {
  open: boolean;
  contentKey: "home" | "about" | "site" | "shop" | "contact";
  title: string;
  content: Record<string, unknown>;
}) {
  const field = (name: string, label: string, multiline = false) => (
    <label key={name} className="grid gap-2 text-sm">
      {label}
      {name === "whatsapp_number" ? (
        <>
          <input
            type="tel"
            name={name}
            autoComplete="tel"
            defaultValue={textValue(content, name)}
            maxLength={30}
            className={inputClass}
          />
          <span className="text-xs text-muted-foreground">
            Include the international country code. Leave blank to hide the floating WhatsApp
            button.
          </span>
        </>
      ) : multiline ? (
        <textarea
          name={name}
          rows={3}
          defaultValue={textValue(content, name)}
          maxLength={5000}
          className={inputClass}
        />
      ) : (
        <input
          name={name}
          defaultValue={textValue(content, name)}
          maxLength={5000}
          className={inputClass}
        />
      )}
    </label>
  );
  const fields: Record<typeof contentKey, Array<[string, string, boolean?]>> = {
    home: [
      ["seo_title", "Search engine title"],
      ["seo_description", "Search engine description", true],
      ["hero_eyebrow", "Hero eyebrow"],
      ["hero_title", "Hero title"],
      ["hero_highlight", "Hero highlighted text"],
      ["hero_subtitle", "Hero second line"],
      ["hero_description", "Hero description", true],
      ["primary_button", "Primary button"],
      ["secondary_button", "Secondary button"],
      ["collections_eyebrow", "Collections eyebrow"],
      ["collections_title", "Collections title"],
      ["collections_highlight", "Collections highlighted text"],
      ["design_eyebrow", "Design section eyebrow"],
      ["design_title", "Design section title"],
      ["design_highlight", "Design section highlighted title"],
      ["design_description", "Design section description", true],
      ["design_upload_title", "Design upload title"],
      ["design_upload_description", "Design upload instructions", true],
      ["design_category_title", "Design category title"],
      ["design_category_prompt", "Design category prompt"],
      ["design_button", "Design section button"],
      ["cta_title", "Bottom CTA title"],
      ["cta_highlight", "Bottom CTA highlighted text"],
      ["cta_description", "Bottom CTA description", true],
      ["cta_button", "Bottom CTA button"],
      ["feature_1_title", "Feature 1 title"],
      ["feature_1_text", "Feature 1 description", true],
      ["feature_2_title", "Feature 2 title"],
      ["feature_2_text", "Feature 2 description", true],
      ["feature_3_title", "Feature 3 title"],
      ["feature_3_text", "Feature 3 description", true],
      ["feature_4_title", "Feature 4 title"],
      ["feature_4_text", "Feature 4 description", true],
      ["collection_cta", "Collection card button"],
      ["gallery_heading", "Gallery heading"],
    ],
    about: [
      ["seo_title", "Search engine title"],
      ["seo_description", "Search engine description", true],
      ["eyebrow", "Eyebrow"],
      ["title", "Page title"],
      ["highlight", "Highlighted title"],
      ["description", "Introduction", true],
      ["stat_1_value", "Stat 1 value"],
      ["stat_1_label", "Stat 1 label"],
      ["stat_2_value", "Stat 2 value"],
      ["stat_2_label", "Stat 2 label"],
      ["stat_3_value", "Stat 3 value"],
      ["stat_3_label", "Stat 3 label"],
      ["value_1_title", "Story card 1 title"],
      ["value_1_text", "Story card 1 text", true],
      ["value_2_title", "Story card 2 title"],
      ["value_2_text", "Story card 2 text", true],
      ["value_3_title", "Story card 3 title"],
      ["value_3_text", "Story card 3 text", true],
      ["cta_title", "Closing call-to-action title"],
      ["cta_highlight", "Closing highlighted title"],
      ["cta_button", "Closing button"],
    ],
    site: [
      ["nav_home", "Home navigation label"],
      ["nav_shop", "Shop navigation label"],
      ["nav_about", "About navigation label"],
      ["nav_contact", "Contact navigation label"],
      ["brand_name", "Brand name"],
      ["footer_text", "Footer description", true],
      ["header_cta", "Header call-to-action"],
      ["phone", "Contact phone"],
      ["email", "Contact email"],
      ["instagram_url", "Instagram URL"],
      ["facebook_url", "Facebook URL"],
      ["tiktok_url", "TikTok URL"],
      ["whatsapp_number", "WhatsApp business number (include country code)"],
      ["footer_shop_heading", "Footer shop heading"],
      ["footer_company_heading", "Footer company heading"],
      ["footer_quote_heading", "Footer quote heading"],
      ["footer_all_products", "Footer all products link"],
      ["footer_about", "Footer About link"],
      ["footer_custom_orders", "Footer custom orders link"],
      ["footer_team_quotes", "Footer team quotes link"],
      ["footer_quote_text", "Footer quote text", true],
      ["footer_quote_cta", "Footer quote button"],
    ],
    shop: [
      ["seo_title", "Search engine title"],
      ["seo_description", "Search engine description", true],
      ["eyebrow", "Eyebrow"],
      ["title", "Page title"],
      ["highlight", "Highlighted title"],
      ["description", "Introduction", true],
      ["collection_cta", "Collection card button"],
      ["collection_badge", "Collection badge"],
    ],
    contact: [
      ["seo_title", "Search engine title"],
      ["seo_description", "Search engine description", true],
      ["eyebrow", "Eyebrow"],
      ["title", "Page title"],
      ["highlight", "Highlighted title"],
      ["description", "Introduction", true],
      ["steps_title", "Process section heading"],
      ["step_1", "Process step 1", true],
      ["step_2", "Process step 2", true],
      ["step_3", "Process step 3", true],
      ["side_title", "Side card title"],
      ["side_description", "Side card description", true],
      ["side_button", "Side card button"],
    ],
  };

  return (
    <details
      id={contentKey}
      open={open || undefined}
      className="admin-page-editor rounded-xl border border-border bg-card"
    >
      <summary>{title}</summary>
      <form
        action={saveStorefrontContent}
        className="grid gap-4 border-t border-border p-6 sm:grid-cols-2"
      >
        <input type="hidden" name="content_key" value={contentKey} />
        {contentKey === "home" && (
          <div className="sm:col-span-2">
            <MediaPicker
              name="hero_image"
              initialUrl={textValue(content, "hero_image")}
              label="Home hero background image"
            />
          </div>
        )}
        {contentKey === "about" && (
          <div className="sm:col-span-2">
            <MediaPicker
              name="banner_image"
              initialUrl={textValue(content, "banner_image")}
              label="About page banner image"
            />
          </div>
        )}
        {contentKey === "site" && (
          <div className="sm:col-span-2">
            <MediaPicker
              name="logo_url"
              initialUrl={textValue(content, "logo_url")}
              label="Site logo"
            />
          </div>
        )}
        {fields[contentKey].map(([name, label, multiline]) => field(name, label, multiline))}
        {contentKey === "site" && (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="show_about"
                defaultChecked={booleanValue(content, "show_about", true)}
              />{" "}
              Show About in navigation
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="show_contact"
                defaultChecked={booleanValue(content, "show_contact", true)}
              />{" "}
              Show Contact in navigation
            </label>
          </>
        )}
        <AdminSubmit>Save {title.toLowerCase()}</AdminSubmit>
      </form>
    </details>
  );
}

function textValue(content: Record<string, unknown>, key: string) {
  const statMatch = /^stat_(\d+)_(value|label)$/.exec(key);
  if (statMatch && Array.isArray(content.stats)) {
    const row = content.stats[Number(statMatch[1]) - 1];
    if (row && typeof row === "object") {
      const value = (row as Record<string, unknown>)[statMatch[2]];
      if (typeof value === "string") return value;
    }
  }
  const valueMatch = /^value_(\d+)_(title|text)$/.exec(key);
  if (valueMatch && Array.isArray(content.values)) {
    const row = content.values[Number(valueMatch[1]) - 1];
    if (row && typeof row === "object") {
      const value = (row as Record<string, unknown>)[valueMatch[2]];
      if (typeof value === "string") return value;
    }
  }
  return typeof content[key] === "string" ? (content[key] as string) : "";
}

function booleanValue(content: Record<string, unknown>, key: string, fallback: boolean) {
  return typeof content[key] === "boolean" ? (content[key] as boolean) : fallback;
}

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground";
