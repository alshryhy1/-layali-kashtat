export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default function LegalPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params?.locale === "en" ? "en" : "ar";
  redirect(`/${locale}/provider-signup`);
}
