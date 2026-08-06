import Link from "next/link";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { localeHref, type Locale } from "@/lib/locales";

export const adminCardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: 20,
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 16,
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  textDecoration: "none",
  color: "#111",
  gap: 8,
};

export const adminStatCardStyle: React.CSSProperties = {
  padding: 24,
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  textAlign: "center",
  minWidth: 180,
  flex: "1 1 160px",
};

export const adminTableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fff",
  borderRadius: 12,
  overflow: "hidden",
  border: "1px solid #e2e8f0",
};

export const adminThStyle: React.CSSProperties = {
  textAlign: "start",
  padding: "12px 14px",
  fontSize: 13,
  color: "#64748b",
  borderBottom: "1px solid #e2e8f0",
  background: "#f8fafc",
  fontWeight: 800,
};

export const adminTdStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderBottom: "1px solid #f1f5f9",
  fontSize: 14,
  color: "#0f172a",
};

export function AdminPageShell({
  locale,
  title,
  subtitle,
  children,
  showBackToPortal = true,
  maxWidth = 1100,
}: {
  locale: Locale | string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showBackToPortal?: boolean;
  maxWidth?: number;
}) {
  const loc: Locale = locale === "en" ? "en" : "ar";
  const isAr = loc === "ar";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f9f9f9",
        padding: 20,
        fontFamily: "inherit",
      }}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {showBackToPortal ? (
            <Link
              href={localeHref(loc, "/admin/portal")}
              style={{ fontSize: 14, color: "#666", textDecoration: "none", fontWeight: 600 }}
            >
              ← {isAr ? "العودة لبوابة الإدارة" : "Back to Admin Portal"}
            </Link>
          ) : (
            <Link
              href={localeHref(loc, "/")}
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
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <LanguageSwitcher locale={loc} />
          <AdminLogoutButton locale={loc} />
        </div>
      </div>

      <div style={{ width: "100%", maxWidth, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: "#1e293b" }}>{title}</h1>
          {subtitle ? (
            <p style={{ color: "#64748b", marginTop: 8, marginBottom: 0 }}>{subtitle}</p>
          ) : null}
        </div>
        {children}
      </div>
    </main>
  );
}

export function AdminStubBanner({ isAr, note }: { isAr: boolean; note?: string }) {
  return (
    <div
      style={{
        padding: 16,
        background: "#fffbeb",
        border: "1px solid #fcd34d",
        borderRadius: 12,
        color: "#92400e",
        fontWeight: 700,
        marginBottom: 16,
        lineHeight: 1.6,
      }}
    >
      {note ||
        (isAr
          ? "قيد الربط — لا توجد واجهة إدارة كاملة بعد. يمكنك مراجعة البيانات المتاحة أدناه إن وُجدت."
          : "Pending wiring — full management UI not ready yet. Available data is shown below when present.")}
    </div>
  );
}

export function AdminEmptyState({ isAr }: { isAr: boolean }) {
  return (
    <div
      style={{
        padding: 28,
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        color: "#64748b",
        textAlign: "center",
        fontWeight: 600,
      }}
    >
      {isAr ? "لا توجد عناصر حالياً." : "No items yet."}
    </div>
  );
}
