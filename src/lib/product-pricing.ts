import type { Product } from "@/lib/supabase/types";

export type ProductPricing = Pick<Product, "price" | "discount_percentage" | "effective_price">;
export type RelatedProduct = Pick<Product, "id" | "slug" | "name" | "image_url" | "image_urls"> &
  ProductPricing;

export function parseDiscountPercentage(value: FormDataEntryValue | null): number | null {
  if (value === null) return 0;
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text === "") return 0;
  if (!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(text)) return null;
  const percentage = Number(text);
  return percentage <= 100 ? percentage : null;
}

export function formatPrice(price: number) {
  return `PKR ${price.toFixed(2)}`;
}
