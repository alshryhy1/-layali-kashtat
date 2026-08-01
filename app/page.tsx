import InstallPrompt from "@/components/InstallPrompt";
import LandingPageClient from "@/components/LandingPageClient";
import { getSession } from "@/lib/auth-customer";
import { getProviderSession } from "@/lib/auth-provider";
import { localeHref } from "@/lib/locales";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Fallback for `/` if proxy rewrite to `/ar` is skipped.
 * Normal traffic is rewritten by proxy.ts → app/[locale]/page.tsx (locale=ar).
 */
export default async function RootPage() {
  const customerSession = await getSession();
  if (customerSession) {
    redirect(localeHref("ar", "/customer/dashboard"));
  }

  const providerSession = await getProviderSession();
  if (providerSession) {
    redirect(localeHref("ar", "/providers/dashboard"));
  }

  return (
    <>
      <LandingPageClient locale="ar" />
      <InstallPrompt />
    </>
  );
}
