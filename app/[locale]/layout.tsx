import "../globals.css";
import SiteHeader from "@/components/SiteHeader";
import TopInfoBar from "@/components/TopInfoBar";
import LegalFooter from "@/components/LegalFooter";
import ViewTracker from "@/components/ViewTracker";
import SnapPixel from "@/components/SnapPixel";
import TikTokPixel from "@/components/TikTokPixel";
import { db } from "@/lib/db"; // Direct DB access for analytics
import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/auth-admin";
import type { Metadata } from "next";
import { localeHref } from "@/lib/locales";

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
    manifest: "/manifest.json",
    themeColor: "#000000",
    viewport: {
      width: "device-width",
      initialScale: 1,
      maximumScale: 1,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Layali",
    },
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

async function getLatestHaraj(locale: Locale) {
  try {
    const res = await db.query(
      "SELECT id, title FROM haraj_items WHERE title NOT ILIKE $1 ORDER BY created_at DESC LIMIT 1",
      ["%جمس%"]
    );
    if (res.rows.length === 0) return null;
    const item = res.rows[0];
    return {
      id: String(item.id),
      title: String(item.title || ""),
      url: localeHref(locale, `/haraj/${item.id}`),
      msg: locale === "ar" ? `إعلان جديد: ${String(item.title || "").slice(0, 40)}` : `New ad: ${String(item.title || "").slice(0, 40)}`
    };
  } catch {
    return null;
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

  const weatherText = await getWeatherText(locale);
  // const latestHaraj = await getLatestHaraj(locale);

  async function getLatestAnnouncement(): Promise<string | null> {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS banner_announcements (
          id SERIAL PRIMARY KEY,
          text TEXT NOT NULL,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      const res = await db.query("SELECT text FROM banner_announcements WHERE active = true ORDER BY created_at DESC LIMIT 1");
      if (res.rows.length > 0) return String(res.rows[0].text || "");
      return null;
    } catch {
      return null;
    }
  }
  const topBannerText = (await getLatestAnnouncement()) || "التسجيل مجانا لفتره محدودة بادر بالتسجيل الان";

  return (
    <>
      {!isAdmin && <ViewTracker />}
      <SnapPixel />
      {/* <TikTokPixel /> */}
      <TopInfoBar 
        locale={locale} 
        weatherText={weatherText ?? undefined} 
        text={topBannerText} 
      />
      <SiteHeader locale={locale} />
      <main
        className="page-container"
        dir={dir}
        style={{
          minHeight: "calc(100vh - 120px)",
          paddingTop: 16,
          paddingBottom: 24,
        }}
      >
        {children}
      </main>
      <LegalFooter locale={locale} />
    </>
  );
}
