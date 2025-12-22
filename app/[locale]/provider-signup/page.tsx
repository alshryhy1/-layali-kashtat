import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

export default async function LegalTextsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = asLocale(rawLocale);
  const isAr = locale === "ar";

  const title = isAr ? "النصوص القانونية" : "Legal Texts";
  const back = isAr ? "العودة للرئيسية" : "Back to Home";

  const heading = isAr ? "إقرار وتعهد مقدّم الخدمة" : "Service Provider Declaration";

  const body = isAr
    ? `أقرّ أنا مقدّم الخدمة بأن جميع البيانات المدخلة صحيحة، وأتحمّل كامل المسؤولية عنها.

أوافق على أن منصة ليالي كشتات هي منصة تقنية وسيطة لتنظيم الطلبات والتواصل فقط، ولا تتحمّل أي مسؤولية قانونية أو مالية عن الخدمات المقدّمة أو أي اتفاق يتم بين مقدّم الخدمة والعميل.

أتعهد بالالتزام بالأنظمة واللوائح المعمول بها داخل المملكة العربية السعودية، وبأن تكون جميع الخدمات المقدّمة نظامية ومصرّح بها.

أفهم أن تقديم معلومات غير صحيحة قد يؤدي إلى رفض الطلب أو إيقافه دون إشعار مسبق.`
    : `I confirm that all information provided is accurate and I take full responsibility for it.

I acknowledge that Layali Kashtat is a technical intermediary platform for organizing requests and communication only, and bears no legal or financial responsibility for the services provided or any agreement between the service provider and the client.

I commit to complying with all applicable laws and regulations in the Kingdom of Saudi Arabia, and confirm that all services offered are lawful and properly authorized.

I understand that providing incorrect information may result in rejection or suspension of the request without prior notice.`;

  return (
    <main
      dir={isAr ? "rtl" : "ltr"}
      style={{
        minHeight: "calc(100vh - 70px)",
        padding: 16,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.72), rgba(255,255,255,0.72)), url('/bg-desert.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div style={{ width: "100%", maxWidth: 980, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: isAr ? "flex-start" : "flex-end",
            marginBottom: 12,
          }}
        >
          <Link
            href={`/${locale}`}
            style={{
              display: "inline-block",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#fff",
              color: "#111",
              fontWeight: 900,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {back}
          </Link>
        </div>

        <section
          style={{
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(0,0,0,0.10)",
            borderRadius: 18,
            padding: 18,
            boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, textAlign: "center" }}>
            {title}
          </h1>

          <div
            style={{
              marginTop: 14,
              padding: 16,
              borderRadius: 14,
              background: "rgba(0,0,0,0.03)",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <h2 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 900 }}>
              {heading}
            </h2>

            <div
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.9,
                fontSize: 14,
                opacity: 0.95,
              }}
            >
              {body}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
