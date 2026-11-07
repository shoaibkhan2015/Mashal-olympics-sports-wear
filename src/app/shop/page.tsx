import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Storefront } from "@/components/storefront";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { Product } from "@/lib/supabase/types";
import { contentString, getStorefrontCategories, getStorefrontContent } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getStorefrontContent("shop");
  const title = contentString(content, "seo_title");
  const description = contentString(content, "seo_description");
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string }>;
}) {
  const { collection } = await searchParams;
  const [shopContent, categories] = await Promise.all([
    getStorefrontContent("shop"),
    getStorefrontCategories(),
  ]);
  let products: Product[] = [];
  const databaseConfigured = isSupabaseConfigured();
  if (databaseConfigured && categories.length > 0) {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, category_id, slug, name, description, image_url, image_urls, price, currency, available_sizes, available_colours, stock_quantity, is_active",
      )
      .eq("is_active", true)
      .in(
        "category_id",
        categories.map((category) => category.id),
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Could not load products: ${error.message}`);
    products = (data ?? []) as Product[];
  }

  return (
    <main className="pt-28">
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-bold tracking-[0.45em] uppercase text-primary">
            {contentString(shopContent, "eyebrow")}
          </p>
          <h1 className="mt-3 font-display text-6xl tracking-wide uppercase sm:text-7xl">
            {contentString(shopContent, "title")}{" "}
            <span className="text-flame">{contentString(shopContent, "highlight")}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            {contentString(shopContent, "description")}
          </p>
        </Reveal>

        {databaseConfigured && products.length > 0 ? (
          <div className="mt-14">
            <Storefront
              products={products}
              categories={categories}
              initialCategory={categories.find((category) => category.slug === collection)?.id}
            />
          </div>
        ) : (
          <>
            {databaseConfigured && (
              <p className="mt-8 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                The catalog is ready for products. Staff can add items and pricing in the admin
                area.
              </p>
            )}
            <div className="mt-14 grid gap-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c, i) => (
                <Reveal key={c.slug} delayMs={(i % 3) * 100} variant="scale">
                  <Link
                    href={`/contact?category=${encodeURIComponent(c.slug)}`}
                    className="product-card group relative block overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-300 hover:border-primary/60"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {c.image ? (
                        <img
                          src={c.image}
                          alt={c.name}
                          loading="lazy"
                          width={1024}
                          height={1024}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div
                          className="size-full bg-gradient-to-br from-card via-background to-primary/20"
                          aria-hidden
                        />
                      )}
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
                        aria-hidden
                      />
                      <span className="shine absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-primary-foreground">
                        <Flame className="size-3" />
                        {contentString(shopContent, "collection_badge", "Made to Order")}
                      </span>
                      <div className="absolute inset-x-0 bottom-0 translate-y-2 p-6 transition-transform duration-300 group-hover:translate-y-0">
                        <h2 className="font-display text-3xl tracking-wider uppercase text-white">
                          {c.name}
                        </h2>
                        <p className="mt-1 text-sm text-white/70">{c.tagline}</p>
                        <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/60 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                          {contentString(shopContent, "collection_cta", "Get Quote")}{" "}
                          <ArrowRight className="size-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
