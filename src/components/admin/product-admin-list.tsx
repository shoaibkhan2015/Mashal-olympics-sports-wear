"use client";

import { useState } from "react";
import { ChevronDown, LoaderCircle } from "lucide-react";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { ProductImagePicker } from "@/components/admin/product-image-picker";
import { deleteProduct, updateProduct } from "@/app/admin/actions";
import type { Product } from "@/lib/supabase/types";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground";
const secondaryButtonClass =
  "rounded-full border border-primary px-5 py-2.5 text-sm font-bold uppercase text-primary transition-colors hover:bg-primary hover:text-primary-foreground";
const initialPageSize = 10;
const pageSize = 10;
type AdminCategory = { id: string; name: string; is_active: boolean };

export function ProductAdminList({
  initialProducts,
  total,
  categories,
  editedProduct,
  initiallyExpanded,
}: {
  initialProducts: Product[];
  total: number;
  categories: AdminCategory[];
  editedProduct: Product | null;
  initiallyExpanded: boolean;
}) {
  const [products, setProducts] = useState(() => {
    const combined = editedProduct
      ? [editedProduct, ...initialProducts.filter((product) => product.id !== editedProduct.id)]
      : initialProducts;
    return combined;
  });
  const [expanded, setExpanded] = useState(initiallyExpanded || Boolean(editedProduct));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadedOffset, setLoadedOffset] = useState(initialProducts.length);

  const loadMore = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/products?offset=${loadedOffset}&limit=${pageSize}`, {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not load more products.");
      const fetched = result.products as Product[];
      const additions = (result.products as Product[]).filter(
        (product) => !products.some((current) => current.id === product.id),
      );
      setProducts((current) => [...current, ...additions]);
      setLoadedOffset((current) => current + fetched.length);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load more products.");
    } finally {
      setLoading(false);
    }
  };

  const hasMore = loadedOffset < total;
  const visibleProducts = expanded ? products : products.slice(0, initialPageSize);

  return (
    <div className="mt-4 grid gap-4">
      {visibleProducts.map((product) => (
        <div
          key={product.id}
          id={`product-${product.id}`}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <form action={updateProduct} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <input type="hidden" name="id" value={product.id} />
            <input
              type="hidden"
              name="list_page_size"
              value={expanded ? products.length : initialPageSize}
            />
            <input type="hidden" name="list_expanded" value={expanded ? "1" : "0"} />
            <label className="grid gap-2 text-sm">
              Product name
              <input
                required
                name="name"
                defaultValue={product.name}
                maxLength={160}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm">
              Collection
              <select
                required
                name="category_id"
                defaultValue={product.category_id}
                className={inputClass}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {!category.is_active ? " (hidden)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              Price (PKR)
              <input
                name="price"
                type="number"
                min={0}
                step="0.01"
                defaultValue={product.price ?? ""}
                className={inputClass}
              />
            </label>
            <ProductImagePicker
              initialUrls={
                product.image_urls?.length
                  ? product.image_urls
                  : product.image_url
                    ? [product.image_url]
                    : []
              }
            />
            <label className="grid gap-2 text-sm">
              Available sizes (comma-separated)
              <input
                name="available_sizes"
                defaultValue={product.available_sizes?.join(", ")}
                maxLength={1200}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm">
              Available colours (comma-separated)
              <input
                name="available_colours"
                defaultValue={product.available_colours?.join(", ")}
                maxLength={1800}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm">
              Stock quantity (blank = made to order)
              <input
                name="stock_quantity"
                type="number"
                min={0}
                step={1}
                defaultValue={product.stock_quantity ?? ""}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm sm:col-span-2 lg:col-span-3">
              Description
              <textarea
                name="description"
                rows={3}
                defaultValue={product.description}
                maxLength={4000}
                className={inputClass}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_active" defaultChecked={product.is_active} />{" "}
              Published
            </label>
            <button className={secondaryButtonClass}>Save product</button>
          </form>
          <form action={deleteProduct} className="mt-3 border-t border-border pt-3">
            <input type="hidden" name="id" value={product.id} />
            <ConfirmDeleteButton label={`the ${product.name} product`} />
          </form>
        </div>
      ))}
      {total === 0 && (
        <p className="rounded-xl border border-border p-5 text-sm text-muted-foreground">
          No products yet.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {total > initialPageSize && (
        <button
          type="button"
          onClick={() => {
            if (expanded) {
              setExpanded(false);
            } else {
              setExpanded(true);
              if (loadedOffset === initialPageSize && hasMore && !loading) void loadMore();
            }
          }}
          aria-expanded={expanded}
          className="mx-auto inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
        >
          {expanded ? "Show less" : "Show more"}
          <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      )}
      {expanded && hasMore && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadMore()}
          className="mx-auto inline-flex min-h-11 items-center gap-2 rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary disabled:opacity-50"
        >
          {loading && <LoaderCircle className="size-4 animate-spin" />}
          {loading ? "Loading…" : `Load next ${Math.min(pageSize, total - loadedOffset)} products`}
        </button>
      )}
    </div>
  );
}
