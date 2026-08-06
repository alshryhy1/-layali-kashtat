import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminPageShell } from "@/components/AdminPageShell";
import AdminUserDetailClient from "@/components/AdminUserDetailClient";
import { requireAdminLocale } from "@/lib/admin-auth-page";
import { getAdminUser, getUserRelated } from "@/lib/admin-users-data";
import { localeHref } from "@/lib/locales";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const p = await params;
  const { locale, isAr } = await requireAdminLocale(Promise.resolve({ locale: p.locale }));
  const id = String(p.id || "").trim();
  if (!id) notFound();

  const user = await getAdminUser(id);
  if (!user) notFound();

  const related = await getUserRelated(id);

  return (
    <AdminPageShell
      locale={locale}
      title={isAr ? "تفاصيل المستخدم" : "User detail"}
      subtitle={user.name || user.phone || user.id}
    >
      <div style={{ marginBottom: 12 }}>
        <Link
          href={localeHref(locale, "/admin/users")}
          style={{ fontSize: 14, fontWeight: 700, color: "#475569", textDecoration: "none" }}
        >
          {isAr ? "← العودة لقائمة المستخدمين" : "← Back to users"}
        </Link>
      </div>
      <AdminUserDetailClient locale={locale as "ar" | "en"} user={user} related={related} />
    </AdminPageShell>
  );
}
