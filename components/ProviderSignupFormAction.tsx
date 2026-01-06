"use client";

import * as React from "react";
import { useFormState, useFormStatus } from "react-dom";

type Locale = "ar" | "en";
type State = { ok: boolean; message: string } | null;
type ActionFn = (prevState: State, formData: FormData) => Promise<State>;

function texts(locale: Locale) {
  const ar = locale === "ar";
  return {
    title: ar ? "تسجيل مقدم خدمة" : "Provider Signup",
    desc: ar
      ? "املأ البيانات التالية وسيتم استلام طلبك داخل الموقع."
      : "Fill in the form below. Your request will be received within the website.",
    name: ar ? "اسم مقدم الخدمة" : "Provider Name",
    phone: ar ? "رقم الجوال" : "Phone Number",
    service: ar ? "نوع الخدمة" : "Service Type",
    city: ar ? "المدينة" : "City",
    pickService: ar ? "اختر نوع الخدمة" : "Select service type",
    pickCity: ar ? "اختر المدينة" : "Select city",
    agree: ar
      ? "أوافق على توثيق مقدم الخدمة والشروط المرتبطة به."
      : "I agree to the provider verification and related terms.",
    docs: ar ? "توثيق مقدم الخدمة" : "Provider verification",
    submit: ar ? "إرسال الطلب" : "Submit request",
    sending: ar ? "جارٍ الإرسال..." : "Submitting...",
    success: ar ? "تم إرسال طلبك بنجاح وسيتم التواصل معك." : "Your request has been sent successfully.",
  };
}

function SubmitButton({ locale }: { locale: Locale }) {
  const { pending } = useFormStatus();
  const t = texts(locale);

  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: 10,
        border: "1px solid #111",
        background: pending ? "#e5e5e5" : "#111",
        color: pending ? "#333" : "#fff",
        fontSize: 13,
        fontWeight: 900,
        cursor: pending ? "not-allowed" : "pointer",
      }}
    >
      {pending ? t.sending : t.submit}
    </button>
  );
}

export default function ProviderSignupFormAction({
  locale,
  action,
}: {
  locale: Locale;
  action: ActionFn;
}) {
  const t = texts(locale);
  const [state, formAction] = useFormState<State, FormData>(action, null);

  const services =
    locale === "ar"
      ? [
          "كشته بريه رمليه",
          "كشته بريه ساحليه",
          "كشته بريه جبليه",
          "مخيم",
          "شاليه",
          "مزرعة",
          "استراحة",
        ]
      : [
          "Desert (sandy)",
          "Desert (coastal)",
          "Desert (mountain)",
          "Camp",
          "Chalet",
          "Farm",
          "Rest area",
        ];

  const cities =
    locale === "ar"
      ? ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "القصيم", "حائل", "تبوك"]
      : ["Riyadh", "Jeddah", "Makkah", "Madinah", "Dammam", "Qassim", "Hail", "Tabuk"];

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.25)",
    fontSize: 13,
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "20px auto 0",
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(6px)",
        borderRadius: 16,
        padding: 14,
      }}
    >
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{t.title}</h2>
      <p style={{ marginTop: 6, marginBottom: 10, fontSize: 13 }}>{t.desc}</p>

      <form
        action={formAction}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        <div>
          <label style={{ fontSize: 12, fontWeight: 700 }}>{t.name}</label>
          <input name="name" required style={inputStyle} />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700 }}>{t.phone}</label>
          <input name="phone" required style={inputStyle} />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700 }}>{t.service}</label>
          <select name="service_type" required style={inputStyle}>
            <option value="">{t.pickService}</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700 }}>{t.city}</label>
          <select name="city" required style={inputStyle}>
            <option value="">{t.pickCity}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <label style={{ fontSize: 12, display: "flex", gap: 6 }}>
          <input type="checkbox" name="agree" required />
          {t.agree}
        </label>

        <a
          href={`/${locale}/providers/docs`}
          style={{ fontSize: 12, fontWeight: 800 }}
        >
          {t.docs}
        </a>

        {!state?.ok && <SubmitButton locale={locale} />}

        {state && (
          <div
            style={{
              marginTop: 6,
              padding: "8px 10px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              background: state.ok ? "#e6f6ea" : "#fdeaea",
              color: state.ok ? "#0f5132" : "#842029",
              border: `1px solid ${state.ok ? "#badbcc" : "#f5c2c7"}`,
            }}
          >
            {state.ok ? t.success : state.message}
          </div>
        )}
      </form>
    </div>
  );
}
