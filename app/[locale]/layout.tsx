import "../globals.css";
import LocaleChrome from "@/components/LocaleChrome";
import ViewTracker from "@/components/ViewTracker";
import SnapPixel from "@/components/SnapPixel";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/auth-admin";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/locales";
import { fetchWeather } from "@/lib/weather";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#EFE3D2",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isValidLocale(raw)) {
    return { title: "ليالي كشتات" };
  }
  const isAr = raw !== "en";

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
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Layali",
    },
    openGraph: {
      title: isAr ? "ليالي كشتات" : "Layali Kashtat",
      description: isAr ? "حجز رحلات ومخيمات برية" : "Book Desert Trips & Camps",
      url: "https://layali-kashtat.com",
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
    const data = await fetchWeather({ lang: locale, timeoutMs: 2500 });
    return data.ok ? data.text : null;
  } catch {
    return null;
  }
}

async function getLatestAnnouncement(): Promise<string | null> {
  try {
    const res = await db.query(
      "SELECT text FROM banner_announcements WHERE active = true ORDER BY created_at DESC LIMIT 1"
    );
    if (res.rows.length > 0) return String(res.rows[0].text || "");
    return null;
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
  if (!isValidLocale(rawLocale)) {
    notFound();
  }
  const locale: Locale = rawLocale === "en" ? "en" : "ar";

  const token = (await cookies()).get("kashtat_admin")?.value;
  const isAdmin = verifyAdminSession(token);

  // Parallel, bounded work — never block home on production HTTP or DDL.
  const [weatherText, announcement] = await Promise.all([
    getWeatherText(locale),
    getLatestAnnouncement(),
  ]);
  const topBannerText = announcement || "التسجيل مجانا لفتره محدودة بادر بالتسجيل الان";

  return (
    <>
      {!isAdmin && <ViewTracker />}
      <SnapPixel />
      <LocaleChrome
        locale={locale}
        weatherText={weatherText ?? undefined}
        topBannerText={topBannerText}
      >
        {children}
      </LocaleChrome>
    </>
  );
}
