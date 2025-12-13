// app/[locale]/provider-signup/page.tsx
"use client";

import React, { useState } from "react";

export default function ProviderSignupPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    serviceType: "",
    city: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.phone || !form.serviceType || !form.city) {
      setError("يرجى تعبئة جميع الحقول");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/provider-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      setSuccess(true);
      setForm({ name: "", phone: "", serviceType: "", city: "" });
    } catch {
      setError("حدث خطأ أثناء الإرسال، حاول لاحقًا");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <section style={box}>
        <h1 style={title}>تم استلام طلبك بنجاح</h1>
        <p style={text}>
          شكرًا لتسجيلك في <strong>ليالي كشتات</strong>.
          سيتم التواصل معك قريبًا.
        </p>
      </section>
    );
  }

  return (
    <section style={box}>
      <h1 style={title}>التسجيل كمقدم خدمة</h1>

      <form onSubmit={handleSubmit} style={formStyle}>
        <input
          placeholder="اسم مقدم الخدمة"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={input}
        />

        <input
          placeholder="رقم الجوال"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          style={input}
        />

        <select
          value={form.serviceType}
          onChange={(e) =>
            setForm({ ...form, serviceType: e.target.value })
          }
          style={input}
        >
          <option value="">اختر نوع الخدمة</option>
          <option value="كشتات">كشتات</option>
          <option value="مخيمات">مخيمات</option>
          <option value="رحلات برية">رحلات برية</option>
          <option value="تجهيز مناسبات">تجهيز مناسبات</option>
        </select>

        <select
          value={form.city}
          onChange={(e) =>
            setForm({ ...form, city: e.target.value })
          }
          style={input}
        >
          <option value="">اختر المنطقة / المدينة</option>
          <option value="الرياض">الرياض</option>
          <option value="جدة">جدة</option>
          <option value="الدمام">الدمام</option>
          <option value="القصيم">القصيم</option>
          <option value="حائل">حائل</option>
          <option value="تبوك">تبوك</option>
          <option value="الجوف">الجوف</option>
          <option value="الحدود الشمالية">الحدود الشمالية</option>
          <option value="أبها">أبها</option>
        </select>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={loading} style={button}>
          {loading ? "جاري الإرسال..." : "إرسال"}
        </button>
      </form>
    </section>
  );
}

const box = { maxWidth: 520, margin: "48px auto", padding: 24 };
const title = { fontSize: 24 };
const text = { marginBottom: 16 };
const formStyle = { display: "flex", flexDirection: "column", gap: 12 };
const input = { padding: 10 };
const button = { padding: 12 };
