import Link from "next/link";

export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

export default async function ProviderSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;

  const locale: Locale = asLocale(p?.locale);
  const isAr = locale === "ar";

  const ref = String(sp?.ref || "").trim();

  const t = {
    title: isAr ? "تم استلام طلبك بنجاح" : "Your request has been received",
    desc: isAr
      ? "سيتم مراجعة الطلب والتواصل معك في حال القبول."
      : "We will review your request and contact you if approved.",
    note: isAr
      ? "للمتابعة ستحتاج رقم الطلب ورقم الجوال المسجّل."
      : "To track, you will need the request number and the phone used.",
    refLabel: isAr ? "رقم الطلب" : "Request number",
    back: isAr ? "العودة للرئيسية" : "Back to home",
    track: isAr ? "متابعة حالة الطلب" : "Track request status",
  };

  const btnPrimary: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 170,
  };

  const btnGhost: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #d0d0d0",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 170,
  };

  return (
    <main
      dir={isAr ? "rtl" : "ltr"}
      style={{
        minHeight: "calc(100vh - 70px)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.62), rgba(255,255,255,0.62)), url('/bg-desert.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          background: "rgba(255,255,255,0.92)",
          borderRadius: 20,
          padding: 20,
          boxShadow: "0 12px 30px rgba(0,0,0,0.10)",
          border: "1px solid rgba(0,0,0,0.06)",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>{t.title}</h1>
        <p style={{ marginTop: 10, marginBottom: 10, opacity: 0.8 }}>{t.desc}</p>
        <p style={{ marginTop: 0, marginBottom: 18, opacity: 0.75, fontSize: 13 }}>{t.note}</p>

        <div
          style={{
            margin: "0 auto 16px",
            maxWidth: 520,
            border: "1px dashed #cfcfcf",
            borderRadius: 14,
            padding: 14,
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 6 }}>{t.refLabel}</div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{ref ? ref : "-"}</div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href={`/${locale}`} style={btnPrimary}>
            {t.back}
          </Link>

          <Link
            href={`/${locale}/providers/status${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`}
            style={btnGhost}
          >
            {t.track}
          </Link>
        </div>
      </div>
    </main>
  );
}
