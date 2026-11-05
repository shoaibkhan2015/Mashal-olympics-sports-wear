import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { categories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop | Mashal Olympics Sports Wear",
  description:
    "Browse the full Mashal Olympics Sports Wear collection — custom shorts, jerseys, gym wear, tracksuits, football kits and martial arts uniforms.",
  openGraph: {
    title: "Shop | Mashal Olympics Sports Wear",
    description:
      "Custom shorts, shirts, gym wear, tracksuits, football kits and martial arts uniforms.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function ShopPage() {
  return (
    <main className="pt-28">
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-bold tracking-[0.45em] uppercase text-primary">
            The Collection
          </p>
          <h1 className="mt-3 font-display text-6xl tracking-wide uppercase sm:text-7xl">
            Shop <span className="text-flame">All Products</span>
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Every item is made to order — pick a product, send us your design, logo and sizes, and
            we handle the rest.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => (
            <Reveal key={c.slug} delayMs={(i % 3) * 100} variant="scale">
              <Link
                href="/contact"
                className="product-card group relative block overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-300 hover:border-primary/60"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    width={1024}
                    height={1024}
                    className="size-full object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
                    aria-hidden
                  />
                  <span className="shine absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-primary-foreground">
                    <Flame className="size-3" />
                    Made to Order
                  </span>
                  <div className="absolute inset-x-0 bottom-0 translate-y-2 p-6 transition-transform duration-300 group-hover:translate-y-0">
                    <h2 className="font-display text-3xl tracking-wider uppercase text-white">
                      {c.name}
                    </h2>
                    <p className="mt-1 text-sm text-white/70">{c.tagline}</p>
                    <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/60 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                      Get Quote <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
