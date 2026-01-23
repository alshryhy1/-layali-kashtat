import "../globals.css";
import SiteHeader from "@/components/SiteHeader";
import TopInfoBar from "@/components/TopInfoBar";
import { db } from "@/lib/db"; // Direct DB access for analytics

type Locale = "ar" | "en";

async function getWeatherText(locale: Locale) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/weather?lang=${locale}`,
      { cache: "no-store" }
    );

    if (!res.ok) return null;

    const data = await res.json();

    // نتوقع API يرجع: city, temp, description
    const city = String(data?.city || "").trim();
    const temp = typeof data?.temp === "number" ? Math.round(data.temp) : null;
    const desc = String(data?.description || "").trim();

    if (!city || temp === null || !desc) return null;

    return locale === "ar"
      ? `${city} • ${temp}° • ${desc}`
      : `${city} • ${temp}° • ${desc}`;
  } catch {
    return null;
  }
}

// Analytics Helper
async function incrementViews() {
  try {
    await db.query(`
      INSERT INTO site_analytics (key, value) 
      VALUES ('total_views', 1) 
      ON CONFLICT (key) 
      DO UPDATE SET value = site_analytics.value + 1
    `);
  } catch (e) {
    console.error("Failed to increment views:", e);
  }
}

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

  // Increment views on every page load (server-side)
  // Note: In a real high-traffic app, use a queue or Redis. For this scale, direct DB update is fine.
  incrementViews();

  const weatherText = await getWeatherText(locale);

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body>
        {/* الشريط العلوي — إعلان + طقس حقيقي */}
        <TopInfoBar locale={locale} weatherText={weatherText ?? undefined} />

        {/* الهيدر (مخفي على الجوال حسب التعديل السابق) */}
        <SiteHeader locale={locale} />

        <main
          className="page-container"
          style={{
            minHeight: "calc(100vh - 120px)",
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
