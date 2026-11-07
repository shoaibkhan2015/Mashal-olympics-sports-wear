import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { Reveal } from "@/components/reveal";
import { contentString, getStorefrontContent } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getStorefrontContent("about");
  const title = contentString(content, "seo_title");
  const description = contentString(content, "seo_description");
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary_large_image" },
  };
}

export default async function AboutPage() {
  const content = await getStorefrontContent("about");
  const stats = readRows(content.stats, "value", "label");
  const values = readRows(content.values, "title", "text");
  const banner = contentString(content, "banner_image") || heroImg.src;
  return (
    <main className="pt-28">
      {/* Banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" aria-hidden>
          <img
            src={banner}
            alt=""
            loading="lazy"
            width={1600}
            height={900}
            className="size-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <Reveal variant="left">
            <p className="text-xs font-bold tracking-[0.45em] uppercase text-primary">
              {contentString(content, "eyebrow")}
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-6xl leading-[0.95] tracking-wide uppercase sm:text-7xl">
              {contentString(content, "title")}{" "}
              <span className="text-flame">{contentString(content, "highlight")}</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {contentString(content, "description")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
          {stats.map((s, i) => (
            <Reveal key={s.label} delayMs={i * 120} className="text-center">
              <p className="stat-number font-display text-6xl text-flame text-glow">{s.value}</p>
              <p className="mt-1 text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                {s.label}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {values.map((v, i) => (
            <Reveal key={v.title} delayMs={i * 120}>
              <div className="flame-border h-full rounded-2xl border border-border bg-card p-8 transition-transform duration-300 hover:-translate-y-1">
                <h2 className="font-display text-3xl tracking-wider uppercase">{v.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-20 text-center">
          <h2 className="font-display text-5xl tracking-wide uppercase sm:text-6xl">
            {contentString(content, "cta_title")}{" "}
            <span className="text-flame">{contentString(content, "cta_highlight")}</span>
          </h2>
          <Link
            href="/contact"
            className="shine mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-10 py-4 font-display text-xl tracking-[0.15em] uppercase text-primary-foreground transition-transform duration-300 hover:scale-105"
          >
            {contentString(content, "cta_button")} <ArrowRight className="size-5" />
          </Link>
        </Reveal>
      </section>
    </main>
  );
}

function readRows(
  value: unknown,
  firstKey: "value",
  secondKey: "label",
): Array<{ value: string; label: string }>;
function readRows(
  value: unknown,
  firstKey: "title",
  secondKey: "text",
): Array<{ title: string; text: string }>;
function readRows(
  value: unknown,
  firstKey: "value" | "title",
  secondKey: "label" | "text",
): Array<{ value: string; label: string } | { title: string; text: string }> {
  if (!Array.isArray(value)) return [];
  const rows: Array<{ value: string; label: string } | { title: string; text: string }> = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const first = record[firstKey];
    const second = record[secondKey];
    if (typeof first !== "string" || typeof second !== "string") continue;
    if (firstKey === "value") rows.push({ value: first, label: second });
    else rows.push({ title: first, text: second });
  }
  return rows;
}
