"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ImagePlus, Scissors, Trash2 } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { categories } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function CustomizeDesign() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [dragging, setDragging] = useState(false);

  const acceptFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
    setSent(false);
  };

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const categoryName = categories.find((c) => c.slug === category)?.name;

  return (
    <section className="relative overflow-hidden border-y border-border bg-card">
      <div
        className="pointer-events-none absolute -left-40 top-1/2 h-96 w-[40rem] max-w-[120vw] -translate-y-1/2 rounded-full blur-3xl pulse-glow bg-[radial-gradient(ellipse,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_70%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <Reveal className="text-center">
          <p className="text-xs font-bold tracking-[0.45em] uppercase text-primary">
            Made To Order
          </p>
          <h2 className="mt-3 font-display text-5xl tracking-wide uppercase sm:text-6xl">
            Customize <span className="text-flame">Your Design</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Upload your design or logo, pick the product you want it on, and we&apos;ll get back to
            you with a quote.
          </p>
        </Reveal>

        {sent ? (
          <Reveal className="mx-auto mt-12 max-w-xl rounded-2xl border border-primary/50 bg-background p-8 text-center">
            <CheckCircle2 className="mx-auto size-12 text-primary" />
            <h3 className="mt-4 font-display text-3xl tracking-wider uppercase">Request Ready</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {categoryName} selected{fileName ? ` — “${fileName}”` : ""}. Our team will review your
              design and reply with pricing and delivery time.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/contact"
                className="shine inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-transform duration-300 hover:scale-105"
              >
                Send To Our Team <ArrowRight className="size-4" />
              </Link>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="rounded-full border border-border px-6 py-3 text-sm font-bold uppercase tracking-wide text-foreground transition-colors hover:text-primary"
              >
                Edit Design
              </button>
            </div>
          </Reveal>
        ) : (
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* ---------- Upload your design ---------- */}
            <Reveal variant="left">
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  acceptFile(e.dataTransfer.files?.[0]);
                }}
                className={cn(
                  "group relative flex min-h-[22rem] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-colors duration-300",
                  dragging
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary/70",
                )}
              >
                {preview ? (
                  <>
                    <img
                      src={preview}
                      alt="Your design"
                      className="max-h-72 w-auto rounded-xl object-contain shadow-[0_20px_50px_-20px_color-mix(in_oklab,black_80%,transparent)]"
                    />
                    <p className="mt-4 max-w-full truncate text-sm text-muted-foreground">
                      {fileName}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" /> Remove
                    </button>
                  </>
                ) : (
                  <>
                    <span className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                      <ImagePlus className="size-8" />
                    </span>
                    <p className="mt-5 font-display text-2xl tracking-wider uppercase">
                      Upload Your Design
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Drag &amp; drop an image here, or click to browse — logo, sketch or a photo of
                      your idea (JPG / PNG).
                    </p>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => acceptFile(e.target.files?.[0])}
                />
              </div>
            </Reveal>

            {/* ---------- Pick your category ---------- */}
            <Reveal variant="right">
              <div className="rounded-2xl border border-border bg-background p-6">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Scissors className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-2xl tracking-wider uppercase">
                      Pick A Category
                    </h3>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      What should we make it on?
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                  {categories.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => {
                        setCategory(c.slug);
                        setSent(false);
                      }}
                      data-selected={category === c.slug}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/70",
                        category === c.slug
                          ? "border-primary shadow-[0_0_0_2px_color-mix(in_oklab,var(--primary)_45%,transparent)]"
                          : "border-border",
                      )}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={c.image}
                          alt={c.name}
                          loading="lazy"
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
                          aria-hidden
                        />
                        {category === c.slug && (
                          <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-[11px] font-black text-primary-foreground">
                            ✓
                          </span>
                        )}
                        <span className="absolute inset-x-0 bottom-0 p-2.5 text-xs font-bold uppercase leading-tight tracking-wide text-white">
                          {c.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        )}

        {!sent && (
          <Reveal delayMs={120} className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setSent(true)}
              className="shine inline-flex items-center gap-2 rounded-full bg-primary px-10 py-4 font-display text-xl tracking-[0.15em] uppercase text-primary-foreground shadow-[0_10px_40px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)] transition-transform duration-300 hover:scale-105"
            >
              Request A Quote <ArrowRight className="size-5" />
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              Demo preview — no information is sent yet.
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
