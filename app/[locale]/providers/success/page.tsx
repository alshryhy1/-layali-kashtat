import Link from "next/link";

export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

/** رقم مختصر للعرض فقط (لا يغيّر التخزين ولا الرابط) */
function shortRef(raw: string) {
  const u = String(raw || "").trim();
  if (!u) return "";

  const lower = u.toLowerCase();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(lower);

  const core = isUuid
    ? lower.slice(0, 8)
    : lower.replace(/[^0-9a-z]/g, "").slice(0, 10);

  if (!core) return "";
  return `LK-${core.toUpperCase()}`;
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
  const displayRef = ref ? shortRef(ref) : "";

  const t = {
    title: isAr ? "تم استلام طلبك بنجاح" : "Request received",
    desc: isAr ? "سيتم التواصل معك بعد مراجعة الطلب." : "We will contact you after review.",
    note: isAr ? "احتفظ برقم الطلب ورقم الجوال للمتابعة." : "Keep the request number and phone to track.",
    refLabel: isAr ? "رقم الطلب" : "Request number",
    back: isAr ? "العودة للرئيسية" : "Back to home",
    track: isAr ? "متابعة حالة الطلب" : "Track status",
  };

  return (
    <section dir={isAr ? "rtl" : "ltr"} className="lk-success">
      <div className="lk-wrap">
        <div className="lk-card" style={{ textAlign: "center" }}>
          <h1 className="lk-title">{t.title}</h1>

          <p className="lk-desc">{t.desc}</p>

          <p className="lk-note">{t.note}</p>

          <div className="lk-ref">
            <div className="lk-ref-label">{t.refLabel}</div>
            <div className="lk-ref-value">{displayRef || "-"}</div>
          </div>

          <div className="lk-actions">
            <Link href={`/${locale}`} className="lk-btn lk-btn-primary">
              {t.back}
            </Link>

            <Link
              href={`/${locale}/providers/status${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`}
              className="lk-btn lk-btn-ghost"
            >
              {t.track}
            </Link>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .lk-success{
            width:100%;
            padding: 14px 0 18px;
          }

          .lk-wrap{
            width:100%;
            max-width: 560px;
            margin-inline:auto;
            padding-inline: 12px;
          }

          .lk-card{
            background: rgba(255,255,255,0.92);
            border: 1px solid rgba(0,0,0,0.08);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            border-radius: 18px;
            box-shadow: 0 12px 28px rgba(0,0,0,0.10);
            padding: 16px;
          }

          .lk-title{
            margin:0;
            font-size: 18px;
            font-weight: 900;
            line-height: 1.25;
          }

          .lk-desc{
            margin: 10px 0 6px;
            font-size: 12.8px;
            opacity:.86;
            line-height: 1.65;
          }

          .lk-note{
            margin: 0 0 12px;
            font-size: 12.2px;
            opacity:.78;
            line-height: 1.65;
          }

          .lk-ref{
            margin: 0 auto 14px;
            border: 1px solid rgba(0,0,0,0.12);
            border-radius: 16px;
            padding: 12px 12px;
            background: rgba(255,255,255,0.88);
            box-shadow: 0 6px 16px rgba(0,0,0,0.06);
          }

          .lk-ref-label{
            font-size: 11.5px;
            font-weight: 900;
            opacity: .78;
            margin-bottom: 6px;
          }

          .lk-ref-value{
            font-size: 16px;
            font-weight: 900;
            letter-spacing: .35px;
          }

          .lk-actions{
            display:flex;
            flex-direction: column;
            gap: 10px;
          }

          .lk-btn{
            height: 42px;
            padding: 8px 12px;
            border-radius: 14px;
            font-size: 13px;
            font-weight: 900;
            text-decoration:none;
            display:flex;
            align-items:center;
            justify-content:center;
            box-sizing: border-box;
          }

          .lk-btn-primary{
            background:#111;
            color:#fff;
            border:1px solid #111;
          }

          .lk-btn-ghost{
            background:#fff;
            color:#111;
            border:1px solid rgba(0,0,0,.16);
          }

          @media (min-width:768px){
            .lk-card{ padding: 20px; }
            .lk-title{ font-size: 20px; }
            .lk-actions{ flex-direction: row; }
            .lk-btn{ height:44px; }
          }
        `,
        }}
      />
    </section>
  );
}
