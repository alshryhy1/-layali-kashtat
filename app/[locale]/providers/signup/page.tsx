import ProviderSignupFormAction from "@/components/ProviderSignupFormAction";
import { createProviderRequest } from "@/app/actions/providerRequests";

export const runtime = "nodejs";

type Locale = "ar" | "en";

export default function ProviderSignupPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const locale: Locale = params?.locale === "en" ? "en" : "ar";
  const isAr = locale === "ar";

  return (
    <div style={{ padding: "24px 16px" }}>
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          background: "rgba(255,255,255,0.92)",
          borderRadius: 14,
          padding: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ textAlign: "center", fontWeight: 900, margin: "6px 0 10px" }}>
          {isAr ? "تسجيل مقدم خدمة" : "Provider Signup"}
        </h1>

        <p style={{ textAlign: "center", color: "#444", lineHeight: 1.7, marginTop: 0 }}>
          {isAr
            ? "املأ البيانات التالية وسيتم استلام طلبك داخل الموقع."
            : "Fill the form below. Your request will be received within the website."}
        </p>

        <ProviderSignupFormAction locale={locale} action={createProviderRequest} />
      </div>
    </div>
  );
}
