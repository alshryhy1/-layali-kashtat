"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { localeHref } from "@/lib/locales";

type Locale = "ar" | "en";
function asLocale(v: any): Locale {
  return String(v || "").toLowerCase() === "en" ? "en" : "ar";
}

export default function CustomerLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const p = React.use(params);
  const locale = asLocale(p?.locale);
  const isAr = locale === "ar";
  const router = useRouter();

  const url = typeof window !== "undefined" ? new URL(window.location.href) : null;
  const initialView = url?.searchParams.get("view") === "signup" ? "signup" : "login";

  const [view, setView] = React.useState<"login" | "signup" | "otp">(initialView as any);
  const [identifier, setIdentifier] = React.useState(""); // email or phone (login only)
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [otp, setOtp] = React.useState("");
  const [agree, setAgree] = React.useState(false);
  const widgetId = (process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || "").trim();
  const tokenAuth = (process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || "").trim();
  const sentRef = React.useRef(false);
  function canonPhone(v: string) {
    let s = String(v || "").replace(/[^0-9]/g, "");
    if (!s) return "";
    if (s.startsWith("00966")) s = s.slice(5);
    if (s.startsWith("966")) s = s.slice(3);
    if (s.startsWith("05")) s = s.slice(1);
    if (s.startsWith("5")) s = s;
    return `966${s}`;
  }

  React.useEffect(() => {
    const u = new URL(window.location.href);
    if (u.searchParams.get("verified") === "true") {
      setMsg(isAr ? "تم تفعيل حسابك بنجاح، يرجى تسجيل الدخول." : "Account verified. Please login.");
      setView("login");
    }
  }, [isAr]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const isEmail = identifier.includes("@");
      const res = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(isEmail ? { email: identifier, password } : { phone: identifier, password }),
      });
      const j = await res.json();
      if (j.ok) {
        window.location.href = localeHref(locale, "/customer/dashboard");
        return;
      }
      if (j.error === "not_verified") {
        setIdentifier(canonPhone(identifier));
        setView("otp");
        setMsg(isAr ? "أرسلنا رمز التحقق إلى جوالك." : "OTP sent to your mobile.");
      } else {
        setMsg(isAr ? "بيانات الدخول غير صحيحة" : "Invalid credentials");
      }
    } catch {
      setMsg(isAr ? "حدث خطأ" : "Error");
    }
    setBusy(false);
  }

  async function loadWidget() {
    if (typeof window === "undefined") return;
    if ((window as any).__msg91ScriptLoaded) return;
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://control.msg91.com/app/assets/otp-provider/otp-provider.js";
      s.async = true;
      s.onload = () => {
        (window as any).__msg91ScriptLoaded = true;
        resolve();
      };
      s.onerror = () => reject(new Error("failed"));
      document.head.appendChild(s);
    });
  }

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      if (!name || !email || !password || !phone) {
        setMsg(isAr ? "يرجى تعبئة جميع الحقول" : "Please fill all fields");
        setBusy(false);
        return;
      }
      if (!agree) {
        setMsg(isAr ? "يلزم الموافقة على الشروط قبل الإرسال" : "You must agree to the terms");
        setBusy(false);
        return;
      }
      await loadWidget();
      const p = canonPhone(phone);
      setIdentifier(p);
      const cfg: any = {
        widgetId,
        tokenAuth,
        identifier: p,
        exposeMethods: true,
        success: async () => {
          try {
            const r = await fetch("/api/customers/signup", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ email, phone, password, name, accepted: true, verified_otp: true }),
            });
            const j = await r.json();
            if (j?.ok) {
              router.push(localeHref(locale, "/customer/dashboard"));
              return;
            }
            setMsg(isAr ? "تعذّر إنشاء الحساب" : "Failed to create account");
          } catch {
            setMsg(isAr ? "تعذّر إنشاء الحساب" : "Failed to create account");
          } finally {
            setBusy(false);
          }
        },
        failure: () => {
          setMsg(isAr ? "تعذّر التحقق عبر MSG91" : "MSG91 verification failed");
          setBusy(false);
        },
      };
      if (typeof (window as any).initMSG91 === "function") {
        (window as any).initMSG91(cfg);
      } else {
        setMsg(isAr ? "تعذّر تحميل خدمة التحقق" : "Failed to load verification");
        setBusy(false);
      }
    } catch {
      setMsg(isAr ? "حدث خطأ" : "Error");
    }
    // busy cleared inside success/failure
  }

  async function onVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
  }

  const onVerifyMSG91 = React.useCallback(async () => {
    if (!widgetId) {
      if (sentRef.current) return;
      const last = Number(localStorage.getItem("lk_otp_last") || "0");
      if (Date.now() - last < 90_000) {
        setMsg(isAr ? "يرجى الانتظار قبل طلب رمز جديد" : "Please wait before requesting a new code");
        return;
      }
      setBusy(true);
      setMsg("");
      try {
        const fr = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ phone: identifier }),
        });
        const fj = await fr.json();
        if (fj?.ok) {
          localStorage.setItem("lk_otp_last", String(Date.now()));
          setMsg(isAr ? "تم إرسال الرمز عبر القناة الاحتياطية" : "OTP sent via fallback channel");
        } else {
          setMsg(isAr ? "تعذّر إرسال الرمز. حاول لاحقاً." : "Failed to send OTP. Try later.");
        }
      } catch {
        setMsg(isAr ? "تعذّر إرسال الرمز. حاول لاحقاً." : "Failed to send OTP. Try later.");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (sentRef.current) return;
    const last = Number(localStorage.getItem("lk_otp_last") || "0");
    if (Date.now() - last < 90_000) {
      setMsg(isAr ? "يرجى الانتظار قبل طلب رمز جديد" : "Please wait before requesting a new code");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await new Promise<void>((resolve, reject) => {
        const urls = ["https://verify.msg91.com/otp-provider.js", "https://verify.phone91.com/otp-provider.js"];
        let i = 0;
        function attempt() {
          if ((window as any).__msg91ScriptLoaded) {
            resolve();
            return;
          }
          const s = document.createElement("script");
          s.src = urls[i];
          s.async = true;
          s.onload = () => {
            (window as any).__msg91ScriptLoaded = true;
            resolve();
          };
          s.onerror = () => {
            i++;
            if (i < urls.length) attempt();
            else reject(new Error("failed"));
          };
          document.head.appendChild(s);
        }
        attempt();
      });
      const cfg: any = {
        widgetId,
        tokenAuth,
        identifier,
        exposeMethods: true,
        success: async (data: any) => {
          try {
            const token =
              data?.["access-token"] ||
              data?.accessToken ||
              data?.token ||
              data?.data?.token ||
              data?.data?.["access-token"] ||
              "";
            const r = await fetch("/api/auth/msg91/verify", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ accessToken: token, role: "customer", phone: identifier }),
            });
            const j = await r.json();
            if (j?.ok && j?.verified) {
              localStorage.setItem("lk_otp_last", String(Date.now()));
              sentRef.current = true;
              window.location.href = localeHref(locale, "/customer/dashboard");
              return;
            }
            setMsg(isAr ? "تعذّر التحقق" : "Verification failed");
          } catch {
            setMsg(isAr ? "تعذّر التحقق" : "Verification failed");
          } finally {
            setBusy(false);
          }
        },
        failure: async () => {
          try {
            const fr = await fetch("/api/auth/send-otp", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ phone: identifier }),
            });
            const fj = await fr.json();
            if (fj?.ok) {
              localStorage.setItem("lk_otp_last", String(Date.now()));
              setMsg(isAr ? "تم إرسال الرمز عبر القناة الاحتياطية" : "OTP sent via fallback channel");
            } else {
              setMsg(isAr ? "تعذّر إرسال الرمز. حاول لاحقاً." : "Failed to send OTP. Try later.");
            }
          } catch {
            setMsg(isAr ? "تعذّر إرسال الرمز. حاول لاحقاً." : "Failed to send OTP. Try later.");
          } finally {
            setBusy(false);
          }
        },
      };
      if (typeof (window as any).initSendOTP === "function") {
        sentRef.current = true;
        (window as any).initSendOTP(cfg);
      } else {
        try {
          const fr = await fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ phone: identifier }),
          });
          const fj = await fr.json();
          if (fj?.ok) {
            localStorage.setItem("lk_otp_last", String(Date.now()));
            setMsg(isAr ? "تم إرسال الرمز عبر القناة الاحتياطية" : "OTP sent via fallback channel");
          } else {
            setMsg(isAr ? "تعذّر تحميل خدمة التحقق" : "Failed to load verification");
          }
        } catch {
          setMsg(isAr ? "تعذّر تحميل خدمة التحقق" : "Failed to load verification");
        } finally {
          setBusy(false);
        }
      }
    } catch {
      setBusy(false);
      setMsg(isAr ? "تعذّر تحميل خدمة التحقق" : "Failed to load verification");
    }
  }, [widgetId, tokenAuth, identifier, locale, isAr]);

  React.useEffect(() => {
    if (view === "otp") {
      onVerifyMSG91();
    }
  }, [view, onVerifyMSG91]);

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: 16 }} dir={isAr ? "rtl" : "ltr"}>
      <h1 style={{ textAlign: "center", fontWeight: 900, marginBottom: 12 }}>
        {view === "signup" ? (isAr ? "تسجيل عميل جديد" : "Customer Signup") : view === "otp" ? (isAr ? "تفعيل الجوال" : "Verify Mobile") : (isAr ? "دخول العميل" : "Customer Login")}
      </h1>
      {msg && (
        <div style={{ background: "#fff8e1", border: "1px solid #ffe082", color: "#8d6e63", padding: 10, borderRadius: 10, marginBottom: 12, textAlign: "center", fontWeight: 700 }}>
          {msg}
        </div>
      )}

      {view === "login" && (
        <form onSubmit={onLogin} style={{ display: "grid", gap: 12, background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 16 }}>
          <input placeholder={isAr ? "البريد أو الجوال" : "Email or Mobile"} value={identifier} onChange={e => setIdentifier(e.target.value)} style={{ height: 44, borderRadius: 10, border: "1px solid #ddd", paddingInline: 12 }} />
          <input type="password" placeholder={isAr ? "كلمة المرور" : "Password"} value={password} onChange={e => setPassword(e.target.value)} style={{ height: 44, borderRadius: 10, border: "1px solid #ddd", paddingInline: 12 }} />
          <button type="submit" disabled={busy} style={{ height: 44, borderRadius: 12, border: "none", background: "#111", color: "#fff", fontWeight: 900 }}>
            {busy ? (isAr ? "جارٍ الدخول..." : "Signing in...") : (isAr ? "دخول" : "Login")}
          </button>
          <button type="button" onClick={() => setView("signup")} style={{ background: "none", border: "none", color: "#666", textDecoration: "underline" }}>
            {isAr ? "تسجيل جديد" : "Create account"}
          </button>
        </form>
      )}

      {view === "signup" && (
        <form onSubmit={onSignup} style={{ display: "grid", gap: 12, background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 16 }}>
          <input required placeholder={isAr ? "الاسم" : "Name"} value={name} onChange={e => setName(e.target.value)} style={{ height: 44, borderRadius: 10, border: "1px solid #ddd", paddingInline: 12 }} />
          <input required placeholder={isAr ? "البريد الإلكتروني" : "Email"} value={email} onChange={e => setEmail(e.target.value)} style={{ height: 44, borderRadius: 10, border: "1px solid #ddd", paddingInline: 12 }} />
          <input required placeholder={isAr ? "الجوال" : "Mobile"} value={phone} onChange={e => setPhone(e.target.value)} style={{ height: 44, borderRadius: 10, border: "1px solid #ddd", paddingInline: 12 }} />
          <input required type="password" placeholder={isAr ? "كلمة المرور" : "Password"} value={password} onChange={e => setPassword(e.target.value)} style={{ height: 44, borderRadius: 10, border: "1px solid #ddd", paddingInline: 12 }} />
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "#555" }}>
            <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
            <span>{isAr ? "أوافق على " : "I agree to the "}
              <a href={localeHref(locale, "/terms")} target="_blank" style={{ color: "#111", fontWeight: 900, textDecoration: "underline" }}>
                {isAr ? "الشروط والأحكام" : "Terms of Service"}
              </a>
            </span>
          </label>
          <button type="submit" disabled={busy} style={{ height: 44, borderRadius: 12, border: "none", background: "#111", color: "#fff", fontWeight: 900 }}>
            {busy ? (isAr ? "جارٍ التسجيل..." : "Signing up...") : (isAr ? "تسجيل" : "Sign Up")}
          </button>
          <button type="button" onClick={() => setView("login")} style={{ background: "none", border: "none", color: "#666", textDecoration: "underline" }}>
            {isAr ? "لدي حساب بالفعل" : "I already have an account"}
          </button>
        </form>
      )}

      {view === "otp" && (
        <div style={{ display: "grid", gap: 12, background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 16 }}>
          <p style={{ textAlign: "center", color: "#666" }}>
            {isAr ? `سيتم فتح واجهة MSG91 للتحقق من ${identifier}` : `MSG91 widget will open to verify ${identifier}`}
          </p>
        </div>
      )}
    </main>
  );
}
