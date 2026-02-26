import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-customer";
import { redirect } from "next/navigation";
import Link from "next/link";
 
type Locale = "ar" | "en";
function asLocale(v: any): Locale {
  return String(v || "").toLowerCase() === "en" ? "en" : "ar";
}
 
export default async function CustomerDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const p = await params;
  const locale = asLocale(p?.locale);
  const isAr = locale === "ar";
 
  const session = await getSession();
  if (!session) {
    redirect(`/${locale}`);
  }
 
  let requests: any[] = [];
  try {
    const res = await db.query(
      `
        SELECT ref, city, service_type, status, provider_status, created_at
        FROM customer_requests
        WHERE (email = $1 OR phone = $2)
        ORDER BY created_at DESC
        LIMIT 50
      `,
      [session.email, session.phone]
    );
    requests = res.rows || [];
  } catch {}
 
  return (
    <main style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>
          {isAr ? "لوحة العميل" : "Customer Dashboard"}
        </h1>
        <form action="/api/customer/logout" method="POST">
          <button
            type="submit"
            style={{ height: 40, borderRadius: 10, border: "1px solid #111", background: "#fff", color: "#111", fontWeight: 900, padding: "0 14px", cursor: "pointer" }}
          >
            {isAr ? "تسجيل الخروج" : "Logout"}
          </button>
        </form>
      </div>
 
      <div style={{ marginTop: 8, color: "#6b7280" }}>
        {isAr ? `مرحباً، ${session.name}` : `Welcome, ${session.name}`}
      </div>
 
      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
          {isAr ? "طلباتك" : "Your Requests"}
        </h2>
        <div style={{ marginBottom: 12 }}>
          <Link href={`/${locale}/customer/request`} style={{ textDecoration: "none" }}>
            <button style={{ height: 40, borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 900, padding: "0 14px", cursor: "pointer" }}>
              {isAr ? "طلب جديد" : "New Request"}
            </button>
          </Link>
        </div>
 
        {requests.length === 0 ? (
          <div style={{ padding: 16, borderRadius: 12, border: "1px solid #eee", background: "#fafafa", color: "#6b7280" }}>
            {isAr ? "لا توجد طلبات حتى الآن." : "No requests yet."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {requests.map((r) => (
              <div key={r.ref} style={{ padding: 16, borderRadius: 12, border: "1px solid #eee", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 900 }}>{r.service_type} — {r.city}</div>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>
                    {new Date(r.created_at).toLocaleString(isAr ? "ar-SA" : "en-US")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ padding: "6px 10px", borderRadius: 999, background: "#f3f4f6", border: "1px solid #e5e7eb", fontWeight: 800, fontSize: 12, color: "#111" }}>
                    {isAr ? "حالة العميل" : "Client"}: {r.status}
                  </span>
                  {r.provider_status && (
                    <span style={{ padding: "6px 10px", borderRadius: 999, background: "#eef2ff", border: "1px solid #e0e7ff", fontWeight: 800, fontSize: 12, color: "#111" }}>
                      {isAr ? "حالة المزود" : "Provider"}: {r.provider_status}
                    </span>
                  )}
                  <Link href={`/${locale}/haraj`} style={{ textDecoration: "underline", fontWeight: 800 }}>
                    {isAr ? "تصفح السوق" : "Browse Market"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
