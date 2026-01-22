"use client";

import * as React from "react";
import ChatWidget from "../../../../components/ChatWidget";
import { SupportView } from "../../../../components/SupportModal";
import LiveMap from "../../../../components/LiveMap";
import { MessageCircle, Map as MapIcon, Star, CheckCircle, Headphones } from "lucide-react";

import "leaflet/dist/leaflet.css";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

function safeText(v: unknown) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

function getParam(sp: URLSearchParams, k: string) {
  return String(sp.get(k) || "").trim();
}

function isMobileUA() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function mobileMapUrl(loc: string) {
  const s = String(loc || "");
  const isIOS = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  return isIOS ? `maps://?q=${encodeURIComponent(s)}` : `geo:0,0?q=${encodeURIComponent(s)}`;
}

type StatusRespOk = {
  ok: true;
  ref: string;
  status: "pending" | "approved" | "rejected";
  completed: boolean;
  city?: string;
  service_type?: string;
  updated_at?: string;
  accepted_provider_id?: number | null;
  accepted_provider_name?: string;
  accepted_provider_phone?: string;
  accepted_provider_email?: string;
  accepted_price_total?: number | null;
  accepted_price_currency?: string;
  accepted_price_notes?: string;
  accepted_meeting_location?: string;
  accepted_payment_method?: string;
  accepted_payment_details?: string;
  provider_status?: string;
  provider_current_lat?: number | null;
  provider_current_lng?: number | null;
  route_polyline?: any[] | string;
  eta?: number | null;
};

type StatusRespFail = { ok: false; code?: string; message?: string };

type CompleteRespOk = {
  ok: true;
  ref: string;
  status: "pending" | "approved" | "rejected";
  completed: true;
  updated?: boolean;
};

type CompleteRespFail = { ok: false; code?: string; message?: string };

function statusLabel(locale: Locale, status: string) {
  const isAr = locale === "ar";
  if (status === "approved") return isAr ? "تم قبول طلبك" : "Approved";
  if (status === "rejected") return isAr ? "تم رفض طلبك" : "Rejected";
  return isAr ? "طلبك قيد الانتظار" : "Pending";
}

function statusHint(locale: Locale, status: string) {
  const isAr = locale === "ar";
  if (status === "approved")
    return isAr
      ? "تم قبول الطلب من مقدم الخدمة. عند انتهاء الرحلة اضغط (تمت الرحلة) لفتح طلب جديد."
      : "Your request was approved. When your trip is done, tap (Trip Completed) to enable a new request.";
  if (status === "rejected")
    return isAr
      ? "تم رفض الطلب. يمكنك المحاولة مرة أخرى بطلب جديد."
      : "Your request was rejected. You can try again with a new request.";
  return isAr
    ? "بانتظار قبول مقدم الخدمة. يمكنك العودة لاحقًا للتحقق."
    : "Waiting for provider approval. Check again later.";
}

export default function TrackRequestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = React.use(params);
  const locale: Locale = asLocale(p?.locale);
  const isAr = locale === "ar";

  const sp = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );

  const [ref, setRef] = React.useState(() => getParam(sp, "ref"));
  const [contact, setContact] = React.useState(() => getParam(sp, "contact"));

  const [loading, setLoading] = React.useState(false);
  const [completing, setCompleting] = React.useState(false);
  const [rating, setRating] = React.useState<number | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [locCopied, setLocCopied] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'chat' | 'map' | 'complete' | 'support'>('map');
  const [result, setResult] = React.useState<StatusRespOk | null>(null);
  const [destCoords, setDestCoords] = React.useState<[number, number] | null>(null);
  const [routePoints, setRoutePoints] = React.useState<Array<[number, number]>>([]);
  const [routeMeta, setRouteMeta] = React.useState<{ distance_m: number | null; duration_s: number | null } | null>(null);

  const lastRouteKeyRef = React.useRef<string>("");
  const lastRouteAtRef = React.useRef<number>(0);
  const didAutoLoadRef = React.useRef(false);

  function parseLatLng(input: string) {
    const s = String(input || "").trim();
    const m = s.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (!m) return null;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    return [lat, lng] as [number, number];
  }

  const t = {
    title: isAr ? "متابعة الطلب" : "Track Request",
    hint: isAr
      ? "أدخل رقم الطلب ثم الجوال أو الإيميل المسجل على نفس الطلب."
      : "Enter your request ID and the phone or email used for that request.",
    ref: isAr ? "رقم الطلب" : "Request ID",
    contact: isAr ? "الجوال أو الإيميل" : "Phone or Email",
    check: isAr ? "تحقق" : "Check",
    checking: isAr ? "جاري التحقق..." : "Checking...",
    backHome: isAr ? "الرجوع للرئيسية" : "Back to home",
    newReq: isAr ? "طلب جديد" : "New Request",
    tripDone: isAr ? "تمت الرحلة" : "Trip Completed",
    completing: isAr ? "جاري الإنهاء..." : "Completing...",
    need: isAr ? "أدخل رقم الطلب والجوال/الإيميل." : "Enter request ID and phone/email.",
    providerInfo: isAr ? "بيانات مقدم الخدمة" : "Provider Details",
    providerName: isAr ? "اسم مقدم الخدمة" : "Provider Name",
    providerPhone: isAr ? "رقم الجوال" : "Phone",
    price: isAr ? "السعر" : "Price",
    meetingLocation: isAr ? "نقطة الالتقاء" : "Meeting Location",
    paymentMethod: isAr ? "طريقة الدفع" : "Payment Method",
    paymentTransfer: isAr ? "تحويل بنكي/رقمي" : "Bank/Digital Transfer",
    paymentCash: isAr ? "نقداً" : "Cash",
    transferDetails: isAr ? "معلومات الدفع" : "Payment Details",
  };

  const needText = t.need;

  const loadStatus = React.useCallback(async (opts?: { reset?: boolean; silent?: boolean }) => {
    const reset = !!opts?.reset;
    const silent = !!opts?.silent;

    if (reset) {
      setError(null);
      setResult(null);
      setDestCoords(null);
      setRoutePoints([]);
      setRouteMeta(null);
      lastRouteKeyRef.current = "";
      lastRouteAtRef.current = 0;
    }

    const r = safeText(ref);
    const c = safeText(contact);
    if (!r || !c) {
      if (!silent) setError(needText);
      return;
    }

    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/customer-requests/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ref: r, contact: c }),
      });

      const data = (await res.json()) as StatusRespOk | StatusRespFail;

      if (!res.ok || !("ok" in data) || data.ok === false) {
        if (!silent) setError(String((data as StatusRespFail)?.message || "Error"));
        if (!silent) setLoading(false);
        return;
      }

      setResult(data as StatusRespOk);
      if (!silent) setLoading(false);
    } catch {
      if (!silent) setError(isAr ? "تعذر الاتصال بالخادم." : "Failed to reach server.");
      if (!silent) setLoading(false);
    }
  }, [ref, contact, needText, isAr]);

  async function completeTrip() {
    setError(null);
    const r = safeText(ref);
    const c = safeText(contact);
    if (!r || !c) {
      setError(t.need);
      return;
    }
    if (!rating) {
      setError(isAr ? "اختر التقييم قبل إنهاء الرحلة." : "Select rating before completing.");
      return;
    }

    setCompleting(true);
    try {
      const res = await fetch("/api/customer-requests/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ref: r, contact: c, rating }),
      });

      const data = (await res.json()) as CompleteRespOk | CompleteRespFail;

      if (!res.ok || !("ok" in data) || data.ok === false) {
        setError(String((data as CompleteRespFail)?.message || "Error"));
        setCompleting(false);
        return;
      }

      // بعد الإنهاء نعيد جلب الحالة لتحديث الواجهة
      await loadStatus({ reset: false, silent: true });
      setCompleting(false);
    } catch {
      setError(isAr ? "تعذر الاتصال بالخادم." : "Failed to reach server.");
      setCompleting(false);
    }
  }

  React.useEffect(() => {
    const r = safeText(ref);
    const c = safeText(contact);
    if (!r || !c) return;
    if (result) return;
    if (didAutoLoadRef.current) return;
    didAutoLoadRef.current = true;
    loadStatus({ reset: true, silent: true });
  }, [ref, contact, result, loadStatus]);

  React.useEffect(() => {
    if (!result) return;
    if (result.status !== "approved") return;
    if (result.completed) return;

    const interval = window.setInterval(() => {
      loadStatus({ reset: false, silent: true });
    }, 5000);

    return () => window.clearInterval(interval);
  }, [result, contact, loadStatus]);

  React.useEffect(() => {
    const loc = safeText(result?.accepted_meeting_location || "");
    if (!loc) return;

    const parsed = parseLatLng(loc);
    if (parsed) {
      setDestCoords(parsed);
      return;
    }

    const ctrl = new AbortController();
    fetch(`/api/maps/geocode?q=${encodeURIComponent(loc)}&lang=${encodeURIComponent(locale)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && Number.isFinite(j.lat) && Number.isFinite(j.lng)) {
          setDestCoords([Number(j.lat), Number(j.lng)]);
        }
      })
      .catch(() => {});

    return () => ctrl.abort();
  }, [result?.accepted_meeting_location, locale]);

  React.useEffect(() => {
    if (!result) return;
    
    // If server provided a route, use it
    if (result.route_polyline) {
        try {
            const parsed = typeof result.route_polyline === 'string' 
                ? JSON.parse(result.route_polyline) 
                : result.route_polyline;
            
            if (Array.isArray(parsed) && parsed.length > 0) {
                setRoutePoints(parsed);
                if (result.eta) {
                    setRouteMeta({
                        distance_m: null,
                        duration_s: result.eta * 60 // convert minutes to seconds for consistency
                    });
                }
                return; // Skip client-side calculation
            }
        } catch (e) {
            console.error("Failed to parse route polyline", e);
        }
    }

    if (result.status !== "approved") return;
    if (result.completed) return;
    if (!result.provider_current_lat || !result.provider_current_lng) return;
    if (!destCoords) return;

    const from: [number, number] = [result.provider_current_lat, result.provider_current_lng];
    const to = destCoords;
    const key = `${from[0].toFixed(5)},${from[1].toFixed(5)}->${to[0].toFixed(5)},${to[1].toFixed(5)}`;
    const now = Date.now();
    const tooSoon = now - lastRouteAtRef.current < 15000;
    if (key === lastRouteKeyRef.current && tooSoon) return;

    lastRouteKeyRef.current = key;
    lastRouteAtRef.current = now;

    const ctrl = new AbortController();
    fetch(`/api/maps/route?from=${encodeURIComponent(from.join(","))}&to=${encodeURIComponent(to.join(","))}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => {
        if (!j?.ok) return;
        const pts = Array.isArray(j.points) ? (j.points as Array<[number, number]>) : [];
        setRoutePoints(pts);
        setRouteMeta({
          distance_m: j.distance_m === null || j.distance_m === undefined ? null : Number(j.distance_m),
          duration_s: j.duration_s === null || j.duration_s === undefined ? null : Number(j.duration_s),
        });
      })
      .catch(() => {});

    return () => ctrl.abort();
  }, [result, destCoords]);

  function goNew() {
    window.location.href = `/${locale}/request/customer`;
  }

  async function doCopyRef(v: string) {
    const text = String(v || "");
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
        return;
      }
    } catch {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.setAttribute("readonly", "");
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  }
  async function copyLocation(v: string) {
    const text = String(v || "");
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
        setLocCopied(true);
        window.setTimeout(() => setLocCopied(false), 1500);
        return;
      }
    } catch {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.setAttribute("readonly", "");
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      document.execCommand("copy");
      document.body.removeChild(ta);
      setLocCopied(true);
      window.setTimeout(() => setLocCopied(false), 1500);
    } catch {}
  }

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
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 900,
    color: "#111",
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 44,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.16)",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    fontSize: 13,
    boxSizing: "border-box",
    outline: "none",
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

  const infoBox: React.CSSProperties = {
    marginTop: 12,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fbfaf8",
    color: "#111",
    fontSize: 12.5,
    lineHeight: 1.7,
    fontWeight: 850,
  };

  const errorBox: React.CSSProperties = {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(180, 0, 0, 0.25)",
    background: "rgba(180, 0, 0, 0.06)",
    color: "#7a0000",
    fontSize: 12.5,
    fontWeight: 900,
  };

  const statusPill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.16)",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    fontSize: 12.5,
  };

  const smallRow: React.CSSProperties = {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 8,
  };

  return (
    <main style={pageStyle} dir={isAr ? "rtl" : "ltr"}>
      <div style={cardStyle}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{t.title}</h1>
        <p style={{ margin: "10px 0 12px", color: "#666", fontSize: 13, lineHeight: 1.7 }}>
          {t.hint}
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={labelStyle}>{t.ref}</label>
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              style={inputStyle}
              placeholder="LK-000000"
              inputMode="text"
            />
          </div>

          <div>
            <label style={labelStyle}>{t.contact}</label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              style={inputStyle}
              placeholder={isAr ? "05xxxxxxxx أو email" : "05xxxxxxxx or email"}
              inputMode="text"
            />
          </div>

          {error ? <div style={errorBox}>{error}</div> : null}

          <button
            type="button"
            style={{
              ...btnPrimary,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onClick={() => loadStatus({ reset: false })}
            disabled={loading}
          >
            {loading ? t.checking : t.check}
          </button>

          <button
            type="button"
            style={btnGhost}
            onClick={() => (window.location.href = `/${locale}`)}
          >
            {t.backHome}
          </button>
        </div>

        {result ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <div style={statusPill}>
                  {statusLabel(locale, result.status)} — {result.ref}
                </div>
                <button
                  type="button"
                  onClick={() => doCopyRef(result.ref)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 999,
                    border: "1px solid #111",
                    background: copied ? "#111" : "#fff",
                    color: copied ? "#fff" : "#111",
                    fontWeight: 900,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {copied ? (isAr ? "نُسخ" : "Copied") : (isAr ? "نسخ" : "Copy")}
                </button>
              </div>

              <div style={smallRow}>
                {result.city ? <span style={statusPill}>{result.city}</span> : null}
                {result.service_type ? <span style={statusPill}>{result.service_type}</span> : null}
                {result.completed ? <span style={statusPill}>{isAr ? "مكتمل" : "Completed"}</span> : null}
              </div>
            </div>

            <div style={infoBox}>{statusHint(locale, result.status)}</div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {result.status === "rejected" ? (
                <button type="button" style={btnPrimary} onClick={goNew}>
                  {t.newReq}
                </button>
              ) : null}

              {/* إذا مكتمل: زر طلب جديد */}
              {result.completed === true ? (
                <button type="button" style={btnPrimary} onClick={goNew}>
                  {t.newReq}
                </button>
              ) : null}
            </div>

            {result.status === "approved" ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ ...infoBox, background: "#fff" }}>
                  <div style={{ marginBottom: 8, fontWeight: 900 }}>{t.providerInfo}</div>
                  {result.accepted_provider_name ? (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontWeight: 900 }}>{t.providerName}:</span> {result.accepted_provider_name}
                    </div>
                  ) : null}
                  {typeof result.accepted_price_total === "number" ? (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontWeight: 900 }}>{t.price}:</span> {result.accepted_price_total}{" "}
                      {result.accepted_price_currency || "SAR"}
                    </div>
                  ) : null}
                  {result.accepted_meeting_location ? (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontWeight: 900 }}>{t.meetingLocation}:</span> {result.accepted_meeting_location}
                      <div style={{ marginTop: 6 }}>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.accepted_meeting_location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: 32,
                            padding: "0 12px",
                            borderRadius: 999,
                            border: "1px solid #111",
                            background: "#fff",
                            color: "#111",
                            fontWeight: 900,
                            fontSize: 12,
                            textDecoration: "none",
                          }}
                        >
                          {isAr ? "عرض على الخريطة" : "Open Map"}
                        </a>
                        {isMobileUA() ? (
                          <a
                            href={mobileMapUrl(String(result.accepted_meeting_location || ""))}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: 32,
                              padding: "0 12px",
                              borderRadius: 999,
                              border: "1px solid #111",
                              background: "#fff",
                              color: "#111",
                              fontWeight: 900,
                              fontSize: 12,
                              textDecoration: "none",
                              marginLeft: 8,
                            }}
                          >
                            {isAr ? "فتح في تطبيق الخرائط" : "Open in Maps App"}
                          </a>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => copyLocation(String(result.accepted_meeting_location || ""))}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: 32,
                            padding: "0 12px",
                            borderRadius: 999,
                            border: "1px solid #111",
                            background: locCopied ? "#111" : "#fff",
                            color: locCopied ? "#fff" : "#111",
                            fontWeight: 900,
                            fontSize: 12,
                            cursor: "pointer",
                            marginLeft: 8,
                          }}
                        >
                          {locCopied ? (isAr ? "نُسخ" : "Copied") : (isAr ? "نسخ الموقع" : "Copy Location")}
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {result.accepted_payment_method ? (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontWeight: 900 }}>{t.paymentMethod}:</span>{" "}
                      {result.accepted_payment_method === "transfer" ? t.paymentTransfer : t.paymentCash}
                    </div>
                  ) : null}
                  {result.accepted_payment_method === "transfer" && result.accepted_payment_details ? (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontWeight: 900 }}>{t.transferDetails}:</span>
                      <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{result.accepted_payment_details}</div>
                    </div>
                  ) : null}
                  {/* Interactive Viewport (Map + Overlays) */}
                  <div style={{ 
                    height: 500, 
                    width: "100%", 
                    borderRadius: 16, 
                    overflow: "hidden", 
                    border: "1px solid #ddd", 
                    position: 'relative',
                    marginTop: 20, 
                    marginBottom: 100 
                  }}>
                    {/* Layer 1: Map (Always visible unless explicitly hidden or unavailable) */}
                    {result.provider_status === "en_route" && result.provider_current_lat && result.provider_current_lng ? (
                         <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
                            <LiveMap
                                center={[result.provider_current_lat, result.provider_current_lng]}
                                zoom={13}
                                carIconUrl="https://cdn-icons-png.flaticon.com/512/3097/3097180.png"
                                providerPos={[result.provider_current_lat, result.provider_current_lng]}
                                destPos={destCoords || undefined}
                                routePoints={routePoints}
                                isAr={isAr}
                                providerLabel={isAr ? "السائق في الطريق" : "Driver is en route"}
                                destLabel={isAr ? "نقطة الالتقاء" : "Meeting Point"}
                            />
                            {routeMeta?.duration_s ? (
                                <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, padding: "6px 12px", background: "white", borderRadius: 8, boxShadow: "0 2px 5px rgba(0,0,0,0.2)", fontSize: 13, fontWeight: "bold" }}>
                                    {isAr
                                    ? `الوصول: ${Math.ceil(routeMeta.duration_s / 60)} د`
                                    : `ETA: ${Math.ceil(routeMeta.duration_s / 60)} m`}
                                </div>
                            ) : null}
                         </div>
                    ) : (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                            <p>{isAr ? "الخريطة غير متاحة حالياً" : "Map not available"}</p>
                        </div>
                    )}

                    {/* Layer 2: Chat Overlay */}
                    {activeTab === 'chat' && (
                        <div style={{ 
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10,
                            background: 'rgba(255,255,255,0.95)' // Ensure background covers map
                        }}>
                                <ChatWidget 
                                requestRef={ref} 
                                userRole="customer" 
                                counterpartName={result.accepted_provider_name}
                                />
                        </div>
                    )}

                    {/* Layer 3: Complete/Rating Overlay */}
                    {activeTab === 'complete' && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, background: 'rgba(255,255,255,0.95)', padding: 20, overflowY: 'auto' }}>
                             {result.completed === false ? (
                                <>
                                <div style={{ marginBottom: 12, fontWeight: 900, fontSize: 16 }}>{isAr ? "التقييم وإنهاء الرحلة" : "Rate & Complete Trip"}</div>
                                <div style={{ marginBottom: 8, fontSize: 14 }}>{isAr ? "التقييم لمقدم الخدمة" : "Rate Provider"}</div>
                                <select
                                    value={rating ?? ""}
                                    onChange={(e) => {
                                    const v = e.target.value;
                                    setRating(v ? parseInt(v, 10) : null);
                                    }}
                                    style={{ ...inputStyle, height: 48, marginBottom: 16 }}
                                >
                                    <option value="">{isAr ? "اختر التقييم" : "Select rating"}</option>
                                    {(
                                    isAr
                                        ? [
                                            { v: 1, t: "1️⃣ سيّئ جدًا" },
                                            { v: 2, t: "2️⃣ سيّئ" },
                                            { v: 3, t: "3️⃣ مقبول" },
                                            { v: 4, t: "4️⃣ جيد" },
                                            { v: 5, t: "5️⃣ ممتاز" },
                                        ]
                                        : [
                                            { v: 1, t: "1️⃣ Very Poor" },
                                            { v: 2, t: "2️⃣ Poor" },
                                            { v: 3, t: "3️⃣ Fair / Average" },
                                            { v: 4, t: "4️⃣ Good" },
                                            { v: 5, t: "5️⃣ Excellent" },
                                        ]
                                    ).map((o) => (
                                    <option key={o.v} value={o.v}>{o.t}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    style={{
                                    ...btnPrimary,
                                    height: 48,
                                    opacity: completing ? 0.7 : 1,
                                    cursor: completing ? "not-allowed" : "pointer",
                                    }}
                                    onClick={completeTrip}
                                    disabled={completing}
                                >
                                    {completing ? t.completing : t.tripDone}
                                </button>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 20, color: '#2e7d32', fontWeight: 'bold' }}>
                                    {isAr ? "تمت الرحلة بنجاح شكراً لك!" : "Trip completed successfully. Thank you!"}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Layer 4: Support Overlay */}
                    {activeTab === 'support' && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, background: 'rgba(255,255,255,0.95)', padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '100%', maxWidth: 340, textAlign: 'center' }}>
                                <SupportView isAr={isAr} refId={result?.ref} />
                            </div>
                        </div>
                    )}
                  </div>
                </div>

                {/* Bottom Navigation Bar */}
                <div style={{ 
                    position: 'fixed', bottom: 0, left: 0, right: 0, 
                    height: 80, background: '#fff', borderTop: '1px solid #eee', 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-around', 
                    zIndex: 2000, paddingBottom: 10,
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
                }}>
                    <button onClick={() => setActiveTab('chat')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ 
                            padding: 10, 
                            borderRadius: '50%', 
                            background: activeTab === 'chat' ? '#111' : 'transparent',
                            color: activeTab === 'chat' ? '#fff' : '#9ca3af',
                            transition: 'all 0.2s'
                        }}>
                            <MessageCircle size={24} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: activeTab === 'chat' ? 700 : 500, color: activeTab === 'chat' ? '#111' : '#9ca3af' }}>{isAr ? "المحادثة" : "Chat"}</span>
                    </button>

                    <button onClick={() => setActiveTab('map')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ 
                            padding: 10, 
                            borderRadius: '50%', 
                            background: activeTab === 'map' ? '#111' : 'transparent',
                            color: activeTab === 'map' ? '#fff' : '#9ca3af',
                            transition: 'all 0.2s'
                        }}>
                            <MapIcon size={24} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: activeTab === 'map' ? 700 : 500, color: activeTab === 'map' ? '#111' : '#9ca3af' }}>{isAr ? "الخريطة" : "Map"}</span>
                    </button>

                    <button onClick={() => setActiveTab('complete')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ 
                            padding: 10, 
                            borderRadius: '50%', 
                            background: activeTab === 'complete' ? '#111' : 'transparent',
                            color: activeTab === 'complete' ? '#fff' : '#9ca3af',
                            transition: 'all 0.2s'
                        }}>
                            <Star size={24} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: activeTab === 'complete' ? 700 : 500, color: activeTab === 'complete' ? '#111' : '#9ca3af' }}>{isAr ? "التقييم" : "Rating"}</span>
                    </button>

                    <button onClick={() => setActiveTab('complete')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ 
                            padding: 10, 
                            borderRadius: '50%', 
                            background: activeTab === 'complete' ? '#111' : 'transparent',
                            color: activeTab === 'complete' ? '#fff' : '#9ca3af',
                            transition: 'all 0.2s'
                        }}>
                            <CheckCircle size={24} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: activeTab === 'complete' ? 700 : 500, color: activeTab === 'complete' ? '#111' : '#9ca3af' }}>{isAr ? "تمت الرحلة" : "Completed"}</span>
                    </button>

                    <button onClick={() => setActiveTab('support')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ 
                            padding: 10, 
                            borderRadius: '50%', 
                            background: activeTab === 'support' ? '#111' : 'transparent',
                            color: activeTab === 'support' ? '#fff' : '#9ca3af',
                            transition: 'all 0.2s'
                        }}>
                            <Headphones size={24} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: activeTab === 'support' ? 700 : 500, color: activeTab === 'support' ? '#111' : '#9ca3af' }}>{isAr ? "الدعم" : "Support"}</span>
                    </button>
                </div>

              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
