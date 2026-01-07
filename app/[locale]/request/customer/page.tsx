"use client";

import * as React from "react";

type Locale = "ar" | "en";

function safeText(v: unknown) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

function normalizePhone(input: string) {
  const s = safeText(input);
  const map: Record<string, string> = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };
  const ascii = s.replace(/[٠-٩]/g, (d) => map[d] ?? d).replace(/\s+/g, "");
  return ascii.replace(/[^0-9+]/g, "");
}

function isValidEmail(email: string) {
  const e = safeText(email).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function detectLocaleFromPath(): Locale {
  if (typeof window === "undefined") return "ar";
  const p = String(window.location.pathname || "");
  // أمثلة: /ar/request/customer  أو /en/request/customer
  return p.startsWith("/en") ? "en" : "ar";
}

type ActiveOk =
  | { ok: true; found: false }
  | { ok: true; found: true; ref: string; status: string; completed: boolean };

type ActiveFail = { ok: false; code?: string; message?: string };

export default function CustomerRequestCustomerPage() {
  const [locale, setLocale] = React.useState<Locale>("ar");

  React.useEffect(() => {
    setLocale(detectLocaleFromPath());
  }, []);

  const isAr = locale === "ar";

  const t = {
    title: isAr ? "بيانات العميل" : "Customer Info",
    desc: isAr ? "أدخل البيانات ثم اضغط التالي." : "Enter your details then tap Next.",
    name: isAr ? "الاسم" : "Name",
    phone: isAr ? "رقم الجوال" : "Mobile",
    email: isAr ? "البريد الإلكتروني" : "Email",
    next: isAr ? "التالي" : "Next",
    checking: isAr ? "جاري التحقق..." : "Checking...",
    backHome: isAr ? "الرجوع للرئيسية" : "Back to home",
    errName: isAr ? "يرجى إدخال الاسم." : "Please enter your name.",
    errPhone: isAr ? "يرجى إدخال رقم جوال صحيح." : "Please enter a valid phone number.",
    errEmail: isAr ? "يرجى إدخال بريد إلكتروني صحيح." : "Please enter a valid email.",
    locked: isAr
      ? "لديك طلب فعّال سابق — سيتم تحويلك لصفحة المتابعة."
      : "You already have an active request — redirecting to tracking.",
  };

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  async function onNext() {
    setError(null);
    setInfo(null);

    const n = safeText(name);
    const p = normalizePhone(phone);
    const e = safeText(email).toLowerCase();

    if (!n) return setError(t.errName);
    if (!p || p.length < 8) return setError(t.errPhone);
    if (!e || !isValidEmail(e)) return setError(t.errEmail);

    setLoading(true);

    try {
      const res = await fetch("/api/customer-requests/active", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: n, phone: p, email: e }),
      });

      const data = (await res.json()) as ActiveOk | ActiveFail;

      if (!res.ok || !("ok" in data) || (data as any).ok === false) {
        setError(String((data as ActiveFail)?.message || (isAr ? "خطأ غير معروف." : "Unknown error.")));
        setLoading(false);
        return;
      }

      const ok = data as ActiveOk;

      if ("found" in ok && ok.found === true && ok.ref) {
        setInfo(t.locked);
        const q = new URLSearchParams();
        q.set("ref", ok.ref);
        window.location.href = `/${locale}/request/track?${q.toString()}`;
        return;
      }

      const q = new URLSearchParams();
      q.set("name", n);
      q.set("phone", p);
      q.set("email", e);
      q.set("accepted", "1");
      window.location.href = `/${locale}/request/service?${q.toString()}`;
    } catch {
      setError(isAr ? "تعذر الاتصال بالخادم." : "Failed to reach server.");
      setLoading(false);
    }
  }

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    padding: "24px 16px",
    display: "flex",
    justifyContent: "center",
    background: "linear-gradient(135deg, #fdfbf7 0%, #d4c5b0 100%)",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 560,
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.6)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 900,
    color: "#111",
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 44,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.16)",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    fontSize: 13,
    boxSizing: "border-box",
    outline: "none",
    textAlign: isAr ? "right" : "left",
  };

  const btnPrimary: React.CSSProperties = {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid #92400e",
    background: "#92400e",
    color: "#fff",
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(146, 64, 14, 0.3)",
  };

  const btnGhost: React.CSSProperties = {
    width: "100%",
    height: 42,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.2)",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
  };

  const errorBox: React.CSSProperties = {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(180, 0, 0, 0.25)",
    background: "rgba(180, 0, 0, 0.06)",
    color: "#7a0000",
    fontSize: 12.5,
    fontWeight: 900,
  };

  const infoBox: React.CSSProperties = {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0, 0, 0, 0.16)",
    background: "#fbfaf8",
    color: "#111",
    fontSize: 12.5,
    fontWeight: 900,
    lineHeight: 1.7,
  };

  return (
    <main style={pageStyle} dir={isAr ? "rtl" : "ltr"}>
      <div style={cardStyle}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{t.title}</h1>
        <p style={{ margin: "10px 0 12px", color: "#666", fontSize: 13, lineHeight: 1.7 }}>{t.desc}</p>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={labelStyle}>{t.name}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{t.phone}</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
              inputMode="tel"
              placeholder="05xxxxxxxx"
            />
          </div>

          <div>
            <label style={labelStyle}>{t.email}</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              inputMode="email"
              placeholder="name@email.com"
            />
          </div>

          {info ? <div style={infoBox}>{info}</div> : null}
          {error ? <div style={errorBox}>{error}</div> : null}

          <button
            type="button"
            onClick={onNext}
            style={{
              ...btnPrimary,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? t.checking : t.next}
          </button>

          <button type="button" onClick={() => (window.location.href = `/${locale}`)} style={btnGhost}>
            {t.backHome}
          </button>
        </div>
      </div>
    </main>
  );
}
