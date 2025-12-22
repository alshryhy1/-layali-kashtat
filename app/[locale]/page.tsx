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

  const btnBase: React.CSSProperties = {
    width: "100%",
    minHeight: 48,
    padding: "12px 14px",
    borderRadius: 14,
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  };

  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
  };

  const btnGhost: React.CSSProperties = {
    ...btnBase,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "#fff",
    color: "#111",
  };

  return (
    <section
      dir={isEn ? "ltr" : "rtl"}
      style={{
        width: "100%",
        paddingTop: 8,
        paddingBottom: 8,
      }}
    >
      <div style={{ width: "100%", maxWidth: 720, marginInline: "auto" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 900,
              lineHeight: "34px",
            }}
          >
            {t.title}
          </h1>

          <p style={{ margin: "10px 0 14px", opacity: 0.78, fontSize: 14 }}>
            {t.desc}
          </p>

          <div
            className="home-actions"
            style={{
              display: "grid",
              gap: 10,
              gridTemplateColumns: "1fr",
              marginTop: 6,
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

          {/* ✅ ويب: صفّين بشكل جميل بدون كسر الجوال */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
              @media (min-width: 768px) {
                .home-actions {
                  grid-template-columns: 1fr 1fr 1fr;
                }
              }
            `,
            }}
          />
        </div>
      </div>
    </section>
  );
}
