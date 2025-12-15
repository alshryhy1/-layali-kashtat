import ProviderSignupForm from "@/components/ProviderSignupForm";
import { createProviderRequest } from "@/app/actions/providerRequests";

export default function Page() {
  return (
    <div style={{ padding: "20px 14px" }} dir="ltr">
      <h1 style={{ textAlign: "center", marginTop: 8 }}>Provider Signup</h1>
      <p style={{ textAlign: "center", color: "#666", marginTop: 6 }}>
        Fill the form and we’ll receive your request.
      </p>

      <ProviderSignupForm action={createProviderRequest} />
    </div>
  );
}
