import ProviderSignupForm from "@/components/ProviderSignupForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function ProviderSignupPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params?.locale === "en" ? "en" : "ar";
  return <ProviderSignupForm locale={locale} />;
}
