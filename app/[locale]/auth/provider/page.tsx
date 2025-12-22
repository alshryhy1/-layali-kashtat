import ProviderRegisterForm from "@/components/ProviderRegisterForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

export default async function ProviderAuthPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = asLocale(rawLocale);
  const isAr = locale === "ar";

  const title = isAr ? "تسجيل مقدم خدمة" : "Provider Registration";
  const sub = isAr
    ? "املأ البيانات التالية وسنراجع طلبك."
    : "Fill in the details below and we’ll review your request.";
  const back = isAr ? "العودة" : "Back";

  return (
    <main
      dir={isAr ? "rtl" : "ltr"}
      style={{
        minHeight: "calc(100vh - 70px)",
        padding: "clamp(10px, 3vw, 16px)",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.62), rgba(255,255,255,0.62)), url('/bg-desert.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560, margin: "0 auto" }}>
        <div
          style={{
            margin: "0 auto 12px",
            background: "rgba(255,255,255,0.70)",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 14,
            padding: "clamp(10px, 2.6vw, 12px)",
            boxShadow: "0 6px 14px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexDirection: isAr ? "row-reverse" : "row",
            }}
          >
            <a
              href={`/${locale}`}
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.55)",
                background: "#fff",
                color: "#111",
                fontWeight: 900,
                textDecoration: "none",
                whiteSpace: "nowrap",
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {back}
            </a>

            <div style={{ textAlign: isAr ? "right" : "left", flex: 1 }}>
              <div style={{ fontSize: "clamp(16px, 4.2vw, 18px)", fontWeight: 900, lineHeight: 1.15 }}>
                {title}
              </div>
              <div style={{ marginTop: 4, fontSize: "clamp(12px, 3.4vw, 13px)", opacity: 0.78 }}>
                {sub}
              </div>
            </div>
          </div>
        </div>

        <ProviderRegisterForm locale={locale} />
      </div>
    </main>
  );
}
