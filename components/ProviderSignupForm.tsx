"use client";

import { useMemo, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";

type Locale = "ar" | "en";

/** قوائم ثابتة لمنع الكتابة */
const SERVICE_TYPES_AR = [
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

const SERVICE_TYPES_EN = [
  "Desert trips",
  "Coastal trips",
  "Mountain trips",
  "Sand trips",
  "Resort",
  "Chalet",
  "Camp",
  "Rest house",
  "Farm",
];

const CITIES_AR = [
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

const CITIES_EN = [
  "Makkah",
  "Madinah",
  "Riyadh",
  "Jeddah",
  "Dammam",
  "Qassim",
  "Hail",
  "Arar",
  "Turaif",
  "Al Qurayyat",
  "Tabarjal",
  "Al Jouf",
  "Sakaka",
  "Tabuk",
  "AlUla",
  "Yanbu",
  "Umluj",
  "Haql",
];

const T = {
  ar: {
    title: "تسجيل مقدم خدمة",
    desc: "عبّئ البيانات وسيتم استلام طلبك من الموقع.",
    name: "الاسم",
    namePh: "اسم مقدم الخدمة",
    phone: "رقم الجوال",
    phonePh: "05xxxxxxxx",
    serviceType: "نوع الخدمة",
    serviceTypePick: "اختر نوع الخدمة",
    city: "المدينة",
    cityPick: "اختر المدينة",
    legalPoints: [
      "المنصة وسيط تقني لاستلام الطلبات فقط.",
      "مقدم الخدمة مسؤول عن الخدمة والسعر والالتزام.",
      "أي بيانات غير صحيحة قد تؤدي لرفض الطلب.",
    ],
    consentTitle: "الموافقة",
    consentText:
      "أوافق على الشروط وأتعهد بصحة البيانات. لن يتم إرسال الطلب بدون الموافقة.",
    mustAgree: "لا يمكن الإرسال بدون الموافقة.",
    submit: "إرسال الطلب",
    sending: "جاري الإرسال...",
    ok: "✅ وصل طلبك من الموقع. سيتم مراجعة الطلب والتواصل لاحقًا.",
    fail: "تعذر إرسال الطلب.",
  },
  en: {
    title: "Provider Signup",
    desc: "Fill the form — we will receive your request from the website.",
    name: "Name",
    namePh: "Provider name",
    phone: "Phone",
    phonePh: "05xxxxxxxx",
    serviceType: "Service Type",
    serviceTypePick: "Select service type",
    city: "City",
    cityPick: "Select city",
    legalPoints: [
      "The platform is a technical intermediary to receive requests only.",
      "The provider is responsible for service, pricing, and commitments.",
      "Incorrect information may result in rejection.",
    ],
    consentTitle: "Consent",
    consentText:
      "I agree to the terms and confirm the information is accurate. The request won’t be submitted without consent.",
    mustAgree: "You must agree before submitting.",
    submit: "Submit Request",
    sending: "Submitting...",
    ok: "✅ Your request was received from the website. We will contact you later.",
    fail: "Could not submit.",
  },
} as const;

function localeFromPathname(pathname: string | null): Locale {
  const seg = (pathname || "/").split("/").filter(Boolean)[0];
  return seg === "en" ? "en" : "ar";
}

export default function ProviderSignupForm({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const effectiveLocale = localeFromPathname(pathname) || locale;

  const isEn = effectiveLocale === "en";
  const t = T[effectiveLocale];
  const dir = isEn ? "ltr" : "rtl";

  const serviceOptions = useMemo(
    () => (isEn ? SERVICE_TYPES_EN : SERVICE_TYPES_AR),
    [isEn]
  );
  const cityOptions = useMemo(() => (isEn ? CITIES_EN : CITIES_AR), [isEn]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [city, setCity] = useState("");

  const [consent, setConsent] = useState(false);
  const [consentErr, setConsentErr] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setConsentErr("");

    if (!consent) {
      setConsentErr(t.mustAgree);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/provider-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          service_type: serviceType,
          city,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        const errText =
          (data?.error && String(data.error)) ||
          (data?.message && String(data.message)) ||
          "";
        setMsg({
          ok: false,
          text: errText ? `${t.fail} (${errText})` : t.fail,
        });
        return;
      }

      // ✅ لا واتساب ولا تحويل — فقط رسالة “وصل الطلب”
      setMsg({ ok: true, text: t.ok });

      // تنظيف الحقول
      setName("");
      setPhone("");
      setServiceType("");
      setCity("");
      setConsent(false);
    } catch (err: any) {
      setMsg({
        ok: false,
        text: `${t.fail} (${err?.message ? String(err.message) : "network"})`,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir={dir}
      style={{
        minHeight: "calc(100vh - 70px)",
        display: "grid",
        placeItems: "start center",
        padding: "28px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520 }}>
        <h1 style={{ textAlign: "center", margin: "10px 0 6px", fontSize: 26 }}>
          {t.title}
        </h1>
        <p style={{ textAlign: "center", margin: "0 0 18px", opacity: 0.75 }}>
          {t.desc}
        </p>

        <form
          onSubmit={onSubmit}
          style={{
            background: "rgba(255,255,255,0.92)",
            border: "1px solid #eee",
            borderRadius: 14,
            padding: 16,
            display: "grid",
            gap: 12,
          }}
        >
          <label>
            <strong>{t.name}</strong>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePh}
              style={inputStyle}
              required
            />
          </label>

          <label>
            <strong>{t.phone}</strong>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder={t.phonePh}
              style={inputStyle}
              required
            />
          </label>

          <label>
            <strong>{t.serviceType}</strong>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              style={inputStyle}
              required
            >
              <option value="" disabled>
                {t.serviceTypePick}
              </option>
              {serviceOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <label>
            <strong>{t.city}</strong>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={inputStyle}
              required
            >
              <option value="" disabled>
                {t.cityPick}
              </option>
              {cityOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <div
            style={{
              marginTop: 6,
              padding: 12,
              borderRadius: 12,
              border: "1px solid #e5e5e5",
              background: "rgba(255,255,255,0.75)",
              fontSize: 14,
            }}
          >
            <ul style={{ paddingInlineStart: 18, margin: "0 0 10px" }}>
              {t.legalPoints.map((p) => (
                <li key={p} style={{ marginBottom: 6 }}>
                  {p}
                </li>
              ))}
            </ul>

            <strong style={{ display: "block", marginBottom: 8 }}>
              {t.consentTitle}
            </strong>

            <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>{t.consentText}</span>
            </label>

            {consentErr && (
              <div style={{ marginTop: 6, color: "#b00020", fontWeight: 700 }}>
                {consentErr}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              height: 46,
              borderRadius: 12,
              border: "1px solid #000",
              background: "#000",
              color: "#fff",
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? t.sending : t.submit}
          </button>

          {msg && (
            <div
              style={{
                textAlign: "center",
                fontWeight: 800,
                color: msg.ok ? "#0a7a2f" : "#b00020",
              }}
            >
              {msg.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: "10px 12px",
  border: "1px solid #e5e5e5",
  borderRadius: 12,
  background: "#fff",
};
