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

  const btnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #111",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    textDecoration: "none",
    minHeight: 46, // ✅ لمس للجوال
    width: "100%",
    textAlign: "center",
  };

  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    background: "#111",
    color: "#fff",
  };

  return (
    <main
      dir={isAr ? "rtl" : "ltr"}
      style={{
        minHeight: "calc(100vh - 70px)",
        display: "grid",
        placeItems: "center",
        padding: 12, // ✅ أقل على الجوال
      }}
    >
      <div
        className="legal-card"
        style={{
          width: "100%",
          maxWidth: 640, // ✅ تقليل كبير (كان 900)
          background: "rgba(255,255,255,0.90)",
          borderRadius: 16, // ✅ أقل
          padding: 16, // ✅ أقل
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
        }}
      >
        <h1
          className="legal-title"
          style={{ margin: 0, fontSize: 22, fontWeight: 900, textAlign: "center" }}
        >
          {t.title}
        </h1>

        <ul
          className="legal-list"
          style={{
            marginTop: 10,
            marginBottom: 0,
            lineHeight: 1.6, // ✅ أقل
            opacity: 0.92,
            paddingInlineStart: isAr ? 18 : 18,
          }}
        >
          {t.body.map((x, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              {x}
            </li>
          ))}
        </ul>

        <div
          className="legal-actions"
          style={{
            marginTop: 12, // ✅ أقل
            display: "grid",
            gap: 10,
          }}
        >
          <a href={`/${locale}/providers/signup`} style={btnPrimary}>
            {t.goSignup}
          </a>

          <a href={`/${locale}/providers/status`} style={btnBase}>
            {t.goStatus}
          </a>

          <a href={`/${locale}`} style={btnBase}>
            {t.backHome}
          </a>
        </div>

        {/* Mobile-first + Desktop refinement */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @media (min-width: 768px) {
              .legal-card { padding: 18px; max-width: 720px; }
              .legal-title { font-size: 24px; }
              .legal-list { line-height: 1.75; }
              .legal-actions {
                grid-template-columns: 1fr 1fr 1fr;
                gap: 10px;
              }
            }
          `,
          }}
        />
      </div>
    </main>
  );
}
