import { getMessages } from "@/lib/i18n";
import { Locale } from "@/lib/locales";
import WaitlistForm from "@/components/WaitlistForm";

type Props = {
  params: { locale: Locale };
};

export default async function WaitlistPage({ params }: Props) {
  const m = await getMessages(params.locale);

  return (
    <WaitlistForm
      t={{
        title: m.waitlist.title,
        description: m.waitlist.description,
        name: m.waitlist.name,
        phone: m.waitlist.phone,
        submit: m.waitlist.submit,
        legal: m.waitlist.legal,
      }}
    />
  );
}
