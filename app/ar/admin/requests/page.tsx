import type { CSSProperties } from "react";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

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
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { token?: string };
}) {
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
  const token = searchParams?.token;

  // 🔒 قفل الصفحة
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    notFound();
  }

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
        <div style={testBanner}>ADMIN – PROTECTED</div>

        {error ? <div style={err}>{String(error.message || error)}</div> : null}

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
                    <td style={td}>{st}</td>
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
                        "تم"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

/* styles */
const pageStyle: CSSProperties = { padding: 24 };
const testBanner: CSSProperties = { background: "#111", color: "#fff", padding: 10 };
const card: CSSProperties = { background: "#fff", padding: 16 };
const table: CSSProperties = { width: "100%", borderCollapse: "collapse" };
const th: CSSProperties = { borderBottom: "1px solid #ddd", padding: 8 };
const td: CSSProperties = { borderBottom: "1px solid #eee", padding: 8 };
const okBtn: CSSProperties = { background: "#0a0", color: "#fff" };
const noBtn: CSSProperties = { background: "#fff", color: "#b00", border: "1px solid #b00" };
const err: CSSProperties = { color: "#b00", marginBottom: 12 };
