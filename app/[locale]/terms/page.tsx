import React from "react";

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => <p style={{ marginBottom: 16 }}>{children}</p>;
const UL = ({ children }: { children: React.ReactNode }) => <ul style={{ marginBottom: 16 }}>{children}</ul>;

export const metadata = {
  title: "الشروط والأحكام | Terms of Service",
};

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale !== "en";

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px", direction: isAr ? "rtl" : "ltr" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 24 }}>
        {isAr ? "الشروط والأحكام" : "Terms of Service"}
      </h1>

      <P>
        {isAr
          ? "باستخدام منصة ليالي كشتات، فإنك توافق على هذه الشروط والأحكام. يرجى قراءتها بعناية."
          : "By using Layali Kashtat, you agree to these Terms of Service. Please read them carefully."}
      </P>

      <H2>{isAr ? "1. طبيعة الخدمة" : "1. Nature of Service"}</H2>
      <UL>
        <li>{isAr ? "المنصة وسيط رقمي لربط العملاء بمقدّمي الخدمات." : "The platform is a digital intermediary connecting customers with service providers."}</li>
        <li>{isAr ? "الخدمات الفعلية ينفّذها مقدّم الخدمة، وهو المسؤول عن جودتها وسلامتها." : "Services are performed by providers, who are responsible for quality and safety."}</li>
      </UL>

      <H2>{isAr ? "2. إنشاء الحساب والتحقق" : "2. Account Creation & Verification"}</H2>
      <UL>
        <li>{isAr ? "يلزم إدخال معلومات صحيحة، ويُشترط تفعيل البريد الإلكتروني قبل استخدام الحساب." : "Accurate information is required; email verification is mandatory before account use."}</li>
        <li>{isAr ? "قد نستخدم رموز تحقق للجوال لميزات أمنية إضافية." : "We may use mobile OTP for additional security features."}</li>
      </UL>

      <H2>{isAr ? "3. المدفوعات والعمولة" : "3. Payments & Commission"}</H2>
      <UL>
        <li>{isAr ? "تُعالَج المدفوعات عبر مزوّد دفع خارجي موثوق؛ لا نحتفظ ببيانات البطاقات." : "Payments are processed by a trusted external provider; we do not store card data."}</li>
        <li>{isAr ? "العمولة تُحمَّل على مقدّم الخدمة بحسب الاتفاق." : "Commission is charged to the service provider as agreed."}</li>
      </UL>

      <H2>{isAr ? "4. الإلغاء والاسترجاع" : "4. Cancellation & Refunds"}</H2>
      <UL>
        <li>{isAr ? "سياسة الإلغاء والاسترجاع تتبع سياسة مقدّم الخدمة، مع دور المنصة كوسيط." : "Cancellation and refunds follow the provider’s policy; the platform acts as an intermediary."}</li>
        <li>{isAr ? "في حال تعذّر تقديم الخدمة من مقدّمها، يُعاد المبلغ وفق سياسة المزود/القوانين السارية." : "If the provider fails to deliver, amounts are refunded per provider policy/applicable law."}</li>
      </UL>

      <H2>{isAr ? "5. المحتوى والسلوك" : "5. Content & Conduct"}</H2>
      <UL>
        <li>{isAr ? "يُمنع نشر محتوى مخالف أو مضلّل أو منتهك للحقوق." : "Posting unlawful, misleading, or infringing content is prohibited."}</li>
        <li>{isAr ? "يجوز إيقاف الحساب عند مخالفة الشروط." : "Accounts may be suspended for violations."}</li>
      </UL>

      <H2>{isAr ? "6. الخصوصية والامتثال لأنظمة المتاجر" : "6. Privacy & Store Compliance"}</H2>
      <UL>
        <li>
          {isAr
            ? "نلتزم بسياسة الخصوصية المنشورة، ونراعي متطلبات منصات المتاجر (مثل Apple App Store) لشفافية جمع البيانات وعدم التتبع غير المصرّح."
            : "We comply with the published Privacy Policy and app store requirements (e.g., Apple App Store) for transparent data collection and no unauthorized tracking."}
        </li>
        <li>
          {isAr
            ? "لا تُستخدم البيانات لأغراض تتبّع عبر تطبيقات أو مواقع طرف ثالث دون موافقة صريحة."
            : "Data is not used for cross-app or cross-site tracking without explicit consent."}
        </li>
      </UL>

      <H2>{isAr ? "7. حدود المسؤولية" : "7. Liability"}</H2>
      <UL>
        <li>{isAr ? "المنصة غير مسؤولة عن أداء مقدّم الخدمة؛ تتحمل مسؤولية تشغيل الوساطة الرقمية فقط." : "The platform is not liable for provider performance; it operates digital intermediation only."}</li>
        <li>{isAr ? "لا نضمن الأحوال الجوية أو الظروف الطارئة الخارجة عن السيطرة." : "We do not guarantee weather or force majeure conditions."}</li>
      </UL>

      <H2>{isAr ? "8. القانون والفض المنازعات" : "8. Law & Dispute Resolution"}</H2>
      <UL>
        <li>{isAr ? "تُفسّر الشروط وفق الأنظمة السارية في الدولة محل التشغيل." : "These terms are governed by the applicable laws of the operating jurisdiction."}</li>
        <li>{isAr ? "يُفضّل حل النزاعات وديًا، وإن تعذّر تُحال للجهات المختصة." : "Disputes should be resolved amicably; otherwise, referred to competent authorities."}</li>
      </UL>

      <H2>{isAr ? "9. التغييرات" : "9. Changes"}</H2>
      <P>
        {isAr
          ? "يجوز تعديل هذه الشروط؛ يسري آخر إصدار منشور على هذه الصفحة."
          : "We may update these terms; the latest version published on this page applies."}
      </P>

      <H2>{isAr ? "10. التواصل" : "10. Contact"}</H2>
      <P>
        {isAr
          ? "للاستفسار حول الشروط أو الحقوق، يرجى التواصل عبر صفحة الدعم والتواصل."
          : "For inquiries about terms or rights, please contact us via the support/contact page."}
      </P>
    </main>
  );
}
