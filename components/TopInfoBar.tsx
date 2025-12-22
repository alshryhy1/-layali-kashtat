"use client";

import * as React from "react";

type Locale = "ar" | "en";
type WeatherState = { ok: true; text: string } | { ok: false; text: string };

export default function TopInfoBar({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";

  const [time, setTime] = React.useState<string>("");

  React.useEffect(() => {
    const update = () => {
      const d = new Date();
      const formatted = d.toLocaleTimeString(isAr ? "ar-SA" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setTime(formatted);
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [isAr]);

  const [weather, setWeather] = React.useState<WeatherState>({
    ok: false,
    text: isAr ? "طقس: —" : "Weather: —",
  });

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const lang = isAr ? "ar" : "en";
        const url = `/api/weather?lang=${encodeURIComponent(lang)}`;

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`weather_http_${res.status}`);

        const json: any = await res.json();
        if (!json?.ok) throw new Error("weather_bad_payload");

        const temp = Number(json?.temp);
        const desc = String(json?.desc || "").trim();

        const t = Math.round(temp);
        const text = isAr
          ? `طقس: ${t}°C${desc ? ` • ${desc}` : ""}`
          : `Weather: ${t}°C${desc ? ` • ${desc}` : ""}`;

        if (!cancelled) setWeather({ ok: true, text });
      } catch {
        if (!cancelled) {
          setWeather({
            ok: false,
            text: isAr ? "طقس: غير متاح" : "Weather: unavailable",
          });
        }
      }
    };

    load();
    const i = setInterval(load, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, [isAr]);

  const marqueeText = isAr
    ? "مرحبًا بك في ليالي كشتات 👋 — قريبًا: إعلانات وخدمات جديدة — تابع آخر الأخبار هنا"
    : "Welcome to Layali Kashtat 👋 — Coming soon: announcements & updates — Stay tuned here";

  return (
    <div
      dir="ltr"
      style={{
        width: "100%",
        background: "rgba(0,0,0,0.92)",
        color: "#fff",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "12px 16px",
          display: "grid",
          gridTemplateColumns: "220px 1fr 220px",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          dir={isAr ? "rtl" : "ltr"}
          style={{
            fontWeight: 900,
            fontSize: 15,
            color: "#ff3b3b",
            display: "flex",
            alignItems: "center",
            gap: 6,
            justifyContent: "flex-start",
            whiteSpace: "nowrap",
          }}
          title={weather.ok ? "" : isAr ? "تحقق من الإعدادات" : "Check settings"}
        >
          <span style={{ fontSize: 16 }}>🌤️</span>
          <span>{weather.text}</span>
        </div>

        <div
          dir={isAr ? "rtl" : "ltr"}
          style={{
            overflow: "hidden",
            whiteSpace: "nowrap",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.14)",
            padding: "9px 14px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              fontSize: 15,
              fontWeight: 900,
              color: "#22c55e",
              animation: "lk_top_marquee 18s linear infinite",
            }}
          >
            {marqueeText}
            <span style={{ margin: "0 18px", opacity: 0.55, color: "#fff" }}>•</span>
            {marqueeText}
          </div>

          <style>{`
            @keyframes lk_top_marquee {
              0% { transform: translateX(${isAr ? "-" : ""}20%); }
              100% { transform: translateX(${isAr ? "" : "-"}120%); }
            }
          `}</style>
        </div>

        <div
          dir={isAr ? "rtl" : "ltr"}
          style={{
            fontWeight: 900,
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            gap: 6,
            justifyContent: "flex-end",
            whiteSpace: "nowrap",
            color: "#ffffff",
          }}
        >
          <span style={{ fontSize: 16 }}>⏰</span>
          <span>{time || "—"}</span>
        </div>
      </div>
    </div>
  );
}
