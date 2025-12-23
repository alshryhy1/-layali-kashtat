import * as React from "react";

export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale: Locale = asLocale(p?.locale);
  const isAr = locale === "ar";

  const t = {
    title: isAr ? "النصوص القانونية" : "Legal Texts",
    backHome: isAr ? "العودة للرئيسية" : "Back to home",
    goSignup: isAr ? "تسجيل مقدم خدمة" : "Provider Signup",
    goStatus: isAr ? "متابعة الطلب" : "Track Request",
    body: isAr
      ? [
          "هذه المنصة تقنية لتنظيم الطلبات والتواصل فقط.",
          "يلتزم مقدم الخدمة بصحة بياناته ومسؤوليته الكاملة عن تقديم الخدمة.",
          "يحق للإدارة قبول أو رفض أي طلب دون إبداء أسباب.",
          "يجب الموافقة على هذه النصوص قبل إرسال طلب التسجيل.",
        ]
      : [
          "This platform is for organizing requests and communication only.",
          "Providers are responsible for their information and services.",
          "Administration may accept or reject any request without explanation.",
          "You must agree to these texts before submitting a signup request.",
        ],
  };

  // Mobile-first: أزرار أخف + أقل ضخامة
  const btnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.16)",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    textDecoration: "none",
    minHeight: 44,
    width: "100%",
    textAlign: "center",
    boxSizing: "border-box",
  };

  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    minHeight: 46,
  };

  const btnLight: React.CSSProperties = {
    ...btnBase,
    fontWeight: 850,
    minHeight: 42,
  };

  return (
    <main
      dir={isAr ? "rtl" : "ltr"}
      style={{
        minHeight: "calc(100vh - 70px)",
        display: "grid",
        placeItems: "center",
        padding: 12,
      }}
    >
      <div
        className="legal-card"
        style={{
          width: "100%",
          maxWidth: 520,
          background: "rgba(255,255,255,0.92)",
          borderRadius: 18,
          padding: 16,
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          className="legal-title"
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 900,
            textAlign: "center",
          }}
        >
          {t.title}
        </h1>

        <div
          className="legal-divider"
          style={{
            width: 44,
            height: 4,
            borderRadius: 999,
            margin: "10px auto 12px",
            background: "rgba(0,0,0,0.12)",
          }}
        />

        <ul
          className="legal-list"
          style={{
            margin: 0,
            opacity: 0.92,
            listStylePosition: "outside",
            paddingInlineStart: isAr ? 20 : 20,
            lineHeight: "1.95",
            fontSize: 14,
          }}
        >
          {t.body.map((x, i) => (
            <li
              key={i}
              style={{
                marginBottom: 10,
              }}
            >
              <span className="legal-item">{x}</span>
            </li>
          ))}
        </ul>

        <div
          className="legal-actions"
          style={{
            marginTop: 14,
            display: "grid",
            gap: 10,
          }}
        >
          <a href={`/${locale}/providers/signup`} style={btnPrimary}>
            {t.goSignup}
          </a>

          <a href={`/${locale}/providers/status`} style={btnLight}>
            {t.goStatus}
          </a>

          <a href={`/${locale}`} style={btnLight}>
            {t.backHome}
          </a>
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
            /* تحسين قراءة العناصر داخل القائمة، خصوصاً RTL */
            .legal-list li { padding-inline-start: 2px; }
            .legal-item { display: inline; }

            @media (min-width: 768px) {
              .legal-card { padding: 20px; max-width: 720px; }
              .legal-title { font-size: 24px; }
              .legal-list { line-height: 1.9; font-size: 15px; }
              .legal-actions { grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
            }
          `,
          }}
        />
      </div>
    </main>
  );
}
