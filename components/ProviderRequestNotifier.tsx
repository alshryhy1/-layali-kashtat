"use client";
 
import * as React from "react";
 
type Props = { locale: "ar" | "en"; pollMs?: number; initialCity?: string; initialService?: string };
 
export default function ProviderRequestNotifier({ locale, pollMs = 25000, initialCity, initialService }: Props) {
  const isAr = locale === "ar";
  const servicesAr = [
    "كشته بريه رمليه",
    "كشته بريه ساحليه",
    "كشته بريه جبليه",
    "مخيم",
    "شاليه",
    "مزرعة",
    "استراحة",
  ];
  const servicesEn = ["Desert (sandy)", "Desert (coastal)", "Desert (mountain)", "Camp", "Chalet", "Farm", "Rest area"];
  const citiesAr = [
    "مكة المكرمة",
    "المدينة المنورة",
    "الرياض",
    "جدة",
    "الدمام",
    "القصيم",
    "حائل",
    "عرعر",
    "طريف",
    "القريات",
    "طبرجل",
    "الجوف",
    "سكاكا",
    "تبوك",
    "العلا",
    "ينبع",
    "أملج",
    "حقل",
  ];
  const citiesEn = [
    "Makkah",
    "Madinah",
    "Riyadh",
    "Jeddah",
    "Dammam",
    "Qassim",
    "Hail",
    "Arar",
    "Turaif",
    "Al Qurayyat",
    "Tabarjal",
    "Al Jouf",
    "Sakaka",
    "Tabuk",
    "Al Ula",
    "Yanbu",
    "Umluj",
    "Haql",
  ];
  const serviceOptions = isAr ? servicesAr : servicesEn;
  const cityOptions = isAr ? citiesAr : citiesEn;
 
  const [city, setCity] = React.useState("");
  const [service, setService] = React.useState("");
  const [enabled, setEnabled] = React.useState(false);
  const [flash, setFlash] = React.useState("");
  const lastRef = React.useRef<string | null>(null);
  const timer = React.useRef<number | null>(null);
 
  React.useEffect(() => {
    try {
      const c = initialCity || localStorage.getItem("lk_notif_city") || "";
      const s = initialService || localStorage.getItem("lk_notif_service") || "";
      const e = localStorage.getItem("lk_notif_enabled") === "1";
      setCity(c);
      setService(s);
      setEnabled(e);
    } catch {}
  }, [initialCity, initialService]);
 
  React.useEffect(() => {
    try {
      localStorage.setItem("lk_notif_city", city);
      localStorage.setItem("lk_notif_service", service);
      localStorage.setItem("lk_notif_enabled", enabled ? "1" : "0");
    } catch {}
  }, [city, service, enabled]);
 
  React.useEffect(() => {
    if (!enabled || !city || !service) return;
    const ask = async () => {
      try {
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "default") await Notification.requestPermission();
        }
      } catch {}
    };
    ask();
    const tick = async () => {
      try {
        const u = new URL("/api/customer-requests/latest", window.location.origin);
        u.searchParams.set("city", city);
        u.searchParams.set("service_type", service);
        const r = await fetch(u.toString(), { cache: "no-store" });
        const j = await r.json();
        const latest = j?.latest || null;
        const ref = latest?.ref || null;
        if (!ref) return;
        if (lastRef.current === null) {
          lastRef.current = ref;
          return;
        }
        if (lastRef.current !== ref) {
          lastRef.current = ref;
          const title = isAr ? "طلب جديد مطابق لتخصصك" : "New request for your service";
          const body = isAr ? `المدينة: ${latest.city} — الخدمة: ${latest.service_type}` : `City: ${latest.city} — Service: ${latest.service_type}`;
          try {
            if (typeof window !== "undefined" && "Notification" in window) {
              if (Notification.permission === "granted") {
                new Notification(title, { body });
              } else {
                setFlash(`${title} — ${body}`);
                window.setTimeout(() => setFlash(""), 5000);
              }
            } else {
              setFlash(`${title} — ${body}`);
              window.setTimeout(() => setFlash(""), 5000);
            }
          } catch {
            setFlash(`${title} — ${body}`);
            window.setTimeout(() => setFlash(""), 5000);
          }
        }
      } catch {}
    };
    tick();
    timer.current = window.setInterval(tick, pollMs) as any;
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
    };
  }, [enabled, city, service, isAr, pollMs]);
 
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, marginTop: 14 }}>
      <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 8 }}>
        {isAr ? "إشعار تلقائي بطلبات العملاء المطابقة" : "Automatic notifications for matching requests"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>{isAr ? "المدينة" : "City"}</label>
          <select value={city} onChange={(e) => setCity(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 10, border: "1px solid #ccc" }}>
            <option value="">{isAr ? "اختر المدينة" : "Select city"}</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>{isAr ? "نوع الخدمة" : "Service"}</label>
          <select value={service} onChange={(e) => setService(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 10, border: "1px solid #ccc" }}>
            <option value="">{isAr ? "اختر النوع" : "Select service"}</option>
            {serviceOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setEnabled((v) => !v)}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            fontWeight: 900,
            fontSize: 12,
            border: "1px solid #111",
            background: enabled ? "#111" : "#fff",
            color: enabled ? "#fff" : "#111",
          }}
        >
          {enabled ? (isAr ? "إيقاف الإشعارات" : "Disable") : (isAr ? "تفعيل الإشعارات" : "Enable")}
        </button>
        <div style={{ fontSize: 12, color: "#666" }}>
          {isAr
            ? "ستظهر إشعارات على جهازك بمجرد وصول طلب مطابق للمدينة والنوع المحددين."
            : "You will get notifications when a matching request arrives for the selected city and service."}
        </div>
      </div>
      {flash ? (
        <div
          style={{
            marginTop: 8,
            padding: "8px 10px",
            border: "1px solid #e7e7e7",
            borderRadius: 10,
            background: "#fff",
            color: "#111",
            fontSize: 13,
            fontWeight: 900,
          }}
        >
          {flash}
        </div>
      ) : null}
    </div>
  );
}
