import Link from "next/link";

export default function DashboardClosedPage() {
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, margin: 0 }}>
        لوحة التحكم غير متاحة حالياً
      </h1>

      <p style={{ marginTop: 12, lineHeight: 1.8 }}>
        تم إيقاف الوصول إلى لوحة التحكم ضمن مرحلة الإطلاق الحالية.
      </p>

      <div style={{ marginTop: 18 }}>
        <Link href="/" style={{ textDecoration: "underline" }}>
          الرجوع للرئيسية
        </Link>
      </div>
    </main>
  );
}
