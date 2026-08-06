import React from "react";

export const metadata = {
  title: "سياسة الخصوصية | Privacy Policy",
};

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale !== "en";

  return (
    <>
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px", direction: isAr ? "rtl" : "ltr" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 10 }}>
          {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
        </h1>
        <p style={{ marginBottom: 22, color: "#6b7280", fontWeight: 700 }}>
          {isAr ? "آخر تحديث: 2026-05-02" : "Last updated: 2026-05-02"}
        </p>

        <div style={{ lineHeight: 1.8, color: "#111827" }}>
        <p style={{ marginBottom: 16 }}>
          {isAr 
            ? "نحن في منصة ليالي كشتات نحرص على حماية خصوصية بيانات المستخدمين. توضح هذه السياسة كيفية جمعنا واستخدامنا للبيانات."
            : "At Layali Kashtat, we are committed to protecting user privacy. This policy explains how we collect and use data."}
        </p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>
          {isAr ? "1. البيانات التي نجمعها" : "1. Data We Collect"}
        </h2>
        <ul style={{ listStyle: "disc", paddingRight: isAr ? 20 : 0, paddingLeft: isAr ? 0 : 20, marginBottom: 16 }}>
          <li>{isAr ? "معلومات التواصل: الاسم، رقم الجوال، والبريد الإلكتروني عند تقديم طلب." : "Contact info: name, phone number, and email when submitting a request."}</li>
          <li>{isAr ? "بيانات الموقع: أثناء استخدام الخدمة لعرض الخدمات القريبة، وتحديد الموقع على الخرائط، وتتبع الطلبات وعرض موقع المزوّد/العميل على الخريطة عند توفر ذلك." : "Location data: while using the service for nearby services, map selection, and order tracking (provider/customer location) when available."}</li>
          <li>{isAr ? "محتوى المستخدم: الصور التي ترفعها (مثل صور الحساب أو صور الإعلانات) والمحادثات داخل التطبيق عند استخدامها." : "User content: uploaded images (profile/listings) and in-app chat content when used."}</li>
          <li>{isAr ? "بيانات تقنية: مثل عنوان IP ومعلومات الجهاز/المتصفح (للويب) وأحداث الأخطاء لأغراض الأمان وتحسين الأداء ومنع إساءة الاستخدام." : "Technical data: such as IP address and device/browser info (web), plus error events for security, performance, and abuse prevention."}</li>
          <li>{isAr ? "بيانات الدفع: المرجع وحالة الدفع ورقم الفاتورة عند السداد إلكترونياً (ولا نقوم بتخزين بيانات البطاقة)." : "Payment data: reference, payment status, and invoice number for electronic payments (we do not store card data)."}</li>
        </ul>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>
          {isAr ? "2. كيفية استخدام البيانات" : "2. How We Use Data"}
        </h2>
        <p style={{ marginBottom: 16 }}>
          {isAr 
            ? "تستخدم البيانات حصراً لتنسيق الخدمات بين العميل ومقدم الخدمة. لا نقوم ببيع البيانات لأي أطراف ثالثة."
            : "Data is used exclusively to coordinate services between the customer and the service provider. We do not sell data to third parties."}
        </p>
        <ul style={{ listStyle: "disc", paddingRight: isAr ? 20 : 0, paddingLeft: isAr ? 0 : 20, marginBottom: 16 }}>
          <li>{isAr ? "تنفيذ الطلبات والتواصل." : "Fulfilling requests and communication."}</li>
          <li>{isAr ? "معالجة المدفوعات عبر مزود خارجي موثوق." : "Processing payments via a trusted external provider."}</li>
          <li>{isAr ? "تحسين الأمان ومنع الاحتيال." : "Improving security and preventing fraud."}</li>
          <li>{isAr ? "الدعم الفني والامتثال للأنظمة." : "Support and regulatory compliance."}</li>
        </ul>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>
          {isAr ? "3. مشاركة البيانات مع مزودي الخدمة" : "3. Sharing with Service Providers"}
        </h2>
        <p style={{ marginBottom: 16 }}>
          {isAr 
            ? "لا تُباع بياناتك. قد نشارك بياناتاً محدودة مع مزودي الخدمة الضروريين لتشغيل المنصة (الاستضافة والبريد الإلكتروني والدفع)."
            : "We do not sell your data. We may share limited data with essential providers (hosting, email, payments) to operate the platform."}
        </p>
        <ul style={{ listStyle: "disc", paddingRight: isAr ? 20 : 0, paddingLeft: isAr ? 0 : 20, marginBottom: 16 }}>
          <li>{isAr ? "الدفع الإلكتروني (Paylink): تتم معالجة الدفع لدى مزود خارجي موثوق، ولا نخزن بيانات البطاقة." : "Payments (Paylink): payment processing is handled by a trusted external provider; we do not store card data."}</li>
          <li>{isAr ? "الخرائط (Mapbox): لعرض الخريطة وحساب المسارات عند الحاجة." : "Maps (Mapbox): to display maps and calculate routes when needed."}</li>
          <li>{isAr ? "الاستضافة/البيانات (Supabase): لتشغيل المصادقة والبيانات والتخزين." : "Infrastructure (Supabase): to power authentication, data, and storage."}</li>
          <li>{isAr ? "البريد الإلكتروني/الإشعارات: قد نستخدم مزود بريد/إشعارات لإرسال التنبيهات." : "Email/notifications: we may use providers to send notifications."}</li>
        </ul>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>
          {isAr ? "4. الأساس النظامي" : "4. Legal Basis"}
        </h2>
        <p style={{ marginBottom: 16 }}>
          {isAr 
            ? "نتعامل مع البيانات بناءً على: تنفيذ العقد عند تقديم الطلب، والموافقة للميزات الاختيارية مثل الموقع، والمصلحة المشروعة لتحسين الأمان."
            : "We process data based on: performance of a contract when handling requests, consent for optional features like location, and legitimate interests to improve security."}
        </p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>
          {isAr ? "5. الكوكيز وذاكرة المتصفح" : "5. Cookies & Storage"}
        </h2>
        <p style={{ marginBottom: 16 }}>
          {isAr 
            ? "قد نستخدم ملفات تعريف الارتباط أو التخزين المحلي لإدارة الجلسات وتحسين الأداء. يمكنك تعطيل ذلك من إعدادات المتصفح، وقد يؤثر على بعض الوظائف."
            : "We may use cookies or local storage to manage sessions and improve performance. You can disable them in your browser settings, which may affect functionality."}
        </p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>
          {isAr ? "6. مدة الاحتفاظ" : "6. Retention"}
        </h2>
        <p style={{ marginBottom: 16 }}>
          {isAr 
            ? "نحتفظ بالبيانات طالما دعت الحاجة لتقديم الخدمة والامتثال للأنظمة. يمكنك طلب حذف بياناتك عبر قنوات الدعم."
            : "We retain data as needed to provide the service and comply with regulations. You may request deletion via support channels."}
        </p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>
          {isAr ? "7. حقوقك" : "7. Your Rights"}
        </h2>
        <ul style={{ listStyle: "disc", paddingRight: isAr ? 20 : 0, paddingLeft: isAr ? 0 : 20, marginBottom: 16 }}>
          <li>{isAr ? "الاطلاع والتصحيح والحذف." : "Access, correction, and deletion."}</li>
          <li>{isAr ? "سحب الموافقة للميزات الاختيارية مثل الموقع." : "Withdraw consent for optional features like location."}</li>
        </ul>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>
          {isAr ? "8. حذف الحساب" : "8. Account Deletion"}
        </h2>
        <p style={{ marginBottom: 16 }}>
          {isAr 
            ? "يمكنك حذف حسابك من داخل التطبيق عبر: الحساب > حذف الحساب. كما يمكنك مراجعة صفحة حذف الحساب على الموقع للحصول على تعليمات إضافية."
            : "You can delete your account from within the app via: Account > Delete account. You can also refer to the website delete-account page for instructions."}
        </p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>
          {isAr ? "9. الأطفال" : "9. Children"}
        </h2>
        <p style={{ marginBottom: 16 }}>
          {isAr 
            ? "المنصة موجّهة للبالغين. إذا كنت ترى أن طفلاً قد زوّدنا ببياناته، يرجى التواصل لحذفها."
            : "The platform is intended for adults. If a child has provided data, please contact us to delete it."}
        </p>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>
          {isAr ? "10. التحديثات" : "10. Updates"}
        </h2>
        <p style={{ marginBottom: 16 }}>
          {isAr 
            ? "قد نقوم بتحديث هذه السياسة من حين لآخر. يسري آخر إصدار منشور على هذه الصفحة."
            : "We may update this policy from time to time. The latest version published on this page applies."}
        </p>

         <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>
          {isAr ? "11. التواصل معنا" : "11. Contact Us"}
        </h2>
        <p style={{ marginBottom: 16 }}>
          {isAr ? (
            <>
              للاستفسارات المتعلقة بالخصوصية أو الحقوق، تواصل معنا عبر البريد:{" "}
              <a href="mailto:layalikashtat1@gmail.com">layalikashtat1@gmail.com</a>
            </>
          ) : (
            <>
              For privacy or rights inquiries, contact us at:{" "}
              <a href="mailto:layalikashtat1@gmail.com">layalikashtat1@gmail.com</a>
            </>
          )}
        </p>
      </div>
      </main>
    </>
  );
}
