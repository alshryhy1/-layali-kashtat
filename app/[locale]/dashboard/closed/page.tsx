import Link from "next/link";

export default function DashboardClosedPage() {
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>لوحة التحكم غير متاحة حالياً</h1>

      <p style={{ marginTop: 12, lineHeight: 1.8 }}>
        تم إيقاف تسجيل مقدّمي الخدمات مؤقتًا ضمن مرحلة الإطلاق الحالية.
        يرجى العودة لاحقًا.
      </p>

      <div style={{ marginTop: 18 }}>
        <Link href="/" style={{ textDecoration: "underline" }}>
          الرجوع للرئيسية
        </Link>
      </div>
    </main>
  );
}
