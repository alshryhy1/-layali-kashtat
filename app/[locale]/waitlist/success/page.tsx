import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { Locale } from "@/lib/locales";

type Props = {
  params: { locale: Locale };
};

export default async function WaitlistSuccessPage({ params }: Props) {
  const m = await getMessages(params.locale);
  const t = m?.waitlistSuccess ?? {};

  return (
    <section
      style={{
        maxWidth: 520,
        margin: "60px auto",
        textAlign: "center",
        padding: "0 16px",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>{t.title}</h1>
      <p style={{ fontSize: 15, opacity: 0.8, marginBottom: 24 }}>{t.description}</p>

      <Link
        href={`/${params.locale}`}
        style={{
          display: "inline-block",
          padding: "10px 18px",
          border: "1px solid #000",
          textDecoration: "none",
          color: "#000",
        }}
      >
        {t.backHome}
      </Link>

      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 20 }}>
        {t.note}
      </p>
    </section>
  );
}
