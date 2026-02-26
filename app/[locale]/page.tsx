
import * as React from "react";
import InstallPrompt from "@/components/InstallPrompt";
import { getSession } from "@/lib/auth-customer";
import { getProviderSession } from "@/lib/auth-provider";
import { redirect } from "next/navigation";
import LandingPageClient from "@/components/LandingPageClient";

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
  
  // 1. Check Customer Session
  const customerSession = await getSession();
  if (customerSession) {
    redirect(`/${locale}/customer/dashboard`);
  }

  // 2. Check Provider Session
  const providerSession = await getProviderSession();
  if (providerSession) {
    redirect(`/${locale}/providers/dashboard`);
  }

  // 3. Render Landing Page
  return (
    <>
      <LandingPageClient locale={locale} />
      <InstallPrompt />
    </>
  );
}
