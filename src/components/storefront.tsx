"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import type { StorefrontCategory } from "@/lib/cms";
import type { Product } from "@/lib/supabase/types";
import { useBasket } from "@/components/basket-provider";

export function Storefront({
  products,
  categories,
  initialCategory = "",
}: {
  products: Product[];
  categories: StorefrontCategory[];
  initialCategory?: string;
}) {
  const { basket, count, addToBasket, updateQuantity, clearBasket } = useBasket();
  const router = useRouter();
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [addingProduct, setAddingProduct] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const checkoutRequestRef = useRef<{ fingerprint: string; id: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const visibleProducts = selectedCategory
    ? products.filter((product) => product.category_id === selectedCategory)
    : products;
  const basketProducts = useMemo(
    () =>
      basket.flatMap((line) => {
        const product = products.find((item) => item.id === line.productId);
        return product ? [{ ...line, product }] : [];
      }),
    [basket, products],
  );
  const canCheckout =
    basketProducts.length > 0 &&
    basketProducts.length === basket.length &&
    basket.length <= 20 &&
    basketProducts.every(({ product }) => product.price !== null);
  const subtotal = basketProducts.reduce(
    (total, { product, quantity }) => total + (product.price ?? 0) * quantity,
    0,
  );
  const hasUnavailableItem = basketProducts.some(
    ({ product, size, colour }) =>
      product.price === null ||
      !product.is_active ||
      product.stock_quantity === 0 ||
      (product.stock_quantity !== null &&
        basket
          .filter((line) => line.productId === product.id)
          .reduce((sum, line) => sum + line.quantity, 0) > product.stock_quantity) ||
      (!!product.available_sizes?.length && !product.available_sizes.includes(size ?? "")) ||
      (!!product.available_colours?.length && !product.available_colours.includes(colour ?? "")),
  ) || basketProducts.length !== basket.length || basket.length > 20;

  const handleAdd = async (product: Product) => {
    setAddingProduct(product.id);
    setNotice("");
    setNoticeError(false);
    try {
      await addToBasket(product);
    } catch (error) {
      setNoticeError(true);
      setNotice(
        error instanceof Error ? error.message : "Could not add this product to your basket.",
      );
    } finally {
      setAddingProduct(null);
    }
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCheckout || busy || submittingRef.current) return;
    submittingRef.current = true;
    setBusy(true);
    setNotice("");
    setNoticeError(false);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const requestBody = {
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        address: form.get("address"),
        notes: form.get("notes"),
        expectedSubtotal: Number(subtotal.toFixed(2)),
        items: basket.map(({ productId, quantity, size, colour }) => ({
          productId,
          quantity,
          size: size ?? "",
          colour: colour ?? "",
        })),
      };
      const fingerprint = JSON.stringify(requestBody);
      if (checkoutRequestRef.current?.fingerprint !== fingerprint) {
        checkoutRequestRef.current = { fingerprint, id: crypto.randomUUID() };
      }
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...requestBody,
          checkoutRequestId: checkoutRequestRef.current.id,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (typeof result.error === "string" && result.error.includes("price changed")) {
          router.refresh();
        }
        throw new Error(result.error ?? "Could not place your order.");
      }
      clearBasket();
      checkoutRequestRef.current = null;
      formElement.reset();
      setNoticeError(false);
      setNotice(
        `Order #${result.order.order_number} received. Items subtotal: PKR ${Number(result.order.subtotal).toFixed(2)}. Our team will contact you to confirm delivery charges and payment.`,
      );
    } catch (error) {
      setNoticeError(true);
      setNotice(error instanceof Error ? error.message : "Could not place your order.");
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{products.length} products</p>
        <a
          href="#basket"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary"
        >
          <ShoppingBag className="size-4" /> Basket ({count})
        </a>
      </div>
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("")}
            aria-pressed={!selectedCategory}
            className={`rounded-full border px-4 py-2 text-sm ${!selectedCategory ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
          >
            All collections
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              aria-pressed={selectedCategory === category.id}
              className={`rounded-full border px-4 py-2 text-sm ${selectedCategory === category.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-6 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProducts.map((product) => (
          <article
            key={product.id}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <Link
              href={`/shop/${product.slug}`}
              className="block aspect-[4/3] bg-background"
              aria-label={`View ${product.name}`}
            >
              {product.image_urls?.[0] || product.image_url ? (
                <img
                  src={product.image_urls?.[0] || product.image_url}
                  alt={product.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center text-sm text-muted-foreground">
                  Product image not added
                </div>
              )}
            </Link>
            <div className="p-5">
              <h2 className="font-display text-2xl uppercase tracking-wide">
                <Link href={`/shop/${product.slug}`} className="hover:text-primary">
                  {product.name}
                </Link>
              </h2>
              <p className="mt-2 min-h-10 text-sm text-muted-foreground">{product.description}</p>
              {product.price !== null ? (
                <>
                  <p className="mt-4 font-bold">PKR {Number(product.price).toFixed(2)}</p>
                  {product.stock_quantity === 0 && (
                    <p className="mt-1 text-xs text-destructive">Out of stock</p>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleAdd(product)}
                    disabled={addingProduct === product.id || product.stock_quantity === 0}
                    className="mt-4 w-full rounded-full bg-primary px-5 py-3 text-sm font-bold uppercase text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {addingProduct === product.id ? "Adding…" : "Add to basket"}
                  </button>
                </>
              ) : (
                <Link
                  href="/contact"
                  className="mt-4 inline-flex rounded-full border border-primary/60 px-5 py-3 text-sm font-bold uppercase text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Request a quote
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
      {visibleProducts.length === 0 && (
        <p className="mb-10 rounded-xl border border-border p-5 text-sm text-muted-foreground">
          No priced products in this collection yet.{" "}
          <Link
            href={`/contact?category=${encodeURIComponent(categories.find((category) => category.id === selectedCategory)?.slug ?? "")}`}
            className="text-primary underline"
          >
            Request a custom quote
          </Link>
        </p>
      )}

      <section
        id="basket"
        className="scroll-mt-28 rounded-2xl border border-border bg-card p-6 sm:p-8"
      >
        <h2 className="font-display text-3xl uppercase tracking-wide">Your Basket</h2>
        {basketProducts.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Your basket is empty.</p>
        ) : (
          <>
            <ul className="mt-5 divide-y divide-border">
              {basketProducts.map(({ product, quantity, size, colour }) => (
                <li
                  key={`${product.id}-${size ?? ""}-${colour ?? ""}`}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      PKR {Number(product.price).toFixed(2)} each
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Line total: PKR {((product.price ?? 0) * quantity).toFixed(2)}
                    </p>
                    {(size || colour) && (
                      <p className="text-xs text-muted-foreground">
                        {[size && `Size: ${size}`, colour && `Colour: ${colour}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      aria-label={`Quantity of ${product.name}`}
                      type="number"
                      min={1}
                      value={quantity}
                      max={getQuantityLimit(product, quantity, size, colour, basket)}
                      onChange={(event) => {
                        const requestedQuantity = Number(event.target.value);
                        if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) return;
                        updateQuantity(
                          product.id,
                          Math.min(
                            requestedQuantity,
                            getQuantityLimit(product, quantity, size, colour, basket),
                          ),
                          size,
                          colour,
                        );
                      }}
                      className="w-20 rounded-lg border border-input bg-background px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, 0, size, colour)}
                      className="text-sm text-primary hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 text-right">
              <p className="text-sm text-muted-foreground">
                Items subtotal: PKR {subtotal.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Discounts are not configured. Delivery charges are confirmed with you before
                fulfillment and are not included above.
              </p>
            </div>
            {hasUnavailableItem && (
              <p role="alert" className="mt-4 rounded-lg border border-destructive/50 p-3 text-sm text-destructive">
                {basket.length > 20
                  ? "An order can contain up to 20 product variants. Remove some items to continue."
                  : "One or more basket items are unavailable, out of stock, or have changed options. Remove or update them before checkout."}
              </p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Payment is arranged by manual invoice after order confirmation. Cash on Delivery and
              online payment are not currently configured; no payment is taken here.
            </p>
            <form onSubmit={submitOrder} className="mt-8 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                Full name
                <input
                  required
                  name="name"
                  autoComplete="name"
                  maxLength={120}
                  minLength={1}
                  pattern=".*\\S.*"
                  className="rounded-lg border border-input bg-background px-4 py-3"
                />
              </label>
              <label className="grid gap-2 text-sm">
                Email
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                  maxLength={254}
                  pattern="[^\\s@]+@[^\\s@]+\\.[^\\s@]+"
                  className="rounded-lg border border-input bg-background px-4 py-3"
                />
              </label>
              <label className="grid gap-2 text-sm">
                Phone / WhatsApp
                <input
                  required
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+92 300 1234567"
                  minLength={7}
                  maxLength={30}
                  pattern="\\+?[\\d\\s().-]{7,30}"
                  className="rounded-lg border border-input bg-background px-4 py-3"
                />
              </label>
              <label className="grid gap-2 text-sm sm:col-span-2">
                Delivery address
                <textarea
                  required
                  name="address"
                  autoComplete="street-address"
                  minLength={10}
                  maxLength={500}
                  rows={3}
                  placeholder="Street, area, city, and any delivery directions"
                  className="rounded-lg border border-input bg-background px-4 py-3"
                />
              </label>
              <label className="grid gap-2 text-sm sm:col-span-2">
                Order notes
                <textarea
                  name="notes"
                  maxLength={4000}
                  rows={3}
                  className="rounded-lg border border-input bg-background px-4 py-3"
                />
              </label>
              <button
                disabled={!canCheckout || hasUnavailableItem || busy}
                className="rounded-full bg-primary px-6 py-3 font-bold uppercase text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
              >
                {busy ? "Submitting…" : "Place order — pay by manual invoice"}
              </button>
            </form>
          </>
        )}
        {notice && (
          <p
            role={noticeError ? "alert" : "status"}
            className={`mt-4 text-sm ${noticeError ? "text-destructive" : "text-primary"}`}
          >
            {notice}
          </p>
        )}
      </section>
    </div>
  );
}

function getQuantityLimit(
  product: Product,
  currentQuantity: number,
  size: string | undefined,
  colour: string | undefined,
  basket: Array<{ productId: string; quantity: number; size?: string; colour?: string }>,
) {
  if (product.stock_quantity === null) return 100;
  const otherVariantsQuantity = basket
    .filter(
      (line) =>
        line.productId === product.id &&
        !((line.size ?? "") === (size ?? "") && (line.colour ?? "") === (colour ?? "")),
    )
    .reduce((sum, line) => sum + line.quantity, 0);
  return Math.max(
    currentQuantity,
    Math.min(100, product.stock_quantity - otherVariantsQuantity),
  );
}
