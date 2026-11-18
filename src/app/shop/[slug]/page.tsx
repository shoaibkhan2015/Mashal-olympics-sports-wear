import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { RelatedProduct } from "@/lib/product-pricing";
import type { Product } from "@/lib/supabase/types";
import { getStorefrontContent, contentString } from "@/lib/cms";
import {
  isProductDetailsSchemaError,
  legacyProductColumns,
  productColumns,
  withProductDetails,
} from "@/lib/supabase/product-details";

async function getProduct(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(productColumns)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (isProductDetailsSchemaError(error)) {
    const legacy = await supabase
      .from("products")
      .select(legacyProductColumns)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (legacy.error) throw new Error(`Could not load product details: ${legacy.error.message}`);
    return legacy.data ? withProductDetails(legacy.data) : null;
  }
  if (error) throw new Error(`Could not load product details: ${error.message}`);
  return data as Product | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [product, siteContent] = await Promise.all([
    getProduct(slug),
    getStorefrontContent("site"),
  ]);
  const brandName = contentString(siteContent, "brand_name", "Knockout Sports Wear");
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} | ${brandName}`,
    description: product.description || `Shop ${product.name} from ${brandName}.`,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.image_url ? [product.image_url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, siteContent] = await Promise.all([
    getProduct(slug),
    getStorefrontContent("site"),
  ]);
  if (!product) notFound();
  const supabase = createPublicSupabaseClient();
  const { data: relatedProducts, error: relatedError } = await supabase
    .from("products")
    .select("id, slug, name, image_url, image_urls, price, discount_percentage, effective_price")
    .eq("category_id", product.category_id)
    .eq("is_active", true)
    .not("price", "is", null)
    .or("stock_quantity.is.null,stock_quantity.gt.0")
    .neq("id", product.id)
    .order("created_at", { ascending: false })
    .limit(4);
  if (relatedError) throw new Error(`Could not load related products: ${relatedError.message}`);
  return (
    <>
      <ProductDetail
        product={product}
        relatedProducts={(relatedProducts ?? []) as RelatedProduct[]}
        whatsappNumber={contentString(siteContent, "whatsapp_number")}
      />
    </>
  );
}
