import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { verifyAdminSession } from "@/lib/auth-admin";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import AdminStatusButtons from "@/components/AdminStatusButtons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string | null;
  phone: string | null;
  service_type: string | null;
  city: string | null;
  status: string | null;
  created_at: string | null;
};

export default async function RequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "ar";
  const isAr = locale === "ar";

  const SECRET = String(process.env.ADMIN_SESSION_SECRET || "").trim();
  const mustAuth = process.env.NODE_ENV === "production" && SECRET.length > 0;
  if (mustAuth) {
    const token = (await cookies()).get("kashtat_admin")?.value;
    if (!verifyAdminSession(token)) redirect(`/${locale}/admin/login`);
  }

  let rows: Row[] = [];
  let loadError: any = null;
  try {
    const r = await db.query(
      "SELECT id::text as id,name,phone,service_type,city,status,created_at FROM provider_requests ORDER BY created_at DESC LIMIT 200"
    );
    rows = (r.rows ?? []) as Row[];
  } catch (e: any) {
    loadError = e;
  }

  async function updateStatus(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "");
    const status = String(formData.get("status") || "");
    if (!id) return;
    if (!["approved", "rejected", "pending"].includes(status)) return;
    await db.query("UPDATE provider_requests SET status = $2 WHERE id = $1::bigint", [id, status]);
  }

  return (
    <main style={pageStyle}>
      <div style={{ width: "100%", maxWidth: 1100 }}>
        <div style={headStyle}>
          <div>
            <h1 style={h1Style}>{isAr ? "طلبات مقدّمي الخدمة" : "Provider Requests"}</h1>
            <p style={mutedStyle}>
              {isAr ? "قبول / رفض الطلبات وتغيير الحالة." : "Approve/Reject requests and update status."}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <a href={`/${locale}/providers/signup`} style={btnStyle}>
              {isAr ? "فتح صفحة التسجيل" : "Open Signup"}
            </a>
            <AdminLogoutButton locale={locale as any} />
          </div>
        </div>

        {loadError ? (
          <div style={cardStyle}>
            <h2 style={h2Style}>{isAr ? "خطأ" : "Error"}</h2>
            <pre style={preStyle}>{String(loadError.message || loadError)}</pre>
          </div>
        ) : (
          <div style={cardStyle}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>{isAr ? "الاسم" : "Name"}</th>
                    <th style={thStyle}>{isAr ? "الجوال" : "Phone"}</th>
                    <th style={thStyle}>{isAr ? "الخدمة" : "Service"}</th>
                    <th style={thStyle}>{isAr ? "المدينة" : "City"}</th>
                    <th style={thStyle}>{isAr ? "الحالة" : "Status"}</th>
                    <th style={thStyle}>{isAr ? "تغيير" : "Change"}</th>
                    <th style={thStyle}>{isAr ? "التاريخ" : "Date"}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td style={tdStyle}>{r.name}</td>
                      <td style={{ ...tdStyle, direction: "ltr" }}>{r.phone}</td>
                      <td style={tdStyle}>{r.service_type}</td>
                      <td style={tdStyle}>{r.city}</td>
                      <td style={tdStyle}>{statusBadge(locale, r.status || "")}</td>
                      <td style={tdStyle}>
                        <AdminStatusButtons
                          locale={locale as any}
                          id={r.id}
                          currentStatus={r.status || "pending"}
                          action={updateStatus}
                        />
                      </td>
                      <td style={tdStyle}>{fmt(locale, r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}


function statusBadge(locale: "ar" | "en", s: string) {
  const v = (s || "pending").toLowerCase();
  const label =
    locale === "ar" ? (v === "approved" ? "مقبول" : v === "rejected" ? "مرفوض" : "انتظار") : v;
  return label;
}

function fmt(locale: "ar" | "en", v: string | null) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString(locale === "ar" ? "ar-SA" : "en-US");
  } catch {
    return v;
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

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e7e7e7",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 6px 16px rgba(0,0,0,0.04)",
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

const btnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #111",
  textDecoration: "none",
  color: "#111",
  fontWeight: 900,
  fontSize: 13,
  background: "#fff",
  whiteSpace: "nowrap",
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
