
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/auth-admin";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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
      </div>
    </main>
  );
}
