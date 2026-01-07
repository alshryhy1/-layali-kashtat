"use client";
 
import * as React from "react";
 
type Props = { locale: "ar" | "en"; pollMs?: number };
 
export default function AdminNewRequestNotifier({ locale, pollMs = 20000 }: Props) {
  const isAr = locale === "ar";
  const [flash, setFlash] = React.useState("");
  const lastRef = React.useRef<string | null>(null);
  const timer = React.useRef<number | null>(null);
 
  React.useEffect(() => {
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
        const r = await fetch("/api/customer-requests/latest", { cache: "no-store" });
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
          const title = isAr ? "وصول طلب عميل جديد" : "New customer request";
          const body = isAr
            ? `المدينة: ${latest.city} — الخدمة: ${latest.service_type}`
            : `City: ${latest.city} — Service: ${latest.service_type}`;
          try {
            if (typeof window !== "undefined" && "Notification" in window) {
              if (Notification.permission === "granted") {
                new Notification(title, { body });
              } else {
                setFlash(`${title} — ${body}`);
                setTimeout(() => setFlash(""), 5000);
              }
            } else {
              setFlash(`${title} — ${body}`);
              setTimeout(() => setFlash(""), 5000);
            }
          } catch {
            setFlash(`${title} — ${body}`);
            setTimeout(() => setFlash(""), 5000);
          }
        }
      } catch {}
    };
    tick();
    timer.current = setInterval(tick, pollMs) as any;
    return () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
  }, [isAr, pollMs]);
 
  if (!flash) return null;
  return (
    <div
      style={{
        margin: "10px 0",
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
  );
}
