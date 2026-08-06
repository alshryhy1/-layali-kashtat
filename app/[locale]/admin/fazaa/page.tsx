import Link from "next/link";
import {
  AdminPageShell,
  AdminEmptyState,
  adminTableStyle,
  adminThStyle,
  adminTdStyle,
  adminCardStyle,
} from "@/components/AdminPageShell";
import { requireAdminLocale, fmtAdminDate } from "@/lib/admin-auth-page";
import { safeRows } from "@/lib/admin-portal-data";
import { localeHref } from "@/lib/locales";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HelpRow = {
  id: string;
  title: string | null;
  body: string | null;
  city_label: string | null;
  moderation_status: string | null;
  created_at: string | null;
};

type RequestRow = {
  id: string;
  name: string | null;
  service_type: string | null;
  status: string | null;
  ref: string | null;
  created_at: string | null;
};

export default async function AdminFazaaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale, isAr } = await requireAdminLocale(params);

  const help = await safeRows<HelpRow>(
    `SELECT id::text AS id, title, body, city_label, moderation_status, created_at::text AS created_at
     FROM community_posts
     WHERE type = 'help_request'
     ORDER BY created_at DESC
     LIMIT 50`
  );

  const requests = await safeRows<RequestRow>(
    `SELECT cr.id::text AS id,
            COALESCE(p.name, NULLIF(TRIM(COALESCE(cr.notes, '')), ''), cr.id::text) AS name,
            cr.service_type,
            cr.status,
            cr.id::text AS ref,
            cr.created_at::text AS created_at
     FROM customer_requests cr
     LEFT JOIN profiles p ON p.id = cr.customer_id
     ORDER BY cr.created_at DESC
     LIMIT 20`
  );

  return (
    <AdminPageShell
      locale={locale}
      title={isAr ? "إدارة الفزعات / الطلبات" : "Help & Requests"}
      subtitle={
        isAr
          ? "فزعات المجتمع (help_request) وطلبات العملاء"
          : "Community help posts and customer requests"
      }
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <Link href={localeHref(locale, "/admin/requests")} style={{ ...adminCardStyle, flex: "1 1 220px" }}>
          <div style={{ fontSize: 28 }}>🛒</div>
          <div style={{ fontWeight: 900 }}>{isAr ? "لوحة طلبات العملاء" : "Customer requests board"}</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            {isAr ? "قبول / رفض / حذف — الواجهة الكاملة" : "Approve / reject / delete — full UI"}
          </div>
        </Link>
        <Link href={localeHref(locale, "/admin/community")} style={{ ...adminCardStyle, flex: "1 1 220px" }}>
          <div style={{ fontSize: 28 }}>📝</div>
          <div style={{ fontWeight: 900 }}>{isAr ? "كل منشورات المجتمع" : "All community posts"}</div>
        </Link>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 10 }}>
        {isAr ? "فزعات المجتمع الأخيرة" : "Recent community help posts"}
      </h2>
      {help.length === 0 ? (
        <AdminEmptyState isAr={isAr} />
      ) : (
        <div style={{ overflowX: "auto", marginBottom: 28 }}>
          <table style={adminTableStyle}>
            <thead>
              <tr>
                <th style={adminThStyle}>{isAr ? "العنوان" : "Title"}</th>
                <th style={adminThStyle}>{isAr ? "المدينة" : "City"}</th>
                <th style={adminThStyle}>{isAr ? "المراجعة" : "Moderation"}</th>
                <th style={adminThStyle}>{isAr ? "التاريخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {help.map((r) => (
                <tr key={r.id}>
                  <td style={adminTdStyle}>{r.title || "—"}</td>
                  <td style={adminTdStyle}>{r.city_label || "—"}</td>
                  <td style={adminTdStyle}>{r.moderation_status || "—"}</td>
                  <td style={adminTdStyle}>{fmtAdminDate(locale, r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 10 }}>
        {isAr ? "أحدث طلبات العملاء" : "Latest customer requests"}
      </h2>
      {requests.length === 0 ? (
        <AdminEmptyState isAr={isAr} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={adminTableStyle}>
            <thead>
              <tr>
                <th style={adminThStyle}>{isAr ? "الاسم" : "Name"}</th>
                <th style={adminThStyle}>{isAr ? "الخدمة" : "Service"}</th>
                <th style={adminThStyle}>{isAr ? "الحالة" : "Status"}</th>
                <th style={adminThStyle}>{isAr ? "المرجع" : "Ref"}</th>
                <th style={adminThStyle}>{isAr ? "التاريخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td style={adminTdStyle}>{r.name || "—"}</td>
                  <td style={adminTdStyle}>{r.service_type || "—"}</td>
                  <td style={adminTdStyle}>{r.status || "—"}</td>
                  <td style={adminTdStyle}>{r.ref || "—"}</td>
                  <td style={adminTdStyle}>{fmtAdminDate(locale, r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPageShell>
  );
}
