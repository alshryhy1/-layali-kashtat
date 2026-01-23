import AdminLoginClient from "@/components/AdminLoginClient";

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
  // Change default redirect to the new portal
  const next = sp?.next || `/${locale}/admin/portal`;

  return <AdminLoginClient locale={locale} next={next} />;
}
