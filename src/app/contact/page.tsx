import type { Metadata } from "next";
import Link from "next/link";
import { Flame } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Custom Order & Quote | Mashal Olympics Sports Wear",
  description:
    "Request a quote for custom sports shorts, shirts, gym wear, tracksuits, football kits, taekwondo, wushu and karate uniforms.",
  openGraph: {
    title: "Custom Order & Quote | Mashal Olympics Sports Wear",
    description: "Request a quote for custom sportswear and martial arts uniforms.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function ContactPage() {
  return (
    <main className="pt-28">
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <Reveal>
          <p className="text-xs font-bold tracking-[0.45em] uppercase text-primary">Get a Quote</p>
          <h1 className="mt-3 font-display text-6xl tracking-wide uppercase sm:text-7xl">
            Custom <span className="text-flame">Order</span>
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Tell us what you need — product, design, quantities — and we&apos;ll reply with pricing
            and delivery time.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-5">
          {/* Form */}
          <Reveal className="lg:col-span-3">
            <ContactForm />
          </Reveal>

          {/* Side info */}
          <Reveal variant="right" delayMs={120} className="lg:col-span-2">
            <div className="grid h-full content-start gap-6">
              <div className="rounded-2xl border border-border bg-card p-8">
                <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Flame className="size-6" />
                </span>
                <h2 className="mt-4 font-display text-3xl tracking-wider uppercase">
                  What Happens Next
                </h2>
                <ol className="mt-4 space-y-4 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="font-display text-2xl leading-none text-primary">1</span>
                    We review your design and confirm fabric, colors and sizing.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-display text-2xl leading-none text-primary">2</span>
                    You get a quote with price per piece and delivery time.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-display text-2xl leading-none text-primary">3</span>
                    Approve a digital sample, then we cut, stitch and ship.
                  </li>
                </ol>
              </div>

              <div className="rounded-2xl border border-border bg-card p-8">
                <h2 className="font-display text-3xl tracking-wider uppercase">Not Sure Yet?</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Browse the collection first — every product page links back here with the item
                  pre-noted.
                </p>
                <Link
                  href="/shop"
                  className="mt-5 inline-flex rounded-full border border-primary/60 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  View Collection
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
