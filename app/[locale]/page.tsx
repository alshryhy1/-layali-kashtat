export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale: Locale = asLocale(p?.locale);
  const isEn = locale === "en";

  const t = {
    title: isEn ? "Layali Kashtat" : "ليالي كشتات",
    desc: isEn
      ? "A simple platform to organize requests and connect service providers with customers."
      : "منصة تقنية بسيطة لتنظيم الطلبات والتواصل بين مقدمي الخدمات والعملاء.",
    signup: isEn ? "Provider Signup" : "تسجيل مقدم خدمة",
    status: isEn ? "Track Request" : "متابعة الطلب",
    legal: isEn ? "Legal Texts" : "النصوص القانونية",
  };

  const btnPrimary: React.CSSProperties = {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 900,
    textDecoration: "none",
    minWidth: 170,
    textAlign: "center",
  };

  const btnGhost: React.CSSProperties = {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #111",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    textDecoration: "none",
    minWidth: 170,
    textAlign: "center",
  };

  return (
    <main
      dir={isEn ? "ltr" : "rtl"}
      style={{
        minHeight: "calc(100vh - 70px)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          background: "rgba(255,255,255,0.78)",
          border: "1px solid #e5e5e5",
          borderRadius: 18,
          padding: 22,
          textAlign: "center",
          boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900 }}>{t.title}</h1>
        <p style={{ margin: "10px 0 18px", opacity: 0.75 }}>{t.desc}</p>

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <a href={`/${locale}/providers/signup`} style={btnPrimary}>
            {t.signup}
          </a>

          <a href={`/${locale}/providers/status`} style={btnGhost}>
            {t.status}
          </a>

          <a href={`/${locale}/legal`} style={btnGhost}>
            {t.legal}
          </a>
        </div>
      </div>
    </main>
  );
}
