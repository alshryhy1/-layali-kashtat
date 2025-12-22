import "../globals.css";
import SiteHeader from "@/components/SiteHeader";
import TopInfoBar from "@/components/TopInfoBar";

type Locale = "ar" | "en";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  const locale: Locale = rawLocale === "en" ? "en" : "ar";
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body style={{ margin: 0, minHeight: "100vh" }}>
        <TopInfoBar locale={locale} />
        <SiteHeader locale={locale} />
        <main style={{ minHeight: "calc(100vh - 70px)" }}>{children}</main>
      </body>
    </html>
  );
}
