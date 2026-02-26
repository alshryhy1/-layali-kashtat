export const dynamic = "force-dynamic";

type Locale = "ar" | "en";
function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

export default async function SignupSelectionPage({ params }: { params: Promise<{ locale: string }> }) {
  const p = await params;
  const locale: Locale = asLocale(p?.locale);
  const isAr = locale === "ar";
  
  return (
    <main
      dir={isAr ? "rtl" : "ltr"}
      style={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(180deg,#efe7de 0%,#f4eee6 100%)",
        padding: 24
      }}
    >
      <div
        style={{
          width: 480,
          maxWidth: "92vw",
          background: "#fff",
          borderRadius: 24,
          boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
          padding: 24,
          border: "1px solid #eee",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, textAlign: "center" }}>
          {isAr ? "تسجيل جديد" : "Create Account"}
        </h1>
        <p style={{ marginTop: 8, color: "#6b7280", textAlign: "center", fontSize: 13 }}>
          {isAr ? "اختر نوع الحساب" : "Choose account type"}
        </p>
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <a
            href={`/${locale}/customer/login?view=signup`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              background: "#f0f9ff",
              color: "#111",
              fontWeight: 900,
              textDecoration: "none",
            }}
          >
            {isAr ? "عميل" : "Customer"}
          </a>
          <a
            href={`/${locale}/providers/signup`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              background: "#fff7ed",
              color: "#111",
              fontWeight: 900,
              textDecoration: "none",
            }}
          >
            {isAr ? "مقدّم خدمة" : "Service Provider"}
          </a>
        </div>
      </div>
    </main>
  );
}
