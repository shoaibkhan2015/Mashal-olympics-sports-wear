import Link from "next/link";
import { Instagram, Mail, MessageCircle, Phone } from "lucide-react";
import { categories } from "@/lib/catalog";
import logo from "@/assets/mashal-logo.jpg";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <img
            src={logo.src}
            alt="Mashal Olympics Sports Wear"
            width={220}
            height={110}
            loading="lazy"
            className="h-20 w-auto rounded-lg"
          />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Custom sportswear and martial arts uniforms — stitched, sublimated and finished to your
            team&apos;s design.
          </p>
          <div className="mt-5 flex gap-3">
            <a
              href="#"
              aria-label="Instagram"
              className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Instagram className="size-4" />
            </a>
            <a
              href="#"
              aria-label="WhatsApp"
              className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <MessageCircle className="size-4" />
            </a>
            <a
              href="#"
              aria-label="Email"
              className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Mail className="size-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-display text-lg tracking-[0.18em] uppercase text-foreground">Shop</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/shop" className="transition-colors hover:text-primary">
                All Products
              </Link>
            </li>
            {categories.slice(0, 4).map((c) => (
              <li key={c.slug}>
                <Link href="/contact" className="transition-colors hover:text-primary">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg tracking-[0.18em] uppercase text-foreground">
            Company
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/about" className="transition-colors hover:text-primary">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-primary">
                Custom Orders
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-primary">
                Team &amp; Club Quotes
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg tracking-[0.18em] uppercase text-foreground">
            Get a Quote
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Send us your design, logo or team list and we&apos;ll come back with pricing and
            delivery time.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-transform duration-300 hover:scale-105"
          >
            <Phone className="size-4" />
            Start Inquiry
          </Link>
        </div>
      </div>

      <div className="border-t border-border py-5 text-center text-xs tracking-wide text-muted-foreground">
        © {new Date().getFullYear()} Mashal Olympics Sports Wear. All rights reserved.
      </div>
    </footer>
  );
}
