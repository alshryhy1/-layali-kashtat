import Link from "next/link";

export default function RootPage() {
  return (
    <main className="page-container" style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 12 }}>Layali Kashtat</h1>
        <p style={{ color: "#666", marginBottom: 18 }}>اختر اللغة / Choose your language</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/ar" style={{ padding: "10px 16px", borderRadius: 12, background: "#111", color: "#fff", fontWeight: 900, textDecoration: "none" }}>العربية</Link>
          <Link href="/en" style={{ padding: "10px 16px", borderRadius: 12, background: "#eee", color: "#111", fontWeight: 900, textDecoration: "none" }}>English</Link>
        </div>
      </div>
    </main>
  );
}
