import type { CSSProperties } from "react";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

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

function sbAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function AdminRequestsPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params?.locale === "en" ? "en" : "ar";
  const supabase = sbAdmin();

  async function updateStatus(formData: FormData) {
    "use server";

    const id = String(formData.get("id") || "").trim();
    const status = String(formData.get("status") || "").trim().toLowerCase();

    if (!id) return;
    if (!["approved", "rejected", "pending"].includes(status)) return;

    const admin = sbAdmin();
    await admin.from("provider_requests").update({ status }).eq("id", id);

    revalidatePath(`/${locale}/admin/requests`);
  }

  const { data, error } = await supabase
    .from("provider_requests")
    .select("id,name,phone,service_type,city,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as Row[];

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1100, width: "100%" }}>
        <div style={testBanner}>ADMIN-REQUESTS OK</div>

        <div style={topRow}>
          <div>
            <h1 style={h1}>لوحة الطلبات (أدمن)</h1>
            <div style={sub}>
              عرض آخر 200 طلب من <code>provider_requests</code>
            </div>
            {error ? <div style={err}>{String(error.message || error)}</div> : null}
          </div>
        </div>

        <div style={card}>
          <div style={{ overflowX: "auto" }}>
            <table style={table} dir="rtl">
              <thead>
                <tr>
                  <th style={th}>الاسم</th>
                  <th style={th}>الجوال</th>
                  <th style={th}>الخدمة</th>
                  <th style={th}>المدينة</th>
                  <th style={th}>الحالة</th>
                  <th style={th}>إجراء</th>
                  <th style={th}>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const st = (r.status ?? "pending").toLowerCase();
                  const pending = st === "pending";

                  return (
                    <tr key={r.id}>
                      <td style={td}>{r.name}</td>
                      <td style={td}>{r.phone}</td>
                      <td style={td}>{r.service_type}</td>
                      <td style={td}>{r.city}</td>
                      <td style={td}>
                        <span style={badge}>{st}</span>
                      </td>
                      <td style={td}>
                        {pending ? (
                          <div style={{ display: "flex", gap: 8 }}>
                            <form action={updateStatus}>
                              <input type="hidden" name="id" value={r.id} />
                              <input type="hidden" name="status" value="approved" />
                              <button style={okBtn}>قبول</button>
                            </form>
                            <form action={updateStatus}>
                              <input type="hidden" name="id" value={r.id} />
                              <input type="hidden" name="status" value="rejected" />
                              <button style={noBtn}>رفض</button>
                            </form>
                          </div>
                        ) : (
                          <span style={done}>تم</span>
                        )}
                      </td>
                      <td style={td}>{fmt(r.created_at)}</td>
                    </tr>
                  );
                })}
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
  return new Date(v).toLocaleString("ar-SA");
}

/* ================= styles ================= */

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: 24,
  background: "#f6f7f9",
  display: "flex",
  justifyContent: "center",
};

const testBanner: CSSProperties = {
  background: "#111",
  color: "#fff",
  padding: "10px 12px",
  borderRadius: 12,
  fontWeight: 900,
  marginBottom: 12,
  textAlign: "center",
};

const topRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 12,
};

const h1: CSSProperties = { margin: 0, fontSize: 22, fontWeight: 900 };
const sub: CSSProperties = { marginTop: 6, color: "#666", fontSize: 13 };

const err: CSSProperties = {
  marginTop: 10,
  padding: 10,
  background: "#fff3f3",
  border: "1px solid #ffd0d0",
  color: "#b00",
};

const card: CSSProperties = {
  background: "#fff",
  border: "1px solid #e7e7e7",
  borderRadius: 14,
  padding: 16,
};

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 900,
};

const th: CSSProperties = {
  textAlign: "right",
  padding: 10,
  borderBottom: "1px solid #ddd",
  background: "#fafafa",
  fontWeight: 900,
};

const td: CSSProperties = {
  padding: 10,
  borderBottom: "1px solid #eee",
};

const badge: CSSProperties = {
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #ccc",
  fontWeight: 900,
  fontSize: 12,
};

const okBtn: CSSProperties = {
  padding: "6px 10px",
  background: "#0a0",
  color: "#fff",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};

const noBtn: CSSProperties = {
  padding: "6px 10px",
  background: "#fff",
  color: "#b00",
  borderRadius: 8,
  border: "1px solid #b00",
  cursor: "pointer",
};

const done: CSSProperties = {
  color: "#666",
  fontWeight: 800,
};
