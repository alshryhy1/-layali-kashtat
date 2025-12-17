import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =======================
   🔐 ADMIN GUARD
   ======================= */

async function requireAdmin(locale: string) {
  const store = await cookies();
  const session = store.get("kashtat_admin")?.value;

  if (!session || session !== (process.env.ADMIN_SESSION_SECRET || "")) {
    redirect(`/${locale}/admin/login`);
  }
}

/* =======================
   TYPES + DB
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
  await requireAdmin(locale);

  const supabase = sbAdmin();

  async function updateStatus(formData: FormData) {
    "use server";

    const id = String(formData.get("id") || "").trim();
    const status = String(formData.get("status") || "").trim().toLowerCase();

    if (!id) return;
    if (!["approved", "rejected"].includes(status)) return;

    await supabase.from("provider_requests").update({ status }).eq("id", id);
    revalidatePath(`/${locale}/admin/requests`);
  }

  /* ===========
     COUNTERS
     =========== */

  const [{ count: pendingCount }, { count: approvedCount }, { count: rejectedCount }] =
    await Promise.all([
      supabase
        .from("provider_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("provider_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved"),
      supabase
        .from("provider_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "rejected"),
    ]);

  /* ===========
     DATA (pending فقط)
     =========== */

  const { data, error } = await supabase
    .from("provider_requests")
    .select("id,name,phone,service_type,city,status,created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as Row[];

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto" }}>
        <div style={title}>لوحة الطلبات</div>

        {/* 🔢 العدّادات */}
        <div style={statsRow}>
          <div style={{ ...statBox, borderColor: "#999" }}>
            ⏳ قيد المراجعة
            <strong>{pendingCount ?? 0}</strong>
          </div>
          <div style={{ ...statBox, borderColor: "#0a0" }}>
            ✅ مقبول
            <strong>{approvedCount ?? 0}</strong>
          </div>
          <div style={{ ...statBox, borderColor: "#b00" }}>
            ❌ مرفوض
            <strong>{rejectedCount ?? 0}</strong>
          </div>
        </div>

        {error ? <div style={err}>{String(error.message || error)}</div> : null}

        <div style={card}>
          <table style={table} dir="rtl">
            <thead>
              <tr>
                <th style={th}>الاسم</th>
                <th style={th}>الجوال</th>
                <th style={th}>الخدمة</th>
                <th style={th}>المدينة</th>
                <th style={th}>إجراء</th>
                <th style={th}>التاريخ</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={empty}>
                    لا توجد طلبات قيد المراجعة
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td style={td}>{r.name ?? ""}</td>
                    <td style={td}>{r.phone ?? ""}</td>
                    <td style={td}>{r.service_type ?? ""}</td>
                    <td style={td}>{r.city ?? ""}</td>
                    <td style={td}>
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
                    </td>
                    <td style={td}>{fmt(r.created_at)}</td>
                  </tr>
                ))
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

const pageStyle = {
  padding: 24,
  background: "#f6f7f9",
  minHeight: "100vh",
};

const title = {
  fontSize: 22,
  fontWeight: 900,
  marginBottom: 12,
};

const statsRow = {
  display: "flex",
  gap: 12,
  marginBottom: 16,
};

const statBox = {
  flex: 1,
  background: "#fff",
  border: "2px solid",
  borderRadius: 12,
  padding: 12,
  textAlign: "center" as const,
  fontWeight: 900,
  display: "flex",
  flexDirection: "column" as const,
  gap: 6,
};

const err = {
  background: "#fee",
  border: "1px solid #f99",
  padding: 10,
  marginBottom: 12,
};

const card = {
  background: "#fff",
  padding: 16,
  borderRadius: 14,
};

const table = { width: "100%", borderCollapse: "collapse" };
const th = { borderBottom: "1px solid #ddd", padding: 8, fontWeight: 900 };
const td = { borderBottom: "1px solid #eee", padding: 8 };
const empty = { textAlign: "center", padding: 16, color: "#666" };

const okBtn = {
  background: "#0a0",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  borderRadius: 8,
  cursor: "pointer",
};

const noBtn = {
  background: "#fff",
  color: "#b00",
  border: "1px solid #b00",
  padding: "6px 10px",
  borderRadius: 8,
  cursor: "pointer",
};
