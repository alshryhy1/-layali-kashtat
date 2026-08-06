import Link from "next/link";
import {
  AdminPageShell,
  AdminEmptyState,
  AdminStubBanner,
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

type BookingRow = {
  id: string;
  status: string | null;
  payment_status: string | null;
  total_amount: string | null;
  created_at: string | null;
};

export default async function AdminPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale, isAr } = await requireAdminLocale(params);

  let list = await safeRows<BookingRow>(
    `SELECT id::text AS id, status,
            payment_status::text AS payment_status,
            total_amount::text AS total_amount,
            created_at::text AS created_at
     FROM bookings
     ORDER BY created_at DESC NULLS LAST
     LIMIT 50`
  );
  if (list.length === 0) {
    list = await safeRows<BookingRow>(
      `SELECT id::text AS id, status,
              NULL::text AS payment_status,
              NULL::text AS total_amount,
              created_at::text AS created_at
       FROM bookings
       ORDER BY created_at DESC NULLS LAST
       LIMIT 50`
    );
  }

  return (
    <AdminPageShell
      locale={locale}
      title={isAr ? "المدفوعات والعمولات" : "Payments & commissions"}
      subtitle={
        isAr
          ? "حجوزات مرتبطة بالدفع، مع رابط عمولة الحراج العامة"
          : "Payment-related bookings, plus public haraj commission link"
      }
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <Link href={localeHref(locale, "/haraj/commission")} style={{ ...adminCardStyle, flex: "1 1 240px" }}>
          <div style={{ fontSize: 28 }}>📦</div>
          <div style={{ fontWeight: 900 }}>{isAr ? "صفحة عمولة الحراج" : "Haraj commission page"}</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            {isAr ? "الواجهة العامة الحالية لعمولة الإعلان" : "Current public commission payment UI"}
          </div>
        </Link>
      </div>

      {list.length === 0 ? (
        <>
          <AdminStubBanner
            isAr={isAr}
            note={
              isAr
                ? "قيد الربط — لا توجد سجلات دفع إدارية كاملة بعد. تُعرض الحجوزات إن وُجدت."
                : "Pending wiring — no full admin payment ledger yet. Bookings shown when available."
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
                <th style={adminThStyle}>{isAr ? "حالة الحجز" : "Booking"}</th>
                <th style={adminThStyle}>{isAr ? "الدفع" : "Payment"}</th>
                <th style={adminThStyle}>{isAr ? "المبلغ" : "Amount"}</th>
                <th style={adminThStyle}>{isAr ? "التاريخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td style={adminTdStyle}>{r.id}</td>
                  <td style={adminTdStyle}>{r.status || "—"}</td>
                  <td style={adminTdStyle}>{r.payment_status || "—"}</td>
                  <td style={adminTdStyle}>{r.total_amount || "—"}</td>
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
