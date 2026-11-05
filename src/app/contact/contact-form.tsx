"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { categories } from "@/lib/catalog";

const inputClasses =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [product, setProduct] = useState(categories[0]?.name ?? "Custom Sports Shorts");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flame-border rounded-2xl border border-border bg-card p-6 sm:p-10">
      {submitted ? (
        <div className="flex flex-col items-center py-16 text-center">
          <CheckCircle2 className="size-16 text-primary" />
          <h2 className="mt-6 font-display text-4xl tracking-wider uppercase">Inquiry Sent</h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Thanks — we&apos;ve noted your request for{" "}
            <span className="font-semibold text-foreground">{product}</span>. Our team will get back
            to you with a quote. This is a demo form, so nothing was actually sent yet.
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
              <input required name="name" placeholder="Your full name" className={inputClasses} />
            </label>
            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Phone / WhatsApp
              <input
                required
                name="phone"
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
                <option key={c.slug} value={c.name}>
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
              placeholder="Colors, logo placement, names & numbers, fabric preference, sizes…"
              className={`${inputClasses} resize-y`}
            />
          </label>

          <button
            type="submit"
            className="shine mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-xl tracking-[0.15em] uppercase text-primary-foreground transition-transform duration-300 hover:scale-[1.02]"
          >
            <Send className="size-5" />
            Send Inquiry
          </button>
        </form>
      )}
    </div>
  );
}
