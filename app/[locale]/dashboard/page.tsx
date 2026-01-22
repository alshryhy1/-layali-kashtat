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

  async function deleteRequest(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "").trim();
    if (!id) return;
    await db.query("DELETE FROM provider_requests WHERE id = $1::bigint", [id]);
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

  // Calculate Stats
  const total = rows.length;
  const pending = rows.filter(r => (r.status || "pending").toLowerCase() === "pending").length;
  const approved = rows.filter(r => (r.status || "").toLowerCase() === "approved").length;
  const rejected = rows.filter(r => (r.status || "").toLowerCase() === "rejected").length;

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1200, width: "100%" }}>
        <div style={topRow}>
        <div>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link href={`/${locale}/admin/portal`} style={{ fontSize: 14, color: "#666", textDecoration: "none" }}>
              ← {locale === "ar" ? "العودة للقائمة الرئيسية" : "Back to Portal"}
            </Link>
            <LanguageSwitcher locale={locale} />
          </div>
          <h1 style={h1}>{locale === "ar" ? "طلبات انضمام مقدمي الخدمة" : "Provider Requests Dashboard"}</h1>
            <div style={sub}>
              {locale === "ar" ? "إدارة ومراجعة طلبات الانضمام الجديدة" : "Manage and review new provider applications"}
            </div>
            {error ? <div style={err}>{String(error.message || error)}</div> : null}
          </div>

          <a href={`/${locale}/providers/signup`} style={btnLink}>
            {locale === "ar" ? "إضافة مقدم خدمة جديد" : "Add New Provider"}
          </a>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
           <div style={statCard}>
              <div style={statLabel}>{locale === "ar" ? "الكل" : "Total"}</div>
              <div style={statValue}>{total}</div>
           </div>
           <div style={statCard}>
              <div style={statLabel}>{locale === "ar" ? "قيد الانتظار" : "Pending"}</div>
              <div style={{...statValue, color: "#f59e0b"}}>{pending}</div>
           </div>
           <div style={statCard}>
              <div style={statLabel}>{locale === "ar" ? "مقبول" : "Approved"}</div>
              <div style={{...statValue, color: "#10b981"}}>{approved}</div>
           </div>
           <div style={statCard}>
              <div style={statLabel}>{locale === "ar" ? "مرفوض" : "Rejected"}</div>
              <div style={{...statValue, color: "#ef4444"}}>{rejected}</div>
           </div>
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
                  <th style={th}>الإجراءات</th>
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
                        <td style={td}>
                          <div style={{fontWeight: 700}}>{r.name ?? "—"}</div>
                        </td>
                        <td style={td}>
                            <a href={`tel:${r.phone}`} style={{color: "#2563eb", textDecoration: "none"}} dir="ltr">{r.phone ?? "—"}</a>
                        </td>
                        <td style={td}>{r.service_type ?? "—"}</td>
                        <td style={td}>{r.city ?? "—"}</td>
                        <td style={td}>
                          <span style={{
                              ...badge, 
                              background: st === "approved" ? "#dcfce7" : st === "rejected" ? "#fee2e2" : "#fef3c7",
                              color: st === "approved" ? "#166534" : st === "rejected" ? "#991b1b" : "#92400e",
                              border: "none"
                          }}>
                              {st === "approved" ? (locale === "ar" ? "مقبول" : "Approved") : 
                               st === "rejected" ? (locale === "ar" ? "مرفوض" : "Rejected") : 
                               (locale === "ar" ? "قيد الانتظار" : "Pending")}
                          </span>
                        </td>

                        <td style={td}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {pending ? (
                                <>
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
                                </>
                            ) : null}
                            
                            <form action={deleteRequest} onSubmit={(e) => { if(!confirm('هل أنت متأكد من الحذف؟')) e.preventDefault(); }}>
                                <input type="hidden" name="id" value={r.id} />
                                <button type="submit" style={delBtn}>🗑️</button>
                            </form>
                          </div>
                        </td>

                        <td style={td} dir="ltr">{fmt(r.created_at)}</td>
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
    return d.toLocaleString("en-GB", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
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
  fontFamily: "inherit",
};

const topRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 24,
  flexWrap: "wrap",
};

const h1: React.CSSProperties = { margin: 0, fontSize: 28, fontWeight: 900, color: "#111" };
const sub: React.CSSProperties = { marginTop: 6, color: "#666", fontSize: 14 };

const statCard: React.CSSProperties = {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    border: "1px solid #eee",
    display: "flex",
    flexDirection: "column",
    gap: 8
};

const statLabel: React.CSSProperties = { fontSize: 13, color: "#64748b", fontWeight: 600 };
const statValue: React.CSSProperties = { fontSize: 24, fontWeight: 900, color: "#0f172a" };

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
  padding: "12px 20px",
  borderRadius: 12,
  border: "none",
  background: "#111",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 14,
  whiteSpace: "nowrap",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e7e7e7",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: "0",
  minWidth: 980,
};

const th: React.CSSProperties = {
  textAlign: "right",
  padding: "16px 12px",
  borderBottom: "2px solid #f1f5f9",
  color: "#64748b",
  fontWeight: 700,
  fontSize: 13,
};

const td: React.CSSProperties = {
  padding: "16px 12px",
  borderBottom: "1px solid #f1f5f9",
  fontSize: 14,
  verticalAlign: "middle",
  color: "#334155",
};

const empty: React.CSSProperties = { padding: 40, textAlign: "center", color: "#64748b", fontSize: 14 };

const badge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px 12px",
  borderRadius: 999,
  fontWeight: 700,
  fontSize: 12,
};

const okBtn: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "none",
  background: "#10b981",
  color: "#fff",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
};

const noBtn: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid #fee2e2",
  background: "#fee2e2",
  color: "#991b1b",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
};

const delBtn: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #eee",
    background: "#fff",
    color: "#666",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  };

const done: React.CSSProperties = { color: "#64748b", fontWeight: 600, fontSize: 12 };
