import Link from "next/link";
import { AdminPageShell } from "@/components/AdminPageShell";
import AdminUsersClient from "@/components/AdminUsersClient";
import { requireAdminLocale } from "@/lib/admin-auth-page";
import { listAdminUsers } from "@/lib/admin-users-data";
import { parseVerifiedFilter } from "@/lib/admin-users-shared";
import { localeHref } from "@/lib/locales";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, isAr } = await requireAdminLocale(params);
  const sp = await searchParams;

  const q = typeof sp.q === "string" ? sp.q : "";
  // Portal card → ?verified=unverified (also accepts verified=0 / filter=unverified)
  const verifiedFromVerified = parseVerifiedFilter(sp.verified);
  const verified =
    verifiedFromVerified !== "all" ? verifiedFromVerified : parseVerifiedFilter(sp.filter);
  const role =
    typeof sp.role === "string" && ["customer", "provider", "admin", "all"].includes(sp.role)
      ? (sp.role as "customer" | "provider" | "admin" | "all")
      : "all";
  const status =
    typeof sp.status === "string" && ["active", "suspended", "all"].includes(sp.status)
      ? (sp.status as "active" | "suspended" | "all")
      : "all";

  const users = await listAdminUsers({ q, verified, role, status, limit: 500 });

  return (
    <AdminPageShell
      locale={locale}
      maxWidth={1280}
      title={isAr ? "إدارة المستخدمين" : "Users"}
      subtitle={
        isAr
          ? "بحث، تصفية، إجراءات فردية وجماعية، وتصدير CSV — من جدول profiles + auth.users"
          : "Search, filter, per-user & bulk actions, CSV export — profiles + auth.users"
      }
    >
      <div style={{ marginBottom: 10 }}>
        <Link
          href={localeHref(locale, "/admin/settings")}
          style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}
        >
          {isAr ? "حسابات مشرفي البوابة (kashtat_admin) ←" : "Portal admin accounts (kashtat_admin) →"}
        </Link>
      </div>
      <AdminUsersClient
        locale={locale as "ar" | "en"}
        initialUsers={users}
        initialQ={q}
        initialVerified={verified}
        initialRole={role}
        initialStatus={status}
      />
    </AdminPageShell>
  );
}
