"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { useBasket } from "@/components/basket-provider";
import { BasketQuantityControl } from "@/components/basket-quantity-control";
import {
  getBasketQuantityLimit,
  getBasketSubtotal,
  hasUnavailableBasketItem,
  resolveBasketLines,
} from "@/lib/basket";
import type { Product } from "@/lib/supabase/types";

export function CartPage({ products }: { products: Product[] }) {
  const { basket, count, hydrated, updateQuantity } = useBasket();
  const lines = resolveBasketLines(basket, products);
  const subtotal = getBasketSubtotal(lines);
  const unavailable = hasUnavailableBasketItem(lines);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-32 sm:px-6">
      <p className="text-xs font-bold tracking-[0.35em] uppercase text-primary">Your selection</p>
      <h1 className="mt-3 font-display text-5xl tracking-wide uppercase sm:text-6xl">Cart</h1>

      {!hydrated ? (
        <p className="mt-8 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
          Loading your saved cart…
        </p>
      ) : lines.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-border bg-card p-8 text-center sm:p-12">
          <ShoppingBag className="mx-auto size-10 text-primary" />
          <h2 className="mt-4 font-display text-3xl uppercase">Your cart is empty</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse the collection and add something made for your team.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-7 py-3 font-bold uppercase text-primary-foreground"
          >
            Continue Shopping
          </Link>
        </section>
      ) : (
        <>
          <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-8">
            <p className="text-sm text-muted-foreground">
              {count} {count === 1 ? "item" : "items"} in your cart
            </p>
            <ul className="mt-4 divide-y divide-border">
              {lines.map(({ product, productId, quantity, size, colour }) => (
                <li
                  key={JSON.stringify([productId, size ?? "", colour ?? ""])}
                  className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    {product?.image_urls?.[0] || product?.image_url ? (
                      <img
                        src={product.image_urls?.[0] || product.image_url}
                        alt={product.name}
                        className="size-20 shrink-0 rounded-xl border border-border object-cover sm:size-24"
                      />
                    ) : (
                      <div className="grid size-20 shrink-0 place-items-center rounded-xl border border-border bg-background text-xs text-muted-foreground sm:size-24">
                        No image
                      </div>
                    )}
                    <div className="min-w-0">
                      {product ? (
                        <Link
                          href={`/shop/${product.slug}`}
                          className="font-semibold hover:text-primary"
                        >
                          {product.name}
                        </Link>
                      ) : (
                        <p className="font-semibold">Unavailable product</p>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground">
                        {product?.price !== null && product
                          ? `PKR ${Number(product.price).toFixed(2)} each`
                          : "Price unavailable"}
                      </p>
                      {(size || colour) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[size && `Size: ${size}`, colour && `Colour: ${colour}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                    <BasketQuantityControl
                      name={product?.name ?? "unavailable product"}
                      quantity={quantity}
                      maxQuantity={getBasketQuantityLimit(product, quantity, size, colour, basket)}
                      onChange={(nextQuantity) =>
                        updateQuantity(productId, nextQuantity, size, colour)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(productId, 0, size, colour)}
                      className="min-h-11 rounded-lg px-2 text-sm font-semibold text-primary hover:underline"
                    >
                      Remove
                    </button>
                    <p className="min-w-32 text-right font-semibold tabular-nums">
                      PKR {((product?.price ?? 0) * quantity || 0).toFixed(2)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {unavailable && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-destructive/50 p-3 text-sm text-destructive"
              >
                One or more items are unavailable or exceed current stock. Update or remove them
                before checkout.
              </p>
            )}

            <div className="mt-5 border-t border-border pt-5">
              <div className="flex justify-between gap-4 text-lg font-bold">
                <span>Items subtotal</span>
                <span className="text-right tabular-nums">PKR {subtotal.toFixed(2)}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Delivery charges are not included. Our team will confirm delivery charges and the
                manual invoice with you before fulfillment. No online payment is taken here.
              </p>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Link
                href="/shop"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-bold uppercase hover:border-primary"
              >
                <ArrowLeft className="size-4" /> Continue Shopping
              </Link>
              {unavailable ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase text-primary-foreground opacity-50"
                >
                  Proceed to Checkout <ArrowRight className="size-4" />
                </button>
              ) : (
                <Link
                  href="/checkout"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase text-primary-foreground hover:opacity-90"
                >
                  Proceed to Checkout <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
