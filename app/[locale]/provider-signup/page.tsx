"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  locale: string;
};

export default function ProviderRegisterForm({ locale }: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/provider-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, serviceType, city }),
      });

      if (!res.ok) throw new Error("Request failed");

      const sp = new URLSearchParams();
      sp.set("status", "success");

      router.push(`/${locale}/dashboard?${sp.toString()}`);
    } catch {
      setError("حدث خطأ أثناء الإرسال، حاول لاحقًا");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 16 }}>التسجيل كمقدّم خدمة</h2>

      <input
        type="text"
        placeholder="الاسم"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        style={{ width: "100%", marginBottom: 12, padding: 10 }}
      />

      <input
        type="tel"
        placeholder="رقم الجوال"
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
        <option value="">اختر نوع الخدمة</option>
        <option value="camping">مخيمات</option>
        <option value="food">ضيافة</option>
        <option value="activities">أنشطة</option>
      </select>

      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        required
        style={{ width: "100%", marginBottom: 12, padding: 10 }}
      >
        <option value="">اختر المدينة</option>

        <option value="riyadh">الرياض</option>
        <option value="jeddah">جدة</option>
        <option value="dammam">الدمام</option>

        <option value="albaha">الباحة</option>
        <option value="hail">حائل</option>
        <option value="northern-borders">الحدود الشمالية</option>
        <option value="jouf">الجوف</option>
        <option value="arar">عرعر</option>
        <option value="tabuk">تبوك</option>
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
        {loading ? "جاري الإرسال..." : "إرسال طلب التسجيل"}
      </button>
    </form>
  );
}
