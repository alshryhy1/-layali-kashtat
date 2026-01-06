export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

export default async function RequestEntryPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale: Locale = asLocale(params?.locale);
  const isAr = locale === "ar";

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px 16px",
        display: "flex",
        justifyContent: "center",
        background: "#f6f3ee",
      }}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #e7e0d6",
            borderRadius: 16,
            padding: 18,
            boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#111" }}>
            {isAr ? "طلب خدمة (للعملاء)" : "Customer Request"}
          </h1>

          <p style={{ margin: "10px 0 14px", color: "#666", fontSize: 13, lineHeight: 1.7 }}>
            {isAr
              ? "ابدأ الآن بإدخال بياناتك ثم اختر المدينة ونوع الخدمة وباقي الخيارات."
              : "Start by entering your details, then choose city, service type, and other options."}
          </p>

          <div style={{ display: "grid", gap: 10 }}>
            <a
              href={`/${locale}/request/customer`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 44,
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid #111",
                textDecoration: "none",
                color: "#fff",
                fontWeight: 900,
                fontSize: 13,
                background: "#111",
              }}
            >
              {isAr ? "ابدأ الطلب" : "Start Request"}
            </a>

            <a
              href={`/${locale}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 40,
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.2)",
                textDecoration: "none",
                color: "#111",
                fontWeight: 900,
                fontSize: 13,
                background: "#fff",
              }}
            >
              {isAr ? "الرجوع للرئيسية" : "Back to home"}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
