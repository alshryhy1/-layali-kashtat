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

function sbAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function verifyAdminSession(token: string | undefined | null): boolean {
  if (!token) return false;

  const SECRET = process.env.ADMIN_SESSION_SECRET || "";
  if (!SECRET) return false;

  try {
    const raw = Buffer.from(String(token), "base64url").toString("utf8");
    const idx = raw.lastIndexOf(".");
    if (idx <= 0) return false;

    const payload = raw.slice(0, idx);
    const sig = raw.slice(idx + 1);

    const expected = sign(payload, SECRET);
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    if (!crypto.timingSafeEqual(a, b)) return false;

    const obj = JSON.parse(payload) as { u?: string; exp?: number };
    if (!obj?.u || typeof obj.exp !== "number") return false;
    if (Date.now() > obj.exp) return false;

    return true;
  } catch {
    return false;
  }
}

function toRef(id: string) {
  const s = String(id || "").trim();
  if (/^\d+$/.test(s)) return `LK-${s.padStart(6, "0")}`;
  const short = s.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6) || "000000";
  return `LK-${short}`;
}

function statusLabel(locale: Locale, raw: string) {
  const s = (raw || "pending").toLowerCase();
  const isAr = locale === "ar";
  if (!isAr) return s;
  if (s === "approved") return "مقبول";
  if (s === "rejected") return "مرفوض";
  return "انتظار";
}

function fmt(locale: Locale, v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return d.toLocaleString(locale === "ar" ? "ar-SA" : "en-US");
  } catch {
    return d.toISOString();
  }
}

function asStatusFilter(v: any): StatusFilter {
  const s = String(v || "").trim().toLowerCase();
  if (s === "pending" || s === "approved" || s === "rejected" || s === "all") return s;
  return "all";
}

function asSortKey(v: any): SortKey {
  const s = String(v || "").trim().toLowerCase();
  if (s === "old" || s === "new") return s;
  return "new";
}

function buildHref(locale: Locale, status: StatusFilter, sort: SortKey, ref?: string) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (sort !== "new") params.set("sort", sort);
  if (ref && String(ref).trim().length > 0) params.set("ref", String(ref).trim());
  const qs = params.toString();
  return `/${locale}/admin/requests${qs ? `?${qs}` : ""}`;
}

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
  const ok = verifyAdminSession(token);
  if (!ok) {
    redirect(`/${locale}/admin/login`);
  }

  const supabase = sbAdmin();

  const statusFilter: StatusFilter = asStatusFilter(sp?.status);
  const sortKey: SortKey = asSortKey(sp?.sort);

  async function updateStatus(formData: FormData) {
    "use server";

    const id = String(formData.get("id") || "").trim();
    const status = String(formData.get("status") || "").trim().toLowerCase();

    if (!id) return;
    if (!["approved", "rejected", "pending"].includes(status)) return;

    const admin = sbAdmin();
    await admin.from("provider_requests").update({ status }).eq("id", id);

    // أعِد تحديث صفحة الأدمن الأساسية (بدون اعتماد على query string)
    revalidatePath(`/${locale}/admin/requests`);
  }

  let q = supabase
    .from("provider_requests")
    .select("id,name,phone,service_type,city,status,created_at");

  if (statusFilter !== "all") {
    q = q.eq("status", statusFilter);
  }

  q = q.order("created_at", { ascending: sortKey === "old" }).limit(200);

  const { data, error } = await q;

  const rowsAll = (data ?? []) as Row[];

  const refQueryRaw = String(sp?.ref ?? "").trim();
  const refQuery = refQueryRaw.toLowerCase();

  const rows =
    refQuery.length === 0
      ? rowsAll
      : rowsAll.filter((r) => {
          const ref = toRef(r.id).toLowerCase();
          const digitsQ = refQuery.replace(/[^0-9]/g, "");
          const digitsRef = ref.replace(/[^0-9]/g, "");
          if (ref.includes(refQuery)) return true;
          if (digitsQ && digitsRef.endsWith(digitsQ)) return true;
          return false;
        });

  const statusTabs: Array<{ key: StatusFilter; labelAr: string; labelEn: string }> = [
    { key: "all", labelAr: "الكل", labelEn: "All" },
    { key: "pending", labelAr: "انتظار", labelEn: "Pending" },
    { key: "approved", labelAr: "مقبول", labelEn: "Approved" },
    { key: "rejected", labelAr: "مرفوض", labelEn: "Rejected" },
  ];

  const sortTabs: Array<{ key: SortKey; labelAr: string; labelEn: string }> = [
    { key: "new", labelAr: "الأحدث أولًا", labelEn: "Newest first" },
    { key: "old", labelAr: "الأقدم أولًا", labelEn: "Oldest first" },
  ];

  const shownCount = rows.length;

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1100, width: "100%" }}>
        <div style={testBanner}>
          {isAr ? `لوحة الأدمن (/${locale}/admin/requests)` : `Admin (/${locale}/admin/requests)`}
        </div>

        <div style={topRow}>
          <div>
            <h1 style={h1}>{isAr ? "لوحة الطلبات (أدمن)" : "Requests Dashboard (Admin)"}</h1>

            <div style={sub}>
              {isAr ? `عرض ${shownCount} طلب (حد أقصى 200) من ` : `Showing ${shownCount} requests (max 200) from `}
              <code>provider_requests</code>
            </div>

            {error ? <div style={err}>{String((error as any)?.message || error)}</div> : null}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <AdminLogoutButton locale={locale} />
            </div>

            <AdminRefSearchBox locale={locale} />
          </div>
        </div>

        <div style={filtersRow} dir={isAr ? "rtl" : "ltr"}>
          <div style={filterGroup}>
            <div style={filterLabel}>{isAr ? "فلترة الحالة:" : "Status filter:"}</div>
            <div style={chips}>
              {statusTabs.map((t2) => {
                const active = t2.key === statusFilter;
                const href = buildHref(locale, t2.key, sortKey, refQueryRaw);
                return (
                  <a key={t2.key} href={href} style={chip(active)}>
                    {isAr ? t2.labelAr : t2.labelEn}
                  </a>
                );
              })}
            </div>
          </div>

          <div style={filterGroup}>
            <div style={filterLabel}>{isAr ? "الترتيب:" : "Sort:"}</div>
            <div style={chips}>
              {sortTabs.map((s2) => {
                const active = s2.key === sortKey;
                const href = buildHref(locale, statusFilter, s2.key, refQueryRaw);
                return (
                  <a key={s2.key} href={href} style={chip(active)}>
                    {isAr ? s2.labelAr : s2.labelEn}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ overflowX: "auto" }}>
            <table style={table} dir={isAr ? "rtl" : "ltr"}>
              <thead>
                <tr>
                  <th style={th}>{isAr ? "الاسم" : "Name"}</th>
                  <th style={th}>{isAr ? "رقم الجوال" : "Phone"}</th>
                  <th style={th}>{isAr ? "نوع الخدمة" : "Service type"}</th>
                  <th style={th}>{isAr ? "المدينة" : "City"}</th>
                  <th style={th}>{isAr ? "الحالة" : "Status"}</th>
                  <th style={th}>{isAr ? "الرقم المرجعي" : "Reference"}</th>
                  <th style={th}>{isAr ? "تغيير الحالة" : "Change status"}</th>
                  <th style={th}>{isAr ? "التاريخ" : "Date"}</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={empty}>
                      {isAr ? "لا توجد نتائج" : "No results"}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const raw = (r.status ?? "pending").toLowerCase();
                    const ref = toRef(r.id);

                    return (
                      <tr key={r.id}>
                        <td style={td}>{r.name ?? ""}</td>
                        <td style={td}>{r.phone ?? ""}</td>
                        <td style={td}>{r.service_type ?? ""}</td>
                        <td style={td}>{r.city ?? ""}</td>
                        <td style={td}>
                          <span style={badge}>{statusLabel(locale, raw)}</span>
                        </td>

                        <td style={td}>
                          <span style={refPill}>{ref}</span>
                        </td>

                        <td style={td}>
                          <AdminStatusButtons
                            locale={locale}
                            id={r.id}
                            currentStatus={raw}
                            action={updateStatus}
                          />
                        </td>

                        <td style={td}>{fmt(locale, r.created_at)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
          {isAr ? "الرابط:" : "Link:"} <code>/{locale}/admin/requests</code>
        </div>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: 24,
  background: "transparent",
  display: "flex",
  justifyContent: "center",
};

const testBanner: React.CSSProperties = {
  background: "#111",
  color: "#fff",
  padding: "10px 12px",
  borderRadius: 12,
  fontWeight: 900,
  marginBottom: 12,
  textAlign: "center",
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

const filtersRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 12,
  flexWrap: "wrap",
};

const filterGroup: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const filterLabel: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 13,
  color: "#111",
};

const chips: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const chip = (active: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 10px",
  borderRadius: 999,
  border: `1px solid ${active ? "#111" : "#ddd"}`,
  background: active ? "#111" : "#fff",
  color: active ? "#fff" : "#111",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 12,
  whiteSpace: "nowrap",
});

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
  minWidth: 1080,
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

const refPill: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #ddd",
  background: "#fff",
  fontWeight: 900,
  fontSize: 12,
  whiteSpace: "nowrap",
};

const done: React.CSSProperties = { color: "#666", fontWeight: 800, fontSize: 12 };
