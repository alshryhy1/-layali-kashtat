import ProviderSignupForm from "@/components/ProviderSignupForm";
import { createProviderRequest } from "@/app/actions/providerRequests";

export default function Page() {
  return (
    <div style={{ padding: "20px 14px" }} dir="rtl">
      <h1 style={{ textAlign: "center", marginTop: 8 }}>تسجيل مقدم خدمة</h1>
      <p style={{ textAlign: "center", color: "#666", marginTop: 6 }}>
        عبّئ البيانات وسيتم استلام طلبك.
      </p>

      <ProviderSignupForm action={createProviderRequest} />
    </div>
  );
}
