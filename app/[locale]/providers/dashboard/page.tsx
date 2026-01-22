"use client";

import * as React from "react";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import ChatWidget from "../../../../components/ChatWidget";
import LiveMap from "../../../../components/LiveMap";
import SupportModal from "../../../../components/SupportModal";
import { supabase } from "../../../../lib/supabaseClient";

type Locale = "ar" | "en";
function asLocale(v: any): Locale {
  return String(v || "").toLowerCase() === "en" ? "en" : "ar";
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



export default function ProviderDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const p = React.use(params);
  const locale = asLocale(p?.locale);
  const isAr = locale === "ar";
  
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  // removed unused error state
  const [selectedRequest, setSelectedRequest] = React.useState<any>(null);
  const [view, setView] = React.useState<"details" | "accept" | "reject">("details");
  const [locCopied, setLocCopied] = React.useState(false);
  const [refCopied, setRefCopied] = React.useState(false);

  // Form States
  const [price, setPrice] = React.useState("");
  const [currency, setCurrency] = React.useState("SAR");
  const [notes, setNotes] = React.useState("");
  const [meetingLocation, setMeetingLocation] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const [accountName, setAccountName] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [rejectReason, setRejectReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [showSupport, setShowSupport] = React.useState(false);
  const [isLiveTracking, setIsLiveTracking] = React.useState(false);

  const trackingWatchIdRef = React.useRef<number | null>(null);
  const trackingRefRef = React.useRef<string | null>(null);
  const trackingStatusRef = React.useRef<string>("accepted");
  const trackingLastCoordsRef = React.useRef<{ lat: number; lng: number } | null>(null);
  const trackingLastSentAtRef = React.useRef<number>(0);

  const [routePolyline, setRoutePolyline] = React.useState<any[] | null>(null);
  const [routeEta, setRouteEta] = React.useState<number | null>(null);
  const [currentPos, setCurrentPos] = React.useState<{lat:number, lng:number}|null>(null);

  const stopLiveTracking = React.useCallback(() => {
    if (trackingWatchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        navigator.geolocation.clearWatch(trackingWatchIdRef.current);
      } catch {}
    }
    trackingWatchIdRef.current = null;
    trackingRefRef.current = null;
    trackingStatusRef.current = "accepted";
    trackingLastCoordsRef.current = null;
    trackingLastSentAtRef.current = 0;
    setIsLiveTracking(false);
    setRoutePolyline(null);
    setRouteEta(null);
    setCurrentPos(null);
  }, []);

  React.useEffect(() => {
    return () => stopLiveTracking();
  }, [stopLiveTracking]);

  // ✅ تحذير قبل إغلاق الصفحة أثناء التتبع
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLiveTracking) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isLiveTracking]);

  const [tab, setTab] = React.useState<"new" | "accepted" | "completed">("new");
  const [chatRequest, setChatRequest] = React.useState<any>(null);

  // إضافة رابط تغيير كلمة المرور في الهيدر أو مكان مناسب
  // سنضيفه بجوار زر تسجيل الخروج أو كزر منفصل


  const t = {
    title: isAr ? "الرد على الطلب" : "Respond to Request",
    city: isAr ? "المدينة" : "City",
    service: isAr ? "الخدمة" : "Service",
    group: isAr ? "نوع الحضور" : "Group",
    people: isAr ? "عدد الأشخاص" : "People",
    notes: isAr ? "ملاحظات العميل" : "Customer Notes",
    price: isAr ? "السعر المقترح" : "Proposed Price",
    currency: isAr ? "العملة" : "Currency",
    priceNotes: isAr ? "ملاحظاتك (اختياري)" : "Your Notes (Optional)",
    accept: isAr ? "قبول الطلب" : "Accept Request",
    reject: isAr ? "رفض الطلب" : "Reject Request",
    submitAccept: isAr ? "تأكيد القبول وإشعار العميل" : "Confirm Accept & Notify",
    submitReject: isAr ? "تأكيد الرفض" : "Confirm Reject",
    rejectReason: isAr ? "سبب الرفض (اختياري)" : "Reject Reason (Optional)",
    successAccept: isAr ? "تم قبول الطلب بنجاح!" : "Request accepted successfully!",
    successReject: isAr ? "تم رفض الطلب." : "Request rejected.",
    startTrip: isAr ? "بدء الرحلة (في الطريق)" : "Start Trip (En Route)",
    arrived: isAr ? "وصلت للموقع" : "Arrived",
    tripStarted: isAr ? "تم بدء الرحلة ومشاركة موقعك مع العميل" : "Trip started, location shared",
    locationError: isAr ? "تعذر تحديد موقعك" : "Location error",
    error: isAr ? "حدث خطأ، حاول مرة أخرى." : "Error occurred, try again.",
    back: isAr ? "إغلاق" : "Close",
    cancel: isAr ? "إلغاء" : "Cancel",
    sending: isAr ? "جارٍ الإرسال..." : "Sending...",
    meetingLoc: isAr ? "موقع الالتقاء" : "Meeting Location",
    payMethod: isAr ? "طريقة الدفع" : "Payment Method",
    payCash: isAr ? "نقداً بعد الالتقاء" : "Cash after meeting",
    payTransfer: isAr ? "تحويل بنكي / STC Pay" : "Bank Transfer / STC Pay",
    accountName: isAr ? "اسم صاحب الحساب" : "Account Holder Name",
    accountNumber: isAr ? "رقم الحساب / الآيبان / STC Pay" : "Account Number / IBAN / STC Pay",
    tabNew: isAr ? "مطابقة جديدة" : "New Matches",
    tabAccepted: isAr ? "مقبولة" : "Accepted",
    tabCompleted: isAr ? "مكتملة" : "Completed",
    completeTrip: isAr ? "إنهاء الرحلة" : "Complete Trip",
    tripCompleted: isAr ? "تم إنهاء الرحلة بنجاح" : "Trip completed successfully",
  };

  React.useEffect(() => {
    fetch("/api/providers/dashboard")
      .then(r => {
        if (r.status === 401) {
          window.location.href = `/${locale}/providers/login`;
          return { redirecting: true };
        }
        return r.json();
      })
      .then(d => {
        if (d && d.redirecting) return;
        if (d && d.ok) setData(d);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [locale]);

  React.useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/providers/dashboard")
        .then((r) => r.json())
        .then((d) => {
          if (d && d.ok) {
            setData((prev: any) => {
              const prevCount = prev?.requests?.length || 0;
              const newCount = d.requests?.length || 0;
              
              if (newCount > prevCount && prev !== null) {
                 if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                    new Notification(isAr ? "طلب جديد!" : "New Request!", {
                       body: isAr ? "وصلك طلب خدمة جديد مطابق لتخصصك." : "You have a new service request.",
                    });
                 }
              }
              return d;
            });
          }
        })
        .catch(() => {});
    }, 30000); // Polling reduced to 30s as backup
    return () => clearInterval(interval);
  }, [isAr]);

  // ✅ Realtime Updates (Supabase)
  React.useEffect(() => {
    if (!data?.provider) return;

    const providerCity = data.provider.city;
    const providerServices = (data.provider.service_type || "")
      .split(",")
      .map((s: string) => s.trim());

    const channel = supabase
      .channel("provider_dashboard_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "customer_requests" },
        (payload) => {
          const newReq = payload.new as any;

          // 1. Check City
          if (newReq.city !== providerCity) return;

          // 2. Check Service
          if (!providerServices.includes(newReq.service_type)) return;

          // 3. Check Status
          if (newReq.status !== "new" && newReq.status !== "pending") return;

          setData((prev: any) => {
            if (!prev) return prev;
            // Deduplicate
            if (prev.requests.some((r: any) => r.id === newReq.id)) return prev;

            // Notify
            if (
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              try {
                new Notification(isAr ? "طلب جديد!" : "New Request!", {
                  body: isAr
                    ? "وصلك طلب خدمة جديد مطابق لتخصصك."
                    : "You have a new service request.",
                });
                // Optional: Play sound here if we had an audio file
              } catch (e) {
                console.error("Notification error:", e);
              }
            }

            return {
              ...prev,
              requests: [newReq, ...prev.requests],
            };
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "customer_requests" },
        (payload) => {
            const updatedReq = payload.new as any;
            
            setData((prev: any) => {
                if (!prev) return prev;
                
                // If a request in our "New Requests" list is no longer new/pending (e.g. taken by someone else)
                const existsInNew = prev.requests.some((r: any) => r.id === updatedReq.id);
                if (existsInNew) {
                    if (updatedReq.status !== "new" && updatedReq.status !== "pending") {
                        // Remove it
                        return {
                            ...prev,
                            requests: prev.requests.filter((r: any) => r.id !== updatedReq.id)
                        };
                    }
                }
                
                return prev;
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [data?.provider?.id, isAr, data]);

  const openRequest = (req: any) => {
    setSelectedRequest(req);
    setView("details");
    setMsg("");
    setPrice("");
    setNotes("");
    setMeetingLocation(req.customer_location || "");
    setPaymentMethod("cash");
    setAccountName("");
    setAccountNumber("");
    setRejectReason("");
  };

  const closeRequest = () => {
    setSelectedRequest(null);
  };

  async function copyText(text: string) {
    const v = String(text || "");
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(v);
        setLocCopied(true);
        window.setTimeout(() => setLocCopied(false), 1500);
        return;
      }
    } catch {}
    try {
      const ta = document.createElement("textarea");
      ta.value = v;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.setAttribute("readonly", "");
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, v.length);
      document.execCommand("copy");
      document.body.removeChild(ta);
      setLocCopied(true);
      window.setTimeout(() => setLocCopied(false), 1500);
    } catch {}
  }
  async function copyRef(text: string) {
    const v = String(text || "");
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(v);
        setRefCopied(true);
        window.setTimeout(() => setRefCopied(false), 1500);
        return;
      }
    } catch {}
    try {
      const ta = document.createElement("textarea");
      ta.value = v;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.setAttribute("readonly", "");
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, v.length);
      document.execCommand("copy");
      document.body.removeChild(ta);
      setRefCopied(true);
      window.setTimeout(() => setRefCopied(false), 1500);
    } catch {}
  }

  async function handleAccept() {
    if (!price) { setMsg(isAr ? "يرجى إدخال السعر" : "Enter price"); return; }
    if (!meetingLocation) { setMsg(isAr ? "يرجى إدخال موقع الالتقاء" : "Enter meeting location"); return; }
    if (paymentMethod === "transfer" && (!accountName || !accountNumber)) {
       setMsg(isAr ? "يرجى إدخال تفاصيل الحساب البنكي" : "Enter bank details");
       return;
    }

    setBusy(true);
    setMsg("");
    
    let paymentDetails = "";
    if (paymentMethod === "transfer") {
      paymentDetails = `${isAr ? "اسم صاحب الحساب" : "Account Name"}: ${accountName}\n${isAr ? "رقم الحساب/IBAN" : "Account No"}: ${accountNumber}`;
    }

    try {
      const res = await fetch("/api/customer-requests/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ref: selectedRequest.ref,
          provider_id: data.provider.id,
          price_total: price,
          currency,
          notes,
          meeting_location: meetingLocation,
          payment_method: paymentMethod,
          payment_details: paymentDetails
        }),
      });
      const j = await res.json();
      if (j.ok) {
        alert(t.successAccept);
        // Remove request from list
        setData((prev: any) => ({
          ...prev,
          requests: prev.requests.filter((r: any) => r.id !== selectedRequest.id)
        }));
        closeRequest();
      } else {
        setMsg(t.error + " " + (j.error || ""));
      }
    } catch {
      setMsg(t.error);
    }
    setBusy(false);
  }

  async function handleReject() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/customer-requests/reject", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ref: selectedRequest.ref,
          provider_id: data.provider.id,
          reason: rejectReason,
        }),
      });
      const j = await res.json();
      if (j.ok) {
        alert(t.successReject);
        // Remove request from list
        setData((prev: any) => ({
          ...prev,
          requests: prev.requests.filter((r: any) => r.id !== selectedRequest.id)
        }));
        closeRequest();
      } else {
        setMsg(t.error);
      }
    } catch {
      setMsg(t.error);
    }
    setBusy(false);
  }

  async function updateStatus(ref: string, status: string, lat?: number, lng?: number, polyline?: any[], eta?: number) {
      try {
        await fetch('/api/providers/track/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ref, status, lat, lng, polyline, eta })
        });
        // Update local state
        setData((prev: any) => {
            if (!prev) return null;
            const updatedAccepted = prev.accepted.map((r: any) => {
                if (r.ref === ref) {
                    return { ...r, provider_status: status };
                }
                return r;
            });
            return { ...prev, accepted: updatedAccepted };
        });
        if (selectedRequest && selectedRequest.ref === ref) {
            setSelectedRequest((prev: any) => ({ ...prev, provider_status: status }));
        }
      } catch (e) {
        console.error("Failed to update status", e);
      }
  }

  async function fetchRouteAndSet(ref: string, status: string, lat: number, lng: number, meetingLoc: string) {
    if (!meetingLoc) return;
    try {
        const geoRes = await fetch(`/api/maps/geocode?q=${encodeURIComponent(meetingLoc)}`);
        const geoData = await geoRes.json();
        if (!geoData.ok) return;

        const routeRes = await fetch('/api/maps/route', {
            method: 'POST',
            body: JSON.stringify({
                startLat: lat,
                startLng: lng,
                endLat: geoData.lat,
                endLng: geoData.lng
            })
        });
        const routeData = await routeRes.json();
        if (routeData.ok) {
            setRoutePolyline(routeData.polyline);
            setRouteEta(routeData.eta);
            // Save route to DB
            await updateStatus(ref, status, lat, lng, routeData.polyline, routeData.eta);
        }
    } catch (e) {
        console.error("Route fetch error", e);
    }
  }

  async function startLiveTrackingFor(ref: string, status: string, meetingLoc?: string) {
    if (!navigator.geolocation) {
      alert(t.locationError);
      return;
    }

    stopLiveTracking();
    trackingRefRef.current = ref;
    trackingStatusRef.current = status;
    setIsLiveTracking(true);

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        const { latitude, longitude } = pos.coords;
        trackingLastCoordsRef.current = { lat: latitude, lng: longitude };
        setCurrentPos({ lat: latitude, lng: longitude });

        const shouldSend = now - trackingLastSentAtRef.current >= 5000;
        if (!shouldSend) return;
        trackingLastSentAtRef.current = now;

        const activeRef = trackingRefRef.current;
        const activeStatus = trackingStatusRef.current;
        if (!activeRef) return;

        await updateStatus(activeRef, activeStatus, latitude, longitude);
      },
      () => {
        alert(t.locationError);
        stopLiveTracking();
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );

    trackingWatchIdRef.current = watchId;

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
      });
      const { latitude, longitude } = pos.coords;
      trackingLastCoordsRef.current = { lat: latitude, lng: longitude };
      setCurrentPos({ lat: latitude, lng: longitude });
      trackingLastSentAtRef.current = Date.now();
      await updateStatus(ref, status, latitude, longitude);
      
      if (status === 'en_route' && meetingLoc) {
          fetchRouteAndSet(ref, status, latitude, longitude, meetingLoc);
      }
    } catch {}
  }

  function handleStartTrip(req: any) {
    if (!navigator.geolocation) {
        alert(t.locationError);
        return;
    }
    setBusy(true);
    startLiveTrackingFor(req.ref, "en_route", req.accepted_meeting_location)
      .then(() => alert(t.tripStarted))
      .finally(() => setBusy(false));
  }

  async function handleArrived(req: any) {
    setBusy(true);
    trackingStatusRef.current = "arrived";

    const last = trackingLastCoordsRef.current;
    const p = last
      ? updateStatus(req.ref, "arrived", last.lat, last.lng)
      : startLiveTrackingFor(req.ref, "arrived");

    try {
      await p;
      alert(t.arrived);
    } finally {
      setBusy(false);
    }
  }

  async function handleInTrip(req: any) {
    setBusy(true);
    trackingStatusRef.current = "in_trip";

    const last = trackingLastCoordsRef.current;
    const p = last
      ? updateStatus(req.ref, "in_trip", last.lat, last.lng)
      : startLiveTrackingFor(req.ref, "in_trip");

    try {
      await p;
      alert(isAr ? "تم بدء الخدمة" : "Service started");
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete(req: any) {
      setBusy(true);
      await updateStatus(req.ref, 'completed');
      stopLiveTracking();
      alert(t.tripCompleted);
      
      // Move from accepted to completed list
      setData((prev: any) => {
          if (!prev) return null;
          const req = prev.accepted.find((r: any) => r.ref === selectedRequest.ref);
          if (!req) return prev;
          return {
              ...prev,
              accepted: prev.accepted.filter((r: any) => r.ref !== selectedRequest.ref),
              completed: [req, ...prev.completed]
          };
      });
      closeRequest();
      setBusy(false);
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>;
  if (!data) return null;

  const { provider, requests, accepted, completed } = data;
  const countNew = Array.isArray(requests) ? requests.length : 0;
  const countAccepted = Array.isArray(accepted) ? accepted.length : 0;
  const countCompleted = Array.isArray(completed) ? completed.length : 0;

  return (
    <main style={{ padding: 20, minHeight: "100vh", background: "#f9f9f9" }} dir={isAr ? "rtl" : "ltr"}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <header style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          justifyContent: "space-between", 
          alignItems: "center", 
          gap: 16, 
          marginBottom: 24, 
          paddingBottom: 16, 
          borderBottom: "1px solid #eee" 
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{isAr ? "لوحة تحكم مقدم الخدمة" : "Provider Dashboard"}</h1>
            <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
              {isAr ? `مرحباً، ${provider.name}` : `Welcome, ${provider.name}`} <span style={{ margin: "0 4px", opacity: 0.3 }}>|</span> {provider.city}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={() => setShowSupport(true)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                color: "#111", fontSize: 13, fontWeight: 600
              }}
            >
              <LifeBuoy size={18} />
              {isAr ? "الدعم" : "Support"}
            </button>
            <div style={{ width: 1, height: 16, background: "#ddd" }}></div>
            <Link 
              href={`/${locale}/providers/change-password`}
              style={{ 
                fontSize: 13, 
                fontWeight: 600, 
                color: "#111", 
                textDecoration: "none",
                borderBottom: "1px dotted #111"
              }}
            >
              {isAr ? "تغيير كلمة المرور" : "Change Password"}
            </Link>
            <div style={{ width: 1, height: 16, background: "#ddd" }}></div>
            <button onClick={() => {
               document.cookie = "kashtat_provider_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
               window.location.href = `/${locale}/providers/login`;
            }} style={{ background: "none", border: "none", padding: 0, fontSize: 13, fontWeight: 600, color: "#d32f2f", cursor: "pointer" }}>
              {isAr ? "تسجيل خروج" : "Logout"}
            </button>
          </div>
        </header>

        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={() => setTab("new")} style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid #111", background: tab === "new" ? "#111" : "#fff", color: tab === "new" ? "#fff" : "#111", fontWeight: 900, fontSize: 12 }}>
            {t.tabNew} ({countNew})
          </button>
          <button onClick={() => setTab("accepted")} style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid #111", background: tab === "accepted" ? "#111" : "#fff", color: tab === "accepted" ? "#fff" : "#111", fontWeight: 900, fontSize: 12 }}>
            {t.tabAccepted} ({countAccepted})
          </button>
          <button onClick={() => setTab("completed")} style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid #111", background: tab === "completed" ? "#111" : "#fff", color: tab === "completed" ? "#fff" : "#111", fontWeight: 900, fontSize: 12 }}>
            {t.tabCompleted} ({countCompleted})
          </button>
        </div>

        {(tab === "new" ? countNew : tab === "accepted" ? countAccepted : countCompleted) === 0 ? (
          <div style={{ background: "#fff", padding: 40, borderRadius: 12, textAlign: "center", color: "#666" }}>
            {isAr ? "لا توجد عناصر حالياً." : "No items found."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
             {(tab === "new" ? requests : tab === "accepted" ? accepted : completed).map((r: any) => (
               <div key={r.ref} style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                 <div style={{ display: "grid", gap: 6 }}>
                   <div style={{ fontWeight: "bold", fontSize: 16 }}>{r.service_type} - {r.city}</div>
                   <div style={{ fontSize: 14, color: "#555" }}>{isAr ? "العميل" : "Client"}: {r.name}</div>
                   <div style={{ fontSize: 13, color: "#888" }}>{new Date(r.created_at).toLocaleString()}</div>
                   <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                     {r.city ? (
                       <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 28, padding: "0 10px", borderRadius: 999, border: "1px solid rgba(0,0,0,0.16)", background: "#fff", color: "#111", fontWeight: 800, fontSize: 12 }}>
                         {r.city}
                       </span>
                     ) : null}
                     {r.service_type ? (
                       <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 28, padding: "0 10px", borderRadius: 999, border: "1px solid rgba(0,0,0,0.16)", background: "#fff", color: "#111", fontWeight: 800, fontSize: 12 }}>
                         {r.service_type}
                       </span>
                     ) : null}
                   </div>
                   <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                     <div style={{ fontWeight: 900, letterSpacing: 1, direction: "ltr" }}>{r.ref}</div>
                     <button
                       type="button"
                       onClick={() => copyRef(String(r.ref || ""))}
                       style={{
                         height: 30,
                         padding: "0 10px",
                         borderRadius: 999,
                         border: "1px solid #111",
                         background: refCopied ? "#111" : "#fff",
                         color: refCopied ? "#fff" : "#111",
                         fontWeight: 900,
                         fontSize: 12,
                         cursor: "pointer",
                       }}
                     >
                       {refCopied ? (isAr ? "نُسخ" : "Copied") : (isAr ? "نسخ المرجع" : "Copy Ref")}
                     </button>
                   </div>
                    {tab === "completed" && typeof r.customer_rating === "number" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 28, padding: "0 10px", borderRadius: 999, border: "1px solid rgba(0,0,0,0.16)", background: "#fff", color: "#111", fontWeight: 800, fontSize: 12 }}>
                          {isAr ? "تقييم العميل" : "Customer Rating"}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 28, padding: "0 10px", borderRadius: 999, border: "1px solid rgba(0,0,0,0.16)", background: "#fff", color: "#111", fontWeight: 900, fontSize: 12 }}>
                          {r.customer_rating}/5
                        </span>
                      </div>
                    ) : null}
                 </div>
                 {tab === "new" ? (
                   <button 
                     onClick={() => openRequest(r)}
                     style={{ background: "#111", color: "#fff", padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: "bold", fontSize: 14 }}
                   >
                     {isAr ? "عرض التفاصيل / قبول" : "View Details / Accept"}
                   </button>
                 ) : tab === "accepted" ? (
                   <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                     <button
                       onClick={() => setChatRequest(r)}
                       style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 36, padding: "0 12px", borderRadius: 999, border: "none", background: "#25D366", color: "#fff", fontWeight: 900, fontSize: 12, cursor: "pointer" }}
                     >
                        {isAr ? "المحادثة" : "Chat"}
                     </button>
                     <a
                       href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(r.accepted_meeting_location || ""))}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 36, padding: "0 12px", borderRadius: 999, border: "1px solid #111", background: "#fff", color: "#111", fontWeight: 900, fontSize: 12, textDecoration: "none" }}
                     >
                       {isAr ? "انطلق للموقع" : "Launch to Location"}
                     </a>
                     {isMobileUA() ? (
                       <a
                         href={mobileMapUrl(String(r.accepted_meeting_location || ""))}
                         style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 36, padding: "0 12px", borderRadius: 999, border: "1px solid #111", background: "#fff", color: "#111", fontWeight: 900, fontSize: 12, textDecoration: "none" }}
                       >
                         {isAr ? "انطلق (تطبيق)" : "Launch (App)"}
                       </a>
                     ) : null}
                   </div>
                 ) : (
                   <span style={{ fontWeight: 900, color: "#2e7d32" }}>{isAr ? "مكتمل" : "Completed"}</span>
                 )}
               </div>
             ))}
          </div>
        )}

        {/* Modal */}
        {selectedRequest && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: 20
          }} onClick={(e) => { if (e.target === e.currentTarget) closeRequest(); }}>
            <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 500, padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{t.title}</h2>
                <button onClick={closeRequest} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer" }}>&times;</button>
              </div>

                <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14, lineHeight: 1.8 }}>
                  <div><strong>{t.city}:</strong> {selectedRequest.city}</div>
                  <div><strong>{t.service}:</strong> {selectedRequest.service_type}</div>
                  {selectedRequest.group_type && <div><strong>{t.group}:</strong> {selectedRequest.group_type}</div>}
                  {selectedRequest.people_count && <div><strong>{t.people}:</strong> {selectedRequest.people_count}</div>}
                  {selectedRequest.notes && <div><strong>{t.notes}:</strong> {selectedRequest.notes}</div>}
                  <div style={{color: '#666', fontSize: 12, marginTop: 8}}>{new Date(selectedRequest.created_at).toLocaleString()}</div>
                </div>

                {/* Tracking Controls */}
                {selectedRequest.accepted_provider_id === data.provider.id && !selectedRequest.completed && (
                    <div style={{ marginBottom: 20, padding: 12, background: "#e3f2fd", borderRadius: 8 }}>
                        <div style={{ fontWeight: 900, marginBottom: 8 }}>{isAr ? "حالة الرحلة" : "Trip Status"}: {
                            selectedRequest.provider_status === 'en_route' ? (isAr ? "في الطريق" : "En Route") :
                            selectedRequest.provider_status === 'arrived' ? (isAr ? "وصلت" : "Arrived") :
                            selectedRequest.provider_status === 'in_trip' ? (isAr ? "بدأت الخدمة" : "In Trip") :
                            selectedRequest.provider_status === 'completed' ? (isAr ? "مكتملة" : "Completed") :
                            (isAr ? "مقبول" : "Accepted")
                        }</div>
                        
                        {isLiveTracking && currentPos && (
                            <div style={{ marginBottom: 16, height: 250, borderRadius: 8, overflow: 'hidden', border: '1px solid #ddd', position: 'relative' }}>
                                <LiveMap
                                    center={[currentPos.lat, currentPos.lng]}
                                    zoom={15}
                                    carIconUrl="https://cdn-icons-png.flaticon.com/512/3097/3097180.png"
                                    providerPos={[currentPos.lat, currentPos.lng]}
                                    routePoints={routePolyline || undefined}
                                    isAr={isAr}
                                    providerLabel={isAr ? "موقعك الحالي" : "Your Location"}
                                />
                                {routeEta && (
                                     <div style={{ position: 'absolute', top: 10, right: 10, background: 'white', padding: '4px 8px', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.2)', zIndex: 1000, fontWeight: 'bold', fontSize: 12 }}>
                                         {isAr ? `الوصول: ${routeEta} د` : `ETA: ${routeEta} m`}
                                     </div>
                                )}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {/* Navigation Button */}
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(selectedRequest.accepted_meeting_location || ""))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ 
                                    flex: "1 1 100%",
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center", 
                                    height: 40, 
                                    marginBottom: 8, 
                                    borderRadius: 8, 
                                    border: "1px solid #111", 
                                    background: "#fff", 
                                    color: "#111", 
                                    fontWeight: 900, 
                                    fontSize: 14, 
                                    textDecoration: "none" 
                                }}
                             >
                                 {isAr ? "انطلق للموقع" : "Launch to Location"}
                             </a>

                             {selectedRequest.provider_status !== 'en_route' && selectedRequest.provider_status !== 'arrived' && selectedRequest.provider_status !== 'in_trip' && selectedRequest.provider_status !== 'completed' && (
                                <button onClick={() => handleStartTrip(selectedRequest)} disabled={busy} style={{ flex: 1, height: 40, borderRadius: 8, background: "#1976d2", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                                    {t.startTrip}
                                </button>
                            )}
                            {(selectedRequest.provider_status === 'en_route' || selectedRequest.provider_status === 'in_trip') && !isLiveTracking && (
                                <button onClick={() => startLiveTrackingFor(selectedRequest.ref, selectedRequest.provider_status, selectedRequest.accepted_meeting_location)} disabled={busy} style={{ flex: 1, height: 40, borderRadius: 8, background: "#111", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                                    {isAr ? "استئناف التتبع" : "Resume Tracking"}
                                </button>
                            )}
                            {selectedRequest.provider_status === 'en_route' && (
                                <button onClick={() => handleArrived(selectedRequest)} disabled={busy} style={{ flex: 1, height: 40, borderRadius: 8, background: "#f57c00", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                                    {t.arrived}
                                </button>
                            )}
                            {selectedRequest.provider_status === 'arrived' && (
                                <button onClick={() => handleInTrip(selectedRequest)} disabled={busy} style={{ flex: 1, height: 40, borderRadius: 8, background: "#7b1fa2", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                                    {isAr ? "بدء الخدمة" : "Start Service"}
                                </button>
                            )}
                            {(selectedRequest.provider_status === 'arrived' || selectedRequest.provider_status === 'en_route' || selectedRequest.provider_status === 'in_trip') && (
                                <button onClick={() => handleComplete(selectedRequest)} disabled={busy} style={{ flex: 1, height: 40, borderRadius: 8, background: "#388e3c", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                                    {t.completeTrip}
                                </button>
                            )}
                            {isLiveTracking && trackingRefRef.current === selectedRequest.ref && (
                              <button onClick={stopLiveTracking} disabled={busy} style={{ flex: 1, height: 40, borderRadius: 8, background: "#111", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                                {isAr ? "إيقاف التتبع" : "Stop Tracking"}
                              </button>
                            )}
                        </div>
                    </div>
                )}

                {view === "details" && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setView("accept")} style={{ flex: 1, height: 44, borderRadius: 10, background: "#111", color: "#fff", border: "none", fontWeight: 900, cursor: "pointer" }}>
                      {t.accept}
                    </button>
                  <button onClick={() => setView("reject")} style={{ flex: 1, height: 44, borderRadius: 10, background: "#fff", color: "#d32f2f", border: "1px solid #d32f2f", fontWeight: 900, cursor: "pointer" }}>
                    {t.reject}
                  </button>
                </div>
              )}

              {view === "accept" && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 900, marginBottom: 4 }}>{t.price}</label>
                    <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid #ddd", padding: "0 10px" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 900, marginBottom: 4 }}>{t.currency}</label>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid #ddd", padding: "0 10px" }}>
                      <option value="SAR">SAR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 900, marginBottom: 4 }}>{t.priceNotes}</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: "100%", minHeight: 80, borderRadius: 8, border: "1px solid #ddd", padding: "10px" }} />
                  </div>
                  
                  <div style={{ borderTop: "1px solid #eee", margin: "10px 0" }}></div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 900, marginBottom: 4 }}>{t.meetingLoc}</label>
                    <input value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)} type="text" placeholder="مثال: محطة القطار، المطار، موقع المخيم..." style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid #ddd", padding: "0 10px" }} />
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => copyText(meetingLocation)}
                        style={{
                          height: 40,
                          padding: "0 12px",
                          borderRadius: 999,
                          border: "1px solid #111",
                          background: locCopied ? "#111" : "#fff",
                          color: locCopied ? "#fff" : "#111",
                          fontWeight: 900,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        {locCopied ? (isAr ? "نُسخ" : "Copied") : (isAr ? "نسخ الموقع" : "Copy Location")}
                      </button>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetingLocation)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: 40,
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
                        {isAr ? "فتح الخريطة" : "Open Map"}
                      </a>
                      {isMobileUA() ? (
                        <a
                          href={mobileMapUrl(String(meetingLocation || ""))}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: 40,
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
                    </div>
                  </div>

                  <div>
                     <label style={{ display: "block", fontSize: 12, fontWeight: 900, marginBottom: 4 }}>{t.payMethod}</label>
                     <div style={{ display: "flex", gap: 15 }}>
                       <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                         <input type="radio" name="pay_method" value="cash" checked={paymentMethod === "cash"} onChange={e => setPaymentMethod(e.target.value)} />
                         <span>{t.payCash}</span>
                       </label>
                       <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                         <input type="radio" name="pay_method" value="transfer" checked={paymentMethod === "transfer"} onChange={e => setPaymentMethod(e.target.value)} />
                         <span>{t.payTransfer}</span>
                       </label>
                     </div>
                  </div>

                  {paymentMethod === "transfer" && (
                    <div style={{ background: "#f9f9f9", padding: 12, borderRadius: 8, display: "grid", gap: 10 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 900, marginBottom: 4 }}>{t.accountName}</label>
                        <input value={accountName} onChange={(e) => setAccountName(e.target.value)} style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid #ddd", padding: "0 10px" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 900, marginBottom: 4 }}>{t.accountNumber}</label>
                        <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="SA0000..." style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid #ddd", padding: "0 10px" }} />
                      </div>
                    </div>
                  )}

                  {msg && <div style={{color: 'red', fontSize: 13}}>{msg}</div>}

                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <button onClick={handleAccept} disabled={busy} style={{ flex: 2, height: 44, borderRadius: 10, background: "#2e7d32", color: "#fff", border: "none", fontWeight: 900, cursor: "pointer", opacity: busy ? 0.7 : 1 }}>
                      {busy ? t.sending : t.submitAccept}
                    </button>
                    <button onClick={() => setView("details")} disabled={busy} style={{ flex: 1, height: 44, borderRadius: 10, background: "#eee", color: "#333", border: "none", fontWeight: 900, cursor: "pointer" }}>
                      {t.cancel}
                    </button>
                  </div>
                </div>
              )}

              {view === "reject" && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 900, marginBottom: 4 }}>{t.rejectReason}</label>
                    <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} style={{ width: "100%", minHeight: 80, borderRadius: 8, border: "1px solid #ddd", padding: "10px" }} />
                  </div>

                  {msg && <div style={{color: 'red', fontSize: 13}}>{msg}</div>}

                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <button onClick={handleReject} disabled={busy} style={{ flex: 2, height: 44, borderRadius: 10, background: "#d32f2f", color: "#fff", border: "none", fontWeight: 900, cursor: "pointer", opacity: busy ? 0.7 : 1 }}>
                      {busy ? t.sending : t.submitReject}
                    </button>
                    <button onClick={() => setView("details")} disabled={busy} style={{ flex: 1, height: 44, borderRadius: 10, background: "#eee", color: "#333", border: "none", fontWeight: 900, cursor: "pointer" }}>
                      {t.cancel}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Widget (Docked) */}
        {chatRequest && (
          <div style={{
            position: "fixed", 
            bottom: 20, 
            [isAr ? "left" : "right"]: 20,
            width: 360,
            height: 500,
            maxHeight: "80vh",
            zIndex: 1100,
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            borderRadius: 16,
            overflow: "hidden",
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.05)"
          }}>
              <ChatWidget 
                  providerId={data.provider.id} 
                  requestId={chatRequest.id} 
                  userRole="provider"
                  requestRef={chatRequest.ref}
                  onClose={() => setChatRequest(null)}
                  fullHeight={true}
                  counterpartName={chatRequest.name}
              />
          </div>
        )}

        {showSupport && <SupportModal onClose={() => setShowSupport(false)} isAr={isAr} refId={selectedRequest?.ref} />}
       </div>
     </main>
  );
}
