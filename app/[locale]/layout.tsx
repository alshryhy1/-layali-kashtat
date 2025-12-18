import "../globals.css";
import type { Metadata } from "next";
import React from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LegalFooter from "@/components/LegalFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ليالي كشتات | Layali Kashtat",
  description: "منصة تقنية وسيطة لتنظيم الطلبات والتواصل بين مقدّمي الخدمات والعملاء",
};

const SUPPORTED = new Set(["ar", "en"]);

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = SUPPORTED.has(raw) ? raw : "ar";
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body>
        <header
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backdropFilter: "blur(6px)",
          }}
        >
          <strong>{locale === "ar" ? "ليالي كشتات" : "Layali Kashtat"}</strong>
          <LanguageSwitcher />
        </header>

        <main style={{ minHeight: "80vh" }}>{children}</main>

        <LegalFooter />
      </body>
    </html>
  );
}
