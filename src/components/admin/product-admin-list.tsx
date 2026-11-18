"use client";

import { useState } from "react";
import { ChevronDown, LoaderCircle } from "lucide-react";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { ProductForm } from "@/components/admin/product-form";
import { CatalogRow } from "@/components/admin/catalog-row";
import { deleteProduct } from "@/app/admin/actions";
import { formatPrice } from "@/lib/product-pricing";
import type { Product } from "@/lib/supabase/types";

const initialPageSize = 10;
const pageSize = 10;
type AdminCategory = { id: string; name: string; is_active: boolean };

export function ProductAdminList({
  initialProducts,
  total,
  categories,
  editedProduct,
  initiallyExpanded,
  productDetailsAvailable,
}: {
  initialProducts: Product[];
  total: number;
  categories: AdminCategory[];
  editedProduct: Product | null;
  initiallyExpanded: boolean;
  productDetailsAvailable: boolean;
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
    <div className="admin-list">
      {visibleProducts.length > 0 && (
        <div className="admin-row-columns" aria-hidden="true">
          <span>Product</span>
          <span>Price</span>
          <span>Status</span>
          <span>Action</span>
        </div>
      )}
      {visibleProducts.map((product) => (
        <CatalogRow
          key={product.id}
          title={product.name}
          subtitle={
            categories.find((category) => category.id === product.category_id)?.name ?? "Unassigned"
          }
          imageUrl={product.image_urls?.[0] || product.image_url}
          metadata={
            product.effective_price == null ? "Quote only" : formatPrice(product.effective_price)
          }
          published={product.is_active}
          initiallyOpen={editedProduct?.id === product.id}
        >
          <ProductForm
            product={product}
            categories={categories}
            detailsAvailable={productDetailsAvailable}
            listPageSize={expanded ? products.length : initialPageSize}
            listExpanded={expanded}
          />
          <form action={deleteProduct} className="admin-delete-form">
            <input type="hidden" name="id" value={product.id} />
            <ConfirmDeleteButton label={`the ${product.name} product`} />
          </form>
        </CatalogRow>
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
          className="admin-button mx-auto"
        >
          {expanded ? "Show first 10" : "Show more products"}
          <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      )}
      {expanded && hasMore && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadMore()}
          className="admin-button mx-auto"
        >
          {loading && <LoaderCircle className="size-4 animate-spin" />}
          {loading ? "Loading…" : `Load next ${Math.min(pageSize, total - loadedOffset)} products`}
        </button>
      )}
    </div>
  );
}
