import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { verifyAdminSession } from "@/lib/auth-admin";
import AdminLogoutButton from "@/components/AdminLogoutButton";

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

export default async function AdminHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ ref?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === "en" ? "en" : "ar";
  const isAr = locale === "ar";
  const sp = (await searchParams) || {};
  const ref = String((sp?.ref || "").toString()).trim();

  const SECRET = String(process.env.ADMIN_SESSION_SECRET || "").trim();
  const mustAuth = process.env.NODE_ENV === "production" && SECRET.length > 0;
  if (mustAuth) {
    const token = (await cookies()).get("kashtat_admin")?.value;
    if (!verifyAdminSession(token)) redirect(`/${locale}/admin/login`);
  }

  let rows: Row[] = [];
  let loadError: any = null;
  if (ref) {
    try {
      await ensureHistoryTable();
      const r = await db.query(
        "SELECT created_at::text as created_at, event, provider_id::text as provider_id, note FROM status_history WHERE ref = $1 ORDER BY created_at DESC LIMIT 200",
        [ref]
      );
      rows = (r.rows ?? []) as Row[];
    } catch (e: any) {
      loadError = e;
    }
  }

  return (
    <main style={pageStyle}>
      <div style={{ width: "100%", maxWidth: 1000 }}>
        <div style={headStyle}>
          <div>
            <h1 style={h1Style}>{isAr ? "سجل الحالة" : "Status History"}</h1>
            <p style={mutedStyle}>
              {isAr
                ? "أدخل رقم الطلب لعرض الأحداث المسجلة (قبول، رفض، إتمام...)."
                : "Enter request ref to view recorded events (accept, reject, complete...)."}
            </p>
          </div>
          <AdminLogoutButton locale={locale as any} />
        </div>

        <form method="get" action={`/${locale}/admin/history`} style={searchRow}>
          <input
            name="ref"
            defaultValue={ref}
            placeholder={isAr ? "رقم الطلب (مثال: LK-000123)" : "Ref (e.g. LK-000123)"}
            style={inputStyle}
          />
          <button type="submit" style={btnPrimary}>
            {isAr ? "بحث" : "Search"}
          </button>
        </form>

        {loadError ? (
          <div style={cardStyle}>
            <h2 style={h2Style}>{isAr ? "خطأ" : "Error"}</h2>
            <pre style={preStyle}>{String(loadError.message || loadError)}</pre>
          </div>
        ) : ref ? (
          <div style={cardStyle}>
            {rows.length === 0 ? (
              <div style={{ color: "#666", padding: 12 }}>
                {isAr ? "لا يوجد سجل لهذا الرقم." : "No history for this ref."}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>{isAr ? "الحدث" : "Event"}</th>
                      <th style={thStyle}>{isAr ? "المقدم" : "Provider"}</th>
                      <th style={thStyle}>{isAr ? "ملاحظات" : "Note"}</th>
                      <th style={thStyle}>{isAr ? "التاريخ" : "Date"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td style={tdStyle}>{labelEvent(isAr, r.event)}</td>
                        <td style={tdStyle}>{r.provider_id || "—"}</td>
                        <td style={tdStyle}>{r.note || "—"}</td>
                        <td style={tdStyle}>{fmt(locale, r.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div style={cardStyle}>
            <div style={{ color: "#666" }}>
              {isAr ? "أدخل رقم الطلب أعلاه." : "Enter request ref above."}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}



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

function fmt(locale: "ar" | "en", v: string | null) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString(locale === "ar" ? "ar-SA" : "en-US");
  } catch {
    return v || "—";
  }
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "24px 16px",
  background: "#f6f7f9",
  display: "flex",
  justifyContent: "center",
};
const headStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 12,
};
const h1Style: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 900,
  color: "#111",
};
const h2Style: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 16,
  fontWeight: 900,
  color: "#111",
};
const mutedStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#666",
  fontSize: 13,
  lineHeight: 1.6,
};
const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e7e7e7",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 6px 16px rgba(0,0,0,0.04)",
};
const preStyle: React.CSSProperties = {
  marginTop: 10,
  padding: 12,
  background: "#0b0b0b",
  color: "#eaeaea",
  borderRadius: 12,
  overflowX: "auto",
  fontSize: 12,
  lineHeight: 1.6,
};
const thStyle: React.CSSProperties = {
  textAlign: "right",
  padding: 10,
  borderBottom: "1px solid #ddd",
  background: "#fafafa",
  fontWeight: 900,
  fontSize: 13,
};
const tdStyle: React.CSSProperties = {
  padding: 10,
  borderBottom: "1px solid #eee",
  fontSize: 13,
  verticalAlign: "top",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 360,
  height: 40,
  borderRadius: 10,
  border: "1px solid #111",
  padding: "0 10px",
  fontWeight: 900,
  fontSize: 13,
  background: "#fff",
};
const btnPrimary: React.CSSProperties = {
  height: 40,
  borderRadius: 10,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 900,
  fontSize: 13,
  padding: "0 16px",
  cursor: "pointer",
};
const searchRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  marginBottom: 12,
};
