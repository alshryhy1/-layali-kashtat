 "use client";
 
 import * as React from "react";
 
 type Locale = "ar" | "en";
 
 type Props = {
   locale: Locale;
   text?: string;
   weatherText?: string;
   linkUrl?: string;
 };
 
 type WeatherState =
   | { ok: true; text: string }
   | { ok: false; text: string };
 
 export default function TopInfoBar({ locale, text, weatherText, linkUrl }: Props) {
   const isAr = locale === "ar";
 
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
 
   const [weather, setWeather] = React.useState<WeatherState>(() => {
     const initial = String(
       weatherText ||
         (isAr ? "☀️ الطقس: سماء صافية" : "☀️ Weather: Clear sky")
     );
     return { ok: true, text: initial };
   });
 
   React.useEffect(() => {
     let cancelled = false;
 
     const run = async () => {
       try {
         const storedCity = String(
           window.localStorage.getItem("lk_city") || ""
         ).trim();
 
         const qs = new URLSearchParams();
         qs.set("lang", isAr ? "ar" : "en");
         if (storedCity) qs.set("city", storedCity);
 
         const res = await fetch(`/api/weather?${qs.toString()}`, {
           cache: "no-store",
         });
 
         if (!res.ok) throw new Error(String(res.status));
 
         const data = await res.json().catch(() => null);
         const t = String(data?.text || "").trim();
 
         if (!t) throw new Error("bad_payload");
 
         if (!cancelled) setWeather({ ok: true, text: t });
       } catch {
         const fallback = String(
           weatherText ||
             (isAr ? "☀️ الطقس: سماء صافية" : "☀️ Weather: Clear sky")
         );
         if (!cancelled) setWeather({ ok: false, text: fallback });
       }
     };
 
     run();
 
     const id = window.setInterval(run, 10 * 60_000);
 
     const handleCityChange = () => {
       run();
     };
     window.addEventListener('lk_city_changed', handleCityChange);
 
     return () => {
       cancelled = true;
       window.clearInterval(id);
       window.removeEventListener('lk_city_changed', handleCityChange);
     };
   }, [isAr, weatherText]);
 
   const w = weather.text;
 
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
 
   const centerWrapStyle: React.CSSProperties = {
     flex: 1,
     overflow: "hidden",
     whiteSpace: "nowrap",
     textAlign: "center",
     position: "relative",
     minWidth: 0,
   };
 
   const centerInnerStyle: React.CSSProperties = {
     display: "inline-block",
     fontSize: 12,
     fontWeight: 900,
     opacity: 0.95,
     paddingInline: 12,
     animation: "lk_marquee 14s linear infinite",
     willChange: "transform",
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
 
       <span style={centerWrapStyle} aria-label={msg} title={msg}>
         {linkUrl ? (
           <a href={linkUrl} style={{ ...centerInnerStyle, color: "#fde68a", textDecoration: "none" }}>
             {msg}
           </a>
         ) : (
           <span style={{ ...centerInnerStyle, color: "#fde68a" }}>{msg}</span>
         )}
       </span>
 
       <span style={rightStyle}>{time}</span>
     </div>
   );
 }
