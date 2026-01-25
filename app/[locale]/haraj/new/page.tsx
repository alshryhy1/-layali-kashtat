"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Upload, Handshake } from "lucide-react";

export default function NewAdPage() {
  const router = useRouter();
  const pathname = usePathname();
  // Robustly extract locale from pathname (e.g. "/ar/haraj/new" -> "ar")
  const locale = pathname?.split('/')[1] || 'ar';

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pledgeAgreed, setPledgeAgreed] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    city: "الرياض",
    category: "tents",
    contact_phone: "",
    delete_code: "",
    image_url: "",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.set("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (json.success) {
        setFormData({ ...formData, image_url: json.url });
      } else {
        alert(`فشل رفع الصورة: ${json.error || 'خطأ غير معروف'}`);
      }
    } catch (err) {
      console.error(err);
      alert("خطأ أثناء الرفع: حدثت مشكلة في الاتصال");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/haraj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push(`/${locale}/haraj`);
        router.refresh();
      } else {
        alert("حدث خطأ أثناء إضافة الإعلان");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  if (!pledgeAgreed) {
    return (
      <div className="page-container" dir="rtl">
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
          <div style={{ 
            background: "#fff", 
            borderRadius: 24, 
            padding: 32, 
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            textAlign: "center"
          }}>
            <div style={{ 
            width: 60, 
            height: 60, 
            background: "#fffbeb", 
            borderRadius: "50%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            margin: "0 auto 24px",
            color: "#d97706"
          }}>
            <Handshake size={32} />
          </div>
            
            <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16, color: "#92400e" }}>
              معاهدة السعي وإبراء الذمة
            </h1>
            
            <p style={{ fontSize: 16, lineHeight: "1.6", color: "#4b5563", marginBottom: 24 }}>
              هذا الموقع يقوم بجهد لتوفير منصة بيع وشراء آمنة وسهلة. 
              استمرارية الموقع تعتمد على أمانة المستخدمين في دفع العمولة المستحقة.
            </p>

            <div style={{ 
              background: "#fdf2f8", 
              border: "1px dashed #be185d", 
              borderRadius: 16, 
              padding: 20,
              marginBottom: 32
            }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#be185d", margin: 0, lineHeight: "1.6" }}>
                &quot;أقسم بالله العظيم أن أدفع عمولة الموقع (1%) من قيمة البيع في حال تم البيع عن طريق الموقع، 
                وأن لا تبرأ ذمتي أمام الله إلا بدفعها.&quot;
              </p>
            </div>

            <button
              onClick={() => setPledgeAgreed(true)}
              style={{
                width: "100%",
                background: "#059669",
                color: "#fff",
                padding: "16px",
                borderRadius: 12,
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)"
              }}
            >
              أتعهد وأقسم بذلك
            </button>
            
            <button
              onClick={() => router.push(`/${locale}/haraj`)}
              style={{
                width: "100%",
                background: "transparent",
                color: "#6b7280",
                padding: "16px",
                marginTop: 8,
                borderRadius: 12,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                fontSize: 14
              }}
            >
              تراجع
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" dir="rtl">
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24 }}>إضافة إعلان جديد</h1>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          <div className="form-group">
            <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>صورة الإعلان</label>
            <div style={{
              border: "2px dashed #e5e7eb",
              borderRadius: 12,
              textAlign: "center",
              cursor: "pointer",
              background: formData.image_url ? `url(${formData.image_url}) center/cover` : "#f9fafb",
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden"
            }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{
                  opacity: 0,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                  zIndex: 2
                }}
              />
              {!formData.image_url && (
                <div style={{ pointerEvents: "none" }}>
                  <Upload size={32} color="#9ca3af" style={{ margin: "0 auto 8px" }} />
                  <span style={{ color: "#6b7280", fontSize: 14, fontWeight: 600 }}>
                    {uploading ? "جاري الرفع..." : "اضغط لرفع صورة"}
                  </span>
                </div>
              )}
              {formData.image_url && (
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  padding: 8,
                  background: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  fontSize: 12,
                  zIndex: 1
                }}>
                  اضغط لتغيير الصورة
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>عنوان الإعلان</label>
            <input
              required
              type="text"
              placeholder="مثال: خيمة صباح نظيفة..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div className="form-group">
            <label>التصنيف</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={inputStyle}
            >
              <option value="tents">خيام وبيوت شعر</option>
              <option value="gear">أدوات تخييم</option>
              <option value="cars">سيارات مجهزة</option>
              <option value="others">أخرى</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label>السعر (ر.س)</label>
              <input
                required
                type="number"
                placeholder="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div className="form-group">
              <label>المدينة</label>
              <input
                required
                type="text"
                placeholder="الرياض"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div className="form-group">
            <label>رقم التواصل</label>
            <input
              required
              type="tel"
              placeholder="05xxxxxxxx"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div className="form-group">
            <label>رمز الحذف (مهم جداً)</label>
            <input
              required
              type="text"
              placeholder="مثال: 1234"
              value={formData.delete_code}
              onChange={(e) => setFormData({ ...formData, delete_code: e.target.value })}
              style={inputStyle}
            />
            <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>
              احفظ هذا الرمز! ستحتاج إليه إذا أردت حذف الإعلان لاحقاً.
            </p>
          </div>

          <div className="form-group">
            <label>التفاصيل</label>
            <textarea
              required
              rows={4}
              placeholder="اذكر حالة السلعة، الملحقات، وأي تفاصيل أخرى..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ ...inputStyle, height: "auto" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#92400e",
              color: "#fff",
              padding: "16px",
              borderRadius: 12,
              fontWeight: 800,
              border: "none",
              cursor: loading ? "wait" : "pointer",
              marginTop: 16,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "جاري النشر..." : "نشر الإعلان"}
          </button>

        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  fontSize: 16,
  background: "#fff",
  outline: "none",
};
