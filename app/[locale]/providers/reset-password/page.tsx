"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Lock, CheckCircle } from "lucide-react";

type Locale = "ar" | "en";
function asLocale(v: any): Locale {
  return String(v || "").toLowerCase() === "en" ? "en" : "ar";
}

export default function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const p = React.use(params);
  const locale = asLocale(p?.locale);
  const isAr = locale === "ar";
  
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  // removed unused msg state
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError(isAr ? "الرابط غير صالح" : "Invalid link");
      return;
    }
    if (password.length < 6) {
      setError(isAr ? "كلمة المرور يجب أن تكون 6 خانات على الأقل" : "Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError(isAr ? "كلمة المرور غير متطابقة" : "Passwords do not match");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/providers/login/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const j = await res.json();
      if (j.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/${locale}/providers/login`);
        }, 3000);
      } else {
        setError(j.message || (isAr ? "حدث خطأ" : "Error"));
      }
    } catch {
      setError(isAr ? "حدث خطأ في الاتصال" : "Connection error");
    }
    setBusy(false);
  }

  if (success) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }} dir={isAr ? "rtl" : "ltr"}>
        <div style={{ background: "#fff", padding: 40, borderRadius: 12, width: "100%", maxWidth: 400, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", textAlign: "center" }}>
          <CheckCircle size={64} color="#4ade80" style={{ marginBottom: 20 }} />
          <h2 style={{ margin: "0 0 10px", fontSize: 24 }}>{isAr ? "تم تغيير كلمة المرور" : "Password Changed"}</h2>
          <p style={{ color: "#666", marginBottom: 20 }}>
            {isAr ? "تم تحديث كلمة المرور بنجاح. سيتم توجيهك لصفحة الدخول..." : "Your password has been updated. Redirecting to login..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }} dir={isAr ? "rtl" : "ltr"}>
      <form onSubmit={onSubmit} style={{ background: "#fff", padding: 30, borderRadius: 12, width: "100%", maxWidth: 400, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        
        <h1 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}>
          <Lock size={24} color="#333" />
          {isAr ? "تعيين كلمة مرور جديدة" : "Set New Password"}
        </h1>

        {!token && (
           <div style={{ padding: 12, background: "#fee2e2", color: "#991b1b", borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
             {isAr ? "رابط الاستعادة مفقود أو غير صالح." : "Reset token is missing or invalid."}
           </div>
        )}

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>{isAr ? "كلمة المرور الجديدة" : "New Password"}</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            style={{ width: "100%", height: 42, border: "1px solid #ddd", borderRadius: 8, padding: "0 12px" }} 
            placeholder="******"
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>{isAr ? "تأكيد كلمة المرور" : "Confirm Password"}</label>
          <input 
            type="password" 
            value={confirm} 
            onChange={e => setConfirm(e.target.value)} 
            required 
            style={{ width: "100%", height: 42, border: "1px solid #ddd", borderRadius: 8, padding: "0 12px" }} 
            placeholder="******"
          />
        </div>

        {error && (
          <div style={{ padding: 10, background: "#fee2e2", color: "#991b1b", borderRadius: 6, marginBottom: 15, fontSize: 13 }}>
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={busy || !token}
          style={{ 
            width: "100%", 
            height: 44, 
            background: busy || !token ? "#ccc" : "#000", 
            color: "#fff", 
            border: "none", 
            borderRadius: 8, 
            fontSize: 16, 
            fontWeight: 600,
            cursor: busy || !token ? "not-allowed" : "pointer"
          }}
        >
          {busy ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ كلمة المرور" : "Save Password")}
        </button>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <a 
            href={`/${locale}/providers/login`}
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 6, 
              textDecoration: "none", 
              color: "#666", 
              fontSize: 14, 
              fontWeight: 500
            }}
          >
            {isAr ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            <span>{isAr ? "العودة لتسجيل الدخول" : "Back to Login"}</span>
          </a>
        </div>

      </form>
    </main>
  );
}
