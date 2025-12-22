import Link from "next/link";

export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

export default async function ProviderStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string; phone?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;

  const locale: Locale = asLocale(p?.locale);
  const isAr = locale === "ar";

  const ref = String(sp?.ref || "").trim();
  const phone = String(sp?.phone || "").trim();

  const t = {
    title: isAr ? "متابعة حالة الطلب" : "Track request",
    hint: isAr ? "اكتب رقم الطلب ورقم الجوال." : "Enter request number and mobile.",
    ref: isAr ? "رقم الطلب" : "Request number",
    phone: isAr ? "رقم الجوال" : "Mobile number",
    submit: isAr ? "متابعة" : "Track",
    back: isAr ? "العودة للرئيسية" : "Back to home",
    status: isAr ? "الحالة" : "Status",
    pending: isAr ? "قيد الانتظار" : "Pending",
    resultTitle: isAr ? "نتيجة المتابعة" : "Result",
  };

  return (
    <section
      dir={isAr ? "rtl" : "ltr"}
      style={{
        width: "100%",
        paddingTop: 6,
        paddingBottom: 10,
      }}
    >
      {/* طبقة واحدة فقط */}
      <div style={{ width: "100%", maxWidth: 560, marginInline: "auto", paddingInline: 12 }}>
        <div
          className="card status-card"
          style={{
            background: "rgba(255,255,255,0.85)", // ✅ طبقة واحدة
            textAlign: isAr ? "right" : "left",
          }}
        >
          <h1
            className="status-title"
            style={{
              margin: "0 0 6px",
              fontSize: 22,
              fontWeight: 900,
              textAlign: "center",
            }}
          >
            {t.title}
          </h1>

          <p
            className="status-hint"
            style={{
              margin: "0 0 10px",
              fontSize: 13,
              opacity: 0.75,
              textAlign: "center",
              lineHeight: 1.25,
            }}
          >
            {t.hint}
          </p>

          {/* الحقول */}
          <div className="status-grid" style={{ display: "grid", gap: 9 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 900 }}>{t.ref}</label>
              <input
                defaultValue={ref}
                style={{
                  width: "100%",
                  minHeight: 48, // ✅ لمس ثابت
                  marginTop: 5, // ✅ أقل
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.18)",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 900 }}>{t.phone}</label>
              <input
                defaultValue={phone}
                inputMode="tel"
                style={{
                  width: "100%",
                  minHeight: 48, // ✅ لمس ثابت
                  marginTop: 5, // ✅ أقل
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.18)",
                }}
              />
            </div>

            <button
              style={{
                width: "100%",
                minHeight: 48, // ✅ لمس ثابت
                borderRadius: 14,
                border: "1px solid #000",
                background: "#000",
                color: "#fff",
                fontWeight: 900,
                cursor: "pointer",
                marginTop: 1, // ✅ يقرب الزر بصريًا
              }}
            >
              {t.submit}
            </button>
          </div>

          {/* نتيجة الطلب — منظمة وواضحة */}
          {ref && (
            <div
              className="status-result"
              style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: "1px solid rgba(0,0,0,0.12)",
              }}
            >
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 13,
                  opacity: 0.8,
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                {t.resultTitle}
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    fontWeight: 900,
                  }}
                >
                  <span style={{ opacity: 0.75, fontSize: 13 }}>{t.ref}</span>
                  <span style={{ fontSize: 16, letterSpacing: 0.3, wordBreak: "break-word" }}>{ref}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    fontWeight: 900,
                  }}
                >
                  <span style={{ opacity: 0.75, fontSize: 13 }}>{t.status}</span>
                  <span style={{ fontSize: 14 }}>{t.pending}</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 12, textAlign: "center" }}>
            <Link href={`/${locale}`} style={{ fontWeight: 900, textDecoration: "underline", color: "#111" }}>
              {t.back}
            </Link>
          </div>

          {/* Mobile-first tightening (status page only) */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
              .status-card { padding: 14px; }
              .status-title { font-size: 20px; }
              @media (min-width: 768px) {
                .status-card { padding: 18px; }
                .status-title { font-size: 22px; }
                .status-grid { gap: 10px; }
              }
            `,
            }}
          />
        </div>
      </div>
    </section>
  );
}
