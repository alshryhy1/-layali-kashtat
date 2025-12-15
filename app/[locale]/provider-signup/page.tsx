import ProviderSignupForm from "@/components/ProviderSignupForm";
import { createProviderRequest } from "@/app/actions/providerRequests";

export default function Page({
  params,
}: {
  params: { locale: string };
}) {
  const isAr = (params?.locale || "ar").toLowerCase().startsWith("ar");

  return (
    <div style={{ padding: "20px 14px" }} dir={isAr ? "rtl" : "ltr"}>
      <h1 style={{ textAlign: "center", marginTop: 8 }}>
        {isAr ? "تسجيل مقدم خدمة" : "Provider Signup"}
      </h1>
      <p style={{ textAlign: "center", color: "#666", marginTop: 6 }}>
        {isAr
          ? "عبّئ البيانات وسيتم استلام طلبك."
          : "Fill the form and we’ll receive your request."}
      </p>

      <ProviderSignupForm action={createProviderRequest} />
    </div>
  );
}
