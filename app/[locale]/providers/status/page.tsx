"use client";

import * as React from "react";
import Link from "next/link";

type Locale = "ar" | "en";

function normalizePhone(raw: string) {
  let s = String(raw || "").trim().replace(/[^\d]/g, "");

  if (s.startsWith("00966")) s = s.replace(/^00966/, "");
  if (s.startsWith("966")) s = s.replace(/^966/, "");

  if (s.length === 9 && s.startsWith("5")) s = `0${s}`;
  return s;
}

function digitsOnly(raw: string) {
  return String(raw || "").replace(/[^\d]/g, "");
}

export default function ProviderStatusPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale: Locale = params?.locale === "en" ? "en" : "ar";
  const isAr = locale === "ar";

  const t = {
    title: isAr ? "متابعة حالة الطلب" : "Track request status",
    hint: isAr
      ? "اكتب رقم الطلب ورقم الجوال ثم اضغط متابعة."
      : "Enter request number and mobile number, then press Track.",
    ref: isAr ? "رقم الطلب" : "Request number",
    phone: isAr ? "رقم الجوال" : "Mobile number",
    track: isAr ? "متابعة" : "Track",
    home: isAr ? "العودة للرئيسية" : "Back to home",

    required: isAr ? "يرجى إدخال رقم الطلب ورقم الجوال." : "Please enter request number and mobile.",
    refInvalid: isAr ? "رقم الطلب غير صحيح (أرقام فقط)." : "Invalid request number (digits only).",
    phoneInvalid: isAr ? "رقم الجوال غير صحيح." : "Invalid mobile number.",
    notFound: isAr ? "لم يتم العثور على طلب بهذا الرقم." : "Request not found.",
    mismatch: isAr ? "رقم الجوال غير مطابق لهذا الطلب." : "Mobile number does not match this request.",
    serverError: isAr ? "حدث خطأ. حاول لاحقًا." : "Something went wrong. Please try again.",

    result: isAr ? "نتيجة المتابعة" : "Result",
    statusPending: isAr ? "قيد الانتظار" : "Pending",
    statusApproved: isAr ? "مقبول" : "Approved",
    statusRejected: isAr ? "مرفوض" : "Rejected",
    login: isAr ? "تسجيل الدخول" : "Log In",
  };

  const [refInput, setRefInput] = React.useState("");
  const [phoneInput, setPhoneInput] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const [result, setResult] = React.useState<{
    ref: string;
    status: "pending" | "approved" | "rejected";
  } | null>(null);

  React.useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const refQ = digitsOnly(url.searchParams.get("ref") || "");
      const phoneQ = normalizePhone(url.searchParams.get("phone") || "");
      if (refQ) setRefInput(refQ);
      if (phoneQ) setPhoneInput(phoneQ);
    } catch {}
  }, []);

  function statusLabel(s: "pending" | "approved" | "rejected") {
    if (s === "approved") return t.statusApproved;
    if (s === "rejected") return t.statusRejected;
    return t.statusPending;
  }

  async function onTrack(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setMsg(null);
    setResult(null);

    const refDigits = digitsOnly(refInput);
    const phoneNorm = normalizePhone(phoneInput);

    if (!refDigits || !phoneNorm) {
      setMsg(t.required);
      return;
    }

    if (!/^\d+$/.test(refDigits) || Number(refDigits) <= 0) {
      setMsg(t.refInvalid);
      return;
    }

    if (!/^05\d{8}$/.test(phoneNorm)) {
      setMsg(t.phoneInvalid);
      return;
    }

    setLoading(true);

    try {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("ref", refDigits);
        url.searchParams.set("phone", phoneNorm);
        window.history.replaceState({}, "", url.toString());
      } catch {}

      const res = await fetch(
        `/api/providers/status?ref=${encodeURIComponent(refDigits)}&phone=${encodeURIComponent(phoneNorm)}`,
        { cache: "no-store" }
      );

      const data = (await res.json().catch(() => null)) as any;

      if (!res.ok || !data?.ok) {
        const err = String(data?.error || data?.message || "").toLowerCase();

        if (res.status === 404 || err.includes("not found")) setMsg(t.notFound);
        else if (res.status === 403 || err.includes("mismatch")) setMsg(t.mismatch);
        else if (res.status === 400) {
          if (err.includes("ref")) setMsg(t.refInvalid);
          else setMsg(t.phoneInvalid);
        } else setMsg(t.serverError);

        setLoading(false);
        return;
      }

      const st = String(data?.status || "pending").toLowerCase();
      const normalized: "pending" | "approved" | "rejected" =
        st === "approved" ? "approved" : st === "rejected" ? "rejected" : "pending";

      setResult({ ref: `LK-${refDigits}`, status: normalized });
      setLoading(false);
    } catch {
      setMsg(t.serverError);
      setLoading(false);
    }
  }

  // ✅ Mobile-first sizes
  const cardMax = 520;
  const inputH = 46;

  return (
    <main
      dir={isAr ? "rtl" : "ltr"}
      style={{
        minHeight: "calc(100vh - 120px)",
        display: "grid",
        placeItems: "center",
        padding: 14,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: cardMax,
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 18,
          boxShadow: "0 12px 28px rgba(0,0,0,0.10)",
          padding: 16,
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            margin: "0 0 6px",
            fontSize: "clamp(18px, 4.6vw, 20px)",
            fontWeight: 900,
            textAlign: "center",
          }}
        >
          {t.title}
        </h1>

        <p
          style={{
            margin: "0 0 14px",
            fontSize: "clamp(12px, 3.4vw, 13px)",
            opacity: 0.78,
            textAlign: "center",
            lineHeight: 1.7,
          }}
        >
          {t.hint}
        </p>

        <form onSubmit={onTrack} noValidate>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 900, display: "block", margin: "0 0 6px", opacity: 0.92 }}>
              {t.ref}
            </label>
            <input
              value={refInput}
              onChange={(e) => {
                const v = digitsOnly(e.target.value);
                setRefInput(v);
                if (msg) setMsg(null);
                if (result) setResult(null);
              }}
              inputMode="numeric"
              autoComplete="off"
              placeholder={isAr ? "مثال: 58" : "e.g. 58"}
              style={{
                width: "100%",
                height: inputH,
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,.18)",
                background: "rgba(255,255,255,0.96)",
                outline: "none",
                fontSize: 15,
                boxSizing: "border-box",
                textAlign: "center",
                fontWeight: 900,
              }}
              required
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 900, display: "block", margin: "0 0 6px", opacity: 0.92 }}>
              {t.phone}
            </label>
            <input
              value={phoneInput}
              onChange={(e) => {
                setPhoneInput(e.target.value);
                if (msg) setMsg(null);
                if (result) setResult(null);
              }}
              onBlur={() => setPhoneInput((v) => normalizePhone(v))}
              inputMode="tel"
              autoComplete="tel"
              placeholder="05xxxxxxxx"
              style={{
                width: "100%",
                height: inputH,
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,.18)",
                background: "rgba(255,255,255,0.96)",
                outline: "none",
                fontSize: 15,
                boxSizing: "border-box",
                textAlign: "center",
                fontWeight: 900,
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 12,
              width: "100%",
              height: 48,
              borderRadius: 14,
              border: 0,
              background: "#000",
              color: "#fff",
              fontWeight: 900,
              fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.65 : 1,
            }}
          >
            {t.track}
          </button>
        </form>

        {msg ? (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 900,
              border: "1px solid rgba(239,68,68,0.35)",
              background: "rgba(255,255,255,0.90)",
              lineHeight: 1.7,
              textAlign: "center",
            }}
            role="status"
            aria-live="polite"
          >
            {msg}
          </div>
        ) : null}

        {result ? (
          <div
            style={{
              marginTop: 16,
              textAlign: "center",
              padding: "12px 10px",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "rgba(255,255,255,0.88)",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6, fontWeight: 900 }}>{t.result}</div>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{result.ref}</div>
            <div style={{ fontSize: 13, fontWeight: 900 }}>{statusLabel(result.status)}</div>

            {result.status === "approved" && (
              <Link
                href={`/${locale}/providers/login`}
                style={{
                  display: "block",
                  marginTop: 16,
                  padding: "12px",
                  backgroundColor: "#000",
                  color: "#fff",
                  borderRadius: 12,
                  textDecoration: "none",
                  fontWeight: 900,
                  fontSize: 14,
                }}
              >
                {t.login || "تسجيل الدخول"}
              </Link>
            )}
          </div>
        ) : null}

        <div style={{ marginTop: 14, textAlign: "center" }}>
          <Link href={`/${locale}`} style={{ fontSize: 12, fontWeight: 900, textDecoration: "underline" }}>
            {t.home}
          </Link>
        </div>
      </div>
    </main>
  );
}
