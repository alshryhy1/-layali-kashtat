import * as React from "react";
import HomeClient from "@/components/HomeClient";
import { isValidLocale, type Locale } from "@/lib/locales";
import { fetchWeather } from "@/lib/weather";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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
  if (!isValidLocale(p?.locale)) notFound();
  const locale: Locale = p.locale === "en" ? "en" : "ar";
  const weather = await fetchWeather({ lang: locale, timeoutMs: 2500 });

  return <HomeClient locale={locale} initialWeatherText={weather.text} />;
}
