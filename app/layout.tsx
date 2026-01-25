import "./globals.css";
import type { Metadata } from "next";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import SnapPixel from "@/components/SnapPixel";
import TikTokPixel from "@/components/TikTokPixel";

export const metadata: Metadata = {
  metadataBase: new URL("https://layalikashtat.com"),
  title: "Layali Kashtat",
  description: "Layali Kashtat Application",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/next.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/next.svg" />
      </head>
      <body>
        {children}
        <SnapPixel />
        <TikTokPixel />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
