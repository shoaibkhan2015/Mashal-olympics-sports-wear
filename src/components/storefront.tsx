"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
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
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [addingProduct, setAddingProduct] = useState<string | null>(null);
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
    basketProducts.length > 0 && basketProducts.every(({ product }) => product.price !== null);
  const subtotal = basketProducts.reduce(
    (total, { product, quantity }) => total + (product.price ?? 0) * quantity,
    0,
  );

  const handleAdd = async (product: Product) => {
    setAddingProduct(product.id);
    setNotice("");
    try {
      await addToBasket(product);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not add this product to your basket.",
      );
    } finally {
      setAddingProduct(null);
    }
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCheckout || busy) return;
    setBusy(true);
    setNotice("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          notes: form.get("notes"),
          items: basket.map(({ productId, quantity, size, colour }) => ({
            productId,
            quantity,
            size: size ?? "",
            colour: colour ?? "",
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not place your order.");
      clearBasket();
      formElement.reset();
      setNotice(
        `Order #${result.order.order_number} received. Our team will contact you about the manual invoice and delivery.`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not place your order.");
    } finally {
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
                      min={0}
                      value={quantity}
                      max={product.stock_quantity ?? 100}
                      onChange={(event) =>
                        updateQuantity(product.id, Number(event.target.value), size, colour)
                      }
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
            <p className="mt-4 text-right text-lg font-bold">
              Subtotal: {`PKR ${subtotal.toFixed(2)}`}
            </p>
            <p className="mt-2 text-right text-xs text-muted-foreground">
              Shipping and payment are confirmed with you before fulfillment. No online payment is
              taken.
            </p>
            <form onSubmit={submitOrder} className="mt-8 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                Full name
                <input
                  required
                  name="name"
                  maxLength={120}
                  className="rounded-lg border border-input bg-background px-4 py-3"
                />
              </label>
              <label className="grid gap-2 text-sm">
                Email
                <input
                  required
                  type="email"
                  name="email"
                  maxLength={254}
                  className="rounded-lg border border-input bg-background px-4 py-3"
                />
              </label>
              <label className="grid gap-2 text-sm">
                Phone / WhatsApp
                <input
                  required
                  name="phone"
                  minLength={5}
                  maxLength={40}
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
                disabled={!canCheckout || busy}
                className="rounded-full bg-primary px-6 py-3 font-bold uppercase text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
              >
                {busy ? "Submitting…" : "Place order — pay by manual invoice"}
              </button>
            </form>
          </>
        )}
        {notice && (
          <p
            role="status"
            className={`mt-4 text-sm ${notice.includes("Could not") || notice.includes("not available") ? "text-destructive" : "text-primary"}`}
          >
            {notice}
          </p>
        )}
      </section>
    </div>
  );
}
