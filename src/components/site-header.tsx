"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, X } from "lucide-react";
import { contentBoolean, contentString } from "@/lib/cms";
import { useBasket } from "@/components/basket-provider";

export function SiteHeader({ siteContent }: { siteContent: Record<string, unknown> }) {
  const [solid, setSolid] = useState(false);
  const { count } = useBasket();
  const pathname = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname; // the menu closes itself on navigation
  const navItems = [
    { href: "/", label: contentString(siteContent, "nav_home", "Home") },
    { href: "/shop", label: contentString(siteContent, "nav_shop", "Shop") },
    ...(contentBoolean(siteContent, "show_about", true)
      ? [{ href: "/about", label: contentString(siteContent, "nav_about", "About") }]
      : []),
    ...(contentBoolean(siteContent, "show_contact", true)
      ? [{ href: "/contact", label: contentString(siteContent, "nav_contact", "Contact") }]
      : []),
  ];
  const logoUrl = contentString(siteContent, "logo_url") || "/knockout-logo.webp";

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid ? "header-solid py-2" : "py-3"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center">
          <img
            src={logoUrl}
            alt={contentString(siteContent, "brand_name", "Knockout Sports Wear")}
            width={220}
            height={110}
            className="h-16 w-auto rounded-lg transition-transform duration-300 group-hover:scale-105 sm:h-20"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-active={pathname === item.href}
              className="nav-link text-sm font-semibold tracking-wide uppercase text-foreground/80 transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/shop#basket"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary"
          >
            <ShoppingBag className="size-4" /> {count}
          </Link>
          <Link
            href="/contact"
            className="shine inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-[0_8px_30px_-8px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition-transform duration-300 hover:scale-105"
          >
            {contentString(siteContent, "header_cta", "Custom Order")}
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpenAt(open ? null : pathname)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="grid size-10 place-items-center rounded-lg border border-border text-foreground md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav className="header-solid mt-3 flex flex-col gap-1 px-6 py-4 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-3 text-sm font-semibold uppercase tracking-wide text-foreground/90 hover:bg-card hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/shop#basket"
            className="rounded-lg px-3 py-3 text-sm font-semibold uppercase tracking-wide text-foreground/90 hover:bg-card hover:text-primary"
          >
            Basket ({count})
          </Link>
        </nav>
      )}
    </header>
  );
}
