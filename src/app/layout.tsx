import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { BasketProvider } from "@/components/basket-provider";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { contentString, getStorefrontCategories, getStorefrontContent } from "@/lib/cms";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getStorefrontContent("site");
  const name = contentString(site, "brand_name", "Knockout Sports Wear");
  const description = contentString(
    site,
    "footer_text",
    "Custom sportswear and martial arts uniforms made to your design.",
  );
  return {
    title: name,
    description,
    openGraph: { title: name, description, type: "website" },
    twitter: { card: "summary_large_image" },
    icons: { icon: { url: "/favicon.png", type: "image/png" } },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [siteContent, collections] = await Promise.all([
    getStorefrontContent("site"),
    getStorefrontCategories(),
  ]);
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- root layout, loads on every page */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>
        <BasketProvider>
          <div className="flex min-h-screen flex-col bg-background text-foreground">
            <SiteHeader siteContent={siteContent} />
            <div className="flex-1">{children}</div>
            <SiteFooter siteContent={siteContent} collections={collections} />
            <WhatsAppButton number={contentString(siteContent, "whatsapp_number")} />
          </div>
        </BasketProvider>
      </body>
    </html>
  );
}
