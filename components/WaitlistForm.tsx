"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";

type Props = {
  t: {
    title: string;
    description: string;
    name: string;
    phone: string;
    submit: string;
    legal: string;
  };
};

function normalizePhone(v: string) {
  return v.replace(/\s+/g, "").replace(/[^\d+]/g, "");
}

function isSaudiMobile(v: string) {
  const p = normalizePhone(v);
  return /^05\d{8}$/.test(p) || /^(?:\+?966)5\d{8}$/.test(p);
}

export default function WaitlistForm({ t }: Props) {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const phoneValid = useMemo(() => isSaudiMobile(phone), [phone]);
  const canSubmit = name.trim().length >= 2 && phoneValid;

  function handleSubmit() {
    if (!canSubmit) return;
    // UI فقط — بدون حفظ
    router.push(`/${locale}/waitlist/success`);
  }

  return (
    <form style={styles.form} onSubmit={(e) => e.preventDefault()}>
      <h1 style={styles.title}>{t.title}</h1>
      <p style={styles.desc}>{t.description}</p>

      <input
        style={styles.input}
        type="text"
        placeholder={t.name}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        style={styles.input}
        type="tel"
        placeholder={t.phone}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <small
        style={{
          color:
            phone.length === 0 ? "#777" : phoneValid ? "#2e7d32" : "#b00020",
        }}
      >
        {phone.length === 0 ? "" : phoneValid ? "رقم صحيح" : "رقم غير صحيح"}
      </small>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          ...styles.button,
          opacity: canSubmit ? 1 : 0.5,
          cursor: canSubmit ? "pointer" : "not-allowed",
        }}
      >
        {t.submit}
      </button>

      <p style={styles.legal}>{t.legal}</p>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    maxWidth: 420,
    margin: "40px auto",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
  },
  desc: {
    fontSize: 14,
    opacity: 0.8,
  },
  input: {
    padding: 12,
    fontSize: 16,
  },
  button: {
    padding: 12,
    fontSize: 16,
  },
  legal: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 8,
    lineHeight: "1.6",
  },
};
