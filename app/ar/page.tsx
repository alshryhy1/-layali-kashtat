import Link from "next/link";

export default function ArRootLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.68), rgba(255,255,255,0.68)), url('/bg-desert.jpg')",
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
          <strong>ليالي كشتات</strong>

          <div style={{ display: "flex", gap: 8 }}>
            <Link
              href="/en/providers/signup"
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #ddd",
                textDecoration: "none",
                background: "#fff",
                color: "#111",
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
                background: "#111",
                color: "#fff",
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
          <small style={{ color: "#333" }}>© 2025 ليالي كشتات</small>
        </footer>
      </body>
    </html>
  );
}
