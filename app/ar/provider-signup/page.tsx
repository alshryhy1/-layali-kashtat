// app/ar/provider-signup/page.tsx
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
          شكرًا لتسجيلك في <strong>ليالي كشتات</strong>.<br />
          سيتم التواصل معك عند بدء استقبال الطلبات.
        </p>
      </section>
    );
  }

  return (
    <section style={box}>
      <h1 style={title}>التسجيل كمقدم خدمة</h1>
      <p style={text}>
        يسعدنا انضمامك إلى منصة <strong>ليالي كشتات</strong>.
        يرجى تعبئة البيانات التالية.
      </p>

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
          <option value="">اختر المدينة</option>
          <option value="الرياض">الرياض</option>
          <option value="جدة">جدة</option>
          <option value="الدمام">الدمام</option>
          <option value="القصيم">القصيم</option>
          <option value="حائل">حائل</option>
          <option value="أبها">أبها</option>
        </select>

        {error && <p style={errorStyle}>{error}</p>}

        <button type="submit" disabled={loading} style={button}>
          {loading ? "جاري الإرسال..." : "إرسال طلب التسجيل"}
        </button>
      </form>
    </section>
  );
}

/* ===== styles ===== */

const box: React.CSSProperties = {
  maxWidth: 520,
  margin: "48px auto",
  padding: 24,
  border: "1px solid #e5e5e5",
  borderRadius: 8,
  background: "#fff",
};

const title = { fontSize: 24, marginBottom: 8 };
const text = { color: "#555", lineHeight: 1.6, marginBottom: 16 };

const formStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 12,
};

const input = {
  padding: 10,
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: 14,
};

const button = {
  marginTop: 12,
  padding: 12,
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 16,
};

const errorStyle = { color: "red", fontSize: 14 };
