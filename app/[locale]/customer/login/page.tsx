import { redirect } from "next/navigation";
import { localeHref } from "@/lib/locales";

type Locale = "ar" | "en";

function asLocale(v: unknown): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

/** Unified account — matches native app (no customer/provider login split). */
export default async function CustomerLoginRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const locale = asLocale(p?.locale);
  const view = String(sp?.view || "").toLowerCase() === "signup" ? "signup" : "login";
  redirect(localeHref(locale, `/account?view=${view}`));
}
