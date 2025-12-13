import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { Locale } from "@/lib/locales";

type Props = {
  params: { locale: Locale };
};

export default async function HomePage({ params }: Props) {
  const m = await getMessages(params.locale);

  return (
    <section
      style={{
        padding: "32px 24px",
        maxWidth: "720px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <h1 style={{ marginBottom: "12px", fontSize: 32 }}>
        {m?.appName ?? "Layali Kashtat"}
      </h1>

      <p
        style={{
          marginBottom: "28px",
          color: "#444",
          lineHeight: "1.8",
          fontSize: 15,
        }}
      >
        {m?.home?.subtitle ?? ""}
      </p>

      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Link
          href={`/${params.locale}/auth/provider`}
          style={{
            padding: "10px 18px",
            border: "1px solid #000",
            textDecoration: "none",
            color: "#000",
            fontWeight: 500,
          }}
        >
          {m?.home?.ctaProvider ?? "Register as Provider"}
        </Link>

        <Link
          href={`/${params.locale}/waitlist`}
          style={{
            padding: "10px 18px",
            border: "1px solid #ccc",
            textDecoration: "none",
            color: "#333",
          }}
        >
          {m?.home?.ctaWaitlist ?? "Waitlist"}
        </Link>

        <Link
          href={`/${params.locale}/legal`}
          style={{
            padding: "10px 18px",
            border: "1px solid #ccc",
            textDecoration: "none",
            color: "#333",
          }}
        >
          {m?.home?.ctaLegal ?? "Legal"}
        </Link>
      </div>
    </section>
  );
}
