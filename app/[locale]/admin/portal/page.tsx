
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
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

  return (
    <main style={containerStyle} dir={isAr ? "rtl" : "ltr"}>
      <div style={headerStyle}>
        <LanguageSwitcher locale={locale} />
        <AdminLogoutButton locale={locale} />
      </div>

      <div style={contentStyle}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 40 }}>
          {isAr ? "بوابة الإدارة الموحدة" : "Admin Portal"}
        </h1>

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
