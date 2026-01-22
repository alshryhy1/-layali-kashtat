"use client";

import * as React from "react";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

function safe(v: unknown) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

export default function ProviderAcceptPage({ params }: { params: { locale: string } }) {
  const locale: Locale = asLocale(params?.locale);
  const isAr = locale === "ar";

  const t = {
    title: isAr ? "الرد على طلب العميل" : "Respond to Customer Request",
    loading: isAr ? "جاري تحميل الطلب..." : "Loading request...",
    notFound: isAr ? "الطلب غير موجود أو غير متاح." : "Request not found or unavailable.",
    city: isAr ? "المدينة" : "City",
    service: isAr ? "الخدمة" : "Service",
    date: isAr ? "التاريخ" : "Date",
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
    back: isAr ? "عودة" : "Back",
    sending: isAr ? "جارٍ الإرسال..." : "Sending...",
    meetingLoc: isAr ? "موقع الالتقاء" : "Meeting Location",
    payMethod: isAr ? "طريقة الدفع" : "Payment Method",
    payCash: isAr ? "نقداً بعد الالتقاء" : "Cash after meeting",
    payTransfer: isAr ? "تحويل بنكي / STC Pay" : "Bank Transfer / STC Pay",
    accountName: isAr ? "اسم صاحب الحساب" : "Account Holder Name",
    accountNumber: isAr ? "رقم الحساب / الآيبان / STC Pay" : "Account Number / IBAN / STC Pay",
  };

  const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const refParam = safe(sp.get("ref"));
  const pidParam = safe(sp.get("provider_id"));

  const [reqData, setReqData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"details" | "accept" | "reject" | "done">("details");
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

  React.useEffect(() => {
    if (!refParam || !pidParam) {
      setLoading(false);
      return;
    }
    fetch(`/api/customer-requests/info?ref=${refParam}&provider_id=${pidParam}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setReqData(d.request);
          if (d.request.status !== 'new' && d.request.status !== 'pending') {
             setMsg(isAr ? "عذراً، هذا الطلب مغلق أو تم قبوله مسبقاً." : "Request is closed or already accepted.");
             setView('done');
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refParam, pidParam, isAr]);

  async function handleAccept() {
    if (!price) {
      setMsg(isAr ? "يرجى إدخال السعر" : "Enter price");
      return;
    }
    if (!meetingLocation) {
      setMsg(isAr ? "يرجى إدخال موقع الالتقاء" : "Enter meeting location");
      return;
    }
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
          ref: refParam,
          provider_id: pidParam,
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
        setView("done");
        setMsg(t.successAccept);
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
          ref: refParam,
          provider_id: pidParam,
          reason: rejectReason,
        }),
      });
      const j = await res.json();
      if (j.ok) {
        setView("done");
        setMsg(t.successReject);
      } else {
        setMsg(t.error);
      }
    } catch {
      setMsg(t.error);
    }
    setBusy(false);
  }

  if (loading) return <div style={{ padding: 20 }}>{t.loading}</div>;
  if (!reqData) return <div style={{ padding: 20 }}>{t.notFound}</div>;

  return (
    <main style={{ padding: 16, display: "flex", justifyContent: "center", minHeight: "100vh", background: "#f9f9f9" }} dir={isAr ? "rtl" : "ltr"}>
      <div style={{ width: "100%", maxWidth: 500, background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", height: "fit-content" }}>
        
        {view === "done" ? (
           <div style={{textAlign: 'center', padding: '40px 0'}}>
             <h2 style={{color: msg.includes("رفض") ? "#d32f2f" : "#2e7d32"}}>{msg}</h2>
           </div>
        ) : (
          <>
            <h1 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 900 }}>{t.title}</h1>
            
            <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14, lineHeight: 1.8 }}>
              <div><strong>{t.city}:</strong> {reqData.city}</div>
              <div><strong>{t.service}:</strong> {reqData.service_type}</div>
              {reqData.group_type && <div><strong>{t.group}:</strong> {reqData.group_type}</div>}
              {reqData.people_count && <div><strong>{t.people}:</strong> {reqData.people_count}</div>}
              {reqData.notes && <div><strong>{t.notes}:</strong> {reqData.notes}</div>}
              <div style={{color: '#666', fontSize: 12, marginTop: 8}}>{new Date(reqData.created_at).toLocaleString()}</div>
            </div>

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
                    {t.back}
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
                    {t.back}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
