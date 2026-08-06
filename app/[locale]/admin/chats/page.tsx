import {
  AdminPageShell,
  AdminEmptyState,
  AdminStubBanner,
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
  customer_id: string | null;
  provider_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export default async function AdminChatsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale, isAr } = await requireAdminLocale(params);

  const rows = await safeRows<Row>(
    `SELECT id::text AS id,
            customer_id::text AS customer_id,
            provider_id::text AS provider_id,
            created_at::text AS created_at,
            updated_at::text AS updated_at
     FROM conversations
     ORDER BY COALESCE(updated_at, created_at) DESC NULLS LAST
     LIMIT 100`
  );

  return (
    <AdminPageShell
      locale={locale}
      title={isAr ? "إدارة المحادثات" : "Chats"}
      subtitle={isAr ? "محادثات الحجوزات من conversations" : "Booking conversations"}
    >
      {rows.length === 0 ? (
        <>
          <AdminStubBanner
            isAr={isAr}
            note={
              isAr
                ? "قيد الربط — لا توجد محادثات معروضة، أو جدول conversations غير جاهز لإدارة كاملة."
                : "Pending wiring — no conversations found, or conversations table not ready for full management."
            }
          />
          <AdminEmptyState isAr={isAr} />
        </>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={adminTableStyle}>
            <thead>
              <tr>
                <th style={adminThStyle}>ID</th>
                <th style={adminThStyle}>{isAr ? "عميل" : "Customer"}</th>
                <th style={adminThStyle}>{isAr ? "مقدّم" : "Provider"}</th>
                <th style={adminThStyle}>{isAr ? "آخر تحديث" : "Updated"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={adminTdStyle}>{r.id}</td>
                  <td style={adminTdStyle}>{r.customer_id || "—"}</td>
                  <td style={adminTdStyle}>{r.provider_id || "—"}</td>
                  <td style={adminTdStyle}>{fmtAdminDate(locale, r.updated_at || r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPageShell>
  );
}
