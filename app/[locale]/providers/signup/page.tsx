"use client";

import { useMemo, useState } from "react";

export default function ProviderSignupPage({
  params,
}: {
  params: { locale: "ar" | "en" };
}) {
  const isAr = params.locale === "ar";

  const t = useMemo(
    () => ({
      title: isAr ? "تسجيل مقدّم الخدمة" : "Provider Signup",
      note: isAr
        ? "التسجيل متاح الآن. لوحة التحكم ما زالت مقفلة مؤقتًا."
        : "Signup is open. The dashboard is still temporarily closed.",
      name: isAr ? "اسم المالك" : "Owner name",
      ownerPhone: isAr ? "رقم جوال المالك" : "Owner phone",
      workerPhone: isAr ? "رقم جوال العامل (اختياري)" : "Worker phone (optional)",
      city: isAr ? "المدينة" : "City",
      service: isAr ? "نوع الخدمة" : "Service type",
      showWorker: isAr ? "إظهار رقم العامل للعميل" : "Show worker phone to customer",
      submit: isAr ? "إرسال الطلب" : "Submit",
      sending: isAr ? "جارٍ الإرسال..." : "Sending...",
      ok: isAr ? "تم استلام طلبك بنجاح ✅" : "Request received ✅",
      err: isAr ? "حدث خطأ. حاول مرة أخرى." : "Something went wrong. Try again.",
    }),
    [isAr]
  );

  const [form, setForm] = useState({
    ownerName: "",
    ownerPhone: "",
    workerPhone: "",
    city: "",
    serviceType: "",
    showWorkerPhoneToCustomer: false,
  });

  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/providers/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: params.locale,
          ...form,
        }),
      });

      if (!res.ok) throw new Error("bad");
      setStatus("ok");
      setForm({
        ownerName: "",
        ownerPhone: "",
        workerPhone: "",
        city: "",
        serviceType: "",
        showWorkerPhoneToCustomer: false,
      });
    } catch {
      setStatus("err");
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ margin: 0 }}>{t.title}</h1>
      <p style={{ marginTop: 10, lineHeight: 1.8 }}>{t.note}</p>

      <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>{t.name}</span>
          <input
            value={form.ownerName}
            onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))}
            required
            style={{ padding: 10, border: "1px solid #e5e5e5", borderRadius: 8 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>{t.ownerPhone}</span>
          <input
            value={form.ownerPhone}
            onChange={(e) => setForm((p) => ({ ...p, ownerPhone: e.target.value }))}
            required
            inputMode="tel"
            style={{ padding: 10, border: "1px solid #e5e5e5", borderRadius: 8 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>{t.workerPhone}</span>
          <input
            value={form.workerPhone}
            onChange={(e) => setForm((p) => ({ ...p, workerPhone: e.target.value }))}
            inputMode="tel"
            style={{ padding: 10, border: "1px solid #e5e5e5", borderRadius: 8 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>{t.city}</span>
          <input
            value={form.city}
            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            required
            style={{ padding: 10, border: "1px solid #e5e5e5", borderRadius: 8 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>{t.service}</span>
          <input
            value={form.serviceType}
            onChange={(e) => setForm((p) => ({ ...p, serviceType: e.target.value }))}
            required
            style={{ padding: 10, border: "1px solid #e5e5e5", borderRadius: 8 }}
          />
        </label>

        <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={form.showWorkerPhoneToCustomer}
            onChange={(e) =>
              setForm((p) => ({ ...p, showWorkerPhoneToCustomer: e.target.checked }))
            }
          />
          <span>{t.showWorker}</span>
        </label>

        <button
          type="submit"
          disabled={status === "sending"}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #e5e5e5",
            cursor: "pointer",
          }}
        >
          {status === "sending" ? t.sending : t.submit}
        </button>

        {status === "ok" && <p style={{ margin: 0 }}>{t.ok}</p>}
        {status === "err" && <p style={{ margin: 0 }}>{t.err}</p>}
      </form>
    </main>
  );
}
