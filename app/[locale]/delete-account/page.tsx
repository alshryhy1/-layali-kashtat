import React from "react";
import LegalFooter from "@/components/LegalFooter";

export const metadata = {
  title: "حذف الحساب | Delete Account",
};

export default async function DeleteAccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale !== "en";

  return (
    <>
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px", direction: isAr ? "rtl" : "ltr" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 10 }}>{isAr ? "حذف الحساب" : "Delete Account"}</h1>
        <p style={{ marginBottom: 22, color: "#6b7280", fontWeight: 700 }}>{isAr ? "آخر تحديث: 2026-05-02" : "Last updated: 2026-05-02"}</p>

        <div style={{ lineHeight: 1.8, color: "#111827" }}>
          <p style={{ marginBottom: 16 }}>
            {isAr
              ? "يمكنك حذف حسابك من منصة ليالي كشتات في أي وقت. هذه الصفحة تشرح الطريقة وما الذي يحدث بعد الحذف."
              : "You can delete your Layali Kashtat account at any time. This page explains how and what happens after deletion."}
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 24, marginBottom: 12 }}>{isAr ? "1) الحذف من داخل التطبيق" : "1) Delete from within the app"}</h2>
          <p style={{ marginBottom: 16 }}>
            {isAr ? "افتح التطبيق ثم اذهب إلى: الحساب > حذف الحساب، ثم أكد عملية الحذف." : "Open the app and go to: Account > Delete account, then confirm deletion."}
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 24, marginBottom: 12 }}>{isAr ? "2) ماذا يحدث بعد الحذف؟" : "2) What happens after deletion?"}</h2>
          <ul style={{ listStyle: "disc", paddingRight: isAr ? 20 : 0, paddingLeft: isAr ? 0 : 20, marginBottom: 16 }}>
            <li>{isAr ? "يتم تعطيل/حذف حسابك وإيقاف إمكانية تسجيل الدخول به." : "Your account is disabled/deleted and you will no longer be able to sign in."}</li>
            <li>{isAr ? "قد يتم حذف البيانات المرتبطة بالحساب حسب طبيعة الخدمة والمتطلبات التقنية." : "Associated data may be deleted depending on the service nature and technical requirements."}</li>
            <li>{isAr ? "قد نحتفظ ببعض السجلات للمدة اللازمة للامتثال القانوني/المحاسبي أو منع الاحتيال أو متطلبات الأمان." : "We may retain certain records as required for legal/accounting compliance, fraud prevention, or security requirements."}</li>
          </ul>

          <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 24, marginBottom: 12 }}>{isAr ? "3) إذا تعذر عليك الحذف" : "3) If you cannot delete your account"}</h2>
          <p style={{ marginBottom: 16 }}>
            {isAr
              ? "إذا لم تتمكن من تسجيل الدخول أو واجهت مشكلة أثناء الحذف، تواصل معنا عبر البريد: support@layali.app"
              : "If you cannot sign in or face issues deleting your account, contact us at: support@layali.app"}
          </p>
        </div>
      </main>
      <LegalFooter locale={locale} />
    </>
  );
}

