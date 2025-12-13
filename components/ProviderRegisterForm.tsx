"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  locale?: string;
  m?: any;
};

export default function ProviderRegisterForm({ locale, m }: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = (key: string, fallback: string) =>
    typeof m?.[key] === "string" ? m[key] : fallback;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/provider-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          serviceType,
          city,
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const sp = new URLSearchParams();
      sp.set("status", "success");

      router.push(`/${locale ?? "ar"}/dashboard?${sp.toString()}`);
    } catch {
      setError(t("providerSignup_error", "حدث خطأ أثناء الإرسال، حاول لاحقًا"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 16 }}>
        {t("providerSignup_title", "التسجيل كمقدّم خدمة")}
      </h2>

      <input
        type="text"
        placeholder={t("providerSignup_name", "الاسم")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        style={{ width: "100%", marginBottom: 12, padding: 10 }}
      />

      <input
        type="tel"
        placeholder={t("providerSignup_phone", "رقم الجوال")}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
        style={{ width: "100%", marginBottom: 12, padding: 10 }}
      />

      <select
        value={serviceType}
        onChange={(e) => setServiceType(e.target.value)}
        required
        style={{ width: "100%", marginBottom: 12, padding: 10 }}
      >
        <option value="">
          {t("providerSignup_serviceType", "اختر نوع الخدمة")}
        </option>
        <option value="camping">{t("service_camping", "مخيمات")}</option>
        <option value="food">{t("service_food", "ضيافة")}</option>
        <option value="activities">{t("service_activities", "أنشطة")}</option>
      </select>

      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        required
        style={{ width: "100%", marginBottom: 12, padding: 10 }}
      >
        <option value="">{t("providerSignup_city", "اختر المدينة")}</option>

        <option value="riyadh">{t("city_riyadh", "الرياض")}</option>
        <option value="jeddah">{t("city_jeddah", "جدة")}</option>
        <option value="dammam">{t("city_dammam", "الدمام")}</option>

        <option value="albaha">{t("city_albaha", "الباحة")}</option>
        <option value="hail">{t("city_hail", "حائل")}</option>
        <option value="northern-borders">
          {t("city_northern_borders", "الحدود الشمالية")}
        </option>
        <option value="jouf">{t("city_jouf", "الجوف")}</option>
        <option value="arar">{t("city_arar", "عرعر")}</option>
        <option value="tabuk">{t("city_tabuk", "تبوك")}</option>
      </select>

      {error && <p style={{ color: "red", marginBottom: 12 }}>{error}</p>}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: 12,
          background: "#000",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading
          ? t("providerSignup_sending", "جاري الإرسال...")
          : t("providerSignup_submit", "إرسال طلب التسجيل")}
      </button>
    </form>
  );
}
