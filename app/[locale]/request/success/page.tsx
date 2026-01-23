"use client";

import * as React from "react";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

function getParam(sp: URLSearchParams, k: string) {
  return String(sp.get(k) || "").trim();
}

export default function RequestSuccessPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale: Locale = asLocale(params?.locale);
  const isAr = locale === "ar";

  const sp = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.snaptr) {
      window.snaptr('track', 'SIGN_UP');
    }
  }, []);

  const ref = getParam(sp, "ref");
  const city = getParam(sp, "city");
  const service = getParam(sp, "service");

  const t = {
    title: isAr ? "تم إرسال الطلب" : "Request Sent",
    desc: isAr
      ? "تم استلام طلبك بنجاح. سيتم التواصل معك قريبًا."
      : "Your request has been received successfully. We will contact you soon.",
    ref: isAr ? "رقم الطلب" : "Request ID",
    city: isAr ? "المدينة" : "City",
    service: isAr ? "نوع الخدمة" : "Service Type",
    backHome: isAr ? "الرجوع للرئيسية" : "Back to Home",
    newReq: isAr ? "طلب جديد" : "New Request",
    track: isAr ? "متابعة الطلب" : "Track Request",
  };

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
    textAlign: "center",
  };

  const pill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.16)",
    background: "#fbfaf8",
    color: "#111",
    fontWeight: 900,
    fontSize: 12.5,
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

  const btnMid: React.CSSProperties = {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.22)",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
  };

  function goTrack() {
    const q = new URLSearchParams();
    if (ref) q.set("ref", ref);
    window.location.href = `/${locale}/request/track?${q.toString()}`;
  }

  return (
    <main style={pageStyle} dir={isAr ? "rtl" : "ltr"}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 36, lineHeight: "36px" }}>✅</div>

          <h1 style={{ margin: "10px 0 0", fontSize: 20, fontWeight: 900, color: "#111" }}>
            {t.title}
          </h1>

          <p style={{ margin: "10px 0 14px", color: "#666", fontSize: 13, lineHeight: 1.7 }}>
            {t.desc}
          </p>

          <div style={{ display: "grid", gap: 8, justifyItems: "center" }}>
            {ref ? (
              <div style={pill}>
                {t.ref}: {ref}
              </div>
            ) : null}

            {city ? (
              <div style={pill}>
                {t.city}: {city}
              </div>
            ) : null}

            {service ? (
              <div style={pill}>
                {t.service}: {service}
              </div>
            ) : null}
          </div>

          <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
            <button type="button" style={btnPrimary} onClick={() => (window.location.href = `/${locale}`)}>
              {t.backHome}
            </button>

            <button type="button" style={btnMid} onClick={goTrack}>
              {t.track}
            </button>

            <button
              type="button"
              style={btnGhost}
              onClick={() => (window.location.href = `/${locale}/request/customer`)}
            >
              {t.newReq}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
