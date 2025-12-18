import Link from "next/link";

type Locale = "ar" | "en";

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const locale: Locale = params?.locale === "en" ? "en" : "ar";
  const isAr = locale === "ar";

  return (
    <html lang={locale} dir={isAr ? "rtl" : "ltr"} suppressHydrationWarning>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.62), rgba(255,255,255,0.62)), url('/bg-desert.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <header
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(6px)",
          }}
        >
          <strong>{isAr ? "ليالي كشتات" : "Layali Kashtat"}</strong>

          <div style={{ display: "flex", gap: 8 }}>
            <Link
              href="/en/providers/signup"
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #ddd",
                textDecoration: "none",
                background: !isAr ? "#111" : "#fff",
                color: !isAr ? "#fff" : "#111",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              EN
            </Link>

            <Link
              href="/ar/providers/signup"
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #ddd",
                textDecoration: "none",
                background: isAr ? "#111" : "#fff",
                color: isAr ? "#fff" : "#111",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              AR
            </Link>
          </div>
        </header>

        <main style={{ minHeight: "80vh" }}>{children}</main>

        <footer
          style={{
            padding: "14px 16px",
            borderTop: "1px solid rgba(0,0,0,0.08)",
            textAlign: "center",
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(6px)",
          }}
        >
          <small style={{ color: "#333" }}>
            {isAr ? "© 2025 ليالي كشتات" : "© 2025 Layali Kashtat"}
          </small>
        </footer>
      </body>
    </html>
  );
}
