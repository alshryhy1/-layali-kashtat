import ProviderSignupFormAction from "@/components/ProviderSignupFormAction";
import { createProviderRequest } from "@/app/actions/createProviderRequest";

type Locale = "ar" | "en";

export default function ProviderSignupPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const locale: Locale = params.locale === "en" ? "en" : "ar";

  return (
    <div style={{ padding: "18px 16px", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
        {locale === "ar" ? "تسجيل مقدم خدمة" : "Provider Signup"}
      </h1>

      <p style={{ marginTop: 8, marginBottom: 12, color: "#444", lineHeight: 1.7 }}>
        {locale === "ar"
          ? "املأ البيانات التالية وسيتم استلام طلبك داخل الموقع."
          : "Fill the form below. Your request will be received within the website."}
      </p>

      <ProviderSignupFormAction locale={locale} action={createProviderRequest} />
    </div>
  );
}
