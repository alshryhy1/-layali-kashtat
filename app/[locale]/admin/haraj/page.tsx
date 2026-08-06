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
  title: string | null;
  price: string | null;
  city: string | null;
  created_at: string | null;
};

export default async function AdminHarajPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale, isAr } = await requireAdminLocale(params);
  let rows = await safeRows<Row>(
    `SELECT id::text AS id, title, price::text AS price, city::text AS city,
            created_at::text AS created_at
     FROM haraj_items
     ORDER BY created_at DESC NULLS LAST
     LIMIT 100`
  );
  if (rows.length === 0) {
    rows = await safeRows<Row>(
      `SELECT id::text AS id, title, NULL::text AS price, NULL::text AS city,
              created_at::text AS created_at
       FROM haraj_items
       ORDER BY created_at DESC NULLS LAST
       LIMIT 100`
    );
  }

  return (
    <AdminPageShell
      locale={locale}
      title={isAr ? "إدارة الحراج" : "Haraj"}
      subtitle={isAr ? "إعلانات الحراج من haraj_items" : "Marketplace listings from haraj_items"}
    >
      {rows.length === 0 ? (
        <AdminEmptyState isAr={isAr} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={adminTableStyle}>
            <thead>
              <tr>
                <th style={adminThStyle}>{isAr ? "العنوان" : "Title"}</th>
                <th style={adminThStyle}>{isAr ? "السعر" : "Price"}</th>
                <th style={adminThStyle}>{isAr ? "المدينة" : "City"}</th>
                <th style={adminThStyle}>{isAr ? "التاريخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={adminTdStyle}>{r.title || r.id}</td>
                  <td style={adminTdStyle}>{r.price || "—"}</td>
                  <td style={adminTdStyle}>{r.city || "—"}</td>
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
