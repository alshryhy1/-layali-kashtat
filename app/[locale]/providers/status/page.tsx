import Link from "next/link";

export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

/** للعرض فقط (لا يغيّر قيمة ref المرسلة بالـ query) */
function shortRef(raw: string) {
  const s = String(raw || "").trim();
  if (!s) return "";
  return `LK-${s.slice(0, 8).toUpperCase()}`;
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

  const refRaw = String(sp?.ref || "").trim();
  const phone = String(sp?.phone || "").trim();

  const displayRef = refRaw ? shortRef(refRaw) : "";

  const fieldMax = 240;

  return (
    <section
      dir={isAr ? "rtl" : "ltr"}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        padding: 12,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#fff",
          borderRadius: 18,
          padding: 16,
          boxShadow: "0 12px 28px rgba(0,0,0,.08)",
        }}
      >
        <h1
          style={{
            margin: "0 0 6px",
            fontSize: 18,
            fontWeight: 900,
            textAlign: "center",
          }}
        >
          متابعة حالة الطلب
        </h1>

        <p
          style={{
            margin: "0 auto 14px",
            fontSize: 12,
            opacity: 0.7,
            textAlign: "center",
            maxWidth: fieldMax,
            lineHeight: 1.5,
          }}
        >
          اكتب رقم الطلب ورقم الجوال ثم اضغط متابعة.
        </p>

        {/* ✅ GET form لتحديث الصفحة بنفس query (ref + phone) */}
        <form
          method="get"
          style={{
            width: "100%",
            maxWidth: fieldMax,
            margin: "0 auto",
            display: "grid",
            gap: 12,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <label
              htmlFor="lk-ref"
              style={{
                fontSize: 11,
                fontWeight: 800,
                opacity: 0.8,
                display: "block",
                marginBottom: 4,
              }}
            >
              رقم الطلب
            </label>

            <input
              id="lk-ref"
              name="ref"
              defaultValue={refRaw}
              inputMode="text"
              placeholder={isAr ? "اكتب رقم الطلب" : "Enter request number"}
              style={{
                width: "100%",
                height: 38,
                padding: "0 10px",
                boxSizing: "border-box",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,.18)",
                fontSize: 13,
                fontWeight: 900,
                textAlign: "center",
                outline: "none",
                background: "#fff",
              }}
            />
          </div>

          <div style={{ textAlign: "center" }}>
            <label
              htmlFor="lk-phone"
              style={{
                fontSize: 11,
                fontWeight: 800,
                opacity: 0.8,
                display: "block",
                marginBottom: 4,
              }}
            >
              رقم الجوال
            </label>

            <input
              id="lk-phone"
              name="phone"
              defaultValue={phone}
              inputMode="tel"
              placeholder="05xxxxxxxx"
              style={{
                width: "100%",
                height: 38,
                padding: "0 10px",
                boxSizing: "border-box",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,.18)",
                fontSize: 13,
                textAlign: "center",
                outline: "none",
                background: "#fff",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              height: 40,
              borderRadius: 12,
              border: 0,
              background: "#000",
              color: "#fff",
              fontWeight: 900,
              fontSize: 13,
              cursor: "pointer",
              marginTop: 2,
            }}
          >
            متابعة
          </button>
        </form>

        {/* result */}
        {refRaw && (
          <div
            style={{
              maxWidth: fieldMax,
              margin: "18px auto 0",
              paddingTop: 12,
              borderTop: "1px solid rgba(0,0,0,.12)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>
              نتيجة المتابعة
            </div>
            <div style={{ fontSize: 14, fontWeight: 900 }}>
              {displayRef || "-"}
            </div>
            <div style={{ fontSize: 12, marginTop: 2 }}>قيد الانتظار</div>
          </div>
        )}

        <div style={{ marginTop: 14, textAlign: "center" }}>
          <Link
            href={`/${locale}`}
            style={{
              fontSize: 12,
              fontWeight: 800,
              textDecoration: "underline",
              color: "#111",
            }}
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </section>
  );
}
