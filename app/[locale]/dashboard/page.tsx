import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth-admin";
import Link from "next/link"; // For the back button
import LanguageSwitcher from "@/components/LanguageSwitcher";

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

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "ar";
  
  const token = (await cookies()).get("kashtat_admin")?.value;
  if (!verifyAdminSession(token)) {
    redirect(`/${locale}/admin/login?next=/${locale}/dashboard`);
  }

  let rows: Row[] = [];
  let error: any = null;

  async function updateStatus(formData: FormData) {
    "use server";

    const id = String(formData.get("id") || "").trim();
    const status = String(formData.get("status") || "").trim().toLowerCase();

    if (!id) return;
    if (!["approved", "rejected", "pending"].includes(status)) return;

    await db.query("UPDATE provider_requests SET status = $2 WHERE id = $1::bigint", [id, status]);

    revalidatePath(`/${locale}/dashboard`);
  }

  try {
    const r = await db.query(
      "SELECT id::text as id,name,phone,service_type,city,status,created_at FROM provider_requests ORDER BY created_at DESC LIMIT 200"
    );
    rows = (r.rows ?? []) as Row[];
  } catch (e: any) {
    error = e;
  }

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1100, width: "100%" }}>
        <div style={topRow}>
        <div>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link href={`/${locale}/admin/portal`} style={{ fontSize: 14, color: "#666", textDecoration: "none" }}>
              ← {locale === "ar" ? "العودة للقائمة الرئيسية" : "Back to Portal"}
            </Link>
            <LanguageSwitcher locale={locale} />
          </div>
          <h1 style={h1}>لوحة الطلبات</h1>
            <div style={sub}>
              عرض آخر 200 طلب من <code>provider_requests</code>
            </div>
            {error ? <div style={err}>{String(error.message || error)}</div> : null}
          </div>

          <a href={`/${locale}/providers/signup`} style={btnLink}>
            فتح صفحة التسجيل
          </a>
        </div>

        <div style={card}>
          <div style={{ overflowX: "auto" }}>
            <table style={table} dir="rtl">
              <thead>
                <tr>
                  <th style={th}>الاسم</th>
                  <th style={th}>رقم الجوال</th>
                  <th style={th}>نوع الخدمة</th>
                  <th style={th}>المدينة</th>
                  <th style={th}>الحالة</th>
                  <th style={th}>قبول / رفض</th>
                  <th style={th}>التاريخ</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={empty}>
                      لا يوجد طلبات
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const st = (r.status ?? "pending").toLowerCase(); // NULL = pending
                    const pending = st === "pending";

                    return (
                      <tr key={r.id}>
                        <td style={td}>{r.name ?? ""}</td>
                        <td style={td}>{r.phone ?? ""}</td>
                        <td style={td}>{r.service_type ?? ""}</td>
                        <td style={td}>{r.city ?? ""}</td>
                        <td style={td}>
                          <span style={badge}>{st}</span>
                        </td>

                        <td style={td}>
                          {pending ? (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <form action={updateStatus}>
                                <input type="hidden" name="id" value={r.id} />
                                <input type="hidden" name="status" value="approved" />
                                <button type="submit" style={okBtn}>قبول</button>
                              </form>

                              <form action={updateStatus}>
                                <input type="hidden" name="id" value={r.id} />
                                <input type="hidden" name="status" value="rejected" />
                                <button type="submit" style={noBtn}>رفض</button>
                              </form>
                            </div>
                          ) : (
                            <span style={done}>تمت المعالجة</span>
                          )}
                        </td>

                        <td style={td}>{fmt(r.created_at)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function fmt(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return d.toLocaleString("ar-SA");
  } catch {
    return d.toISOString();
  }
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: 24,
  background: "#f6f7f9",
  display: "flex",
  justifyContent: "center",
};

const topRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 12,
};

const h1: React.CSSProperties = { margin: 0, fontSize: 22, fontWeight: 900 };
const sub: React.CSSProperties = { marginTop: 6, color: "#666", fontSize: 13 };

const err: React.CSSProperties = {
  marginTop: 10,
  padding: 10,
  borderRadius: 10,
  background: "#fff3f3",
  border: "1px solid #ffd0d0",
  color: "#b00",
  fontSize: 13,
};

const btnLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#fff",
  color: "#111",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 13,
  whiteSpace: "nowrap",
};

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e7e7e7",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 6px 16px rgba(0,0,0,0.04)",
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 980,
};

const th: React.CSSProperties = {
  textAlign: "right",
  padding: 10,
  borderBottom: "1px solid #ddd",
  background: "#fafafa",
  fontWeight: 900,
  fontSize: 13,
};

const td: React.CSSProperties = {
  padding: 10,
  borderBottom: "1px solid #eee",
  fontSize: 13,
  verticalAlign: "top",
};

const empty: React.CSSProperties = { padding: 14, textAlign: "center", color: "#666" };

const badge: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #e7e7e7",
  fontWeight: 900,
  fontSize: 12,
};

const okBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #0a0",
  background: "#0a0",
  color: "#fff",
  fontWeight: 900,
  fontSize: 12,
  cursor: "pointer",
};

const noBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #b00",
  background: "#fff",
  color: "#b00",
  fontWeight: 900,
  fontSize: 12,
  cursor: "pointer",
};

const done: React.CSSProperties = { color: "#666", fontWeight: 800, fontSize: 12 };
