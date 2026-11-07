"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Send } from "lucide-react";
import type { StorefrontCategory } from "@/lib/cms";

const inputClasses =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30";

export function ContactForm({
  initialCategory,
  categories,
}: {
  initialCategory?: string;
  categories: StorefrontCategory[];
}) {
  const [submitted, setSubmitted] = useState(false);
  const [product, setProduct] = useState(
    categories.some((category) => category.slug === initialCategory)
      ? initialCategory!
      : (categories[0]?.slug ?? "custom-shorts"),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/quotes", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not submit your inquiry.");
      setSubmitted(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Could not submit your inquiry.",
      );
    } finally {
      setBusy(false);
    }
  };
  const productName = categories.find((category) => category.slug === product)?.name ?? product;

  return (
    <div className="flame-border rounded-2xl border border-border bg-card p-6 sm:p-10">
      {submitted ? (
        <div className="flex flex-col items-center py-16 text-center">
          <CheckCircle2 className="size-16 text-primary" />
          <h2 className="mt-6 font-display text-4xl tracking-wider uppercase">Inquiry Sent</h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Thanks — your request for{" "}
            <span className="font-semibold text-foreground">{productName}</span> was received. Our
            team will get back to you with a quote.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-8 rounded-full border border-border px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors hover:border-primary hover:text-primary"
          >
            Send Another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Name
              <input
                required
                maxLength={120}
                name="name"
                placeholder="Your full name"
                className={inputClasses}
              />
            </label>
            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Phone / WhatsApp
              <input
                required
                name="phone"
                minLength={5}
                maxLength={40}
                placeholder="Your contact number"
                className={inputClasses}
              />
            </label>
          </div>

          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Product
            <select
              name="product"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className={inputClasses}
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Quantity
              <input
                name="quantity"
                type="number"
                min={1}
                max={10000}
                placeholder="e.g. 25"
                className={inputClasses}
              />
            </label>
            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Needed By
              <input
                name="deadline"
                type="date"
                className={`${inputClasses} [color-scheme:dark]`}
              />
            </label>
          </div>

          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Design Details
            <textarea
              name="details"
              rows={5}
              maxLength={4000}
              placeholder="Colors, logo placement, names & numbers, fabric preference, sizes…"
              className={`${inputClasses} resize-y`}
            />
          </label>

          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Design Image (optional, JPG / PNG / WebP, max 4 MB)
            <input
              name="design"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm normal-case tracking-normal file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-primary-foreground"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="shine mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-xl tracking-[0.15em] uppercase text-primary-foreground transition-transform duration-300 hover:scale-[1.02]"
          >
            <Send className="size-5" />
            {busy ? "Sending…" : "Send Inquiry"}
          </button>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
