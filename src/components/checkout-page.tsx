"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useBasket } from "@/components/basket-provider";
import { getBasketSubtotal, hasUnavailableBasketItem, resolveBasketLines } from "@/lib/basket";
import type { Product } from "@/lib/supabase/types";

export function CheckoutPage({ products }: { products: Product[] }) {
  const { basket, hydrated, clearBasket } = useBasket();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [orderConfirmation, setOrderConfirmation] = useState<{
    orderNumber: number;
    subtotal: number;
  } | null>(null);
  const submittingRef = useRef(false);
  const checkoutRequestRef = useRef<{ fingerprint: string; id: string } | null>(null);
  const lines = resolveBasketLines(basket, products);
  const subtotal = getBasketSubtotal(lines);
  const unavailable = hasUnavailableBasketItem(lines);
  const canSubmit = hydrated && lines.length > 0 && !unavailable;

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || busy || submittingRef.current) return;
    submittingRef.current = true;
    setBusy(true);
    setErrorMessage("");

    const form = new FormData(event.currentTarget);
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

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...requestBody,
          checkoutRequestId: checkoutRequestRef.current.id,
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          result &&
          typeof result === "object" &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Could not place your order. Please try again.";
        if (message.toLowerCase().includes("price changed")) router.refresh();
        throw new Error(message);
      }
      if (
        !result ||
        typeof result !== "object" ||
        !("order" in result) ||
        !result.order ||
        typeof result.order !== "object" ||
        !("order_number" in result.order) ||
        typeof result.order.order_number !== "number" ||
        !("subtotal" in result.order) ||
        !Number.isFinite(Number(result.order.subtotal))
      ) {
        throw new Error("The order was saved, but its confirmation could not be loaded.");
      }

      const confirmation = {
        orderNumber: result.order.order_number,
        subtotal: Number(result.order.subtotal),
      };
      clearBasket();
      checkoutRequestRef.current = null;
      setOrderConfirmation(confirmation);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not place your order. Please try again.",
      );
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-32 sm:px-6">
      {orderConfirmation ? (
        <section
          role="status"
          className="mx-auto max-w-2xl rounded-2xl border border-primary/40 bg-card p-8 text-center sm:p-12"
        >
          <CheckCircle2 className="mx-auto size-14 text-primary" />
          <p className="mt-5 text-xs font-bold tracking-[0.3em] uppercase text-primary">
            Order received
          </p>
          <h1 className="mt-2 font-display text-4xl uppercase sm:text-5xl">
            Thank you for your order
          </h1>
          <p className="mt-4 text-muted-foreground">
            Your reference is{" "}
            <strong className="text-foreground">#{orderConfirmation.orderNumber}</strong>. Items
            subtotal: PKR {orderConfirmation.subtotal.toFixed(2)}.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Our team will contact you to confirm delivery charges and the manual invoice. No payment
            was taken online.
          </p>
          <Link
            href="/shop"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-7 py-3 font-bold uppercase text-primary-foreground"
          >
            Continue Shopping
          </Link>
        </section>
      ) : (
        <>
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-primary">Final step</p>
          <h1 className="mt-3 font-display text-5xl tracking-wide uppercase sm:text-6xl">
            Checkout
          </h1>
          {!hydrated ? (
            <p className="mt-8 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
              Loading your saved cart…
            </p>
          ) : lines.length === 0 ? (
            <section className="mt-8 rounded-2xl border border-border bg-card p-7">
              <p className="text-muted-foreground">
                Your cart is empty. Add products before checkout.
              </p>
              <Link
                href="/shop"
                className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-7 py-3 font-bold uppercase text-primary-foreground"
              >
                Go to Shop
              </Link>
            </section>
          ) : (
            <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
              <section className="rounded-2xl border border-border bg-card p-5 sm:p-8">
                <h2 className="font-display text-3xl uppercase">Customer & Delivery Details</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  We’ll use these details to confirm your order and delivery.
                </p>
                {unavailable && (
                  <p
                    role="alert"
                    className="mt-5 rounded-lg border border-destructive/50 p-3 text-sm text-destructive"
                  >
                    One or more items are unavailable, out of stock, or exceed the order limit.
                    Return to your cart to review them.
                  </p>
                )}
                {errorMessage && (
                  <p
                    role="alert"
                    className="mt-5 rounded-lg border border-destructive/50 p-3 text-sm text-destructive"
                  >
                    {errorMessage}
                  </p>
                )}
                <form onSubmit={submitOrder} className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm">
                    Full name
                    <input
                      required
                      name="name"
                      autoComplete="name"
                      maxLength={120}
                      minLength={1}
                      pattern=".*\S.*"
                      className="min-w-0 rounded-lg border border-input bg-background px-4 py-3"
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
                      pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                      className="min-w-0 rounded-lg border border-input bg-background px-4 py-3"
                    />
                  </label>
                  <label className="grid gap-2 text-sm sm:col-span-2">
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
                      pattern="\+?[\d\s\(\).\x2d]{7,30}"
                      className="min-w-0 rounded-lg border border-input bg-background px-4 py-3"
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
                      className="min-w-0 rounded-lg border border-input bg-background px-4 py-3"
                    />
                  </label>
                  <label className="grid gap-2 text-sm sm:col-span-2">
                    Order notes{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                    <textarea
                      name="notes"
                      maxLength={4000}
                      rows={3}
                      className="min-w-0 rounded-lg border border-input bg-background px-4 py-3"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={!canSubmit || busy}
                    className="min-h-12 rounded-full bg-primary px-6 py-3 font-bold uppercase text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
                  >
                    {busy ? "Submitting…" : "Place Order — Pay by Manual Invoice"}
                  </button>
                </form>
              </section>

              <aside className="rounded-2xl border border-border bg-card p-5 sm:p-7">
                <h2 className="font-display text-3xl uppercase">Order Summary</h2>
                <ul className="mt-5 divide-y divide-border">
                  {lines.map(({ product, productId, quantity, size, colour }) => (
                    <li
                      key={JSON.stringify([productId, size ?? "", colour ?? ""])}
                      className="flex items-start gap-3 py-4"
                    >
                      {product?.image_urls?.[0] || product?.image_url ? (
                        <img
                          src={product.image_urls?.[0] || product.image_url}
                          alt=""
                          className="size-14 shrink-0 rounded-lg border border-border object-cover"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{product?.name ?? "Unavailable product"}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {quantity}</p>
                        {(size || colour) && (
                          <p className="text-xs text-muted-foreground">
                            {[size && `Size: ${size}`, colour && `Colour: ${colour}`]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 text-right text-sm font-semibold tabular-nums">
                        PKR {((product?.price ?? 0) * quantity || 0).toFixed(2)}
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between gap-3 font-bold">
                    <span>Items subtotal</span>
                    <span className="text-right tabular-nums">PKR {subtotal.toFixed(2)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Delivery charges are pending and not included in this subtotal. We’ll confirm
                    them with you before fulfillment. Payment is arranged by manual invoice after
                    order confirmation; no online payment is taken.
                  </p>
                </div>
                <Link
                  href="/cart"
                  className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  <ArrowLeft className="size-4" /> Return to Cart
                </Link>
              </aside>
            </div>
          )}
        </>
      )}
    </main>
  );
}
