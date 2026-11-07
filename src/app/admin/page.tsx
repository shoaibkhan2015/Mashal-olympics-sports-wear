import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingCmsSchemaError } from "@/lib/cms";
import type { Order, Product } from "@/lib/supabase/types";
import { MediaPicker } from "@/components/admin/media-picker";
import { ProductImagePicker } from "@/components/admin/product-image-picker";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { ProductAdminList } from "@/components/admin/product-admin-list";
import { CollapsibleCollection } from "@/components/admin/collapsible-collection";
import { PasswordField } from "@/components/admin/password-field";
import {
  createCategory,
  createProduct,
  deleteCategory,
  saveStorefrontContent,
  signIn,
  signOut,
  updateCategory,
  updateOrder,
  updateQuote,
} from "./actions";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  unauthorized: "Sign-in failed or this account is not an administrator.",
  credentials: "Enter your email and password.",
  signout: "Could not sign out. Please try again.",
  product: "Enter a valid product name and description.",
  image: "Use an image URL beginning with http://, https://, or a single /.",
  price: "Active products need a non-negative PKR price.",
  "product-save": "Product could not be saved. Check the category and slug, then try again.",
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
    error?: string;
    notice?: string;
    expandedProduct?: string;
    productPageSize?: string;
    productsExpanded?: string;
  }>;
}) {
  const params = await searchParams;
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
    if (user) redirect("/admin?error=unauthorized");
    return (
      <AdminShell>
        <p className="mb-6 max-w-xl text-sm text-muted-foreground">
          Staff access only. Admin accounts must be created in Supabase Auth and assigned the{" "}
          <code>app_metadata.role = admin</code> claim.
        </p>
        {params.error && errorMessages[params.error] && (
          <Notice error>{errorMessages[params.error]}</Notice>
        )}
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
          <button className={buttonClass}>Sign in</button>
        </form>
      </AdminShell>
    );
  }

  const [
    { data: categories, error: categoriesError },
    { data: rawProducts, error: productsError, count: productCount },
    { data: rawOrders, error: ordersError },
    { data: quotes, error: quotesError },
    { data: contentRows, error: contentError },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, name, tagline, image_url, is_active, position")
      .order("position"),
    supabase
      .from("products")
      .select(
        "id, category_id, slug, name, description, image_url, image_urls, price, currency, available_sizes, available_colours, stock_quantity, is_active",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(0, initialProductLimit - 1),
    supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, customer_email, customer_phone, notes, status, payment_status, currency, subtotal, created_at, order_items(id, product_name, unit_price, quantity, line_total, selected_size, selected_colour)",
      )
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("quote_requests")
      .select(
        "id, customer_name, customer_phone, product_name, quantity, needed_by, details, attachment_path, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("storefront_content")
      .select("content_key, content")
      .in("content_key", ["home", "about", "site", "shop", "contact"]),
  ]);
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
  const editedProductResult = params.expandedProduct
    ? await supabase
        .from("products")
        .select(
          "id, category_id, slug, name, description, image_url, image_urls, price, currency, available_sizes, available_colours, stock_quantity, is_active",
        )
        .eq("id", params.expandedProduct)
        .maybeSingle()
    : null;
  if (editedProductResult?.error) {
    throw new Error(`Could not restore the edited product: ${editedProductResult.error.message}`);
  }
  const editedProduct = editedProductResult?.data ? (editedProductResult.data as Product) : null;
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

  return (
    <AdminShell>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
        <form action={signOut}>
          <button className={secondaryButtonClass}>Sign out</button>
        </form>
      </div>
      {params.error && errorMessages[params.error] && (
        <Notice error>{errorMessages[params.error]}</Notice>
      )}
      {params.notice && noticeMessages[params.notice] && (
        <Notice>{noticeMessages[params.notice]}</Notice>
      )}

      <nav className="sticky top-24 z-20 mb-8 flex gap-2 overflow-x-auto rounded-xl border border-border bg-background/95 p-2 backdrop-blur">
        {[
          ["collections", "Collections"],
          ["products", "Products"],
          ["pages", "Storefront pages"],
          ["orders", "Orders"],
          ["quotes", "Quote requests"],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} className={secondaryButtonClass + " whitespace-nowrap"}>
            {label}
          </a>
        ))}
      </nav>

      <section id="collections" className="scroll-mt-44">
        <h2 className="font-display text-3xl uppercase">Collections ({allCategories.length})</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Collections appear on the home page and help customers choose what to request. Deactivate
          a collection to hide it without breaking old orders.
        </p>
        <form
          action={createCategory}
          className="mt-5 grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2"
        >
          <h3 className="font-display text-2xl uppercase sm:col-span-2">Create collection</h3>
          <label className="grid gap-2 text-sm">
            Collection name
            <input required name="name" maxLength={120} className={inputClass} />
          </label>
          <label className="grid gap-2 text-sm">
            Short description
            <input name="tagline" maxLength={300} className={inputClass} />
          </label>
          <label className="grid gap-2 text-sm">
            Display order
            <input
              name="position"
              type="number"
              min={0}
              defaultValue={allCategories.length + 1}
              className={inputClass}
            />
          </label>
          <MediaPicker name="image_url" label="Collection cover image" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked /> Publish collection
          </label>
          <button className={buttonClass}>Create collection</button>
        </form>
        <div className="mt-5 grid gap-4">
          {allCategories.map((category) => (
            <CollapsibleCollection
              key={category.id}
              title={category.name}
              slug={category.slug}
              imageUrl={category.image_url}
            >
              <form action={updateCategory} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="id" value={category.id} />
                <label className="grid gap-2 text-sm">
                  Name
                  <input
                    required
                    name="name"
                    defaultValue={category.name}
                    maxLength={120}
                    className={inputClass}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  Description
                  <input
                    name="tagline"
                    defaultValue={category.tagline}
                    maxLength={300}
                    className={inputClass}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  Display order
                  <input
                    name="position"
                    type="number"
                    min={0}
                    defaultValue={category.position}
                    className={inputClass}
                  />
                </label>
                <MediaPicker
                  name="image_url"
                  initialUrl={category.image_url}
                  label="Collection image"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_active" defaultChecked={category.is_active} />{" "}
                  Published
                </label>
                <button className={secondaryButtonClass}>Save collection</button>
              </form>
              <form action={deleteCategory} className="self-end lg:justify-self-end">
                <input type="hidden" name="id" value={category.id} />
                <ConfirmDeleteButton label={`the ${category.name} collection`} />
              </form>
            </CollapsibleCollection>
          ))}
        </div>
      </section>

      <section id="products" className="mt-14 scroll-mt-44">
        <h2 className="font-display text-3xl uppercase">
          Products ({productCount ?? products.length})
        </h2>
        <form
          action={createProduct}
          className="mt-5 grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2"
        >
          <h3 className="font-display text-2xl uppercase sm:col-span-2">Add product</h3>
          <label className="grid gap-2 text-sm">
            Name
            <input required name="name" maxLength={160} className={inputClass} />
          </label>
          <label className="grid gap-2 text-sm">
            Category
            <select required name="category_id" className={inputClass}>
              <option value="">Select category</option>
              {allCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Price (leave blank for quote-only)
            <input name="price" type="number" min="0" step="0.01" className={inputClass} />
          </label>
          <ProductImagePicker />
          <label className="grid gap-2 text-sm">
            Available sizes (comma-separated)
            <input
              name="available_sizes"
              placeholder="S, M, L, XL"
              maxLength={1200}
              className={inputClass}
            />
          </label>
          <label className="grid gap-2 text-sm">
            Available colours (comma-separated)
            <input
              name="available_colours"
              placeholder="Black, Red, Blue"
              maxLength={1800}
              className={inputClass}
            />
          </label>
          <label className="grid gap-2 text-sm">
            Stock quantity (leave blank for made to order)
            <input name="stock_quantity" type="number" min={0} step={1} className={inputClass} />
          </label>
          <label className="grid gap-2 text-sm sm:col-span-2">
            Description
            <textarea name="description" rows={3} maxLength={4000} className={inputClass} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" /> Publish (requires a price)
          </label>
          <button className={buttonClass}>Add product</button>
        </form>
        <ProductAdminList
          initialProducts={products}
          total={productCount ?? products.length}
          categories={allCategories}
          editedProduct={editedProduct}
          initiallyExpanded={productsExpanded}
        />
      </section>

      <section id="pages" className="mt-14 scroll-mt-44">
        <h2 className="font-display text-3xl uppercase">Storefront pages & site settings</h2>
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
            <ContentEditor contentKey="home" title="Home page" content={content.home ?? {}} />
            <ContentEditor contentKey="about" title="About page" content={content.about ?? {}} />
            <ContentEditor contentKey="shop" title="Shop page" content={content.shop ?? {}} />
            <ContentEditor
              contentKey="contact"
              title="Contact page"
              content={content.contact ?? {}}
            />
            <ContentEditor
              contentKey="site"
              title="Brand, navigation & footer"
              content={content.site ?? {}}
            />
          </div>
        )}
      </section>

      <section id="orders" className="mt-14 scroll-mt-44">
        <h2 className="font-display text-3xl uppercase">Orders ({orders.length})</h2>
        <div className="mt-4 grid gap-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <h3 className="font-bold">
                  Order #{order.order_number} · {order.currency} {Number(order.subtotal).toFixed(2)}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm">
                {order.customer_name} · {order.customer_email} · {order.customer_phone}
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
                <button className={secondaryButtonClass}>Update order</button>
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

      <section id="quotes" className="mt-14 scroll-mt-44 pb-16">
        <h2 className="font-display text-3xl uppercase">Quote requests ({quotes?.length ?? 0})</h2>
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
                <button className={secondaryButtonClass}>Update request</button>
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
      <Link href="/shop" className="text-sm text-primary hover:underline">
        View storefront
      </Link>
    </AdminShell>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 pb-20 pt-32 sm:px-6">
      <h1 className="font-display text-5xl uppercase">Store Admin</h1>
      <p className="mt-2 text-sm text-muted-foreground">Catalog, orders, and quote requests</p>
      <div className="mt-8">{children}</div>
    </main>
  );
}

function Notice({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return (
    <p
      role={error ? "alert" : "status"}
      className={`mb-5 rounded-xl border p-4 text-sm ${error ? "border-destructive text-destructive" : "border-primary/50 text-primary"}`}
    >
      {children}
    </p>
  );
}

function ContentEditor({
  contentKey,
  title,
  content,
}: {
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
    <details id={contentKey} className="scroll-mt-44 rounded-2xl border border-border bg-card">
      <summary className="cursor-pointer px-6 py-5 font-display text-2xl uppercase">
        {title}
      </summary>
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
        <button className={buttonClass}>Save {title.toLowerCase()}</button>
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
const buttonClass =
  "rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase text-primary-foreground disabled:opacity-50";
const secondaryButtonClass =
  "rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary";
