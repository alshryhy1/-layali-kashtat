import {
  AdminPageShell,
  AdminEmptyState,
  adminTableStyle,
  adminThStyle,
  adminTdStyle,
} from "@/components/AdminPageShell";
import { requireAdminLocale, fmtAdminDate } from "@/lib/admin-auth-page";
import { localeHref } from "@/lib/locales";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ensureHistoryTable() {
  try {
    await db.query(
      "CREATE TABLE IF NOT EXISTS status_history (id bigserial primary key, ref text, event text, provider_id bigint, note text, created_at timestamptz default now())"
    );
  } catch {}
}

type Row = {
  created_at: string;
  event: string;
  provider_id: string | null;
  note: string | null;
};

function labelEvent(isAr: boolean, e: string) {
  const v = String(e || "").toLowerCase();
  if (isAr) {
    if (v === "accepted") return "قبول";
    if (v === "rejected") return "رفض";
    if (v === "completed") return "إتمام";
    return v || "—";
  }
  return v || "—";
}

export default async function AdminHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ ref?: string }>;
}) {
  const { locale, isAr } = await requireAdminLocale(params);
  const sp = (await searchParams) || {};
  const ref = String((sp?.ref || "").toString()).trim();

  let rows: Row[] = [];
  let loadError: unknown = null;
  if (ref) {
    try {
      await ensureHistoryTable();
      const r = await db.query(
        "SELECT created_at::text as created_at, event, provider_id::text as provider_id, note FROM status_history WHERE ref = $1 ORDER BY created_at DESC LIMIT 200",
        [ref]
      );
      rows = (r.rows ?? []) as Row[];
    } catch (e) {
      loadError = e;
    }
  }

  return (
    <AdminPageShell
      locale={locale}
      title={isAr ? "سجل الحالة" : "Status History"}
      subtitle={
        isAr
          ? "أدخل رقم الطلب لعرض الأحداث المسجلة (قبول، رفض، إتمام...)."
          : "Enter request ref to view recorded events (accept, reject, complete...)."
      }
    >
      <form
        method="get"
        action={localeHref(locale, "/admin/history")}
        style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}
      >
        <input
          name="ref"
          defaultValue={ref}
          placeholder={isAr ? "رقم الطلب (مثال: LK-000123)" : "Ref (e.g. LK-000123)"}
          style={{
            width: "100%",
            maxWidth: 360,
            height: 40,
            borderRadius: 10,
            border: "1px solid #111",
            padding: "0 10px",
            fontWeight: 900,
            fontSize: 13,
            background: "#fff",
          }}
        />
        <button
          type="submit"
          style={{
            height: 40,
            borderRadius: 10,
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
            fontWeight: 900,
            fontSize: 13,
            padding: "0 16px",
            cursor: "pointer",
          }}
        >
          {isAr ? "بحث" : "Search"}
        </button>
      </form>

      {loadError ? (
        <div
          style={{
            padding: 16,
            background: "#fff",
            border: "1px solid #fecaca",
            borderRadius: 12,
            color: "#991b1b",
            fontWeight: 700,
          }}
        >
          {String((loadError as { message?: string })?.message || loadError)}
        </div>
      ) : !ref ? (
        <div
          style={{
            padding: 20,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            color: "#64748b",
            fontWeight: 600,
          }}
        >
          {isAr ? "أدخل رقم الطلب أعلاه." : "Enter request ref above."}
        </div>
      ) : rows.length === 0 ? (
        <AdminEmptyState isAr={isAr} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={adminTableStyle}>
            <thead>
              <tr>
                <th style={adminThStyle}>{isAr ? "الحدث" : "Event"}</th>
                <th style={adminThStyle}>{isAr ? "المقدم" : "Provider"}</th>
                <th style={adminThStyle}>{isAr ? "ملاحظات" : "Note"}</th>
                <th style={adminThStyle}>{isAr ? "التاريخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.created_at}-${i}`}>
                  <td style={adminTdStyle}>{labelEvent(isAr, r.event)}</td>
                  <td style={adminTdStyle}>{r.provider_id || "—"}</td>
                  <td style={adminTdStyle}>{r.note || "—"}</td>
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
