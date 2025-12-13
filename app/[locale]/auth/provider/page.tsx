import { getMessages } from "@/lib/i18n";
import { Locale } from "@/lib/locales";
import ProviderRegisterForm from "@/components/ProviderRegisterForm";

type Props = {
  params: { locale: Locale };
};

export default async function ProviderRegisterPage({ params }: Props) {
  const m = await getMessages(params.locale);
  return <ProviderRegisterForm m={m} />;
}
