"use client";

import * as React from "react";
import Link from "next/link";

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

function normalizePhoneForLinks(input: string) {
  const map: Record<string, string> = { "٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9" };
  const s = String(input || "").replace(/[٠-٩]/g, (d) => map[d] ?? d).replace(/\s+/g, "");
  const digits = s.replace(/[^0-9+]/g, "");
  const tel = digits.replace(/\+/g, "");
  let wa = tel;
  if (tel.startsWith("0") && tel.length >= 9) {
    wa = "966" + tel.slice(1);
  } else if (tel.startsWith("+966")) {
    wa = tel.slice(1);
  }
  return { tel, wa };
}

export default function ProviderDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const p = React.use(params);
  const locale = asLocale(p?.locale);
  const isAr = locale === "ar";
  
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
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
  const [tab, setTab] = React.useState<"new" | "accepted" | "completed">("new");

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

  const openRequest = (req: any) => {
    setSelectedRequest(req);
    setView("details");
    setMsg("");
    setPrice("");
    setNotes("");
    setMeetingLocation("");
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

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>;
  if (!data) return null;

  const { provider, requests, accepted, completed } = data;
  const countNew = Array.isArray(requests) ? requests.length : 0;
  const countAccepted = Array.isArray(accepted) ? accepted.length : 0;
  const countCompleted = Array.isArray(completed) ? completed.length : 0;

  return (
    <main style={{ padding: 20, minHeight: "100vh", background: "#f9f9f9" }} dir={isAr ? "rtl" : "ltr"}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>{isAr ? "لوحة تحكم مقدم الخدمة" : "Provider Dashboard"}</h1>
            <div style={{ fontSize: 14, color: "#666", marginTop: 5 }}>
              {isAr ? `مرحباً، ${provider.name}` : `Welcome, ${provider.name}`} | {provider.city}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link 
              href={`/${locale}/providers/change-password`}
              style={{ 
                padding: "8px 16px", 
                background: "#fff", 
                border: "1px solid #ddd", 
                borderRadius: 6, 
                textDecoration: "none", 
                color: "#111", 
                fontSize: 14,
                display: "inline-flex",
                alignItems: "center"
              }}
            >
              {isAr ? "تغيير كلمة المرور" : "Change Password"}
            </Link>
            <button onClick={() => {
               document.cookie = "kashtat_provider_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
               window.location.href = `/${locale}/providers/login`;
            }} style={{ padding: "8px 16px", background: "#eee", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>
              {isAr ? "خروج" : "Logout"}
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
                    {tab !== "completed" && r.phone ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 800, letterSpacing: 1, direction: "ltr" }}>{r.phone}</div>
                        {(() => {
                          const l = normalizePhoneForLinks(String(r.phone || ""));
                          const msg = isAr ? `مرحباً، بخصوص الطلب ${r.ref}` : `Hello, regarding request ${r.ref}`;
                          const waUrl = `https://wa.me/${l.wa}?text=${encodeURIComponent(msg)}`;
                          const telUrl = `tel:${l.tel}`;
                          const circleBase: React.CSSProperties = {
                            width: 36,
                            height: 36,
                            borderRadius: 999,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textDecoration: "none",
                            fontWeight: 900,
                            fontSize: 16,
                            border: "1px solid rgba(0,0,0,0.2)",
                            background: "#fff",
                            color: "#111",
                          };
                          const circleCall: React.CSSProperties = { ...circleBase };
                          const circleWhats: React.CSSProperties = {
                            ...circleBase,
                            border: "1px solid #25D366",
                            color: "#25D366",
                          };
                          return (
                            <>
                              <a href={telUrl} style={circleCall} title={isAr ? "اتصال" : "Call"} aria-label={isAr ? "اتصال" : "Call"}>📞</a>
                              <a href={waUrl} style={circleWhats} title="WhatsApp" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">WA</a>
                            </>
                          );
                        })()}
                      </div>
                    ) : null}
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
                     <a
                       href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(r.accepted_meeting_location || ""))}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 36, padding: "0 12px", borderRadius: 999, border: "1px solid #111", background: "#fff", color: "#111", fontWeight: 900, fontSize: 12, textDecoration: "none" }}
                     >
                       {isAr ? "فتح الخريطة" : "Open Map"}
                     </a>
                     {isMobileUA() ? (
                       <a
                         href={mobileMapUrl(String(r.accepted_meeting_location || ""))}
                         style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 36, padding: "0 12px", borderRadius: 999, border: "1px solid #111", background: "#fff", color: "#111", fontWeight: 900, fontSize: 12, textDecoration: "none" }}
                       >
                         {isAr ? "فتح في تطبيق الخرائط" : "Open in Maps App"}
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

                {selectedRequest.phone ? (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>{isAr ? "جوال العميل" : "Client Phone"}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 800, letterSpacing: 1, direction: "ltr" }}>{selectedRequest.phone}</div>
                      {(() => {
                        const l = normalizePhoneForLinks(String(selectedRequest.phone || ""));
                        const msg = isAr ? `مرحباً، بخصوص الطلب ${selectedRequest.ref}` : `Hello, regarding request ${selectedRequest.ref}`;
                        const waUrl = `https://wa.me/${l.wa}?text=${encodeURIComponent(msg)}`;
                        const telUrl = `tel:${l.tel}`;
                        const circleBase: React.CSSProperties = {
                          width: 40,
                          height: 40,
                          borderRadius: 999,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textDecoration: "none",
                          fontWeight: 900,
                          fontSize: 18,
                          border: "1px solid rgba(0,0,0,0.2)",
                          background: "#fff",
                          color: "#111",
                        };
                        const circleCall: React.CSSProperties = { ...circleBase };
                        const circleWhats: React.CSSProperties = {
                          ...circleBase,
                          border: "1px solid #25D366",
                          color: "#25D366",
                        };
                        return (
                          <>
                            <a href={telUrl} style={circleCall} title={isAr ? "اتصال" : "Call"} aria-label={isAr ? "اتصال" : "Call"}>📞</a>
                            <a href={waUrl} style={circleWhats} title="WhatsApp" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">WA</a>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : null}

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
      </div>
    </main>
  );
}
