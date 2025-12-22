import Link from "next/link";

type Locale = "ar" | "en";

export default async function ProviderSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ ref?: string }> | { ref?: string };
}) {
  const p = await params;
  const locale: Locale = p?.locale === "ar" ? "ar" : "en";
  const isAr = locale === "ar";

  // ✅ يدعم الحالتين: لو searchParams جاية كـ Promise أو كـ Object
  const sp =
    typeof (searchParams as any)?.then === "function"
      ? await (searchParams as Promise<{ ref?: string }>)
      : (searchParams as { ref?: string } | undefined);

  const ref = (sp?.ref || "").trim();

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px 16px",
        background: "transparent",
        display: "flex",
        justifyContent: "center",

        // ✅ رفع الكارد لفوق بشكل مرن لكل الشاشات
        alignItems: "flex-start",
        paddingTop: "clamp(80px, 12vh, 140px)",
        paddingBottom: 40,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: "22px 20px",
          maxWidth: 520,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 10px 28px rgba(0,0,0,0.12)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>
          {isAr ? "تم استلام طلبك بنجاح" : "Your request was submitted successfully"}
        </h1>

        <p style={{ marginTop: 10, color: "#555", fontSize: 14, lineHeight: 1.7 }}>
          {isAr
            ? "سيتم مراجعة طلبك من قبل الإدارة."
            : "Your request will be reviewed by the admin team."}
        </p>

        {/* الرقم المرجعي */}
        {ref ? (
          <div
            style={{
              marginTop: 16,
              padding: "12px 12px",
              borderRadius: 12,
              background: "#f1f3f5",
              fontSize: 14,
            }}
          >
            <div style={{ marginBottom: 6, fontWeight: 800 }}>
              {isAr ? "الرقم المرجعي:" : "Reference Number:"}
            </div>

            <div
              style={{
                fontWeight: 900,
                letterSpacing: 1,
                fontSize: 16,
                userSelect: "text",
                direction: "ltr",
              }}
            >
              {ref}
            </div>

            <div style={{ marginTop: 8, color: "#666", fontSize: 12 }}>
              {isAr ? "انسخ الرقم واحتفظ به للمتابعة." : "Copy and keep this number to track your request."}
            </div>
          </div>
        ) : (
          <p style={{ marginTop: 14, color: "red", fontSize: 13 }}>
            {isAr ? "تنبيه: لم يتم تمرير الرقم المرجعي." : "Warning: reference number is missing."}
          </p>
        )}

        {/* الأزرار */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 18,
            flexWrap: "wrap",
          }}
        >
          <Link href={`/${locale}`} style={btnSecondary}>
            {isAr ? "العودة للرئيسية" : "Home"}
          </Link>

          {ref && (
            <Link href={`/${locale}/requests?ref=${encodeURIComponent(ref)}`} style={btnPrimary}>
              {isAr ? "متابعة حالة الطلب" : "Track request"}
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  background: "#111",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 14,
};

const btnSecondary: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  background: "#fff",
  color: "#111",
  border: "1px solid #111",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 14,
};
