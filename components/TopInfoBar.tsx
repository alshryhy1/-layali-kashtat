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

  const now = new Date();
  const time = now.toLocaleTimeString(isAr ? "ar-SA" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const fallbackText = isAr
    ? "قريبًا: إعلانات وخدمات جديدة — تابع آخر الأخبار هنا"
    : "Soon: new updates and services — follow the latest here";

  const msg = String(text || fallbackText);

  const w = String(weatherText || (isAr ? "☀️ الطقس: سماء صافية" : "☀️ Weather: Clear sky"));

  const barStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(0,0,0,0.92)",
    color: "#fff",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    overflow: "hidden",
  };

  // ✅ Desktop/Tablet: keep same behavior (scrollable row)
  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    direction: isAr ? "rtl" : "ltr",
    paddingTop: 10,
    paddingBottom: 10,
    overflowX: "auto",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  };

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.16)",
    whiteSpace: "nowrap",
    fontSize: 12,
    lineHeight: "16px",
    fontWeight: 800,
    flexShrink: 0,
  };

  const dotStyle: React.CSSProperties = {
    width: 6,
    height: 6,
    borderRadius: 999,
    background: "rgba(255,255,255,0.55)",
    flexShrink: 0,
  };

  // ✅ Mobile: weather at edge + time opposite + centered ad pill ثابت (النص فقط يتحرك)
  const mobileWrapStyle: React.CSSProperties = {
    width: "100%",
    overflow: "hidden",
    paddingTop: 8,
    paddingBottom: 8,
  };

  const mobileLineStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    direction: isAr ? "rtl" : "ltr",
  };

  const mobileSideBadge: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.16)",
    whiteSpace: "nowrap",
    fontSize: 11,
    lineHeight: "14px",
    fontWeight: 800,
    flexShrink: 0,
  };

  const mobileDot: React.CSSProperties = {
    width: 5,
    height: 5,
    borderRadius: 999,
    background: "rgba(255,255,255,0.55)",
    flexShrink: 0,
  };

  // ✅ كبسولة الإعلان ثابتة (الخلفية ثابتة) — النص فقط اللي يتحرك بالداخل
  const mobileAdPill: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(34,197,94,0.16)",
    border: "1px solid rgba(34,197,94,0.30)",
    overflow: "hidden", // مهم عشان النص يمشي داخلها فقط
  };

  const mobileAdText: React.CSSProperties = {
    fontSize: 11,
    lineHeight: "14px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  };

  return (
    <div style={barStyle}>
      <div className="page-container">
        {/* ✅ Mobile */}
        <div className="topbar-mobile" style={mobileWrapStyle}>
          <div className="topbar-mobile-line" style={mobileLineStyle}>
            {/* طرف 1: الطقس */}
            <span style={mobileSideBadge}>{w}</span>

            <span style={mobileDot} />

            {/* الوسط: كبسولة ثابتة — النص فقط يتحرك */}
            <div
              className={`ad-pill ${isAr ? "dir-rtl" : "dir-ltr"}`}
              style={mobileAdPill}
              aria-label={isAr ? "شريط الإعلانات" : "Ads ticker"}
              title={msg}
            >
              <div className="ticker-viewport">
                <span className="ticker-text" style={mobileAdText}>
                  {msg}
                </span>
              </div>
            </div>

            <span style={mobileDot} />

            {/* طرف 2: الساعة */}
            <span style={mobileSideBadge}>{`🕒 ${time}`}</span>
          </div>
        </div>

        {/* ✅ Desktop/Tablet (unchanged) */}
        <div className="topbar-desktop">
          <div className="topbar-row" style={rowStyle}>
            <span style={badgeStyle}>{w}</span>
            <span style={dotStyle} />
            <span
              style={{
                ...badgeStyle,
                background: "rgba(34,197,94,0.16)",
                border: "1px solid rgba(34,197,94,0.30)",
              }}
              title={msg}
            >
              {msg}
            </span>
            <span style={dotStyle} />
            <span style={badgeStyle}>{`🕒 ${time}`}</span>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .topbar-row::-webkit-scrollbar { display: none; }

          /* Mobile vs Desktop split */
          .topbar-mobile { display: block; }
          .topbar-desktop { display: none; }

          @media (min-width: 768px) {
            .topbar-mobile { display: none; }
            .topbar-desktop { display: block; }
          }

          /* ✅ Ticker: النص فقط يتحرك داخل الكبسولة الثابتة */
          .ticker-viewport {
            position: relative;
            overflow: hidden;
            width: 100%;
          }

          .ticker-text {
            display: inline-block;
            will-change: transform;
          }

          /* حركة بطيئة وناعمة (مناسبة للإعلانات) */
          .dir-ltr .ticker-text {
            padding-left: 100%;
            animation: lk-marquee-ltr 18s linear infinite;
          }

          .dir-rtl .ticker-text {
            padding-right: 100%;
            animation: lk-marquee-rtl 18s linear infinite;
          }

          @keyframes lk-marquee-ltr {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }

          @keyframes lk-marquee-rtl {
            0%   { transform: translateX(0); }
            100% { transform: translateX(100%); }
          }

          /* Respect reduced motion */
          @media (prefers-reduced-motion: reduce) {
            .ticker-text { animation: none !important; padding: 0 !important; }
          }
        `,
        }}
      />
    </div>
  );
}
