import * as React from "react";
import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

function asLocale(v: unknown): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

/**
 * Home tab — matches native HomeScreen (V5).
 * No landing/splash, no redirect to legacy JWT dashboards.
 */
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale: Locale = asLocale(p?.locale);

  return <HomeClient locale={locale} />;
}
