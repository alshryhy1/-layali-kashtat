"use client";

import { Suspense } from "react";
import * as React from "react";
import { useSearchParams } from "next/navigation";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

function getParam(sp: URLSearchParams, k: string) {
  return String(sp.get(k) || "").trim();
}

function SuccessContent({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.snaptr) {
        window.snaptr('track', 'SIGN_UP');
      }
      if (window.ttq) {
        window.ttq.track('CompleteRegistration');
      }
    }
  }, []);

  const ref = searchParams.get("ref") || "";
  const city = searchParams.get("city") || "";
  const service = searchParams.get("service") || "";

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
    color: "#000",
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
    marginBottom: 8,
  };

  return (
    <div style={pageStyle} dir={isAr ? "rtl" : "ltr"}>
      <div style={cardStyle}>
        <div style={{ marginBottom: 12 }}>
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16a34a"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, color: "#111" }}>
          {t.title}
        </h1>
        <p style={{ fontSize: 14, color: "#555", lineHeight: 1.5, marginBottom: 24 }}>
          {t.desc}
        </p>

        <div style={{ background: "#fbfaf8", border: "1px solid #e7e0d6", borderRadius: 12, padding: 16, marginBottom: 24, textAlign: isAr ? "right" : "left" }}>
          {ref && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 2 }}>
                {t.ref}
              </span>
              <span style={{ fontSize: 15, fontWeight: 900, color: "#111", fontFamily: "monospace" }}>
                {ref}
              </span>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {city && (
              <div style={pill}>
                <span style={{ color: "#888", marginRight: isAr ? 0 : 4, marginLeft: isAr ? 4 : 0 }}>
                  📍
                </span>
                {city}
              </div>
            )}
            {service && (
              <div style={pill}>
                <span style={{ color: "#888", marginRight: isAr ? 0 : 4, marginLeft: isAr ? 4 : 0 }}>
                  🏕️
                </span>
                {service}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            style={btnPrimary}
            onClick={() => window.location.href = `/${locale}/customer/track?ref=${ref}`}
          >
            {t.track}
          </button>

          <button
            style={btnGhost}
            onClick={() => window.location.href = `/${locale}/request`}
          >
            {t.newReq}
          </button>

          <a
            href={`/${locale}`}
            style={{ fontSize: 13, color: "#666", textDecoration: "underline", fontWeight: 700 }}
          >
            {t.backHome}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function RequestSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = React.useState<Locale>("ar");

  React.useEffect(() => {
    params.then((p) => setLocale(asLocale(p?.locale)));
  }, [params]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent locale={locale} />
    </Suspense>
  );
}
