"use client";

import * as React from "react";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

function getParam(sp: URLSearchParams, k: string) {
  return String(sp.get(k) || "").trim();
}

export default function CityStepPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale: Locale = asLocale(params?.locale);
  const isAr = locale === "ar";

  const sp = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );

  const name = getParam(sp, "name");
  const phone = getParam(sp, "phone");
  const accepted = getParam(sp, "accepted");
  const service = getParam(sp, "service");

  // حماية التدفق: لازم بيانات الخطوتين السابقة
  React.useEffect(() => {
    if (!name || !phone || accepted !== "1" || !service) {
      window.location.href = `/${locale}/request/service`;
    }
  }, [name, phone, accepted, service, locale]);

  const t = {
    title: isAr ? "المدينة" : "City",
    hint: isAr ? "اختر المدينة المطلوبة." : "Choose the required city.",
    next: isAr ? "التالي: تأكيد الطلب" : "Next: Confirm Request",
    back: isAr ? "رجوع" : "Back",
  };

  const cities = isAr
    ? [
        "الرياض",
        "جدة",
        "مكة",
        "المدينة",
        "الدمام",
        "تبوك",
        "حائل",
        "الجوف",
        "الحدود الشمالية",
      ]
    : [
        "Riyadh",
        "Jeddah",
        "Makkah",
        "Madinah",
        "Dammam",
        "Tabuk",
        "Hail",
        "Al Jouf",
        "Northern Borders",
      ];

  const [city, setCity] = React.useState("");

  function goNext() {
    if (!city) return;

    if (typeof window !== "undefined") {
      window.localStorage.setItem("lk_city", city);
    }

    const q = new URLSearchParams();
    q.set("name", name);
    q.set("phone", phone);
    q.set("accepted", "1");
    q.set("service", service);
    q.set("city", city);

    // حسب ترتيبك: الخطوة (4)
    window.location.href = `/${locale}/request/confirm?${q.toString()}`;
  }

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    padding: "24px 16px",
    display: "flex",
    justifyContent: "center",
    background: "linear-gradient(135deg, #fdfbf7 0%, #d4c5b0 100%)",
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.6)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
  };

  const optionStyle = (active: boolean): React.CSSProperties => ({
    height: 44,
    borderRadius: 12,
    border: active ? "2px solid #92400e" : "1px solid rgba(0,0,0,0.16)",
    background: active ? "#92400e" : "#fff",
    color: active ? "#fff" : "#111",
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
  });

  return (
    <main style={pageStyle} dir={isAr ? "rtl" : "ltr"}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={cardStyle}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>
            {t.title}
          </h1>

          <p style={{ margin: "10px 0 14px", fontSize: 13, color: "#666" }}>
            {t.hint}
          </p>

          <div style={{ display: "grid", gap: 10 }}>
            {cities.map((c) => (
              <button
                key={c}
                type="button"
                style={optionStyle(city === c)}
                onClick={() => setCity(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <button
              type="button"
              onClick={goNext}
              disabled={!city}
              style={{
                height: 44,
                borderRadius: 12,
                border: "1px solid #92400e",
                background: "#92400e",
                color: "#fff",
                fontWeight: 900,
                fontSize: 13,
                opacity: city ? 1 : 0.5,
                cursor: city ? "pointer" : "not-allowed",
                boxShadow: "0 4px 12px rgba(146, 64, 14, 0.3)",
              }}
            >
              {t.next}
            </button>

            <button
              type="button"
              onClick={() => window.history.back()}
              style={{
                height: 40,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.2)",
                background: "#fff",
                color: "#111",
                fontWeight: 900,
                fontSize: 13,
              }}
            >
              {t.back}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
