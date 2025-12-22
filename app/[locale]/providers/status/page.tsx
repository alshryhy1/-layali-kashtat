"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Locale = "ar" | "en";

function localeFromPath(pathname: string): Locale {
  const p = pathname || "/";
  if (p === "/en" || p.startsWith("/en/")) return "en";
  return "ar";
}

function t(locale: Locale) {
  const ar = locale === "ar";
  return {
    title: ar ? "متابعة حالة الطلب" : "Track Request Status",
    subtitle: ar
      ? "اكتب رقم الطلب ورقم الجوال المسجّل في الطلب."
      : "Enter the request number and the phone used in the request.",
    refLabel: ar ? "رقم الطلب" : "Request number",
    phoneLabel: ar ? "رقم الجوال" : "Phone number",
    check: ar ? "متابعة" : "Track",
    backHome: ar ? "العودة للرئيسية" : "Back to home",
    invalid: ar ? "الرجاء إدخال رقم طلب صحيح + رقم جوال صحيح." : "Enter a valid request number and phone.",
    notFound: ar ? "لم يتم العثور على طلب بهذه البيانات." : "No request found for these details.",
    mismatch: ar ? "رقم الجوال لا يطابق هذا الطلب." : "Phone does not match this request.",
    serverErr: ar ? "تعذّر جلب الحالة الآن. حاول مرة أخرى." : "Could not load status. Please try again.",
    statusLabel: ar ? "الحالة" : "Status",
    pending: ar ? "انتظار" : "Pending",
    approved: ar ? "مقبول" : "Approved",
    rejected: ar ? "مرفوض" : "Rejected",
    updatedAt: ar ? "آخر تحديث" : "Last update",
    loading: ar ? "جارٍ التحقق..." : "Checking...",
  };
}

function statusText(locale: Locale, s: string) {
  const m = t(locale);
  if (s === "approved") return m.approved;
  if (s === "rejected") return m.rejected;
  return m.pending;
}

type ApiOk = {
  ok: true;
  ref: number;
  status: "pending" | "approved" | "rejected";
  updated_at: string | null;
  created_at: string | null;
};

type ApiErr = { ok: false; error?: string };

async function fetchStatus(ref: string, phone: string) {
  const url = `/api/providers/status?ref=${encodeURIComponent(ref)}&phone=${encodeURIComponent(phone)}`;
  const res = await fetch(url, { method: "GET" });
  const j = (await res.json().catch(() => null)) as ApiOk | ApiErr | null;
  return { res, j };
}

export default function ProviderStatusPage() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const sp = useSearchParams();

  const locale: Locale = localeFromPath(pathname);
  const m = t(locale);

  const initialRef = (sp.get("ref") || "").trim();
  const initialPhone = (sp.get("phone") || "").trim();

  const [ref, setRef] = React.useState(initialRef);
  const [phone, setPhone] = React.useState(initialPhone);

  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [okData, setOkData] = React.useState<ApiOk | null>(null);

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 720,
    background: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 12px 30px rgba(0,0,0,0.10)",
    border: "1px solid rgba(0,0,0,0.06)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #d8d8d8",
    fontSize: 14,
    outline: "none",
  };

  const btnStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  };

  const linkStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #d0d0d0",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  };

  const alertStyle: React.CSSProperties = {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #f2caca",
    background: "#fff5f5",
  };

  function pushUrl(nextRef: string, nextPhone: string) {
    const base = pathname.split("?")[0];
    const qs = `?ref=${encodeURIComponent(nextRef)}&phone=${encodeURIComponent(nextPhone)}`;
    router.replace(`${base}${qs}`);
  }

  async function runCheck(nextRef: string, nextPhone: string) {
    setLoading(true);
    setErrorMsg(null);
    setOkData(null);

    const refTrim = String(nextRef || "").trim();
    const phoneTrim = String(nextPhone || "").trim();
    const refNum = Number(refTrim);

    if (!refTrim || !phoneTrim || !Number.isFinite(refNum) || refNum <= 0) {
      setLoading(false);
      setErrorMsg(m.invalid);
      return;
    }

    try {
      const { res, j } = await fetchStatus(refTrim, phoneTrim);

      if (!res.ok || !j) {
        // تمييز الحالات الأساسية
        if (res.status === 404) setErrorMsg(m.notFound);
        else if (res.status === 403) setErrorMsg(m.mismatch);
        else setErrorMsg(m.serverErr);
        setLoading(false);
        return;
      }

      if ((j as any).ok !== true) {
        if (res.status === 404) setErrorMsg(m.notFound);
        else if (res.status === 403) setErrorMsg(m.mismatch);
        else setErrorMsg(m.serverErr);
        setLoading(false);
        return;
      }

      setOkData(j as ApiOk);
      setLoading(false);
    } catch {
      setErrorMsg(m.serverErr);
      setLoading(false);
    }
  }

  // ✅ لو فتح الرابط وفيه ref+phone: نفّذ التحقق تلقائيًا مرة واحدة
  const didAuto = React.useRef(false);
  React.useEffect(() => {
    if (didAuto.current) return;
    didAuto.current = true;

    const r = initialRef;
    const p = initialPhone;
    if (r && p) {
      runCheck(r, p);
    }
  }, [initialRef, initialPhone]);

  return (
    <main
      dir={locale === "ar" ? "rtl" : "ltr"}
      style={{
        minHeight: "calc(100vh - 70px)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.62), rgba(255,255,255,0.62)), url('/bg-desert.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div style={cardStyle}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>{m.title}</h1>
            <p style={{ margin: 0, opacity: 0.75, fontSize: 14 }}>{m.subtitle}</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const r = ref.trim();
              const p = phone.trim();
              pushUrl(r, p);
              runCheck(r, p);
            }}
            style={{ display: "grid", gap: 10 }}
          >
            <label style={{ fontSize: 13, fontWeight: 900 }}>{m.refLabel}</label>
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              inputMode="numeric"
              placeholder={locale === "ar" ? "مثال: 49" : "e.g. 49"}
              style={inputStyle}
              name="ref"
            />

            <label style={{ fontSize: 13, fontWeight: 900 }}>{m.phoneLabel}</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder={locale === "ar" ? "مثال: 05xxxxxxxx" : "e.g. 05xxxxxxxx"}
              style={inputStyle}
              name="phone"
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="submit" style={btnStyle} disabled={loading}>
                {loading ? m.loading : m.check}
              </button>

              <a href={`/${locale}`} style={linkStyle}>
                {m.backHome}
              </a>
            </div>
          </form>

          {errorMsg ? (
            <div style={alertStyle}>
              <strong>{errorMsg}</strong>
            </div>
          ) : null}

          {okData ? (
            <div
              style={{
                marginTop: 10,
                padding: 14,
                borderRadius: 14,
                border: "1px solid #e7e7e7",
                background: "#fff",
              }}
            >
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontWeight: 900 }}>{m.refLabel}</span>
                  <span style={{ fontWeight: 900 }}>{okData.ref}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontWeight: 900 }}>{m.statusLabel}</span>
                  <span style={{ fontWeight: 900 }}>{statusText(locale, okData.status)}</span>
                </div>

                {okData.updated_at ? (
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, opacity: 0.85 }}>
                    <span style={{ fontWeight: 800 }}>{m.updatedAt}</span>
                    <span style={{ fontWeight: 800 }}>
                      {new Date(okData.updated_at).toLocaleString(locale === "ar" ? "ar-SA" : "en-US")}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
