import * as React from "react";
import InstallPrompt from "@/components/InstallPrompt";
import { getSession } from "@/lib/auth-customer";
import { getProviderSession } from "@/lib/auth-provider";
import { redirect } from "next/navigation";
import LandingPageClient from "@/components/LandingPageClient";
import { localeHref } from "@/lib/locales";

export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale: Locale = asLocale(p?.locale);

  const customerSession = await getSession();
  if (customerSession) {
    redirect(localeHref(locale, "/customer/dashboard"));
  }

  const providerSession = await getProviderSession();
  if (providerSession) {
    redirect(localeHref(locale, "/providers/dashboard"));
  }

  return (
    <>
      <LandingPageClient locale={locale} />
      <InstallPrompt />
    </>
  );
}
