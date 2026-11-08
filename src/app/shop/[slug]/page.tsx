import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { Product } from "@/lib/supabase/types";
import { getStorefrontContent, contentString } from "@/lib/cms";
import { WhatsAppButton } from "@/components/whatsapp-button";

async function getProduct(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, category_id, slug, name, description, image_url, image_urls, price, currency, available_sizes, available_colours, stock_quantity, is_active",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
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
  return (
    <>
      <ProductDetail product={product} />
      <WhatsAppButton
        number={contentString(siteContent, "whatsapp_number")}
        productName={product.name}
        productSlug={product.slug}
      />
    </>
  );
}
