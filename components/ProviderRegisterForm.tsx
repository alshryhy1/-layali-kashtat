"use client";

import * as React from "react";

type Locale = "ar" | "en";

type Props = {
  locale?: string;
};

function isLocale(v: any): v is Locale {
  return v === "ar" || v === "en";
}

export default function ProviderRegisterForm({ locale }: Props) {
  const finalLocale: Locale = isLocale(locale) ? locale : "ar";
  const isAr = finalLocale === "ar";

  const t = {
    title: isAr ? "التسجيل كمقدم خدمة" : "Provider Signup",
    hint: isAr
      ? "أدخل بياناتك بدقة — المدينة ونوع الخدمة من القائمة فقط."
      : "Enter your details accurately — city and service type must be selected from the list.",
    name: isAr ? "اسم مقدم الخدمة" : "Provider Name",
    phone: isAr ? "رقم الجوال" : "Phone Number",
    service: isAr ? "نوع الخدمة" : "Service Type",
    city: isAr ? "المدينة" : "City",
    agree: isAr ? "موافق على الشروط" : "I agree to the terms",
    legal: isAr ? "قراءة النصوص القانونية" : "Read legal texts",
    submit: isAr ? "إرسال طلب التسجيل" : "Submit request",
    sending: isAr ? "جاري الإرسال..." : "Sending...",
  };

  const services = isAr
    ? ["كشتات برية", "كشتات ساحلية", "كشتات جبلية", "كشتات رملية", "منتجع", "شاليه", "مخيم", "استراحة", "مزرعة"]
    : ["Desert trips", "Coastal trips", "Mountain trips", "Sandy trips", "Resort", "Chalet", "Camp", "Rest house", "Farm"];

  const cities = isAr
    ? ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر", "تبوك", "حائل", "سكاكا", "عرعر"]
    : ["Riyadh", "Jeddah", "Makkah", "Madinah", "Dammam", "Khobar", "Tabuk", "Hail", "Sakaka", "Arar"];

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [serviceType, setServiceType] = React.useState("");
  const [city, setCity] = React.useState("");
  const [accepted, setAccepted] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!accepted) {
      setError(isAr ? "يلزم الموافقة على الشروط قبل الإرسال." : "You must accept the terms.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/providers/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          serviceType,
          city,
          accepted: true, // 🔴 إجباري وصريح
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.message || json?.error || "حدث خطأ.");
      }
    } catch {
      setError(isAr ? "تعذر الاتصال بالسيرفر." : "Server unreachable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16 }} dir={isAr ? "rtl" : "ltr"}>
      <form onSubmit={submit} style={{ maxWidth: 520, margin: "0 auto", display: "grid", gap: 12 }}>
        <h2 style={{ textAlign: "center" }}>{t.title}</h2>
        <p style={{ textAlign: "center", fontSize: 13 }}>{t.hint}</p>

        <input placeholder={t.name} value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="05xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
          <option value="">{t.service}</option>
          {services.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">{t.city}</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          onClick={() => setAccepted((v) => !v)}
        >
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          {t.agree}
        </label>

        <a href={isAr ? "/ar/legal" : "/en/legal"}>{t.legal}</a>

        {error && <div style={{ color: "red" }}>{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? t.sending : t.submit}
        </button>
      </form>
    </div>
  );
}
