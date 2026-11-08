"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const defaultMessage = "Hi! I have a question about Knockout Sports Wear.";

export function WhatsAppButton({
  number,
  productName,
  productSlug,
}: {
  number: string;
  productName?: string;
  productSlug?: string;
}) {
  const pathname = usePathname();
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const digits = number.replace(/\D/g, "");
  const isProductPage = pathname.startsWith("/shop/") && pathname !== "/shop/";

  useEffect(() => {
    if (pathname !== "/shop") return;
    const basket = document.getElementById("basket");
    if (!basket) return;

    const observer = new IntersectionObserver(
      ([entry]) => setCheckoutVisible(entry.isIntersecting),
      { threshold: 0.01 },
    );
    observer.observe(basket);
    return () => observer.disconnect();
  }, [pathname]);

  if (
    digits.length < 7 ||
    digits.length > 15 ||
    pathname.startsWith("/admin") ||
    (isProductPage && !productName) ||
    checkoutVisible
  ) {
    return null;
  }

  const message = productName
    ? `${defaultMessage}\n\nProduct: ${productName}\nLink: /shop/${productSlug ?? ""}`
    : defaultMessage;
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={
        productName
          ? `Chat with Knockout Sports Wear on WhatsApp about ${productName}`
          : "Chat with Knockout Sports Wear on WhatsApp"
      }
      onClick={(event) => {
        if (!productName) return;
        event.preventDefault();
        const productUrl = `${window.location.origin}/shop/${productSlug ?? ""}`;
        const productMessage = `${defaultMessage}\n\nProduct: ${productName}\nLink: ${productUrl}`;
        window.open(
          `https://wa.me/${digits}?text=${encodeURIComponent(productMessage)}`,
          "_blank",
          "noopener,noreferrer",
        );
      }}
      className="fixed bottom-5 right-4 z-40 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#25D366] sm:bottom-6 sm:right-6"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="size-7 fill-current">
        <path d="M16 .8A15 15 0 0 0 3.1 23.5L1 31l7.7-2A15.1 15.1 0 1 0 16 .8Zm0 27.5c-2.3 0-4.5-.6-6.4-1.8l-.5-.3-4.5 1.2 1.2-4.4-.3-.5a12.3 12.3 0 1 1 10.5 5.8Zm6.8-9.2c-.4-.2-2.3-1.2-2.7-1.3-.4-.2-.6-.2-.9.2-.3.4-1 1.3-1.3 1.5-.2.3-.5.3-.9.1a10.1 10.1 0 0 1-3.1-1.9 11.6 11.6 0 0 1-2.1-2.7c-.2-.4 0-.6.2-.8l.6-.7.4-.6c.1-.3 0-.5 0-.7l-1.2-2.8c-.3-.8-.7-.7-.9-.7h-.8c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.3s1.5 3.8 1.7 4.1c.2.3 2.9 4.5 7 6.3 1 .4 1.7.7 2.3.8 1 .3 1.9.2 2.6.1.8-.1 2.3-.9 2.6-1.8.4-.9.4-1.6.3-1.8-.1-.2-.4-.3-.8-.5Z" />
      </svg>
    </a>
  );
}
