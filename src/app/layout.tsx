import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mashal Olympics Sports Wear",
  description:
    "Custom sportswear manufacturer — sports shorts, shirts, tank tops, gym wear, tracksuits, football kits, taekwondo, wushu and karate uniforms made to your design.",
  openGraph: {
    title: "Mashal Olympics Sports Wear",
    description: "Custom sportswear and martial arts uniforms, made to your team's design.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: { url: "/favicon.png", type: "image/png" } },
};

export default function RootLayout({ children }: { children: ReactNode }) {
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
        <div className="flex min-h-screen flex-col bg-background text-foreground">
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
