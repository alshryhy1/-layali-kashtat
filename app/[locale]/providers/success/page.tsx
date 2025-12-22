import Link from "next/link";

export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

export default async function ProviderSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;

  const locale: Locale = asLocale(p?.locale);
  const isAr = locale === "ar";

  const ref = String(sp?.ref || "").trim();

  const t = {
    title: isAr ? "تم استلام طلبك بنجاح" : "Request received",
    desc: isAr ? "سيتم التواصل معك بعد مراجعة الطلب." : "We will contact you after review.",
    note: isAr ? "احتفظ برقم الطلب ورقم الجوال للمتابعة." : "Keep the request number and phone to track.",
    refLabel: isAr ? "رقم الطلب" : "Request number",
    back: isAr ? "العودة للرئيسية" : "Back to home",
    track: isAr ? "متابعة حالة الطلب" : "Track status",
  };

  const btnBase: React.CSSProperties = {
    width: "100%",
    minHeight: 48, // ✅ لمس ثابت
    padding: "12px 14px",
    borderRadius: 14,
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
  };

  const btnGhost: React.CSSProperties = {
    ...btnBase,
    border: "1px solid #d0d0d0",
    background: "#fff",
    color: "#111",
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
      <div style={{ width: "100%", maxWidth: 560, marginInline: "auto", paddingInline: 12 }}>
        <div className="card success-card" style={{ textAlign: "center" }}>
          <h1 className="success-title" style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
            {t.title}
          </h1>

          <p
            className="success-desc"
            style={{
              marginTop: 8,
              marginBottom: 6,
              opacity: 0.84,
              lineHeight: 1.25,
            }}
          >
            {t.desc}
          </p>

          <p
            className="success-note"
            style={{
              marginTop: 0,
              marginBottom: 10,
              opacity: 0.78,
              fontSize: 13,
              lineHeight: 1.25,
            }}
          >
            {t.note}
          </p>

          <div
            className="success-ref"
            style={{
              margin: "0 auto 10px",
              maxWidth: 520,
              border: "1px dashed rgba(0,0,0,0.22)",
              borderRadius: 14,
              padding: 10,
              background: "rgba(255,255,255,0.70)",
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 4, fontSize: 13 }}>{t.refLabel}</div>
            <div
              style={{
                fontWeight: 900,
                fontSize: 18,
                letterSpacing: 0.4,
                wordBreak: "break-word",
                lineHeight: 1.15,
              }}
            >
              {ref ? ref : "-"}
            </div>
          </div>

          <div
            className="success-actions"
            style={{
              display: "grid",
              gap: 10,
              gridTemplateColumns: "1fr",
              marginTop: 4,
            }}
          >
            <Link href={`/${locale}`} style={btnPrimary}>
              {t.back}
            </Link>

            <Link
              href={`/${locale}/providers/status${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`}
              style={btnGhost}
            >
              {t.track}
            </Link>
          </div>

          <style
            dangerouslySetInnerHTML={{
              __html: `
              /* Mobile-first tightening (Success page only) */
              .success-card { padding: 14px; }
              .success-title { font-size: 20px; }

              @media (min-width: 768px) {
                .success-card { padding: 18px; }
                .success-title { font-size: 22px; }
                .success-actions {
                  grid-template-columns: 1fr 1fr;
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
