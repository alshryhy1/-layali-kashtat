// app/[locale]/layout.tsx
import React from "react";
import "@/app/globals.css";
import SiteHeader from "@/components/SiteHeader";
import LegalFooter from "@/components/LegalFooter";

export const dynamic = "force-dynamic";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const dir = locale === "ar" ? "rtl" : "ltr";
  const lang = locale === "ar" ? "ar" : "en";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body>
        <SiteHeader />
        <main style={{ minHeight: "80vh" }}>{children}</main>
        <LegalFooter />
      </body>
    </html>
  );
}
