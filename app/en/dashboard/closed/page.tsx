import Link from "next/link";

export default function DashboardClosedEN() {
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>
        Dashboard is currently unavailable
      </h1>

      <p style={{ marginTop: 12, lineHeight: 1.8 }}>
        Service provider registration has been temporarily disabled during the
        initial launch phase. Please check back later.
      </p>

      <div style={{ marginTop: 18 }}>
        <Link href="/en" style={{ textDecoration: "underline" }}>
          Back to home
        </Link>
      </div>
    </main>
  );
}
