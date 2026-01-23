import "./globals.css";
import type { Metadata } from "next";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import SnapPixel from "@/components/SnapPixel";

export const metadata: Metadata = {
  title: "Layali Kashtat",
  description: "Layali Kashtat Application",
  manifest: "/manifest.json",
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
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
