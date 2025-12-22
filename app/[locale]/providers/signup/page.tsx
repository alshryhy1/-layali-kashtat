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
        paddingTop: 6,
        paddingBottom: 14,
      }}
    >
      <div className="lk-signup-wrap">
        <ProviderRegisterForm locale={locale} />
      </div>

      {/* Mobile First tuning */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* ===== Mobile (default) ===== */
          .lk-signup-wrap {
            width: 100%;
            max-width: 480px;        /* ✅ أصغر = أخف */
            margin-inline: auto;
            margin-top: -6px;        /* ✅ رفع خفيف */
          }

          /* ===== Tablet / Desktop ===== */
          @media (min-width: 768px) {
            .lk-signup-wrap {
              max-width: 560px;
              margin-top: 0;
            }
          }
        `,
        }}
      />
    </main>
  );
}
