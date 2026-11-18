import type { ProductFaq } from "@/lib/supabase/types";

export const productDetailsColumns =
  "fabric_details, fit_details, care_instructions, customization_options, size_guide, fabric_image_urls, product_faqs";

export const legacyProductColumns =
  "id, category_id, slug, name, description, image_url, image_urls, price, currency, available_sizes, available_colours, stock_quantity, is_active";

export const productColumns = `${legacyProductColumns}, ${productDetailsColumns}`;

export type ProductDetails = {
  fabric_details: string;
  fit_details: string;
  care_instructions: string;
  customization_options: string;
  size_guide: string;
  fabric_image_urls: string[];
  product_faqs: ProductFaq[];
};

export const emptyProductDetails: ProductDetails = {
  fabric_details: "",
  fit_details: "",
  care_instructions: "",
  customization_options: "",
  size_guide: "",
  fabric_image_urls: [],
  product_faqs: [],
};

export function isProductDetailsSchemaError(
  error: { code?: string; message?: string } | null,
) {
  return (
    (error?.code === "42703" || error?.code === "PGRST204") &&
    productDetailsColumns.split(", ").some((column) => error.message?.includes(column))
  );
}

export function withProductDetails<T extends object>(product: T): T & ProductDetails {
  return { ...emptyProductDetails, ...product };
}

export function hasProductDetails(details: ProductDetails) {
  return (
    details.fabric_details.length > 0 ||
    details.fit_details.length > 0 ||
    details.care_instructions.length > 0 ||
    details.customization_options.length > 0 ||
    details.size_guide.length > 0 ||
    details.fabric_image_urls.length > 0 ||
    details.product_faqs.length > 0
  );
}
