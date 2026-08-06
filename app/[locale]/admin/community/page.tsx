import {
  AdminPageShell,
  AdminEmptyState,
  adminTableStyle,
  adminThStyle,
  adminTdStyle,
} from "@/components/AdminPageShell";
import { requireAdminLocale, fmtAdminDate } from "@/lib/admin-auth-page";
import { safeRows } from "@/lib/admin-portal-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  type: string | null;
  title: string | null;
  city_label: string | null;
  moderation_status: string | null;
  created_at: string | null;
};

export default async function AdminCommunityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale, isAr } = await requireAdminLocale(params);
  const rows = await safeRows<Row>(
    `SELECT id::text AS id, type, title, city_label, moderation_status, created_at::text AS created_at
     FROM community_posts
     ORDER BY created_at DESC
     LIMIT 100`
  );

  return (
    <AdminPageShell
      locale={locale}
      title={isAr ? "إدارة المجتمع" : "Community"}
      subtitle={isAr ? "منشورات المجتمع من community_posts" : "Posts from community_posts"}
    >
      {rows.length === 0 ? (
        <AdminEmptyState isAr={isAr} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={adminTableStyle}>
            <thead>
              <tr>
                <th style={adminThStyle}>{isAr ? "النوع" : "Type"}</th>
                <th style={adminThStyle}>{isAr ? "العنوان" : "Title"}</th>
                <th style={adminThStyle}>{isAr ? "المدينة" : "City"}</th>
                <th style={adminThStyle}>{isAr ? "المراجعة" : "Moderation"}</th>
                <th style={adminThStyle}>{isAr ? "التاريخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={adminTdStyle}>{r.type || "—"}</td>
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
    </AdminPageShell>
  );
}
