import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, ChevronDown, Flame, Package, Scissors, Truck } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { Marquee } from "@/components/marquee";
import { Reveal } from "@/components/reveal";
import { CylinderGallery } from "@/components/cylinder-gallery";
import { CustomizeDesign } from "@/components/customize-design";
import { contentString, getStorefrontCategories, getStorefrontContent } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getStorefrontContent("home");
  const title = contentString(content, "seo_title");
  const description = contentString(content, "seo_description");
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary_large_image" },
  };
}

const featureIcons = [Scissors, Package, Award, Truck];

export default async function Home() {
  const [home, collections] = await Promise.all([
    getStorefrontContent("home"),
    getStorefrontCategories(),
  ]);
  const showcase = collections.filter((collection) => collection.image).slice(0, 3);
  const features = featureIcons.map((icon, index) => ({
    icon,
    title: contentString(home, `feature_${index + 1}_title`),
    text: contentString(home, `feature_${index + 1}_text`),
  }));
  const heroImage = contentString(home, "hero_image") || heroImg.src;
  return (
    <main>
      {/* ---------- Animated hero banner ---------- */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          <img
            src={heroImage}
            alt=""
            width={1600}
            height={900}
            className="kenburns size-full object-cover"
          />
        </div>
        <div
          className="absolute inset-0 bg-[linear-gradient(to_top,var(--background)_8%,color-mix(in_oklab,var(--background)_55%,transparent)_55%,color-mix(in_oklab,var(--background)_20%,transparent))]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-[70rem] max-w-[150vw] -translate-x-1/2 rounded-full blur-3xl pulse-glow bg-[radial-gradient(ellipse,color-mix(in_oklab,var(--primary)_40%,transparent),transparent_70%)]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-5xl px-4 pb-24 pt-32 text-center sm:px-6">
          <p
            className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700 text-xs font-bold tracking-[0.45em] uppercase text-primary"
            style={{ animationDelay: "150ms" }}
          >
            {contentString(home, "hero_eyebrow")}
          </p>
          <h1
            className="animate-in fade-in slide-in-from-bottom-8 fill-mode-both duration-1000 mt-5 font-display text-6xl leading-[0.95] tracking-wide uppercase text-foreground text-glow sm:text-7xl md:text-8xl"
            style={{ animationDelay: "300ms" }}
          >
            {contentString(home, "hero_title")}{" "}
            <span className="text-flame">{contentString(home, "hero_highlight")}</span>
            <br />
            {contentString(home, "hero_subtitle")}
          </h1>
          <p
            className="animate-in fade-in slide-in-from-bottom-6 fill-mode-both duration-1000 mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            style={{ animationDelay: "550ms" }}
          >
            {contentString(home, "hero_description")}
          </p>
          <div
            className="animate-in fade-in slide-in-from-bottom-6 fill-mode-both duration-1000 mt-10 flex flex-wrap items-center justify-center gap-4"
            style={{ animationDelay: "750ms" }}
          >
            <Link
              href="/shop"
              className="shine group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-xl tracking-[0.15em] uppercase text-primary-foreground shadow-[0_10px_40px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)] transition-transform duration-300 hover:scale-105"
            >
              {contentString(home, "primary_button")}
              <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="flame-border inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-8 py-4 font-display text-xl tracking-[0.15em] uppercase text-foreground backdrop-blur transition-colors duration-300 hover:text-primary"
            >
              <Flame className="size-5 text-primary" />
              {contentString(home, "secondary_button")}
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-primary" aria-hidden>
          <ChevronDown className="size-7 scroll-hint" />
        </div>
      </section>

      <Marquee collections={collections} />

      {/* ---------- Category grid ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <Reveal className="text-center">
          <p className="text-xs font-bold tracking-[0.45em] uppercase text-primary">
            {contentString(home, "collections_eyebrow")}
          </p>
          <h2 className="mt-3 font-display text-5xl tracking-wide uppercase sm:text-6xl">
            {contentString(home, "collections_title")}{" "}
            <span className="text-flame">{contentString(home, "collections_highlight")}</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((c, i) => (
            <Reveal key={c.slug} delayMs={(i % 4) * 90}>
              <Link
                href={`/shop?collection=${encodeURIComponent(c.slug)}`}
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
                    <div className="size-full bg-gradient-to-br from-card via-background to-primary/20" aria-hidden />
                  )}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"
                    aria-hidden
                  />
                  <div className="absolute inset-x-0 bottom-0 translate-y-2 p-5 transition-transform duration-300 group-hover:translate-y-0">
                    <h3 className="font-display text-2xl tracking-wider uppercase text-white">
                      {c.name}
                    </h3>
                    <p className="mt-1 text-sm text-white/70">{c.tagline}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.2em] uppercase text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {contentString(home, "collection_cta")} <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Scroll-driven cylinder gallery ---------- */}
      {collections.some((collection) => collection.image) && (
        <CylinderGallery
          collections={collections}
          heading={contentString(home, "gallery_heading")}
        />
      )}

      {/* ---------- Showcase strip ---------- */}
      {showcase.length > 0 && (
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {showcase.map((s, i) => (
            <Reveal key={s.slug} variant={i === 1 ? "up" : i === 0 ? "left" : "right"}>
              <div className="product-card group relative overflow-hidden rounded-2xl border border-border">
                <img
                  src={s.image}
                  alt={s.name}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="aspect-[3/4] size-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"
                  aria-hidden
                />
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="font-display text-3xl tracking-wider uppercase text-white text-glow">
                    {s.name}
                  </h3>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      )}

      {/* ---------- Features ---------- */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <Reveal key={f.title} delayMs={i * 100}>
                <div className="group">
                  <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <f.icon className="size-6" />
                  </span>
                  <h3 className="mt-4 font-display text-2xl tracking-wider uppercase">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Customize your design ---------- */}
      <CustomizeDesign categories={collections} content={home} />

      {/* ---------- CTA ---------- */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-[60rem] max-w-[140vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl pulse-glow bg-[radial-gradient(ellipse,color-mix(in_oklab,var(--primary)_35%,transparent),transparent_70%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl px-4 py-28 text-center sm:px-6">
          <Reveal>
            <h2 className="font-display text-5xl tracking-wide uppercase sm:text-6xl">
              {contentString(home, "cta_title")}{" "}
              <span className="text-flame">{contentString(home, "cta_highlight")}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {contentString(home, "cta_description")}
            </p>
            <Link
              href="/contact"
              className="shine mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-10 py-4 font-display text-xl tracking-[0.15em] uppercase text-primary-foreground transition-transform duration-300 hover:scale-105"
            >
              {contentString(home, "cta_button")} <ArrowRight className="size-5" />
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
