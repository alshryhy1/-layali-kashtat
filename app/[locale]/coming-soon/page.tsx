import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>قريبًا</h1>

      <p style={{ marginTop: 12, lineHeight: 1.8 }}>
        هذه الخدمة غير متاحة حالياً ضمن مرحلة الإطلاق الأولى.
      </p>

      <div style={{ marginTop: 18 }}>
        <Link href="/" style={{ textDecoration: "underline" }}>
          الرجوع للرئيسية
        </Link>
      </div>
    </main>
  );
}
