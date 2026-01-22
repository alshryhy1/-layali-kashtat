"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CreditCard, Calculator, Send, CheckCircle } from "lucide-react";

export default function CommissionPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || "ar";
  const isAr = locale === "ar";

  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    sender_name: "",
    amount: "",
    bank_name: "Al Rajhi Bank",
    transfer_date: new Date().toISOString().split('T')[0],
    notes: ""
  });

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
    <div className="page-container" dir={isAr ? "rtl" : "ltr"}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px" }}>
        
        {/* Header */}
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
          
          {/* Bank Accounts */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <CreditCard className="text-emerald-600" />
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>
                {isAr ? "الحسابات البنكية" : "Bank Accounts"}
              </h2>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 16, background: "#f8fafc" }}>
                <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>مصرف الراجحي (Al Rajhi)</div>
                <div style={{ fontSize: 18, fontFamily: "monospace", color: "#0f172a" }}>SA46 8020 7282 4002 2212 1010</div>
                <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>اسم المستفيد: حسن للعسل ومشتقاته</div>
              </div>

              <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 16, background: "#f8fafc" }}>
                <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>البنك الأهلي (SNB)</div>
                <div style={{ fontSize: 18, fontFamily: "monospace", color: "#0f172a" }}>SA00 1000 0000 0000 0000 0000</div>
                <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>اسم المستفيد: حسن للعسل ومشتقاته</div>
              </div>
            </div>
          </div>

          {/* Calculator */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <Calculator className="text-orange-600" />
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>
                {isAr ? "حاسبة العمولة" : "Commission Calculator"}
              </h2>
            </div>
            
            <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isAr ? "سعر البيع" : "Sale Price"}
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
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

          {/* Report Form */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <Send className="text-blue-600" />
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>
                {isAr ? "نموذج تحويل العمولة" : "Report Transfer"}
              </h2>
            </div>

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
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Al Rajhi Bank">مصرف الراجحي</option>
                  <option value="SNB">البنك الأهلي</option>
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
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
