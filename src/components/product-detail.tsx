"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/supabase/types";
import { useBasket } from "@/components/basket-provider";

export function ProductDetail({ product }: { product: Product }) {
  const images = product.image_urls?.length
    ? product.image_urls
    : product.image_url
      ? [product.image_url]
      : [];
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("");
  const [colour, setColour] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const { addToBasket } = useBasket();
  const outOfStock = product.stock_quantity === 0;
  const canAdd =
    !outOfStock &&
    product.price !== null &&
    (!product.available_sizes?.length || !!size) &&
    (!product.available_colours?.length || !!colour);

  const add = async () => {
    setAdding(true);
    setError("");
    try {
      await addToBasket(product, quantity, size, colour);
    } catch (addError) {
      setError(
        addError instanceof Error ? addError.message : "Could not add this product to your basket.",
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6">
      <Link
        href="/shop"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ChevronLeft className="size-4" /> Back to shop
      </Link>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <section>
          <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-card">
            {images[selectedImage] ? (
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center text-muted-foreground">
                Product image not added
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous image"
                onClick={() =>
                  setSelectedImage((index) => (index - 1 + images.length) % images.length)
                }
                className="grid size-10 shrink-0 place-items-center rounded-full border border-border hover:border-primary"
              >
                <ChevronLeft className="size-5" />
              </button>
              <div className="flex min-w-0 gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    aria-label={`Show product image ${index + 1}`}
                    aria-pressed={selectedImage === index}
                    className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 ${selectedImage === index ? "border-primary" : "border-border"}`}
                  >
                    <img src={image} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                aria-label="Next image"
                onClick={() => setSelectedImage((index) => (index + 1) % images.length)}
                className="grid size-10 shrink-0 place-items-center rounded-full border border-border hover:border-primary"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          )}
        </section>

        <section className="lg:py-4">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Knockout Sports Wear
          </p>
          <h1 className="mt-3 font-display text-4xl uppercase tracking-wide sm:text-5xl">
            {product.name}
          </h1>
          {product.price !== null && (
            <p className="mt-5 text-2xl font-bold">PKR {Number(product.price).toFixed(2)}</p>
          )}
          <p className="mt-6 whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {product.description || "Contact us for product details and customization."}
          </p>

          <p
            className={`mt-6 flex items-center gap-2 text-sm font-semibold ${outOfStock ? "text-destructive" : "text-primary"}`}
          >
            <span
              className={`size-2 rounded-full ${outOfStock ? "bg-destructive" : "bg-primary"}`}
            />
            {outOfStock
              ? "Out of stock"
              : product.stock_quantity === null
                ? "Made to order"
                : `${product.stock_quantity} in stock`}
          </p>

          {!!product.available_sizes?.length && (
            <label className="mt-6 grid max-w-sm gap-2 text-sm font-semibold">
              Available sizes
              <select
                value={size}
                onChange={(event) => setSize(event.target.value)}
                className="rounded-lg border border-input bg-background px-4 py-3 font-normal"
              >
                <option value="">Select a size</option>
                {product.available_sizes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!!product.available_colours?.length && (
            <label className="mt-4 grid max-w-sm gap-2 text-sm font-semibold">
              Available colours
              <select
                value={colour}
                onChange={(event) => setColour(event.target.value)}
                className="rounded-lg border border-input bg-background px-4 py-3 font-normal"
              >
                <option value="">Select a colour</option>
                {product.available_colours.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <label className="grid gap-2 text-sm font-semibold">
              Quantity
              <input
                type="number"
                min={1}
                max={product.stock_quantity ?? 100}
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    Math.max(
                      1,
                      Math.min(Number(event.target.value) || 1, product.stock_quantity ?? 100),
                    ),
                  )
                }
                className="w-24 rounded-lg border border-input bg-background px-3 py-3"
              />
            </label>
            <button
              type="button"
              onClick={() => void add()}
              disabled={!canAdd || adding}
              className="min-h-12 flex-1 rounded-full bg-primary px-6 py-3 font-bold uppercase text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              {adding ? "Adding…" : "Add to Basket"}
            </button>
          </div>
          {!canAdd && !outOfStock && (
            <p className="mt-3 text-xs text-muted-foreground">
              Choose available options to continue.
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            Payment and delivery are confirmed with you before fulfillment. No online payment is
            taken.
          </p>
        </section>
      </div>
    </main>
  );
}
