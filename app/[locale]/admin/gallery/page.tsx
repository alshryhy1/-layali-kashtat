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
  caption: string | null;
  user_name: string | null;
  likes_count: number | null;
  moderation_status: string | null;
  created_at: string | null;
};

export default async function AdminGalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale, isAr } = await requireAdminLocale(params);
  let rows = await safeRows<Row>(
    `SELECT id::text AS id, caption, user_name, likes_count,
            moderation_status, created_at::text AS created_at
     FROM gallery_posts
     ORDER BY created_at DESC NULLS LAST
     LIMIT 100`
  );
  if (rows.length === 0) {
    rows = await safeRows<Row>(
      `SELECT id::text AS id, caption, user_name, likes_count,
              NULL::text AS moderation_status, created_at::text AS created_at
       FROM gallery_posts
       ORDER BY created_at DESC NULLS LAST
       LIMIT 100`
    );
  }

  return (
    <AdminPageShell
      locale={locale}
      title={isAr ? "إدارة المعرض" : "Gallery"}
      subtitle={isAr ? "منشورات المعرض من gallery_posts" : "Gallery posts from gallery_posts"}
    >
      {rows.length === 0 ? (
        <AdminEmptyState isAr={isAr} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={adminTableStyle}>
            <thead>
              <tr>
                <th style={adminThStyle}>{isAr ? "التعليق" : "Caption"}</th>
                <th style={adminThStyle}>{isAr ? "المستخدم" : "User"}</th>
                <th style={adminThStyle}>{isAr ? "الإعجابات" : "Likes"}</th>
                <th style={adminThStyle}>{isAr ? "المراجعة" : "Moderation"}</th>
                <th style={adminThStyle}>{isAr ? "التاريخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={adminTdStyle}>{(r.caption || "—").slice(0, 80)}</td>
                  <td style={adminTdStyle}>{r.user_name || "—"}</td>
                  <td style={adminTdStyle}>{r.likes_count ?? 0}</td>
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
