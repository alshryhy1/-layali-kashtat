"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type Locale = "ar" | "en";
function asLocale(v: any): Locale {
  return String(v || "").toLowerCase() === "en" ? "en" : "ar";
}

export default function ChangePasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const p = React.use(params);
  const locale = asLocale(p?.locale);
  const isAr = locale === "ar";
  const router = useRouter();

  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");

    try {
      const res = await fetch("/api/providers/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const j = await res.json();
      
      if (j.ok) {
        setMsg(isAr ? "تم تغيير كلمة المرور بنجاح." : "Password changed successfully.");
        setTimeout(() => {
          router.push(`/${locale}/providers/dashboard`);
        }, 1500);
      } else {
        if (j.error === "invalid_old_password") {
          setMsg(isAr ? "كلمة المرور الحالية غير صحيحة." : "Current password is incorrect.");
        } else if (j.error === "password_too_short") {
          setMsg(isAr ? "كلمة المرور الجديدة قصيرة جداً." : "New password is too short.");
        } else {
          setMsg(isAr ? "حدث خطأ ما." : "Error occurred.");
        }
      }
    } catch {
      setMsg(isAr ? "حدث خطأ في الاتصال." : "Connection error.");
    }
    setBusy(false);
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }} dir={isAr ? "rtl" : "ltr"}>
      <form onSubmit={onSubmit} style={{ background: "#fff", padding: 30, borderRadius: 12, width: "100%", maxWidth: 400, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <h1 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800 }}>
          {isAr ? "تغيير كلمة المرور" : "Change Password"}
        </h1>
        
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>{isAr ? "كلمة المرور الحالية" : "Current Password"}</label>
          <input 
            type="password" 
            value={oldPassword} 
            onChange={e => setOldPassword(e.target.value)} 
            required 
            style={{ width: "100%", height: 42, border: "1px solid #ddd", borderRadius: 8, padding: "0 12px" }} 
          />
        </div>

        <div style={{ textAlign: "end", marginTop: -10, marginBottom: 15 }}>
          <button
            type="button"
            onClick={() => {
               if (confirm(isAr ? "لإعادة تعيين كلمة المرور، يجب تسجيل الخروج واستخدام خيار 'نسيت كلمة المرور' في صفحة الدخول.\n\nهل تريد تسجيل الخروج الآن؟" : "To reset password, you must logout and use 'Forgot Password' on login page.\n\nLogout now?")) {
                 document.cookie = "kashtat_provider_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                 window.location.href = `/${locale}/providers/login`;
               }
            }}
            style={{ background: "none", border: "none", padding: 0, color: "#666", fontSize: 12, textDecoration: "underline", cursor: "pointer" }}
          >
            {isAr ? "نسيت كلمة المرور الحالية؟" : "Forgot current password?"}
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>{isAr ? "كلمة المرور الجديدة" : "New Password"}</label>
          <input 
            type="password" 
            value={newPassword} 
            onChange={e => setNewPassword(e.target.value)} 
            required 
            minLength={6}
            style={{ width: "100%", height: 42, border: "1px solid #ddd", borderRadius: 8, padding: "0 12px" }} 
          />
        </div>

        <button 
          type="submit" 
          disabled={busy}
          style={{ 
            width: "100%", 
            height: 44, 
            background: "#111", 
            color: "#fff", 
            border: "none", 
            borderRadius: 12, 
            fontWeight: 900,
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.7 : 1
          }}
        >
          {busy ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save Changes")}
        </button>

        <div style={{ marginTop: 15, textAlign: "center" }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 14 }}
          >
            {isAr ? "إلغاء وعودة" : "Cancel & Return"}
          </button>
        </div>

        {msg && (
          <div style={{ 
            marginTop: 15, 
            padding: 10, 
            borderRadius: 8, 
            background: msg.includes("نجاح") || msg.includes("success") ? "#e6fcf5" : "#fff5f5",
            color: msg.includes("نجاح") || msg.includes("success") ? "#0ca678" : "#e03131",
            fontSize: 14,
            textAlign: "center"
          }}>
            {msg}
          </div>
        )}
      </form>
    </main>
  );
}
