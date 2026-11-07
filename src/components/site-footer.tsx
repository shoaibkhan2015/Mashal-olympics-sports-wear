import Link from "next/link";
import { Facebook, Instagram, Mail, Phone } from "lucide-react";
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
  const facebookUrl = contentString(siteContent, "facebook_url");
  const tiktokUrl = contentString(siteContent, "tiktok_url");
  const whatsappNumber = contentString(siteContent, "whatsapp_number").replace(/\D/g, "");
  const whatsappUrl =
    whatsappNumber.length >= 7 && whatsappNumber.length <= 15
      ? `https://wa.me/${whatsappNumber}`
      : "";
  const socialLinkClass =
    "grid size-10 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary";
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
          {(instagramUrl || facebookUrl || tiktokUrl || email) && (
            <div className="mt-5 flex gap-3">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  aria-label="Visit our Instagram profile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={socialLinkClass}
                >
                  <Instagram className="size-4" />
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  aria-label="Visit our Facebook profile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={socialLinkClass}
                >
                  <Facebook className="size-4" />
                </a>
              )}
              {tiktokUrl && (
                <a
                  href={tiktokUrl}
                  aria-label="Visit our TikTok profile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={socialLinkClass}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
                    <path d="M19.6 6.2a5.4 5.4 0 0 1-3.3-3.3A5.2 5.2 0 0 1 16 1.5h-3.8v14.1a2.8 2.8 0 1 1-2.8-2.8c.4 0 .8.1 1.1.2v-3.9a6.8 6.8 0 1 0 5.5 6.7V8.6a9 9 0 0 0 5.2 1.7V6.5c-.6 0-1.1-.1-1.6-.3Z" />
                  </svg>
                </a>
              )}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  aria-label="Chat with us on WhatsApp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={socialLinkClass}
                >
                  <svg viewBox="0 0 32 32" aria-hidden="true" className="size-4 fill-current">
                    <path d="M16 .8A15 15 0 0 0 3.1 23.5L1 31l7.7-2A15.1 15.1 0 1 0 16 .8Zm0 27.5c-2.3 0-4.5-.6-6.4-1.8l-.5-.3-4.5 1.2 1.2-4.4-.3-.5a12.3 12.3 0 1 1 10.5 5.8Zm6.8-9.2c-.4-.2-2.3-1.2-2.7-1.3-.4-.2-.6-.2-.9.2-.3.4-1 1.3-1.3 1.5-.2.3-.5.3-.9.1a10.1 10.1 0 0 1-3.1-1.9 11.6 11.6 0 0 1-2.1-2.7c-.2-.4 0-.6.2-.8l.6-.7.4-.6c.1-.3 0-.5 0-.7l-1.2-2.8c-.3-.8-.7-.7-.9-.7h-.8c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.3s1.5 3.8 1.7 4.1c.2.3 2.9 4.5 7 6.3 1 .4 1.7.7 2.3.8 1 .3 1.9.2 2.6.1.8-.1 2.3-.9 2.6-1.8.4-.9.4-1.6.3-1.8-.1-.2-.4-.3-.8-.5Z" />
                  </svg>
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
