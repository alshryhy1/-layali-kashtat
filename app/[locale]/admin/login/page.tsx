import AdminLoginClient from "@/components/AdminLoginClient";
import { localeHref } from "@/lib/locales";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ next?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const locale = p?.locale === "en" ? "en" : "ar";
  const next = sp?.next || localeHref(locale, "/admin/portal");

  return <AdminLoginClient locale={locale} next={next} />;
}
