 "use client";
 
 import { useState, useEffect } from "react";
 import { useRouter, useParams } from "next/navigation";
 import { CreditCard, Calculator, Send, CheckCircle, Wallet } from "lucide-react";
 
 export default function CommissionPage() {
   const params = useParams();
   const router = useRouter();
   const locale = (params.locale as string) || "ar";
   const isAr = locale === "ar";
 
   const [price, setPrice] = useState("");
   const [loading, setLoading] = useState(false);
   const [success, setSuccess] = useState(false);
  const [waitingPay, setWaitingPay] = useState(false);
  const [waitingMsg, setWaitingMsg] = useState("");
  const [pollTimer, setPollTimer] = useState<any>(null);
   
   const [formData, setFormData] = useState({
     sender_name: "",
     amount: "",
     bank_name: "Al Rajhi Bank",
     transfer_date: "",
     notes: ""
   });
 
   useEffect(() => {
     setFormData(prev => ({
       ...prev,
       transfer_date: new Date().toISOString().split('T')[0]
     }));
   }, []);
 
  const calculateCommission = (val: string) => {
     const num = parseFloat(val);
     if (isNaN(num)) return 0;
     return (num * 0.01).toFixed(2);
   };
 
  const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
 
     try {
 
       const res = await fetch("/api/haraj/commission", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(formData),
       });
 
       if (res.ok) {
         setSuccess(true);
         setTimeout(() => {
           router.push(`/${locale}/haraj`);
         }, 3000);
       } else {
         alert(isAr ? "حدث خطأ أثناء الإرسال" : "Error sending report");
       }
     } catch (err) {
       console.error(err);
       alert(isAr ? "حدث خطأ غير متوقع" : "Unexpected error");
     } finally {
       setLoading(false);
     }
   };
   
  const handleOnlinePay = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert(isAr ? "أدخل مبلغ التحويل أولاً" : "Enter transfer amount first");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/paymob/intention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commission_policy: "haraj",
          sale_price: parseFloat(formData.amount),
          currency: "SAR",
          description: "Layali Kashtat Commission",
          customer_name: formData.sender_name || "Customer",
          customer_phone: "",
          customer_email: "",
        }),
      });
      const j = await r.json();
      if (!j.ok) {
        const err = String(j?.error || "");
        const msg = isAr
          ? (err === "missing_api_key" ? "بوابة الدفع غير مهيأة — أضف PAYMOB_API_KEY في .env.local"
            : err === "missing_integration_id" ? "أدخل رقم Integration ID في .env.local"
            : "تعذر إنشاء الدفع")
          : (err === "missing_api_key" ? "Gateway not configured — add PAYMOB_API_KEY in .env.local"
            : err === "missing_integration_id" ? "Add Integration ID in .env.local"
            : "Failed to create payment");
        alert(msg);
        return;
      }
      const clientSecret = j?.client_secret || j?.data?.client_secret;
      const intentionId = j?.intention_id || j?.data?.id || "";
      if (clientSecret) {
        if (intentionId) {
          try {
            localStorage.setItem("lk_last_intention", String(intentionId));
          } catch {}
        }
        window.location.href = `https://ksa.paymob.com/unifiedcheckout/?client_secret=${clientSecret}`;
        setWaitingPay(true);
        setWaitingMsg(isAr ? "بانتظار إتمام الدفع..." : "Waiting for payment...");
        if (pollTimer) {
          try { clearInterval(pollTimer); } catch {}
        }
        const t = setInterval(async () => {
          const id = intentionId || localStorage.getItem("lk_last_intention") || "";
          if (!id) return;
          try {
            const vr = await fetch("/api/paymob/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ intention_id: id }),
            });
            const vj = await vr.json();
            if (vj && vj.ok) {
              if (vj.paid) {
                try { clearInterval(t); } catch {}
                setPollTimer(null);
                setWaitingMsg(isAr ? "تم الدفع بنجاح" : "Payment succeeded");
                alert(isAr ? "تم الدفع بنجاح" : "Payment succeeded");
                setWaitingPay(false);
              } else if (String(vj.status || "").toLowerCase() === "failed") {
                try { clearInterval(t); } catch {}
                setPollTimer(null);
                setWaitingMsg(isAr ? "فشل الدفع" : "Payment failed");
                alert(isAr ? "فشل الدفع" : "Payment failed");
                setWaitingPay(false);
              }
            }
          } catch {}
        }, 5000);
        setPollTimer(t);
        return;
      }
      alert(isAr ? "تعذر إنشاء الدفع" : "Failed to create payment");
    } catch {
      alert(isAr ? "خطأ غير متوقع أثناء إنشاء الدفع" : "Unexpected error creating payment");
    } finally {
      setLoading(false);
    }
  };
 
   if (success) {
     return (
       <div className="page-container" dir={isAr ? "rtl" : "ltr"}>
         <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center", padding: 40, background: "#fff", borderRadius: 24 }}>
           <CheckCircle size={64} color="#10b981" style={{ margin: "0 auto 20px" }} />
           <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>
             {isAr ? "تم إرسال النموذج بنجاح" : "Report Sent Successfully"}
           </h2>
           <p className="text-gray-600">
             {isAr ? "شكراً لأمانتك، سيتم مراجعة التحويل." : "Thank you. We will verify the transfer."}
           </p>
         </div>
       </div>
     );
   }
 
   return (
     <div className="page-container" dir={isAr ? "rtl" : "ltr"} style={{ background: "#fcfcfc", minHeight: "100vh" }}>
       <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px" }}>
         
         <div style={{ marginBottom: 32, textAlign: "center" }}>
           <h1 style={{ fontSize: 32, fontWeight: 900, color: "#92400e", marginBottom: 12 }}>
             {isAr ? "دفع العمولة (1%)" : "Pay Commission (1%)"}
           </h1>
           <p style={{ fontSize: 18, color: "#666", maxWidth: 600, margin: "0 auto" }}>
             {isAr 
               ? "العمولة أمانة في ذمة المعلن سواء تمت البيعة عن طريق الموقع أو بسببه." 
               : "Commission is mandatory if the sale was made through or because of this site."}
           </p>
         </div>
 
         <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
          {waitingPay ? (
            <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 16, textAlign: "center", fontWeight: 900 }}>
              {waitingMsg}
            </div>
          ) : null}
           
           <div style={{ background: "#f5f5f5", borderRadius: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", overflow: "hidden", border: "1px solid #e0e0e0" }}>
             <div style={{ background: "#eeeeee", padding: "20px", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", gap: 12 }}>
               <CreditCard className="text-emerald-600" />
               <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
                 {isAr ? "الحسابات البنكية" : "Bank Accounts"}
               </h2>
             </div>
 
             <div style={{ padding: 24, display: "grid", gap: 16 }}>
               <div style={{ padding: 16, border: "1px solid #e0e0e0", borderRadius: 16, background: "#fafafa" }}>
                 <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>مصرف الراجحي (Al Rajhi)</div>
                 <div style={{ fontSize: 18, fontFamily: "monospace", color: "#0f172a" }}>SA1980208354056222121011</div>
                 <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>اسم المستفيد: حسن الشمري برمجه وتطوير المواقغ الالكترونية</div>
               </div>
             </div>
           </div>
 
           <div style={{ background: "#f5f5f5", borderRadius: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", overflow: "hidden", border: "1px solid #e0e0e0" }}>
             <div style={{ background: "#eeeeee", padding: "20px", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", gap: 12 }}>
               <Calculator className="text-orange-600" />
               <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
                 {isAr ? "حاسبة العمولة" : "Commission Calculator"}
               </h2>
             </div>
             
             <div style={{ padding: 24, display: "flex", gap: 16, alignItems: "flex-end" }}>
               <div style={{ flex: 1 }}>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   {isAr ? "سعر البيع" : "Sale Price"}
                 </label>
                 <input
                   type="number"
                   placeholder="0"
                   value={price}
                   onChange={(e) => setPrice(e.target.value)}
                   className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                 />
               </div>
               <div style={{ paddingBottom: 12, fontWeight: 900, fontSize: 24, color: "#92400e" }}>
                 =
               </div>
               <div style={{ flex: 1 }}>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   {isAr ? "العمولة المستحقة" : "Commission Due"}
                 </label>
                 <div className="w-full p-3 bg-orange-50 border border-orange-100 rounded-xl font-bold text-orange-800">
                   {calculateCommission(price)} {isAr ? "ر.س" : "SAR"}
                 </div>
               </div>
             </div>
           </div>
 
           <div style={{ background: "#f5f5f5", borderRadius: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", overflow: "hidden", border: "1px solid #e0e0e0" }}>
             <div style={{ background: "#eeeeee", padding: "20px", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", gap: 12 }}>
               <Send className="text-blue-600" />
               <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
                 {isAr ? "نموذج تحويل العمولة" : "Report Transfer"}
               </h2>
             </div>
 
             <div style={{ padding: 24 }}>
               <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   {isAr ? "اسم المحول" : "Sender Name"}
                 </label>
                 <input
                   type="text"
                   required
                   value={formData.sender_name}
                   onChange={(e) => setFormData({...formData, sender_name: e.target.value})}
                   className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                 />
               </div>
 
               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     {isAr ? "المبلغ المحول" : "Amount"}
                   </label>
                   <input
                     type="number"
                     required
                     value={formData.amount}
                     onChange={(e) => setFormData({...formData, amount: e.target.value})}
                     className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     {isAr ? "تاريخ التحويل" : "Date"}
                   </label>
                   <input
                     type="date"
                     required
                     value={formData.transfer_date}
                     onChange={(e) => setFormData({...formData, transfer_date: e.target.value})}
                     className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                   />
                 </div>
               </div>
 
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   {isAr ? "البنك المحول إليه" : "Bank"}
                 </label>
                 <select
                   value={formData.bank_name}
                   onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                   className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                 >
                   <option value="Al Rajhi Bank">مصرف الراجحي</option>
                   <option value="Other">بنك آخر</option>
                 </select>
               </div>
 
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   {isAr ? "ملاحظات (رقم الإعلان، إلخ)" : "Notes (Ad ID, etc)"}
                 </label>
                 <textarea
                   rows={3}
                   value={formData.notes}
                   onChange={(e) => setFormData({...formData, notes: e.target.value})}
                   className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                 />
               </div>
 
               <button
                 type="submit"
                 disabled={loading}
                 className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
               >
                 {loading 
                   ? (isAr ? "جاري الإرسال..." : "Sending...") 
                   : (isAr ? "إرسال النموذج" : "Submit Report")}
               </button>
               
              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  onClick={handleOnlinePay}
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  <Wallet size={18} />
                  {isAr ? "الدفع الإلكتروني" : "Pay Online"}
                </button>
              </div>
             </form>
             </div>
           </div>
 
         </div>
       </div>
     </div>
   );
 }
