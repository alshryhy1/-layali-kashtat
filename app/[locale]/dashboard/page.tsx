import { getMessages } from "@/lib/i18n";
import { Locale } from "@/lib/locales";
import { FEATURES } from "@/lib/features";

type Props = {
  params: { locale: Locale };
};

export default async function DashboardPage({ params }: Props) {
  if (!FEATURES.providerSignupEnabled) {
    return null;
  }

  const m = await getMessages(params.locale);
  const t = m?.dashboard ?? {};

  return (
    <section
      style={{
        maxWidth: 720,
        margin: "40px auto",
        padding: "0 16px",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>
        {t.title ?? "لوحة مقدّم الخدمة"}
      </h1>

      <div style={box}>
        <strong>{t.statusLabel ?? "الحالة"}</strong>
        <div style={val}>{t.statusAvailable ?? "متاح"}</div>
      </div>

      <div style={box}>
        <strong>{t.capacityLabel ?? "الطاقة اليومية"}</strong>
        <div style={val}>2</div>
      </div>

      <div style={box}>
        <strong>{t.serviceTypeLabel ?? "نوع الخدمة"}</strong>
        <div style={val}>مخيم / شاليه</div>
      </div>

      <div style={box}>
        <strong>{t.workAreaLabel ?? "منطقة العمل"}</strong>
        <div style={val}>الرياض</div>
      </div>

      <div style={box}>
        <strong>{t.workersLabel ?? "عدد العمّال"}</strong>
        <div style={val}>0</div>
      </div>

      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 16 }}>
        {t.note ??
          "هذه لوحة عرض فقط في المرحلة الحالية — لا توجد عمليات أو تعديل."}
      </p>
    </section>
  );
}

const box: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 16,
  marginBottom: 12,
};

const val: React.CSSProperties = {
  marginTop: 6,
};
