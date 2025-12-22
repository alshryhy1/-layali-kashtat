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

  const btn: React.CSSProperties = {
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

  const btnPrimary: React.CSSProperties = {
    ...btn,
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
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          background: "rgba(255,255,255,0.92)",
          borderRadius: 18,
          padding: 22,
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, textAlign: "center" }}>
          {t.title}
        </h1>

        <ul style={{ marginTop: 14, lineHeight: 1.9, opacity: 0.9 }}>
          {t.body.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <a href={`/${locale}`} style={btn}>
            {t.backHome}
          </a>

          <a href={`/${locale}/providers/signup`} style={btnPrimary}>
            {t.goSignup}
          </a>

          <a href={`/${locale}/providers/status`} style={btn}>
            {t.goStatus}
          </a>
        </div>
      </div>
    </main>
  );
}
