"use client";

import * as React from "react";
import { useFormState, useFormStatus } from "react-dom";

type Locale = "ar" | "en";

type State = {
  ok: boolean;
  message?: string;
  error?: string;
};

type ActionFn = (prevState: State, formData: FormData) => Promise<State>;

function SubmitButton({ locale }: { locale: Locale }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 10,
        border: "1px solid #111",
        background: pending ? "#ddd" : "#111",
        color: pending ? "#333" : "#fff",
        cursor: pending ? "not-allowed" : "pointer",
        fontWeight: 700,
      }}
    >
      {pending ? (locale === "ar" ? "جارٍ الإرسال..." : "Submitting...") : locale === "ar" ? "إرسال الطلب" : "Submit"}
    </button>
  );
}

export default function ProviderSignupForm(props: {
  locale?: Locale;
  action: ActionFn;
}) {
  const locale: Locale = props.locale === "en" ? "en" : "ar";

  const initialState: State = { ok: false };
  const [state, formAction] = useFormState(props.action, initialState);

  const cities = [
    "مكة المكرمة",
    "المدينة المنورة",
    "الرياض",
    "جده",
    "الدمام",
    "القصيم",
    "حائل",
    "عرعر",
    "طريف",
    "القريات",
    "طبرجل",
    "الجوف",
    "سكاكا",
    "تبوك",
    "العلا",
    "ينبع",
    "املج",
    "حقل",
  ];

  const serviceTypes = [
    "كشتات بريه",
    "كشتات ساحليه",
    "كشتات جبليه",
    "كشتات رمليه",
    "منتجع",
    "شاليه",
    "مخيم",
    "استراحه",
    "مزرعه",
  ];

  return (
    <div style={{ marginTop: 14 }}>
      <form action={formAction} style={{ display: "grid", gap: 12 }}>
        {/* الاسم */}
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontWeight: 700 }}>
            {locale === "ar" ? "اسم مقدم الخدمة" : "Provider name"}
          </label>
          <input
            name="name"
            required
            autoComplete="name"
            placeholder={locale === "ar" ? "مثال: عبدالله" : "e.g. Abdullah"}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              outline: "none",
            }}
          />
        </div>

        {/* الجوال */}
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontWeight: 700 }}>
            {locale === "ar" ? "رقم الجوال" : "Phone"}
          </label>
          <input
            name="phone"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder={locale === "ar" ? "05xxxxxxxx" : "05xxxxxxxx"}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              outline: "none",
            }}
          />
        </div>

        {/* نوع الخدمة (Select فقط لمنع الكتابة) */}
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontWeight: 700 }}>
            {locale === "ar" ? "نوع الخدمة" : "Service type"}
          </label>
          <select
            name="service_type"
            required
            defaultValue=""
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              outline: "none",
              background: "#fff",
            }}
          >
            <option value="" disabled>
              {locale === "ar" ? "اختر نوع الخدمة" : "Select a service type"}
            </option>
            {serviceTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* المدينة (Select فقط لمنع الكتابة) */}
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontWeight: 700 }}>
            {locale === "ar" ? "المدينة" : "City"}
          </label>
          <select
            name="city"
            required
            defaultValue=""
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              outline: "none",
              background: "#fff",
            }}
          >
            <option value="" disabled>
              {locale === "ar" ? "اختر المدينة" : "Select a city"}
            </option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* الرسائل */}
        {state?.ok ? (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #b7eb8f",
              background: "#f6ffed",
              color: "#135200",
              fontWeight: 700,
            }}
          >
            {state.message ||
              (locale === "ar"
                ? "تم استلام طلبك بنجاح."
                : "Your request has been received successfully.")}
          </div>
        ) : state?.error ? (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ffccc7",
              background: "#fff2f0",
              color: "#a8071a",
              fontWeight: 700,
            }}
          >
            {state.error}
          </div>
        ) : null}

        <SubmitButton locale={locale} />
      </form>
    </div>
  );
}
