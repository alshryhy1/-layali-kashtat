import ProviderRegisterForm from "@/components/ProviderRegisterForm";

export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

export default async function ProviderSignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale: Locale = asLocale(p?.locale);
  const isAr = locale === "ar";

  return (
    <main
      dir={isAr ? "rtl" : "ltr"}
      style={{
        width: "100%",
        paddingInline: 12,
        paddingTop: 8,
        paddingBottom: 16,
      }}
    >
      <div className="lk-signup-wrap">
        <ProviderRegisterForm locale={locale} />
      </div>

      {/* ✅ Fix: mobile fields alignment + consistent card width */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* ===== Mobile (default) ===== */
          .lk-signup-wrap{
            width:100%;
            max-width:100%;
            margin-inline:auto;
          }

          /* على الجوال: الكرت والحقول لازم يملون العرض بالكامل */
          .lk-signup-wrap .lk-form{
            width:100% !important;
            max-width:100% !important;
            padding:14px !important;
            border-radius:16px !important;
            background:rgba(255,255,255,0.88) !important;
            box-shadow:0 12px 26px rgba(0,0,0,0.10) !important;
          }

          /* تحسين صغير جدًا للجوال الصغير */
          @media (max-width: 380px){
            .lk-signup-wrap .lk-form{ padding:12px !important; }
          }

          /* ===== Tablet / Desktop ===== */
          @media (min-width: 768px) {
            .lk-signup-wrap{
              max-width:560px;
            }
            .lk-signup-wrap .lk-form{
              max-width:520px !important;
              padding:18px !important;
              border-radius:18px !important;
              background:rgba(255,255,255,0.90) !important;
            }
          }
        `,
        }}
      />
    </main>
  );
}
