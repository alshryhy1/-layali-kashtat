import "../globals.css";
import SiteHeader from "@/components/SiteHeader";
import TopInfoBar from "@/components/TopInfoBar";

type Locale = "ar" | "en";

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const rawLocale = params?.locale;
  const locale: Locale = rawLocale === "en" ? "en" : "ar";

  const lang = locale === "en" ? "en" : "ar";
  const dir = locale === "en" ? "ltr" : "rtl";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body>
        <TopInfoBar />
        <SiteHeader />
        <main style={{ minHeight: "80vh" }}>{children}</main>
      </body>
    </html>
  );
}
