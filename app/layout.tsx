import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ProviderDocsLink from "@/components/ProviderDocsLink";
import LegalFooter from "@/components/LegalFooter";

export const metadata: Metadata = {
  title: "ليالي كشتات | Layali Kashtat",
  description:
    "منصة تقنية وسيطة لتنظيم الطلبات والتواصل بين مقدّمي الخدمات والعملاء",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body>
        <header
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #e5e5e5",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Link href="/" style={{ fontWeight: 700, textDecoration: "none" }}>
            ليالي كشتات
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* رابط توثيق مقدّمي الخدمة (يتغير حسب اللغة تلقائيًا) */}
            <ProviderDocsLink />

            {/* تبديل اللغة */}
            <LanguageSwitcher />
          </nav>
        </header>

        <main style={{ minHeight: "80vh" }}>{children}</main>

        <LegalFooter />
      </body>
    </html>
  );
}
