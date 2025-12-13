import { getMessages } from "@/lib/i18n";
import { Locale } from "@/lib/locales";

type Props = {
  params: { locale: Locale };
};

export default async function LegalPage({ params }: Props) {
  const m = await getMessages(params.locale);

  return (
    <section style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "16px" }}>{m?.legal?.title ?? "Legal"}</h1>

      <p style={{ lineHeight: "1.8", color: "#333" }}>
        {m?.legal?.disclaimer ?? ""}
      </p>

      <hr style={{ margin: "24px 0" }} />

      <h3 style={{ marginBottom: "8px" }}>
        {m?.legal?.sections?.providerTitle ?? ""}
      </h3>
      <p style={{ lineHeight: "1.8" }}>
        {m?.legal?.sections?.providerBody ?? ""}
      </p>

      <hr style={{ margin: "24px 0" }} />

      <h3 style={{ marginBottom: "8px" }}>
        {m?.legal?.sections?.customerTitle ?? ""}
      </h3>
      <p style={{ lineHeight: "1.8" }}>
        {m?.legal?.sections?.customerBody ?? ""}
      </p>
    </section>
  );
}
