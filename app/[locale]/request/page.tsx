import RequestForm from "@/components/RequestForm";
import { getMessages } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

export default async function RequestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = asLocale(rawLocale);

  const m = await getMessages(locale);

  // ✅ RequestForm حسب تعريفه الحالي يقبل m فقط
  return <RequestForm m={m} />;
}
