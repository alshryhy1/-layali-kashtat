"use client";

import * as React from "react";

type Locale = "ar" | "en";

type Props = {
  locale: Locale;
  text?: string;
  weatherText?: string;
};

export default function TopInfoBar({ locale, text, weatherText }: Props) {
  const isAr = locale === "ar";

  // ✅ حل جذري لمشكلة Hydration mismatch:
  // لا نحسب الوقت داخل الرندر (SSR) لأن السيرفر والعميل يختلفون.
  // نحسبه بعد التركيب على المتصفح.
  const [time, setTime] = React.useState<string>("");

  React.useEffect(() => {
    const format = () =>
      new Date().toLocaleTimeString(isAr ? "ar-SA" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

    setTime(format());

    const id = window.setInterval(() => {
      setTime(format());
    }, 60_000);

    return () => window.clearInterval(id);
  }, [isAr]);

  const fallbackText = isAr
    ? "قريبًا: إعلانات وخدمات جديدة — تابع آخر الأخبار هنا"
    : "Soon: new updates and services — follow the latest here";

  const msg = String(text || fallbackText);

  const w = String(
    weatherText || (isAr ? "☀️ الطقس: سماء صافية" : "☀️ Weather: Clear sky")
  );

  const barStyle: React.CSSProperties = {
    width: "100%",
    background: "#000",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    boxSizing: "border-box",
  };

  const leftStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 900,
    opacity: 0.95,
    whiteSpace: "nowrap",
  };

  const centerStyle: React.CSSProperties = {
    flex: 1,
    fontSize: 12,
    fontWeight: 900,
    opacity: 0.95,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textAlign: "center",
  };

  const rightStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 900,
    opacity: 0.95,
    whiteSpace: "nowrap",
  };

  return (
    <div style={barStyle} dir={isAr ? "rtl" : "ltr"}>
      <span style={leftStyle}>{w}</span>
      <span style={centerStyle}>{msg}</span>
      {/* وقت ثابت في SSR (فارغ) ثم يتعبّى بعد التركيب */}
      <span style={rightStyle}>{time}</span>
    </div>
  );
}
