 "use client";
 
 import * as React from "react";
 
 type Locale = "ar" | "en";
 function asLocale(v: any): Locale {
   return String(v || "").toLowerCase() === "en" ? "en" : "ar";
 }
 function clean(v: unknown) {
   return String(v ?? "").trim();
 }
 
 export default function NewCustomerRequestPage({ params }: { params: { locale: string } }) {
   const locale = asLocale(params?.locale);
   const isAr = locale === "ar";
   const [city, setCity] = React.useState("");
   const [service, setService] = React.useState("");
   const [notes, setNotes] = React.useState("");
   const [busy, setBusy] = React.useState(false);
   const [msg, setMsg] = React.useState("");
   const [ref, setRef] = React.useState("");
 
   async function submit() {
     if (!city || !service) {
       setMsg(isAr ? "يرجى اختيار المدينة ونوع الخدمة" : "Select city and service");
       return;
     }
     setBusy(true);
     setMsg("");
     try {
       const r = await fetch("/api/customer-requests/create", {
         method: "POST",
         headers: { "content-type": "application/json" },
         body: JSON.stringify({ city: clean(city), service_type: clean(service), notes: clean(notes) }),
       });
       const j = await r.json();
       if (j?.ok && j?.ref) {
         setRef(String(j.ref));
         setMsg(isAr ? "تم إنشاء الطلب بنجاح" : "Request created successfully");
       } else {
         setMsg(isAr ? "تعذّر إنشاء الطلب" : "Failed to create request");
       }
     } catch {
       setMsg(isAr ? "تعذّر إنشاء الطلب" : "Failed to create request");
     }
     setBusy(false);
   }
 
   return (
     <main style={{ maxWidth: 680, margin: "0 auto", padding: 16 }} dir={isAr ? "rtl" : "ltr"}>
       <h1 style={{ fontWeight: 900, fontSize: 24, marginBottom: 12 }}>
         {isAr ? "طلب خدمة جديد" : "New Service Request"}
       </h1>
       {msg && <div style={{ padding: 12, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 12, color: "#374151", fontWeight: 700 }}>{msg}</div>}
       <div style={{ display: "grid", gap: 12 }}>
         <input placeholder={isAr ? "المدينة" : "City"} value={city} onChange={(e) => setCity(e.target.value)} style={{ height: 44, borderRadius: 10, border: "1px solid #ddd", paddingInline: 12 }} />
         <input placeholder={isAr ? "نوع الخدمة" : "Service Type"} value={service} onChange={(e) => setService(e.target.value)} style={{ height: 44, borderRadius: 10, border: "1px solid #ddd", paddingInline: 12 }} />
         <textarea placeholder={isAr ? "ملاحظات إضافية" : "Additional notes"} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ minHeight: 90, borderRadius: 10, border: "1px solid #ddd", paddingInline: 12, paddingBlock: 8 }} />
         <button onClick={submit} disabled={busy} style={{ height: 44, borderRadius: 12, border: "none", background: "#111", color: "#fff", fontWeight: 900 }}>
           {busy ? (isAr ? "جارٍ الإرسال..." : "Submitting...") : (isAr ? "إنشاء الطلب" : "Create Request")}
         </button>
         {ref && <div style={{ color: "#111", fontWeight: 800 }}>{isAr ? `رقم الطلب: ${ref}` : `Request Ref: ${ref}`}</div>}
       </div>
     </main>
   );
 }
