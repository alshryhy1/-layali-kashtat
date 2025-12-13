import { getMessages } from "@/lib/i18n";
import { Locale } from "@/lib/locales";
import { redirect } from "next/navigation";
import { requestsOpen } from "@/lib/launchGuard";
import RequestForm from "@/components/RequestForm";

type Props = {
  params: { locale: Locale };
};

export default async function RequestPage({ params }: Props) {
  if (!requestsOpen()) {
    redirect(`/${params.locale}/coming-soon`);
  }

  const m = await getMessages(params.locale);
  return <RequestForm m={m} />;
}
