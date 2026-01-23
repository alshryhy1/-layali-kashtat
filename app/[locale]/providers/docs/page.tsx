import Link from "next/link";
import ProviderRequestNotifier from "@/components/ProviderRequestNotifier";

type PageProps = {
  params: { locale: "ar" | "en" };
};

export default async function ProviderDocsPage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  const isAr = locale === "ar";

  return (
    <main style={{ padding: 24, maxWidth: 860, margin: "0 auto" }}>
      <h1 style={{ margin: 0, fontSize: 26 }}>
        {isAr ? "توثيق مقدّمي الخدمة" : "Service Providers Documentation"}
      </h1>

      <p style={{ marginTop: 12, lineHeight: 1.9 }}>
        {isAr
          ? "هذه الصفحة تشرح آلية عمل مقدّمي الخدمة على منصة ليالي كشتات. التسجيل غير متاح حاليًا ضمن مرحلة الإطلاق الأولى، والمحتوى هنا للقراءة فقط."
          : "This page explains how service providers will operate on Layali Kashtat. Provider registration is currently closed during the initial launch phase. This content is read-only."}
      </p>

      <div style={{ marginTop: 14 }}>
        <Link href={`/${params.locale}`} style={{ textDecoration: "underline" }}>
          {isAr ? "الرجوع للرئيسية" : "Back to home"}
        </Link>
      </div>

      <hr style={{ margin: "20px 0" }} />

      <h2>{isAr ? "من هو مقدّم الخدمة؟" : "Who is a Service Provider?"}</h2>
      <p style={{ lineHeight: 1.9 }}>
        {isAr
          ? "مقدّم الخدمة هو فرد أو جهة مسؤولة عن تنفيذ الطلبات للعملاء ضمن نطاق جغرافي وخدمة محددة."
          : "A service provider is an individual or entity responsible for fulfilling customer requests within a defined service type and geographic area."}
      </p>

      <h2>{isAr ? "المتاح حاليًا" : "Currently Available"}</h2>
      <ul>
        <li>{isAr ? "محتوى توثيقي فقط" : "Documentation only"}</li>
        <li>{isAr ? "لا تسجيل ولا تعديل بيانات" : "No signup or profile editing"}</li>
        <li>{isAr ? "لوحة التحكم مغلقة" : "Dashboard is closed"}</li>
      </ul>

      <h2>{isAr ? "سيتم توفيره لاحقًا" : "Coming Later"}</h2>
      <ul>
        <li>{isAr ? "إنشاء حساب مقدّم خدمة" : "Provider account creation"}</li>
        <li>{isAr ? "لوحة تحكم لإدارة الطلبات" : "Dashboard to manage requests"}</li>
        <li>{isAr ? "تحديد المنطقة والطاقة اليومية" : "Service area and daily capacity"}</li>
      </ul>

      <h2>{isAr ? "ملاحظات" : "Notes"}</h2>
      <p>
        {isAr
          ? "سيتم فتح التسجيل تدريجيًا بعد اكتمال مرحلة الإطلاق الأولى."
          : "Provider onboarding will be enabled gradually after the initial launch phase."}
      </p>

      <ProviderRequestNotifier locale={params.locale} />
    </main>
  );
}
