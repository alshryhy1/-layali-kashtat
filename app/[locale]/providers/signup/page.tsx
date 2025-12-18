// app/[locale]/providers/signup/page.tsx
import React from "react";
import ProviderSignupForm from "@/components/ProviderSignupForm";

export default async function ProviderSignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = locale === "ar" ? "ar" : "en";

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>
        {lang === "ar" ? "تسجيل مقدّم خدمة" : "Provider Signup"}
      </h1>

      <p style={{ marginTop: 0, opacity: 0.8 }}>
        {lang === "ar"
          ? "أدخل بياناتك لإرسال طلب الانضمام."
          : "Enter your details to submit a provider request."}
      </p>

      <ProviderSignupForm locale={lang as any} />
    </div>
  );
}
