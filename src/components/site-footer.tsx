import Link from "next/link";
import { Instagram, Mail, MessageCircle, Phone } from "lucide-react";
import logo from "@/assets/mashal-logo.jpg";
import { contentBoolean, contentString, type StorefrontCategory } from "@/lib/cms";

export function SiteFooter({
  siteContent,
  collections,
}: {
  siteContent: Record<string, unknown>;
  collections: StorefrontCategory[];
}) {
  const logoUrl = contentString(siteContent, "logo_url") || logo.src;
  const brandName = contentString(siteContent, "brand_name", "Mashal Olympics Sports Wear");
  const email = contentString(siteContent, "email");
  const phone = contentString(siteContent, "phone");
  const instagramUrl = contentString(siteContent, "instagram_url");
  const whatsappUrl =
    contentString(siteContent, "whatsapp_url") ||
    (phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : "");
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <img
            src={logoUrl}
            alt={brandName}
            width={220}
            height={110}
            loading="lazy"
            className="h-20 w-auto rounded-lg"
          />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {contentString(
              siteContent,
              "footer_text",
              "Custom sportswear and martial arts uniforms — made to your design.",
            )}
          </p>
          {(instagramUrl || whatsappUrl || email) && (
            <div className="mt-5 flex gap-3">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  aria-label="Instagram"
                  target="_blank"
                  rel="noreferrer"
                  className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Instagram className="size-4" />
                </a>
              )}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  aria-label="WhatsApp"
                  target="_blank"
                  rel="noreferrer"
                  className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <MessageCircle className="size-4" />
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  aria-label="Email"
                  className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Mail className="size-4" />
                </a>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-display text-lg tracking-[0.18em] uppercase text-foreground">
            {contentString(siteContent, "footer_shop_heading", "Shop")}
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/shop" className="transition-colors hover:text-primary">
                {contentString(siteContent, "footer_all_products", "All Products")}
              </Link>
            </li>
            {collections.slice(0, 4).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/contact?category=${encodeURIComponent(c.slug)}`}
                  className="transition-colors hover:text-primary"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg tracking-[0.18em] uppercase text-foreground">
            {contentString(siteContent, "footer_company_heading", "Company")}
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {contentBoolean(siteContent, "show_about", true) && (
              <li>
                <Link href="/about" className="transition-colors hover:text-primary">
                  {contentString(siteContent, "footer_about", "About Us")}
                </Link>
              </li>
            )}
            <li>
              <Link href="/contact" className="transition-colors hover:text-primary">
                {contentString(siteContent, "footer_custom_orders", "Custom Orders")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-primary">
                {contentString(siteContent, "footer_team_quotes", "Team & Club Quotes")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg tracking-[0.18em] uppercase text-foreground">
            {contentString(siteContent, "footer_quote_heading", "Get a Quote")}
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {phone && <span className="block">{phone}</span>}
            {email && <span className="block">{email}</span>}
            {contentString(
              siteContent,
              "footer_quote_text",
              "Send us your design, logo or team list and we’ll come back with pricing and delivery time.",
            )}
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-transform duration-300 hover:scale-105"
          >
            <Phone className="size-4" />
            {contentString(siteContent, "footer_quote_cta", "Start Inquiry")}
          </Link>
        </div>
      </div>

      <div className="border-t border-border py-5 text-center text-xs tracking-wide text-muted-foreground">
        © {new Date().getFullYear()} {brandName}. All rights reserved.
      </div>
    </footer>
  );
}
