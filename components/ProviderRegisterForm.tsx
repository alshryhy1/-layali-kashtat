"use client";

import * as React from "react";

type Locale = "ar" | "en";

type Props = {
  locale?: string;
  m?: any;
};

function isLocale(v: any): v is Locale {
  return v === "ar" || v === "en";
}

export default function ProviderRegisterForm({ locale, m }: Props) {
  const finalLocale: Locale = isLocale(locale) ? locale : "ar";
  const isAr = finalLocale === "ar";

  const t = {
    title: isAr ? "التسجيل كمقدم خدمة" : "Provider Signup",
    hint: isAr
      ? "أدخل بياناتك بدقة — المدينة ونوع الخدمة من القائمة فقط."
      : "Enter your details accurately — city and service type must be selected from the list.",
    nameLabel: isAr ? "اسم مقدم الخدمة" : "Provider Name",
    phoneLabel: isAr ? "رقم الجوال" : "Phone Number",
    serviceLabel: isAr ? "نوع الخدمة" : "Service Type",
    cityLabel: isAr ? "المدينة" : "City",
    agree: isAr ? "موافق" : "I agree",
    legal: isAr ? "قراءة النصوص القانونية" : "Read legal texts",
    submit: isAr ? "إرسال طلب التسجيل" : "Submit Request",
    sending: isAr ? "جاري الإرسال..." : "Sending...",
    okMsg: isAr ? "تم إرسال طلبك بنجاح." : "Your request has been submitted successfully.",
  };

  // قوائم ثابتة (تقدر تعدّلها لاحقًا)
  const servicesAr = [
    "كشتات برية",
    "كشتات ساحلية",
    "كشتات جبلية",
    "كشتات رملية",
    "منتجع",
    "شاليه",
    "مخيم",
    "استراحة",
    "مزرعة",
  ];
  const servicesEn = [
    "Desert trips",
    "Coastal trips",
    "Mountain trips",
    "Sandy trips",
    "Resort",
    "Chalet",
    "Camp",
    "Rest house",
    "Farm",
  ];

  const citiesAr = [
    "الرياض",
    "جدة",
    "مكة",
    "المدينة",
    "الدمام",
    "الخبر",
    "تبوك",
    "حائل",
    "سكاكا",
    "عرعر",
    "أبها",
    "جازان",
    "نجران",
    "الباحة",
    "بريدة",
  ];
  const citiesEn = [
    "Riyadh",
    "Jeddah",
    "Makkah",
    "Madinah",
    "Dammam",
    "Khobar",
    "Tabuk",
    "Hail",
    "Sakaka",
    "Arar",
    "Abha",
    "Jazan",
    "Najran",
    "Al Bahah",
    "Buraidah",
  ];

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [serviceType, setServiceType] = React.useState("");
  const [city, setCity] = React.useState("");
  const [accepted, setAccepted] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [ok, setOk] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(false);
    setError("");

    // تحقق سريع على الواجهة (والسيرفر عنده تحقق أقوى)
    if (!name.trim()) return setError(isAr ? "الاسم مطلوب." : "Name is required.");
    if (!phone.trim()) return setError(isAr ? "رقم الجوال مطلوب." : "Phone is required.");
    if (!serviceType) return setError(isAr ? "اختر نوع الخدمة." : "Select a service type.");
    if (!city) return setError(isAr ? "اختر المدينة." : "Select a city.");
    if (!accepted) return setError(isAr ? "يلزم الموافقة على الشروط قبل الإرسال." : "You must accept the terms.");

    setLoading(true);
    try {
      const res = await fetch("/api/providers/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          serviceType: serviceType,
          city: city,
          accepted: accepted, // ✅ مهم: الآن تُرسل بشكل صحيح
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          (json && (json.message || json.error)) ||
          (isAr ? "تعذر إرسال الطلب الآن." : "Could not submit right now.");
        setError(String(msg));
        return;
      }

      if (json?.ok) {
        setOk(true);
        setError("");
      } else {
        setError(isAr ? "تعذر إرسال الطلب الآن." : "Could not submit right now.");
      }
    } catch {
      setError(isAr ? "تعذر الاتصال بالسيرفر." : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 560,
    background: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    padding: 18,
    border: "1px solid rgba(0,0,0,0.08)",
    boxShadow: "0 8px 26px rgba(0,0,0,0.08)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid #d0d0d0",
    padding: "0 12px",
    outline: "none",
    fontSize: 14,
    background: "#fff",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: "#111",
    marginBottom: 6,
    display: "block",
  };

  const rowStyle: React.CSSProperties = { display: "grid", gap: 12 };

  const btnStyle: React.CSSProperties = {
    width: "100%",
    height: 48,
    borderRadius: 14,
    border: "none",
    background: "#000",
    color: "#fff",
    fontSize: 15,
    fontWeight: 800,
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={{ width: "100%", display: "grid", placeItems: "center", padding: 16 }} dir={isAr ? "rtl" : "ltr"}>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{t.title}</div>
          <div style={{ fontSize: 12, color: "#444", marginTop: 6 }}>{t.hint}</div>
        </div>

        <form onSubmit={onSubmit} style={rowStyle}>
          <div>
            <label style={labelStyle}>{t.nameLabel}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              autoComplete="name"
            />
          </div>

          <div>
            <label style={labelStyle}>{t.phoneLabel}</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
              inputMode="tel"
              autoComplete="tel"
              placeholder={isAr ? "05xxxxxxxx" : "05xxxxxxxx"}
            />
          </div>

          <div>
            <label style={labelStyle}>{t.serviceLabel}</label>
            <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} style={inputStyle}>
              <option value="">{isAr ? "اختر" : "Select"}</option>
              {(isAr ? servicesAr : servicesEn).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>{t.cityLabel}</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle}>
              <option value="">{isAr ? "اختر" : "Select"}</option>
              {(isAr ? citiesAr : citiesEn).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: 10,
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "rgba(255,255,255,0.7)",
            }}
          >
            <a href={isAr ? "/ar/legal" : "/en/legal"} style={{ fontSize: 12, color: "#1d4ed8", textDecoration: "none" }}>
              {t.legal}
            </a>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 800 }}>
              <span>{t.agree}</span>
              <input
                type="checkbox"
                checked={accepted}                 // ✅ controlled
                onChange={(e) => setAccepted(e.target.checked)} // ✅ يغيّر القيمة الحقيقية
              />
            </label>
          </div>

          {error ? (
            <div style={{ border: "1px solid #ef4444", color: "#111", background: "#fff", padding: 10, borderRadius: 12, fontSize: 13 }}>
              {error}
            </div>
          ) : null}

          {ok ? (
            <div style={{ border: "1px solid #22c55e", color: "#111", background: "#fff", padding: 10, borderRadius: 12, fontSize: 13 }}>
              {t.okMsg}
            </div>
          ) : null}

          <button type="submit" style={btnStyle} disabled={loading}>
            {loading ? t.sending : t.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
