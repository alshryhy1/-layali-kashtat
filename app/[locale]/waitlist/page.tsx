"use client";

import React, { useMemo, useState } from "react";

type Props = {
  params: { locale: string };
};

export default function WaitlistPage({ params }: Props) {
  const raw = String(params?.locale || "ar").trim().toLowerCase();
  const isEn = raw === "en" || raw.startsWith("en-") || raw.startsWith("en_");
  const locale = isEn ? "en" : "ar";

  const t = useMemo(() => {
    if (isEn) {
      return {
        title: "Waitlist",
        subtitle: "Leave your details and we’ll contact you when it’s your turn.",
        name: "Name",
        phone: "Phone",
        city: "City",
        note: "Note (optional)",
        namePh: "Your full name",
        phonePh: "05xxxxxxxx",
        cityPh: "Riyadh / Jeddah ...",
        notePh: "Anything we should know...",
        submit: "Join Waitlist",
        sending: "Submitting...",
        okTitle: "Done ✅",
        okText:
          "Your request was saved. If the server is not connected yet, it will still show as saved locally.",
        errTitle: "Couldn’t submit",
        errText:
          "The server endpoint /api/waitlist is missing or failed. Create it if you want to store data in Supabase.",
      };
    }

    return {
      title: "قائمة الانتظار",
      subtitle: "اترك بياناتك وسنتواصل معك عند فتح التسجيل.",
      name: "الاسم",
      phone: "رقم الجوال",
      city: "المدينة",
      note: "ملاحظة (اختياري)",
      namePh: "الاسم الكامل",
      phonePh: "05xxxxxxxx",
      cityPh: "الرياض / جدة ...",
      notePh: "أي ملاحظة…",
      submit: "إرسال",
      sending: "جارٍ الإرسال...",
      okTitle: "تم ✅",
      okText:
        "تم حفظ طلبك. إذا كان السيرفر غير جاهز الآن ستظهر رسالة نجاح محلية فقط.",
      errTitle: "تعذر الإرسال",
      errText:
        "المسار /api/waitlist غير موجود أو فشل. أنشئه إذا تبي حفظ البيانات في Supabase.",
    };
  }, [isEn]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; title: string; text: string } | null>(
    null
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    const payload = {
      locale,
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim(),
      note: note.trim(),
    };

    if (!payload.name || !payload.phone || !payload.city) {
      setMsg({
        type: "err",
        title: isEn ? "Missing fields" : "حقول ناقصة",
        text: isEn
          ? "Please fill Name, Phone and City."
          : "عبّئ الاسم ورقم الجوال والمدينة.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // ما نكسر الصفحة — فقط رسالة واضحة
        setMsg({ type: "err", title: t.errTitle, text: t.errText });
      } else {
        setMsg({ type: "ok", title: t.okTitle, text: t.okText });
        setName("");
        setPhone("");
        setCity("");
        setNote("");
      }
    } catch {
      setMsg({ type: "err", title: t.errTitle, text: t.errText });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      dir={isEn ? "ltr" : "rtl"}
      style={{
        minHeight: "100vh",
        padding: "28px 16px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div style={{ width: "100%", maxWidth: 680 }}>
        <h1 style={{ fontSize: 34, fontWeight: 900, textAlign: "center" }}>{t.title}</h1>
        <p style={{ textAlign: "center", color: "#666", marginTop: 8 }}>{t.subtitle}</p>

        <div
          style={{
            marginTop: 18,
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 18,
            padding: 18,
            boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
            backdropFilter: "blur(6px)",
          }}
        >
          {msg ? (
            <div
              style={{
                marginBottom: 12,
                padding: 12,
                borderRadius: 12,
                border: "1px solid",
                background: msg.type === "ok" ? "rgba(0,160,0,0.08)" : "rgba(180,0,0,0.08)",
                borderColor: msg.type === "ok" ? "rgba(0,160,0,0.35)" : "rgba(180,0,0,0.35)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 4 }}>{msg.title}</div>
              <div style={{ color: "#333" }}>{msg.text}</div>
            </div>
          ) : null}

          <form onSubmit={onSubmit} aria-label="waitlist form">
            <div style={{ display: "grid", gap: 12 }}>
              <Field
                label={t.name}
                value={name}
                onChange={setName}
                placeholder={t.namePh}
                inputMode="text"
              />
              <Field
                label={t.phone}
                value={phone}
                onChange={setPhone}
                placeholder={t.phonePh}
                inputMode="tel"
              />
              <Field
                label={t.city}
                value={city}
                onChange={setCity}
                placeholder={t.cityPh}
                inputMode="text"
              />

              <div>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>{t.note}</div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.notePh}
                  rows={3}
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.18)",
                    padding: "10px 12px",
                    resize: "vertical",
                    outline: "none",
                    background: "#fff",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: 6,
                  width: "100%",
                  borderRadius: 14,
                  padding: "12px 14px",
                  fontWeight: 900,
                  border: "1px solid #111",
                  background: "#111",
                  color: "#fff",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? t.sending : t.submit}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{props.label}</div>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        inputMode={props.inputMode}
        style={{
          width: "100%",
          borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.18)",
          padding: "10px 12px",
          outline: "none",
          background: "#fff",
        }}
      />
    </div>
  );
}
