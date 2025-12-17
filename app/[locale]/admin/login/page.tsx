import AdminLoginClient from "@/components/AdminLoginClient";

export const dynamic = "force-dynamic";

export default function AdminLoginPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { next?: string };
}) {
  const locale = params?.locale === "en" ? "en" : "ar";
  const next = searchParams?.next || `/${locale}/admin/requests`;

  return <AdminLoginClient locale={locale} next={next} />;
}
