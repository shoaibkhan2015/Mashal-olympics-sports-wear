import type { Metadata } from "next";
import Link from "next/link";
import { Flame } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { ContactForm } from "./contact-form";
import { contentString, getStorefrontCategories, getStorefrontContent } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getStorefrontContent("contact");
  const title = contentString(content, "seo_title");
  const description = contentString(content, "seo_description");
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [content, categories] = await Promise.all([
    getStorefrontContent("contact"),
    getStorefrontCategories(),
  ]);
  return (
    <main className="pt-28">
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <Reveal>
          <p className="text-xs font-bold tracking-[0.45em] uppercase text-primary">
            {" "}
            {contentString(content, "eyebrow")}
          </p>
          <h1 className="mt-3 font-display text-6xl tracking-wide uppercase sm:text-7xl">
            {contentString(content, "title")}{" "}
            <span className="text-flame">{contentString(content, "highlight")}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            {contentString(content, "description")}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-5">
          {/* Form */}
          <Reveal className="lg:col-span-3">
            <ContactForm initialCategory={category} categories={categories} />
          </Reveal>

          {/* Side info */}
          <Reveal variant="right" delayMs={120} className="lg:col-span-2">
            <div className="grid h-full content-start gap-6">
              <div className="rounded-2xl border border-border bg-card p-8">
                <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Flame className="size-6" />
                </span>
                <h2 className="mt-4 font-display text-3xl tracking-wider uppercase">
                  {contentString(content, "steps_title")}
                </h2>
                <ol className="mt-4 space-y-4 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="font-display text-2xl leading-none text-primary">1</span>
                    {contentString(content, "step_1")}
                  </li>
                  <li className="flex gap-3">
                    <span className="font-display text-2xl leading-none text-primary">2</span>
                    {contentString(content, "step_2")}
                  </li>
                  <li className="flex gap-3">
                    <span className="font-display text-2xl leading-none text-primary">3</span>
                    {contentString(content, "step_3")}
                  </li>
                </ol>
              </div>

              <div className="rounded-2xl border border-border bg-card p-8">
                <h2 className="font-display text-3xl tracking-wider uppercase">
                  {contentString(content, "side_title")}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  {contentString(content, "side_description")}
                </p>
                <Link
                  href="/shop"
                  className="mt-5 inline-flex rounded-full border border-primary/60 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {contentString(content, "side_button")}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
