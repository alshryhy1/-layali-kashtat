import CommunityClient from "@/components/CommunityClient";

type Locale = "ar" | "en";

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = raw === "en" ? "en" : "ar";
  return <CommunityClient locale={locale} />;
}
