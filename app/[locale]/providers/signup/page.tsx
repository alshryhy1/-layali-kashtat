import { redirect } from "next/navigation";
import { localeHref } from "@/lib/locales";

type Locale = "ar" | "en";

function asLocale(v: unknown): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

/** Provider details are completed after login via «خدماتي» — same as native app. */
export default async function ProvidersSignupRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale = asLocale(p?.locale);
  redirect(localeHref(locale, "/account?view=signup"));
}
