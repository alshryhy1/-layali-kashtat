import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =======================
   🔐 ADMIN GUARD (TOP)
   ======================= */

function requireAdmin(locale: string) {
  const cookieStore = cookies();
  const session = cookieStore.get("admin_session")?.value;

  if (!session || session !== process.env.ADMIN_SESSION_SECRET) {
    redirect(`/${locale}/admin/login`);
  }
}

/* =======================
   DB
   ======================= */

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

/* =======================
   PAGE
   ======================= */

export default async function AdminRequestsPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params?.locale === "en" ? "en" : "ar";

  // 🔐 حماية الأدمن
  requireAdmin(locale);

  const supabase = sbAdmin();

  async function updateStatus(formData: FormData) {
    "use server";

    const id = String(formData.get("id") || "").trim();
    const status = String(formData.get("status") || "").trim().toLowerCase();

    if (!id) return;
    if (!["approved", "rejected", "pending"].includes(status)) return;

    await supabase.from("provider_requests").update({ status }).eq("id", id);

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

        <h1 style={h1}>لوحة الطلبات (أدمن)</h1>

        {error ? (
          <div style={err}>{String(error.message || error)}</div>
        ) : null}

        <div style={card}>
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={empty}>
                    لا يوجد طلبات
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const st = (r.status ?? "pending").toLowerCase();
                  const pending = st === "pending";

                  return (
                    <tr key={r.id}>
                      <td style={td}>{r.name ?? ""}</td>
                      <td style={td}>{r.phone ?? ""}</td>
                      <td style={td}>{r.service_type ?? ""}</td>
                      <td style={td}>{r.city ?? ""}</td>
                      <td style={td}>{st}</td>
                      <td style={td}>
                        {pending ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <form action={updateStatus}>
                              <input type="hidden" name="id" value={r.id} />
                              <input
                                type="hidden"
                                name="status"
                                value="approved"
                              />
                              <button style={okBtn}>قبول</button>
                            </form>
                            <form action={updateStatus}>
                              <input type="hidden" name="id" value={r.id} />
                              <input
                                type="hidden"
                                name="status"
                                value="rejected"
                              />
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

/* =======================
   UI
   ======================= */

function fmt(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleString("ar-SA");
}

const pageStyle = { padding: 24, background: "#f6f7f9", minHeight: "100vh" };
const testBanner = {
  background: "#000",
  color: "#fff",
  padding: 10,
  borderRadius: 10,
  marginBottom: 12,
  textAlign: "center",
  fontWeight: 900,
};
const h1 = { marginBottom: 12 };
const err = {
  background: "#fee",
  border: "1px solid #f99",
  padding: 10,
  marginBottom: 12,
};
const card = {
  background: "#fff",
  padding: 16,
  borderRadius: 12,
};
const table = { width: "100%", borderCollapse: "collapse" };
const th = { borderBottom: "1px solid #ddd", padding: 8 };
const td = { borderBottom: "1px solid #eee", padding: 8 };
const empty = { textAlign: "center", padding: 16 };
const okBtn = {
  background: "green",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  borderRadius: 6,
};
const noBtn = {
  background: "#fff",
  color: "red",
  border: "1px solid red",
  padding: "6px 10px",
  borderRadius: 6,
};
const done = { color: "#666" };
