import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth-admin";
import { localeHref } from "@/lib/locales";

export async function requireAdminLocale(params: Promise<{ locale: string }>) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "ar";
  const token = (await cookies()).get("kashtat_admin")?.value;
  if (!verifyAdminSession(token)) {
    redirect(localeHref(locale, "/admin/login"));
  }
  return { locale, isAr: locale === "ar" };
}

export function fmtAdminDate(locale: string, v: string | null | undefined) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString(locale === "ar" ? "ar-SA" : "en-US");
  } catch {
    return String(v);
  }
}
