import * as React from "react";
import InstallPrompt from "@/components/InstallPrompt";

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
    request: isEn ? "Request Service (Customers)" : "طلب خدمة (للعملاء)",
    signup: isEn ? "Provider Signup" : "تسجيل مقدم خدمة",
    providerDashboard: isEn ? "Provider Dashboard" : "لوحة إدارة مقدم الخدمة",
    status: isEn ? "Track Request" : "متابعة الطلب",
    legal: isEn ? "Legal Texts" : "النصوص القانونية",
  };

  const btnBase: React.CSSProperties = {
    width: "100%",
    minHeight: 44,
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    boxSizing: "border-box",
  };

  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
  };

  const btnGhost: React.CSSProperties = {
    ...btnBase,
    minHeight: 42,
    fontWeight: 850,
    border: "1px solid rgba(0,0,0,0.16)",
    background: "#fff",
    color: "#111",
  };

  return (
    <section
      dir={isEn ? "ltr" : "rtl"}
      style={{
        width: "100%",
        paddingTop: 14,
        paddingBottom: 14,
        paddingInline: 12,
      }}
    >
      <div style={{ width: "100%", maxWidth: 720, marginInline: "auto" }}>
        <div
          className="card home-card"
          style={{
            textAlign: "center",
            padding: "18px 14px",
            borderRadius: 18,
          }}
        >
          <div style={{ width: "100%", maxWidth: 420, marginInline: "auto" }}>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 900,
                lineHeight: "32px",
                letterSpacing: isEn ? 0 : "-0.2px",
              }}
            >
              {t.title}
            </h1>

            

            

            <p
              style={{
                margin: "10px 0 16px",
                opacity: 0.78,
                fontSize: 13,
                lineHeight: "20px",
              }}
            >
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
              <a href={`/${locale}/request`} style={btnPrimary}>
                {t.request}
              </a>

              <a href={`/${locale}/providers/signup`} style={btnGhost}>
                {t.signup}
              </a>

              <a href={`/${locale}/providers/dashboard`} style={btnGhost}>
                {t.providerDashboard}
              </a>

              <a href={`/${locale}/providers/status`} style={btnGhost}>
                {t.status}
              </a>

              <a href={`/${locale}/legal`} style={btnGhost}>
                {t.legal}
              </a>
            </div>
          </div>

          <style
            dangerouslySetInnerHTML={{
              __html: `
              /* Mobile-first: بطاقة أضيق وتوازن مسافات */
              .home-card { box-shadow: 0 12px 28px rgba(0,0,0,.08); }

              /* Tablet/Desktop: 2×2 عشان 4 أزرار */
              @media (min-width: 768px) {
                .home-card { padding: 22px 18px; }
                .home-actions { grid-template-columns: 1fr 1fr; }
              }
            `,
            }}
          />
        </div>
        <InstallPrompt />
      </div>
    </section>
  );
}
