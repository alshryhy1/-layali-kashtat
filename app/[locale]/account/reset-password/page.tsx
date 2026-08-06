import { Suspense } from "react";
import ResetPasswordClient from "@/components/ResetPasswordClient";

type Locale = "ar" | "en";

function asLocale(v: unknown): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale = asLocale(p?.locale);
  return (
    <Suspense fallback={<div dir="rtl" style={{ padding: 24, textAlign: "center" }}>...</div>}>
      <ResetPasswordClient locale={locale} />
    </Suspense>
  );
}
