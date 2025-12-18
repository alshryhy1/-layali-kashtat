import Link from "next/link";

export default function ProviderDocsArPage() {
  return (
    <div style={{ padding: "18px 16px", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ marginBottom: 12 }}>
        <Link
          href="/ar/providers/signup"
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
          رجوع للتسجيل
        </Link>
      </div>

      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>توثيق مقدّمي الخدمة</h1>

      <p style={{ marginTop: 10, color: "#222", lineHeight: 1.9 }}>
        هذه الصفحة مخصّصة لشرح آلية العمل لمقدّمي الخدمة على منصة ليالي كشتات.
      </p>

      <h2 style={{ marginTop: 18, marginBottom: 6, fontSize: 18, fontWeight: 900 }}>
        من هو مقدم الخدمة؟
      </h2>
      <p style={{ marginTop: 0, color: "#222", lineHeight: 1.9 }}>
        مقدم الخدمة هو الجهة أو الفرد المسؤول عن تنفيذ الطلبات وتقديم الخدمات للعملاء عبر المنصة وفق
        نطاق جغرافي وخدمة محددة.
      </p>

      <h2 style={{ marginTop: 18, marginBottom: 6, fontSize: 18, fontWeight: 900 }}>
        ما المتاح حاليًا؟
      </h2>
      <ul style={{ marginTop: 0, lineHeight: 1.9 }}>
        <li>عرض المعلومات العامة فقط</li>
        <li>لا يوجد تسجيل أو تعديل بيانات</li>
        <li>لا توجد طلبات مباشرة</li>
      </ul>

      <h2 style={{ marginTop: 18, marginBottom: 6, fontSize: 18, fontWeight: 900 }}>
        ما الذي سيتاح لاحقًا؟
      </h2>
      <ul style={{ marginTop: 0, lineHeight: 1.9 }}>
        <li>إنشاء حساب لمقدم الخدمة</li>
        <li>لوحة تحكم لإدارة الطلبات</li>
        <li>تحديد منطقة العمل والطاقة اليومية</li>
      </ul>

      <p style={{ marginTop: 18, fontWeight: 900, color: "#111" }}>
        ملاحظة: تفعيل التسجيل سيتم بشكل تدريجي بعد اكتمال مرحلة الإطلاق ومراجعة الجوانب النظامية والتشغيلية.
      </p>
    </div>
  );
}
