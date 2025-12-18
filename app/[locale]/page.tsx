export default function Home({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params?.locale === "en" ? "en" : "ar";
  const isEn = locale === "en";

  const t = {
    title: isEn ? "Layali Kashtat" : "ليالي كشتات",
    desc: isEn
      ? "A simple platform to organize requests and connect service providers with customers."
      : "منصة تقنية بسيطة لتنظيم الطلبات والتواصل بين مقدمي الخدمات والعملاء.",
    provider: isEn ? "Provider Signup" : "تسجيل مقدم خدمة",
    legal: isEn ? "Legal" : "النصوص القانونية",
  };

  return (
    <main
      style={{
        minHeight: "calc(100vh - 70px)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
      dir={isEn ? "ltr" : "rtl"}
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

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <a
            href={`/${locale}/provider-signup`}
            style={{
              display: "inline-block",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              fontWeight: 900,
            }}
          >
            {t.provider}
          </a>

          <a
            href={`/${locale}/legal`}
            style={{
              display: "inline-block",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#fff",
              color: "#111",
              fontWeight: 900,
            }}
          >
            {t.legal}
          </a>
        </div>
      </div>
    </main>
  );
}
