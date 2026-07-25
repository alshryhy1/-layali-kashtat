
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/auth-admin";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import bcrypt from "bcrypt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPortalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "ar";
  const isAr = locale === "ar";

  const token = (await cookies()).get("kashtat_admin")?.value;
  if (!verifyAdminSession(token)) {
    redirect(`/${locale}/admin/login`);
  }

  let totalViews = 0;
  try {
    if (process.env.DATABASE_URL) {
      const viewsRes = await db.query("SELECT value FROM site_analytics WHERE key = 'total_views'");
      if (viewsRes.rows.length > 0) {
        totalViews = Number(viewsRes.rows[0].value || 0);
      }
    }
  } catch (e) {
    console.error("Failed to fetch views:", e);
  }

  const containerStyle: React.CSSProperties = {
    minHeight: "calc(100vh - 100px)", // Adjust for layout padding
    display: "flex",
    flexDirection: "column",
    background: "#f9f9f9",
    padding: 20,
    fontFamily: "inherit",
  };

  const headerStyle: React.CSSProperties = {
    width: "100%",
    display: "flex",
    justifyContent: "space-between", // Spread items apart
    alignItems: "center",
    marginBottom: 40,
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  };

  const cardStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 400,
    padding: 40,
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 16,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    textDecoration: "none",
    color: "#111",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer",
    textAlign: "center",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 900,
    marginBottom: 8,
  };

  const descStyle: React.CSSProperties = {
    fontSize: 16,
    color: "#666",
  };

  const statCardStyle: React.CSSProperties = {
    padding: 24,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    marginBottom: 32,
    textAlign: "center",
    minWidth: 200,
  };

  async function addAdmin(formData: FormData) {
    "use server";
    const username = String(formData.get("username") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "").trim();
    if (!username || !password) return;
    await db.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    const hash = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO admins (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING", [username, hash]);
  }

  async function addAnnouncement(formData: FormData) {
    "use server";
    const text = String(formData.get("text") || "").trim();
    if (!text) return;
    await db.query(`
      CREATE TABLE IF NOT EXISTS banner_announcements (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.query("INSERT INTO banner_announcements (text, active) VALUES ($1, true)", [text]);
  }

  async function deleteAnnouncement(formData: FormData) {
    "use server";
    const id = Number(formData.get("id") || 0);
    if (!id) return;
    await db.query("DELETE FROM banner_announcements WHERE id = $1", [id]);
  }

  let admins: Array<{ id: number; username: string; created_at: string }> = [];
  let announcements: Array<{ id: number; text: string; active: boolean; created_at: string }> = [];
  try {
    const a1 = await db.query("SELECT id, username, created_at FROM admins ORDER BY created_at DESC");
    admins = a1.rows || [];
  } catch {}
  try {
    const a2 = await db.query("SELECT id, text, active, created_at FROM banner_announcements ORDER BY created_at DESC");
    announcements = a2.rows || [];
  } catch {}

  return (
    <main style={containerStyle} dir={isAr ? "rtl" : "ltr"}>
      <div style={headerStyle}>
        <Link
          href={`/${locale}`}
          style={{
            textDecoration: "none",
            color: "#666",
            fontSize: 14,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>🏠</span>
          {isAr ? "العودة للرئيسية" : "Back to Home"}
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <LanguageSwitcher locale={locale} />
          <AdminLogoutButton locale={locale} />
        </div>
      </div>

      <div style={contentStyle}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, color: "#1e293b" }}>
            {isAr ? "بوابة الإدارة" : "Admin Portal"}
          </h1>
          <p style={{ color: "#64748b" }}>
            {isAr ? "مرحباً بك في لوحة التحكم" : "Welcome to the control panel"}
          </p>
        </div>

        {/* View Counter */}
        <div style={statCardStyle}>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            {isAr ? "إجمالي زيارات الموقع" : "Total Site Views"}
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#0f172a" }}>
            👁️ {totalViews.toLocaleString()}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", width: "100%" }}>
          <Link href={`/${locale}/dashboard`} style={cardStyle}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={titleStyle}>{isAr ? "لوحة انضمام المقدمين" : "Provider Requests"}</div>
            <div style={descStyle}>
              {isAr
                ? "مراجعة وقبول طلبات التسجيل الجديدة لمقدمي الخدمة."
                : "Review and approve new service provider applications."}
            </div>
          </Link>

          <Link href={`/${locale}/admin/requests`} style={cardStyle}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
            <div style={titleStyle}>{isAr ? "لوحة طلبات العملاء" : "Customer Requests"}</div>
            <div style={descStyle}>
              {isAr
                ? "إدارة حجوزات وطلبات العملاء."
                : "Manage customer bookings and requests."}
            </div>
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, width: "100%", maxWidth: 900 }}>
          <div style={{ padding: 24, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>{isAr ? "إضافة مشرف" : "Add Admin"}</h2>
            <form action={addAdmin}>
              <div style={{ display: "grid", gap: 10 }}>
                <input name="username" placeholder={isAr ? "اسم المستخدم" : "Username"} style={{ padding: 10, borderRadius: 10, border: "1px solid #e2e8f0" }} />
                <input name="password" type="password" placeholder={isAr ? "كلمة المرور" : "Password"} style={{ padding: 10, borderRadius: 10, border: "1px solid #e2e8f0" }} />
                <button type="submit" style={{ padding: 10, borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 900 }}>
                  {isAr ? "إضافة" : "Add"}
                </button>
              </div>
            </form>
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>{isAr ? "قائمة المشرفين" : "Admins List"}</h3>
              <ul>
                {admins.map(a => (
                  <li key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                    <span>{a.username}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div style={{ padding: 24, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>{isAr ? "إعلانات البنر العلوي" : "Top Banner Announcements"}</h2>
            <form action={addAnnouncement}>
              <div style={{ display: "grid", gap: 10 }}>
                <input name="text" placeholder={isAr ? "نص الإعلان" : "Announcement text"} style={{ padding: 10, borderRadius: 10, border: "1px solid #e2e8f0" }} />
                <button type="submit" style={{ padding: 10, borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 900 }}>
                  {isAr ? "إضافة" : "Add"}
                </button>
              </div>
            </form>
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>{isAr ? "النصوص الحالية" : "Current Items"}</h3>
              <ul>
                {announcements.map(a => (
                  <li key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", gap: 10 }}>
                    <span style={{ fontWeight: 700 }}>{a.text}</span>
                    <form action={deleteAnnouncement}>
                      <input type="hidden" name="id" value={String(a.id)} />
                      <button type="submit" style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ef4444", background: "#ef4444", color: "#fff", fontWeight: 900 }}>
                        {isAr ? "حذف" : "Delete"}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
