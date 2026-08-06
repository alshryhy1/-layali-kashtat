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
  is_active: boolean | null;
  moderation_status: string | null;
  starting_price: string | null;
  created_at: string | null;
};

export default async function AdminServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale, isAr } = await requireAdminLocale(params);
  let rows = await safeRows<Row>(
    `SELECT id::text AS id, title, is_active, moderation_status,
            starting_price::text AS starting_price,
            created_at::text AS created_at
     FROM provider_services
     ORDER BY created_at DESC NULLS LAST
     LIMIT 100`
  );
  if (rows.length === 0) {
    rows = await safeRows<Row>(
      `SELECT id::text AS id, title, is_active, moderation_status,
              NULL::text AS starting_price,
              created_at::text AS created_at
       FROM provider_services
       ORDER BY created_at DESC NULLS LAST
       LIMIT 100`
    );
  }

  return (
    <AdminPageShell
      locale={locale}
      title={isAr ? "إدارة الخدمات" : "Services"}
      subtitle={isAr ? "خدمات مقدّمي الكشتات من provider_services" : "Provider services from provider_services"}
    >
      {rows.length === 0 ? (
        <AdminEmptyState isAr={isAr} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={adminTableStyle}>
            <thead>
              <tr>
                <th style={adminThStyle}>{isAr ? "العنوان" : "Title"}</th>
                <th style={adminThStyle}>{isAr ? "الحالة" : "Active"}</th>
                <th style={adminThStyle}>{isAr ? "المراجعة" : "Moderation"}</th>
                <th style={adminThStyle}>{isAr ? "السعر" : "Price"}</th>
                <th style={adminThStyle}>{isAr ? "التاريخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={adminTdStyle}>{r.title || r.id}</td>
                  <td style={adminTdStyle}>{r.is_active ? (isAr ? "نشط" : "Active") : isAr ? "متوقف" : "Off"}</td>
                  <td style={adminTdStyle}>{r.moderation_status || "—"}</td>
                  <td style={adminTdStyle}>{r.starting_price || "—"}</td>
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
