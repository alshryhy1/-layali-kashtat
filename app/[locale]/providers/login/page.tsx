"use client";

import * as React from "react";

type Locale = "ar" | "en";
function asLocale(v: any): Locale {
  return String(v || "").toLowerCase() === "en" ? "en" : "ar";
}

export default function ProviderLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const p = React.use(params);
  const locale = asLocale(p?.locale);
  const isAr = locale === "ar";
  
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    
    try {
      const res = await fetch("/api/providers/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await res.json();
      if (j.ok) {
        window.location.href = `/${locale}/providers/dashboard`;
      } else {
        setMsg(isAr ? "بيانات الدخول غير صحيحة" : "Invalid credentials");
      }
    } catch {
       setMsg(isAr ? "حدث خطأ" : "Error");
    }
    setBusy(false);
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }} dir={isAr ? "rtl" : "ltr"}>
      <form onSubmit={onSubmit} style={{ background: "#fff", padding: 30, borderRadius: 12, width: "100%", maxWidth: 400, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <h1 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800 }}>{isAr ? "دخول مقدم الخدمة" : "Provider Login"}</h1>
        
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>{isAr ? "البريد الإلكتروني" : "Email"}</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            style={{ width: "100%", height: 42, border: "1px solid #ddd", borderRadius: 8, padding: "0 12px" }} 
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>{isAr ? "كلمة المرور" : "Password"}</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            style={{ width: "100%", height: 42, border: "1px solid #ddd", borderRadius: 8, padding: "0 12px" }} 
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -8, marginBottom: 12 }}>
          <button
            type="button"
            onClick={async () => {
              if (!email) { setMsg(isAr ? "أدخل بريدك أولاً" : "Enter your email first"); return; }
              setBusy(true);
              setMsg("");
              try {
                const res = await fetch("/api/providers/login/forgot", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ email }),
                });
                const j = await res.json();
                if (j && j.ok) {
                  setMsg(isAr ? "تم إرسال كلمة مرور مؤقتة إلى بريدك." : "A temporary password was sent to your email.");
                } else {
                  setMsg(isAr ? "تعذر الإرسال." : "Could not send.");
                }
              } catch {
                setMsg(isAr ? "حدث خطأ." : "Error.");
              }
              setBusy(false);
            }}
            style={{ background: "none", border: "none", color: "#111", fontWeight: 900, textDecoration: "underline", cursor: "pointer" }}
          >
            {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
          </button>
        </div>

        {msg && <div style={{ color: "red", marginBottom: 15, fontSize: 14 }}>{msg}</div>}

        <button disabled={busy} style={{ width: "100%", height: 44, background: "#111", color: "#fff", borderRadius: 8, fontWeight: "bold", border: "none", cursor: "pointer", opacity: busy ? 0.7 : 1 }}>
          {busy ? (isAr ? "جار التحقق..." : "Checking...") : (isAr ? "دخول" : "Login")}
        </button>
      </form>
    </main>
  );
}
