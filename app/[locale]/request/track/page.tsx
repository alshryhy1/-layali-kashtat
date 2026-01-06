"use client";

import * as React from "react";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

function safeText(v: unknown) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

function getParam(sp: URLSearchParams, k: string) {
  return String(sp.get(k) || "").trim();
}

function normalizePhoneForLinks(input: string) {
  const map: Record<string, string> = { "٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9" };
  const s = String(input || "").replace(/[٠-٩]/g, (d) => map[d] ?? d).replace(/\s+/g, "");
  const digits = s.replace(/[^0-9+]/g, "");
  const tel = digits.replace(/\+/g, "");
  let wa = tel;
  if (tel.startsWith("0") && tel.length >= 9) {
    wa = "966" + tel.slice(1);
  } else if (tel.startsWith("+966")) {
    wa = tel.slice(1);
  }
  return { tel, wa };
}

function isMobileUA() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function mobileMapUrl(loc: string) {
  const s = String(loc || "");
  const isIOS = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  return isIOS ? `maps://?q=${encodeURIComponent(s)}` : `geo:0,0?q=${encodeURIComponent(s)}`;
}

type StatusRespOk = {
  ok: true;
  ref: string;
  status: "pending" | "approved" | "rejected";
  completed: boolean;
  city?: string;
  service_type?: string;
  updated_at?: string;
  accepted_provider_id?: number | null;
  accepted_provider_name?: string;
  accepted_provider_phone?: string;
  accepted_provider_email?: string;
  accepted_price_total?: number | null;
  accepted_price_currency?: string;
  accepted_price_notes?: string;
  accepted_meeting_location?: string;
  accepted_payment_method?: string;
  accepted_payment_details?: string;
};

type StatusRespFail = { ok: false; code?: string; message?: string };

type CompleteRespOk = {
  ok: true;
  ref: string;
  status: "pending" | "approved" | "rejected";
  completed: true;
  updated?: boolean;
};

type CompleteRespFail = { ok: false; code?: string; message?: string };

function statusLabel(locale: Locale, status: string) {
  const isAr = locale === "ar";
  if (status === "approved") return isAr ? "تم قبول طلبك" : "Approved";
  if (status === "rejected") return isAr ? "تم رفض طلبك" : "Rejected";
  return isAr ? "طلبك قيد الانتظار" : "Pending";
}

function statusHint(locale: Locale, status: string) {
  const isAr = locale === "ar";
  if (status === "approved")
    return isAr
      ? "تم قبول الطلب من مقدم الخدمة. عند انتهاء الرحلة اضغط (تمت الرحلة) لفتح طلب جديد."
      : "Your request was approved. When your trip is done, tap (Trip Completed) to enable a new request.";
  if (status === "rejected")
    return isAr
      ? "تم رفض الطلب. يمكنك المحاولة مرة أخرى بطلب جديد."
      : "Your request was rejected. You can try again with a new request.";
  return isAr
    ? "بانتظار قبول مقدم الخدمة. يمكنك العودة لاحقًا للتحقق."
    : "Waiting for provider approval. Check again later.";
}

export default function TrackRequestPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale: Locale = asLocale(params?.locale);
  const isAr = locale === "ar";

  const sp = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );

  const [ref, setRef] = React.useState(() => getParam(sp, "ref"));
  const [contact, setContact] = React.useState(() => getParam(sp, "contact"));

  const [loading, setLoading] = React.useState(false);
  const [completing, setCompleting] = React.useState(false);
  const [rating, setRating] = React.useState<number | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [locCopied, setLocCopied] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<StatusRespOk | null>(null);

  const t = {
    title: isAr ? "متابعة الطلب" : "Track Request",
    hint: isAr
      ? "أدخل رقم الطلب ثم الجوال أو الإيميل المسجل على نفس الطلب."
      : "Enter your request ID and the phone or email used for that request.",
    ref: isAr ? "رقم الطلب" : "Request ID",
    contact: isAr ? "الجوال أو الإيميل" : "Phone or Email",
    check: isAr ? "تحقق" : "Check",
    checking: isAr ? "جاري التحقق..." : "Checking...",
    backHome: isAr ? "الرجوع للرئيسية" : "Back to home",
    newReq: isAr ? "طلب جديد" : "New Request",
    tripDone: isAr ? "تمت الرحلة" : "Trip Completed",
    completing: isAr ? "جاري الإنهاء..." : "Completing...",
    need: isAr ? "أدخل رقم الطلب والجوال/الإيميل." : "Enter request ID and phone/email.",
    providerInfo: isAr ? "بيانات مقدم الخدمة" : "Provider Details",
    providerName: isAr ? "اسم مقدم الخدمة" : "Provider Name",
    providerPhone: isAr ? "رقم الجوال" : "Phone",
    price: isAr ? "السعر" : "Price",
    meetingLocation: isAr ? "نقطة الالتقاء" : "Meeting Location",
    paymentMethod: isAr ? "طريقة الدفع" : "Payment Method",
    paymentTransfer: isAr ? "تحويل بنكي/رقمي" : "Bank/Digital Transfer",
    paymentCash: isAr ? "نقداً" : "Cash",
    transferDetails: isAr ? "معلومات الدفع" : "Payment Details",
    call: isAr ? "اتصال" : "Call",
    whatsapp: isAr ? "واتساب" : "WhatsApp",
  };

  async function fetchStatus() {
    setError(null);
    setResult(null);

    const r = safeText(ref);
    const c = safeText(contact);
    if (!r || !c) {
      setError(t.need);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/customer-requests/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ref: r, contact: c }),
      });

      const data = (await res.json()) as StatusRespOk | StatusRespFail;

      if (!res.ok || !("ok" in data) || data.ok === false) {
        setError(String((data as StatusRespFail)?.message || "Error"));
        setLoading(false);
        return;
      }

      setResult(data as StatusRespOk);
      setLoading(false);
    } catch {
      setError(isAr ? "تعذر الاتصال بالخادم." : "Failed to reach server.");
      setLoading(false);
    }
  }

  async function completeTrip() {
    setError(null);
    const r = safeText(ref);
    const c = safeText(contact);
    if (!r || !c) {
      setError(t.need);
      return;
    }
    if (!rating) {
      setError(isAr ? "اختر التقييم قبل إنهاء الرحلة." : "Select rating before completing.");
      return;
    }

    setCompleting(true);
    try {
      const res = await fetch("/api/customer-requests/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ref: r, contact: c, rating }),
      });

      const data = (await res.json()) as CompleteRespOk | CompleteRespFail;

      if (!res.ok || !("ok" in data) || data.ok === false) {
        setError(String((data as CompleteRespFail)?.message || "Error"));
        setCompleting(false);
        return;
      }

      // بعد الإنهاء نعيد جلب الحالة لتحديث الواجهة
      await fetchStatus();
      setCompleting(false);
    } catch {
      setError(isAr ? "تعذر الاتصال بالخادم." : "Failed to reach server.");
      setCompleting(false);
    }
  }

  function goNew() {
    window.location.href = `/${locale}/request/customer`;
  }

  async function doCopyRef(v: string) {
    const text = String(v || "");
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
        return;
      }
    } catch {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.setAttribute("readonly", "");
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  }
  async function copyLocation(v: string) {
    const text = String(v || "");
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
        setLocCopied(true);
        window.setTimeout(() => setLocCopied(false), 1500);
        return;
      }
    } catch {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.setAttribute("readonly", "");
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      document.execCommand("copy");
      document.body.removeChild(ta);
      setLocCopied(true);
      window.setTimeout(() => setLocCopied(false), 1500);
    } catch {}
  }

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    padding: "24px 16px",
    display: "flex",
    justifyContent: "center",
    background: "#f6f3ee",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 560,
    background: "#fff",
    border: "1px solid #e7e0d6",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
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
  };

  const btnPrimary: React.CSSProperties = {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
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

  const infoBox: React.CSSProperties = {
    marginTop: 12,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fbfaf8",
    color: "#111",
    fontSize: 12.5,
    lineHeight: 1.7,
    fontWeight: 850,
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

  const statusPill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.16)",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    fontSize: 12.5,
  };

  const smallRow: React.CSSProperties = {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 8,
  };

  return (
    <main style={pageStyle} dir={isAr ? "rtl" : "ltr"}>
      <div style={cardStyle}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{t.title}</h1>
        <p style={{ margin: "10px 0 12px", color: "#666", fontSize: 13, lineHeight: 1.7 }}>
          {t.hint}
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={labelStyle}>{t.ref}</label>
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              style={inputStyle}
              placeholder="LK-000000"
              inputMode="text"
            />
          </div>

          <div>
            <label style={labelStyle}>{t.contact}</label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              style={inputStyle}
              placeholder={isAr ? "05xxxxxxxx أو email" : "05xxxxxxxx or email"}
              inputMode="text"
            />
          </div>

          {error ? <div style={errorBox}>{error}</div> : null}

          <button
            type="button"
            style={{
              ...btnPrimary,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onClick={fetchStatus}
            disabled={loading}
          >
            {loading ? t.checking : t.check}
          </button>

          <button
            type="button"
            style={btnGhost}
            onClick={() => (window.location.href = `/${locale}`)}
          >
            {t.backHome}
          </button>
        </div>

        {result ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <div style={statusPill}>
                  {statusLabel(locale, result.status)} — {result.ref}
                </div>
                <button
                  type="button"
                  onClick={() => doCopyRef(result.ref)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 999,
                    border: "1px solid #111",
                    background: copied ? "#111" : "#fff",
                    color: copied ? "#fff" : "#111",
                    fontWeight: 900,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {copied ? (isAr ? "نُسخ" : "Copied") : (isAr ? "نسخ" : "Copy")}
                </button>
              </div>

              <div style={smallRow}>
                {result.city ? <span style={statusPill}>{result.city}</span> : null}
                {result.service_type ? <span style={statusPill}>{result.service_type}</span> : null}
                {result.completed ? <span style={statusPill}>{isAr ? "مكتمل" : "Completed"}</span> : null}
              </div>
            </div>

            <div style={infoBox}>{statusHint(locale, result.status)}</div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {result.status === "rejected" ? (
                <button type="button" style={btnPrimary} onClick={goNew}>
                  {t.newReq}
                </button>
              ) : null}

              {/* إذا مكتمل: زر طلب جديد */}
              {result.completed === true ? (
                <button type="button" style={btnPrimary} onClick={goNew}>
                  {t.newReq}
                </button>
              ) : null}
            </div>

            {result.status === "approved" ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ ...infoBox, background: "#fff" }}>
                  <div style={{ marginBottom: 8, fontWeight: 900 }}>{t.providerInfo}</div>
                  {result.accepted_provider_name ? (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontWeight: 900 }}>{t.providerName}:</span> {result.accepted_provider_name}
                    </div>
                  ) : null}
                  {result.accepted_provider_phone ? (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontWeight: 900 }}>{t.providerPhone}:</span> {result.accepted_provider_phone}
                    </div>
                  ) : null}
                  {result.accepted_provider_phone ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                      {(() => {
                        const l = normalizePhoneForLinks(String(result.accepted_provider_phone || ""));
                        const msg =
                          isAr
                            ? `مرحباً، بخصوص الطلب ${result.ref}`
                            : `Hello, regarding request ${result.ref}`;
                        const waUrl = `https://wa.me/${l.wa}?text=${encodeURIComponent(msg)}`;
                        const telUrl = `tel:${l.tel}`;
                        const circleBase: React.CSSProperties = {
                          width: 44,
                          height: 44,
                          borderRadius: 999,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textDecoration: "none",
                          fontWeight: 900,
                          fontSize: 18,
                          border: "1px solid rgba(0,0,0,0.2)",
                          background: "#fff",
                          color: "#111",
                        };
                        const circleCall: React.CSSProperties = { ...circleBase };
                        const circleWhats: React.CSSProperties = {
                          ...circleBase,
                          border: "1px solid #25D366",
                          color: "#25D366",
                        };
                        return (
                          <>
                            <a href={telUrl} style={circleCall} title={t.call} aria-label={t.call}>📞</a>
                            <a href={waUrl} style={circleWhats} title={t.whatsapp} aria-label={t.whatsapp} target="_blank" rel="noopener noreferrer">WA</a>
                          </>
                        );
                      })()}
                    </div>
                  ) : null}
                  {typeof result.accepted_price_total === "number" ? (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontWeight: 900 }}>{t.price}:</span> {result.accepted_price_total}{" "}
                      {result.accepted_price_currency || "SAR"}
                    </div>
                  ) : null}
                  {result.accepted_meeting_location ? (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontWeight: 900 }}>{t.meetingLocation}:</span> {result.accepted_meeting_location}
                      <div style={{ marginTop: 6 }}>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.accepted_meeting_location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: 32,
                            padding: "0 12px",
                            borderRadius: 999,
                            border: "1px solid #111",
                            background: "#fff",
                            color: "#111",
                            fontWeight: 900,
                            fontSize: 12,
                            textDecoration: "none",
                          }}
                        >
                          {isAr ? "عرض على الخريطة" : "Open Map"}
                        </a>
                        {isMobileUA() ? (
                          <a
                            href={mobileMapUrl(String(result.accepted_meeting_location || ""))}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: 32,
                              padding: "0 12px",
                              borderRadius: 999,
                              border: "1px solid #111",
                              background: "#fff",
                              color: "#111",
                              fontWeight: 900,
                              fontSize: 12,
                              textDecoration: "none",
                              marginLeft: 8,
                            }}
                          >
                            {isAr ? "فتح في تطبيق الخرائط" : "Open in Maps App"}
                          </a>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => copyLocation(String(result.accepted_meeting_location || ""))}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: 32,
                            padding: "0 12px",
                            borderRadius: 999,
                            border: "1px solid #111",
                            background: locCopied ? "#111" : "#fff",
                            color: locCopied ? "#fff" : "#111",
                            fontWeight: 900,
                            fontSize: 12,
                            cursor: "pointer",
                            marginLeft: 8,
                          }}
                        >
                          {locCopied ? (isAr ? "نُسخ" : "Copied") : (isAr ? "نسخ الموقع" : "Copy Location")}
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {result.accepted_payment_method ? (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontWeight: 900 }}>{t.paymentMethod}:</span>{" "}
                      {result.accepted_payment_method === "transfer" ? t.paymentTransfer : t.paymentCash}
                    </div>
                  ) : null}
                  {result.accepted_payment_method === "transfer" && result.accepted_payment_details ? (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontWeight: 900 }}>{t.transferDetails}:</span>
                      <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{result.accepted_payment_details}</div>
                    </div>
                  ) : null}
                  {result.completed === false ? (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ marginBottom: 6, fontWeight: 900 }}>{isAr ? "التقييم لمقدم الخدمة" : "Rate Provider"}</div>
                      <select
                        value={rating ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setRating(v ? parseInt(v, 10) : null);
                        }}
                        style={{ ...inputStyle, height: 42 }}
                      >
                        <option value="">{isAr ? "اختر التقييم" : "Select rating"}</option>
                        {(
                          isAr
                            ? [
                                { v: 1, t: "1️⃣ سيّئ جدًا" },
                                { v: 2, t: "2️⃣ سيّئ" },
                                { v: 3, t: "3️⃣ مقبول" },
                                { v: 4, t: "4️⃣ جيد" },
                                { v: 5, t: "5️⃣ ممتاز" },
                              ]
                            : [
                                { v: 1, t: "1️⃣ Very Poor" },
                                { v: 2, t: "2️⃣ Poor" },
                                { v: 3, t: "3️⃣ Fair / Average" },
                                { v: 4, t: "4️⃣ Good" },
                                { v: 5, t: "5️⃣ Excellent" },
                              ]
                        ).map((o) => (
                          <option key={o.v} value={o.v}>{o.t}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        style={{
                          ...btnPrimary,
                          marginTop: 10,
                          opacity: completing ? 0.7 : 1,
                          cursor: completing ? "not-allowed" : "pointer",
                        }}
                        onClick={completeTrip}
                        disabled={completing}
                      >
                        {completing ? t.completing : t.tripDone}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
