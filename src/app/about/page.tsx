import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "About Us | Mashal Olympics Sports Wear",
  description:
    "Mashal Olympics Sports Wear manufactures custom sportswear and martial arts uniforms for teams, clubs and athletes.",
  openGraph: {
    title: "About Us | Mashal Olympics Sports Wear",
    description: "Custom sportswear and martial arts uniforms for teams, clubs and athletes.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

const stats = [
  { value: "10+", label: "Product Lines" },
  { value: "100%", label: "Made to Order" },
  { value: "1 Roof", label: "Cut, Stitch & Print" },
];

const values = [
  {
    title: "Made Around Your Design",
    text: "Nothing off the shelf unless you want it. Send a sketch, a photo or just your club colors — our team turns it into a production-ready kit.",
  },
  {
    title: "Sport-Specific Craft",
    text: "A taekwondo dobok, a wushu satin set and a football kit all demand different fabric, cut and finish. We build each one the way its sport needs.",
  },
  {
    title: "Built for Match Day",
    text: "Reinforced stitching, color-fast sublimation and competition-appropriate weights, so your kit performs as hard as you do.",
  },
];

export default function AboutPage() {
  return (
    <main className="pt-28">
      {/* Banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" aria-hidden>
          <img
            src={heroImg.src}
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
            <p className="text-xs font-bold tracking-[0.45em] uppercase text-primary">Our Story</p>
            <h1 className="mt-3 max-w-3xl font-display text-6xl leading-[0.95] tracking-wide uppercase sm:text-7xl">
              The Torch Behind <span className="text-flame">Every Kit</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Mashal means torch — the light athletes walk out behind. We make the gear they walk
              out in.
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
            Ready When <span className="text-flame">You Are</span>
          </h2>
          <Link
            href="/contact"
            className="shine mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-10 py-4 font-display text-xl tracking-[0.15em] uppercase text-primary-foreground transition-transform duration-300 hover:scale-105"
          >
            Start Your Order <ArrowRight className="size-5" />
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
