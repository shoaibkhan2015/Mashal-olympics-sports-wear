"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, X } from "lucide-react";
import { contentBoolean, contentString } from "@/lib/cms";
import { useBasket } from "@/components/basket-provider";

export function SiteHeader({ siteContent }: { siteContent: Record<string, unknown> }) {
  const [solid, setSolid] = useState(false);
  const { count } = useBasket();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
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
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    if (window.matchMedia("(min-width: 768px)").matches) {
      desktopNavRef.current?.querySelector<HTMLElement>("a")?.focus();
    } else {
      menuButtonRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== "Tab") return;

      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusable = drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (
        event.shiftKey &&
        (document.activeElement === first || !drawer.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !drawer.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const onBreakpointChange = () => {
      if (window.matchMedia("(min-width: 768px)").matches) closeMenu();
    };
    window.addEventListener("resize", onBreakpointChange);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onBreakpointChange);
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
    };
  }, [menuOpen, closeMenu]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <>
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

          <nav ref={desktopNavRef} className="hidden items-center gap-8 md:flex">
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
              href="/cart"
              aria-label={`Cart (${count})`}
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
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            className="grid size-10 place-items-center rounded-lg border border-border text-foreground md:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>
      <div
        className={`mobile-menu-layer md:hidden ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          aria-label="Close menu"
          onClick={closeMenu}
          className="mobile-menu-backdrop"
        />
        <aside
          id="mobile-navigation"
          ref={drawerRef}
          role="dialog"
          aria-modal={menuOpen}
          aria-label="Mobile navigation"
          inert={!menuOpen}
          className={`mobile-menu-drawer ${menuOpen ? "is-open" : ""}`}
        >
          <div className="flex items-center justify-between border-b border-border px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
            <p className="font-display text-2xl tracking-[0.12em] uppercase text-foreground">
              Menu
            </p>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              className="grid size-12 place-items-center rounded-xl border border-border text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              <X className="size-6" />
            </button>
          </div>
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-active={isActive(item.href)}
                aria-current={isActive(item.href) ? "page" : undefined}
                onClick={closeMenu}
                className="mobile-menu-link"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/cart"
              data-active={pathname === "/cart"}
              aria-current={pathname === "/cart" ? "page" : undefined}
              onClick={closeMenu}
              className="mobile-menu-link mt-2 border-t border-border pt-4"
            >
              <span>Cart</span>
              <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
                {count}
              </span>
            </Link>
          </nav>
        </aside>
      </div>
    </>
  );
}
