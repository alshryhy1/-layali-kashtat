"use client";

import * as React from "react";

type Locale = "ar" | "en";

type Props = {
  locale: Locale;
  text?: string;
  weatherText?: string;
};

type WeatherApiOk = {
  ok: true;
  text?: string;
};
type WeatherApi = WeatherApiOk | { ok: false; error?: string };

function formatTime(isAr: boolean) {
  const now = new Date();
  return now.toLocaleTimeString(isAr ? "ar-SA" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TopInfoBar({ locale, text, weatherText }: Props) {
  const isAr = locale === "ar";

  const fallbackText = isAr
    ? "قريبًا: إعلانات وخدمات جديدة — تابع آخر الأخبار هنا"
    : "Soon: new updates and services — follow the latest here";

  const msg = String(text || fallbackText);

  const [weather, setWeather] = React.useState<string>(() =>
    String(
      weatherText ||
        (isAr ? "🌤️ الطقس: جاري التحديث..." : "🌤️ Weather: updating...")
    )
  );

  React.useEffect(() => {
    if (typeof weatherText === "string" && weatherText.trim()) {
      setWeather(weatherText.trim());
    }
  }, [weatherText]);

  React.useEffect(() => {
    if (typeof weatherText === "string" && weatherText.trim()) return;

    let alive = true;
    const ctrl = new AbortController();

    async function load() {
      try {
        const r = await fetch(`/api/weather?lang=${isAr ? "ar" : "en"}`, {
          signal: ctrl.signal,
        });
        const data = (await r.json().catch(() => null)) as WeatherApi | null;

        if (!alive) return;

        if (r.ok && data && (data as any).ok) {
          const txt = String((data as WeatherApiOk).text || "").trim();
          if (txt) {
            setWeather(txt);
            return;
          }
        }

        setWeather(isAr ? "🌤️ الطقس: غير متاح حاليًا" : "🌤️ Weather: unavailable");
      } catch {
        if (!alive) return;
        setWeather(isAr ? "🌤️ الطقس: غير متاح حاليًا" : "🌤️ Weather: unavailable");
      }
    }

    load();
    const id = window.setInterval(load, 10 * 60 * 1000);

    return () => {
      alive = false;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [isAr, weatherText]);

  const [time, setTime] = React.useState(() => formatTime(isAr));
  React.useEffect(() => {
    setTime(formatTime(isAr));
    const id = window.setInterval(() => setTime(formatTime(isAr)), 60 * 1000);
    return () => window.clearInterval(id);
  }, [isAr]);

  // ===== Styles =====
  const barStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(0,0,0,0.92)",
    color: "#fff",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    overflow: "hidden",
  };

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

  // ===== Mobile (نسق موحّد) =====
  const H = 28; // ارتفاع موحّد لكل الكبسولات

  const mobileWrapStyle: React.CSSProperties = {
    width: "100%",
    overflow: "hidden",
    paddingTop: 6,
    paddingBottom: 6,
  };

  const mobileLineStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    width: "100%",
    direction: isAr ? "rtl" : "ltr",
  };

  const mobileSideBadgeBase: React.CSSProperties = {
    height: H,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 10px",
    boxSizing: "border-box",
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.16)",
    whiteSpace: "nowrap",
    fontSize: 11,
    lineHeight: `${H}px`,
    fontWeight: 900,
    flexShrink: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const mobileWeatherBadge: React.CSSProperties = {
    ...mobileSideBadgeBase,
    maxWidth: "34%",
  };

  const mobileTimeBadge: React.CSSProperties = {
    ...mobileSideBadgeBase,
    maxWidth: "22%",
  };

  const mobileDot: React.CSSProperties = {
    width: 5,
    height: 5,
    borderRadius: 999,
    background: "rgba(255,255,255,0.55)",
    flexShrink: 0,
    alignSelf: "center",
  };

  const mobileAdPill: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    height: H,
    display: "flex",
    alignItems: "center",
    padding: "0 10px",
    boxSizing: "border-box",
    borderRadius: 999,
    background: "rgba(34,197,94,0.16)",
    border: "1px solid rgba(34,197,94,0.30)",
    overflow: "hidden",
  };

  const mobileAdText: React.CSSProperties = {
    fontSize: 11,
    lineHeight: `${H}px`,
    fontWeight: 900,
    whiteSpace: "nowrap",
  };

  return (
    <div style={barStyle}>
      <div className="page-container">
        {/* Mobile */}
        <div className="topbar-mobile" style={mobileWrapStyle}>
          <div className="topbar-mobile-line" style={mobileLineStyle}>
            <span style={mobileWeatherBadge} title={weather}>
              {weather}
            </span>

            <span style={mobileDot} />

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

            <span style={mobileTimeBadge} title={`🕒 ${time}`}>
              {`🕒 ${time}`}
            </span>
          </div>
        </div>

        {/* Desktop/Tablet */}
        <div className="topbar-desktop">
          <div className="topbar-row" style={rowStyle}>
            <span style={badgeStyle}>{weather}</span>
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

          .topbar-mobile { display: block; }
          .topbar-desktop { display: none; }

          @media (min-width: 768px) {
            .topbar-mobile { display: none; }
            .topbar-desktop { display: block; }
          }

          .ticker-viewport {
            position: relative;
            overflow: hidden;
            width: 100%;
            height: ${H}px;
            display: flex;
            align-items: center;
          }

          .ticker-text {
            display: inline-block;
            will-change: transform;
          }

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

          @media (prefers-reduced-motion: reduce) {
            .ticker-text { animation: none !important; padding: 0 !important; }
          }
        `,
        }}
      />
    </div>
  );
}
