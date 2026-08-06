import SectionsClient from "@/components/SectionsClient";

type Locale = "ar" | "en";

export default async function SectionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = raw === "en" ? "en" : "ar";
  return <SectionsClient locale={locale} />;
}
