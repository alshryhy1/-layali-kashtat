// ⚠️ نفس الاستيرادات والمنطق — لم يتم المساس بها
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

import AdminRefSearchBox from "@/components/AdminRefSearchBox";
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

type Locale = "ar" | "en";
type StatusFilter = "all" | "pending" | "approved" | "rejected";
type SortKey = "new" | "old";

/* ================== helpers (كما هي) ================== */
function sbAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing env");
  return createClient(url, key, { auth: { persistSession: false } });
}

function asLocale(v: any): Locale {
  return String(v || "").toLowerCase() === "en" ? "en" : "ar";
}

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function verifyAdminSession(token: string | undefined | null): boolean {
  if (!token) return false;
  const SECRET = process.env.ADMIN_SESSION_SECRET || "";
  if (!SECRET) return false;

  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const i = raw.lastIndexOf(".");
    if (i <= 0) return false;
    const payload = raw.slice(0, i);
    const sig = raw.slice(i + 1);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(sign(payload, SECRET))))
      return false;
    const obj = JSON.parse(payload);
    return Date.now() <= obj.exp;
  } catch {
    return false;
  }
}

function toRef(id: string) {
  const s = String(id || "");
  return `LK-${s.replace(/[^0-9A-Za-z]/g, "").slice(0, 6)}`;
}

function statusLabel(locale: Locale, s: string) {
  const v = (s || "pending").toLowerCase();
  if (locale === "en") return v;
  if (v === "approved") return "مقبول";
  if (v === "rejected") return "مرفوض";
  return "انتظار";
}

function fmt(locale: Locale, v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleString(locale === "ar" ? "ar-SA" : "en-US");
}

/* ================== الصفحة ================== */
export default async function AdminRequestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string; status?: string; sort?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;

  const locale: Locale = asLocale(p?.locale);
  const isAr = locale === "ar";

  const token = (await cookies()).get("kashtat_admin")?.value;
  if (!verifyAdminSession(token)) redirect(`/${locale}/admin/login`);

  const supabase = sbAdmin();

  const { data } = await supabase
    .from("provider_requests")
    .select("id,name,phone,service_type,city,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as Row[];

  async function updateStatus(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "");
    const status = String(formData.get("status") || "");
    if (!id) return;
    await sbAdmin().from("provider_requests").update({ status }).eq("id", id);
    revalidatePath(`/${locale}/admin/requests`);
  }

  return (
    <main className="admin-page">
      <div className="top">
        <h1>{isAr ? "لوحة الطلبات" : "Requests"}</h1>
        <AdminLogoutButton locale={locale} />
      </div>

      <AdminRefSearchBox locale={locale} />

      {/* ===== Desktop Table ===== */}
      <div className="desktop">
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الجوال</th>
              <th>الخدمة</th>
              <th>المدينة</th>
              <th>الحالة</th>
              <th>المرجع</th>
              <th>تغيير</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.phone}</td>
                <td>{r.service_type}</td>
                <td>{r.city}</td>
                <td>{statusLabel(locale, r.status || "")}</td>
                <td>{toRef(r.id)}</td>
                <td>
                  <AdminStatusButtons
                    locale={locale}
                    id={r.id}
                    currentStatus={r.status || "pending"}
                    action={updateStatus}
                  />
                </td>
                <td>{fmt(locale, r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== Mobile Cards ===== */}
      <div className="mobile">
        {rows.map((r) => (
          <div key={r.id} className="card">
            <div className="row">
              <strong>{r.name}</strong>
              <span>{toRef(r.id)}</span>
            </div>
            <div className="muted">{r.phone}</div>
            <div className="muted">
              {r.city} — {r.service_type}
            </div>
            <div className="badge">{statusLabel(locale, r.status || "")}</div>
            <AdminStatusButtons
              locale={locale}
              id={r.id}
              currentStatus={r.status || "pending"}
              action={updateStatus}
            />
          </div>
        ))}
      </div>

      <style>{`
        .desktop { display:block }
        .mobile { display:none }

        @media (max-width:768px){
          .desktop{ display:none }
          .mobile{ display:grid; gap:12px }
        }

        table{ width:100%; border-collapse:collapse }
        th,td{ padding:10px; border-bottom:1px solid #eee }

        .card{
          background:#fff;
          border-radius:14px;
          padding:12px;
          box-shadow:0 6px 16px rgba(0,0,0,.06)
        }
        .row{ display:flex; justify-content:space-between }
        .muted{ font-size:13px; color:#666 }
        .badge{
          display:inline-block;
          margin:6px 0;
          padding:4px 10px;
          border-radius:999px;
          border:1px solid #ddd;
          font-weight:900;
          font-size:12px;
        }
      `}</style>
    </main>
  );
}
