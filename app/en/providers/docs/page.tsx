import Link from "next/link";

export default function ProviderDocsEnPage() {
  return (
    <div style={{ padding: "18px 16px", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ marginBottom: 12 }}>
        <Link
          href="/en/providers/signup"
          style={{
            display: "inline-block",
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #111",
            background: "#fff",
            color: "#111",
            fontWeight: 900,
            textDecoration: "none",
          }}
        >
          Back to signup
        </Link>
      </div>

      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>Provider Verification</h1>

      <p style={{ marginTop: 10, color: "#222", lineHeight: 1.9 }}>
        This page explains how providers will work with Layali Kashtat.
      </p>

      <h2 style={{ marginTop: 18, marginBottom: 6, fontSize: 18, fontWeight: 900 }}>
        Who is a provider?
      </h2>
      <p style={{ marginTop: 0, color: "#222", lineHeight: 1.9 }}>
        A provider is the person or entity responsible for delivering services and fulfilling requests through the platform.
      </p>

      <h2 style={{ marginTop: 18, marginBottom: 6, fontSize: 18, fontWeight: 900 }}>
        What is available now?
      </h2>
      <ul style={{ marginTop: 0, lineHeight: 1.9 }}>
        <li>Public information only</li>
        <li>No profile registration/editing</li>
        <li>No direct orders</li>
      </ul>

      <h2 style={{ marginTop: 18, marginBottom: 6, fontSize: 18, fontWeight: 900 }}>
        What will be available later?
      </h2>
      <ul style={{ marginTop: 0, lineHeight: 1.9 }}>
        <li>Create a provider account</li>
        <li>Dashboard to manage requests</li>
        <li>Set service area and daily capacity</li>
      </ul>

      <p style={{ marginTop: 18, fontWeight: 900, color: "#111" }}>
        Note: Provider onboarding will be enabled gradually after launch and operational/legal review.
      </p>
    </div>
  );
}
