import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminPageShell } from "@/components/AdminPageShell";
import AdminFlagDetailClient from "@/components/AdminFlagDetailClient";
import { requireAdminLocale } from "@/lib/admin-auth-page";
import { getAdminFlagDetail } from "@/lib/admin-flags-data";
import { localeHref } from "@/lib/locales";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminFlagDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const p = await params;
  const { locale, isAr } = await requireAdminLocale(Promise.resolve({ locale: p.locale }));
  const id = String(p.id || "").trim();
  if (!id) notFound();

  const detail = await getAdminFlagDetail(id);
  if (!detail) notFound();

  return (
    <AdminPageShell
      locale={locale}
      maxWidth={960}
      title={isAr ? `بلاغ #${detail.shortId}` : `Report #${detail.shortId}`}
      subtitle={isAr ? detail.targetTypeLabelAr : detail.targetTypeLabelEn}
    >
      <div style={{ marginBottom: 12 }}>
        <Link
          href={localeHref(locale, "/admin/flags?status=pending")}
          style={{ fontSize: 14, fontWeight: 700, color: "#475569", textDecoration: "none" }}
        >
          {isAr ? "← العودة لقائمة البلاغات" : "← Back to reports"}
        </Link>
      </div>
      <AdminFlagDetailClient locale={locale as "ar" | "en"} detail={detail} />
    </AdminPageShell>
  );
}
