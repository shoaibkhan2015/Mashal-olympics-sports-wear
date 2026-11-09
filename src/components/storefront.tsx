"use client";

import { useEffect, useRef, useState } from "react";
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
  const { count, addToBasket } = useBasket();
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [addingProduct, setAddingProduct] = useState<string | null>(null);
  const collectionFilterRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [filterEdges, setFilterEdges] = useState({ left: false, right: false });
  const visibleProducts = selectedCategory
    ? products.filter((product) => product.category_id === selectedCategory)
    : products;

  useEffect(() => {
    const filter = collectionFilterRef.current;
    if (!filter) return;

    const updateEdges = () => {
      setFilterEdges({
        left: filter.scrollLeft > 1,
        right: filter.scrollLeft + filter.clientWidth < filter.scrollWidth - 1,
      });
    };
    const revealSelected = () => {
      const selected = filter.querySelector<HTMLElement>("[data-selected='true']");
      if (selected) {
        const filterRect = filter.getBoundingClientRect();
        const selectedRect = selected.getBoundingClientRect();
        let nextScrollLeft = filter.scrollLeft;
        if (selectedRect.left < filterRect.left) {
          nextScrollLeft -= filterRect.left - selectedRect.left;
        } else if (selectedRect.right > filterRect.right) {
          nextScrollLeft += selectedRect.right - filterRect.right;
        }
        if (nextScrollLeft !== filter.scrollLeft) {
          filter.scrollTo({
            left: nextScrollLeft,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "instant"
              : "smooth",
          });
        }
      }
      updateEdges();
    };

    revealSelected();
    filter.addEventListener("scroll", updateEdges, { passive: true });
    const resizeObserver = new ResizeObserver(updateEdges);
    resizeObserver.observe(filter);
    return () => {
      filter.removeEventListener("scroll", updateEdges);
      resizeObserver.disconnect();
    };
  }, [selectedCategory, categories.length]);

  const handleAdd = async (product: Product) => {
    setAddingProduct(product.id);
    setNotice("");
    setNoticeError(false);
    try {
      await addToBasket(product);
    } catch (error) {
      setNoticeError(true);
      setNotice(
        error instanceof Error ? error.message : "Could not add this product to your cart.",
      );
    } finally {
      setAddingProduct(null);
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{visibleProducts.length} products</p>
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary"
        >
          <ShoppingBag className="size-4" /> Cart ({count})
        </Link>
      </div>
      {categories.length > 0 && (
        <div
          className={`collection-filter-shell mb-8 ${filterEdges.left ? "has-left-overflow" : ""} ${filterEdges.right ? "has-right-overflow" : ""}`}
        >
          <div
            ref={collectionFilterRef}
            role="group"
            aria-label="Filter products by collection"
            tabIndex={0}
            className="collection-filter-row flex flex-wrap gap-2"
          >
            <button
              type="button"
              data-selected={selectedCategory === ""}
              aria-pressed={selectedCategory === ""}
              onClick={() => setSelectedCategory("")}
              className={`collection-filter-button rounded-full border px-4 py-2 text-sm ${selectedCategory === "" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
            >
              All collections
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                data-selected={selectedCategory === category.id}
                aria-pressed={selectedCategory === category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`collection-filter-button rounded-full border px-4 py-2 text-sm ${selectedCategory === category.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
              >
                {category.name}
              </button>
            ))}
          </div>
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
                    {addingProduct === product.id ? "Adding…" : "Add to Cart"}
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
      {notice && (
        <p
          role={noticeError ? "alert" : "status"}
          className={`mt-4 text-sm ${noticeError ? "text-destructive" : "text-primary"}`}
        >
          {notice}
        </p>
      )}
    </div>
  );
}
