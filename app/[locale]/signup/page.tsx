import { redirect } from "next/navigation";
import { localeHref } from "@/lib/locales";

type Locale = "ar" | "en";

function asLocale(v: unknown): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

/** Unified signup — no customer/provider choice (matches native AccountScreen). */
export default async function SignupRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale = asLocale(p?.locale);
  redirect(localeHref(locale, "/account?view=signup"));
}
