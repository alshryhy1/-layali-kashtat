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
  const lang = locale;

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body>
        {/* شريط علوي خفيف (طقس/معلومة) — لا يكسر العرض */}
        <TopInfoBar locale={locale} />

        {/* الهيدر — صف واحد على الجوال */}
        <SiteHeader locale={locale} />

        {/* الحاوية العامة لكل الصفحات */}
        <main
          className="page-container"
          style={{
            minHeight: "calc(100vh - 120px)", // يمنع القفز ويضمن امتلاء الصفحة
            paddingTop: 16,
            paddingBottom: 24,
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
