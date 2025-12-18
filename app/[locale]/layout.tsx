import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import LegalFooter from "@/components/LegalFooter";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";
  const dir = isEn ? "ltr" : "rtl";

  return (
    <div dir={dir} style={{ minHeight: "100vh" }}>
      <SiteHeader locale={isEn ? "en" : "ar"} />
      <main style={{ minHeight: "80vh" }}>{children}</main>
      <LegalFooter locale={isEn ? "en" : "ar"} />
    </div>
  );
}
