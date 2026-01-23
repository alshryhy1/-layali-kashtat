import "../globals.css";
import SiteHeader from "@/components/SiteHeader";
import TopInfoBar from "@/components/TopInfoBar";
import { db } from "@/lib/db"; // Direct DB access for analytics
import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/auth-admin";
import type { Metadata } from "next";

type Locale = "ar" | "en";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale !== "en";

  return {
    title: isAr 
      ? "ليالي كشتات | حجز مخيمات ورحلات برية وكرفانات" 
      : "Layali Kashtat | Camping, Desert Trips & Caravans",
    description: isAr
      ? "المنصة الأولى في السعودية لحجز المخيمات، الكرفانات، والرحلات البرية. نوفر لك تجربة كشتة متكاملة مع خدمات مميزة."
      : "The #1 platform in Saudi Arabia for booking camps, caravans, and desert trips. We provide a complete camping experience with premium services.",
    keywords: isAr
      ? ["كشتات", "مخيمات", "رحلات برية", "تأجير خيام", "السعودية", "الرياض", "فعاليات شتوية"]
      : ["Kashtat", "Camping", "Desert Trips", "Saudi Arabia", "Riyadh", "Winter Events"],
    openGraph: {
      title: isAr ? "ليالي كشتات" : "Layali Kashtat",
      description: isAr ? "حجز رحلات ومخيمات برية" : "Book Desert Trips & Camps",
      url: "https://layali-kashtat.com", // Placeholder
      siteName: "Layali Kashtat",
      locale: isAr ? "ar_SA" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: isAr ? "ليالي كشتات" : "Layali Kashtat",
      description: isAr ? "حجز رحلات ومخيمات برية" : "Book Desert Trips & Camps",
    },
  };
}

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

  // Check if admin
  const token = (await cookies()).get("kashtat_admin")?.value;
  const isAdmin = verifyAdminSession(token);

  // Increment views only if NOT admin
  if (!isAdmin) {
    incrementViews();
  }

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
