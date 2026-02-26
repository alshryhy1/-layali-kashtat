 "use client";
 
 import * as React from "react";
 
export default function ProviderRegisterForm() {
   const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
   const [phone, setPhone] = React.useState("");
  const [city, setCity] = React.useState("");
  const [serviceTypes, setServiceTypes] = React.useState<string[]>([]);
  const [password, setPassword] = React.useState("");
   const [msg, setMsg] = React.useState("");
   const [busy, setBusy] = React.useState(false);
  const [agree, setAgree] = React.useState(false);
  const [step, setStep] = React.useState<"form" | "otp">("form");
  const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID as any;
  const tokenAuth = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH as any;
  const sentRef = React.useRef(false);
  const [otherEnabled, setOtherEnabled] = React.useState(false);
  const [otherText, setOtherText] = React.useState("");
 
  const serviceOptions = [
    "كشته رمليه",
    "كشته جبليه",
    "كشته ساحليه",
    "مخيم",
    "شاليه",
    "مزرعة",
    "مسبح",
    "ملعب كرة قدم",
  ];

  const cityOptions = [
    "مكة",
    "المدينة",
    "الرياض",
    "القصيم",
    "حائل",
    "الحدود الشمالية",
    "الجوف",
    "تبوك",
    "جدة",
    "نجران",
    "عسير",
  ];

  function canonPhone(v: string) {
    let s = String(v || "").replace(/[^0-9]/g, "");
    if (!s) return "";
    if (s.startsWith("00966")) s = s.slice(5);
    if (s.startsWith("966")) return s;
    if (s.startsWith("05")) return "966" + s.slice(1);
    if (s.startsWith("5")) return "966" + s;
    return s;
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

  async function submit() {
    const chosen = [...serviceTypes, ...(otherEnabled && otherText.trim() ? [otherText.trim()] : [])];
    if (!name || !email || !phone || !city || chosen.length === 0 || !password) {
       setMsg("يرجى تعبئة جميع الحقول");
       return;
     }
    if (chosen.length > 3) {
      setMsg("يمكنك اختيار حتى 3 خدمات كحد أقصى");
      return;
    }
     if (!agree) {
       setMsg("يلزم الموافقة على الشروط قبل الإرسال");
       return;
     }
     setBusy(true);
     setMsg("");
    try {
      await loadWidget();
      const p = canonPhone(phone);
      const cfg: any = {
        widgetId,
        tokenAuth,
        identifier: p,
        exposeMethods: true,
        success: async () => {
          try {
            const r = await fetch("/api/providers/signup", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                name,
                email,
                phone,
                city,
                service_types: chosen,
                password,
                accepted: true,
                verified_otp: true,
              }),
            });
            const j = await r.json();
            if (j?.ok) {
              window.location.href = "/ar/providers/login?verified=true";
              return;
            }
            setMsg("حدث خطأ");
          } catch {
            setMsg("حدث خطأ");
          }
        },
        failure: () => {
          setMsg("تعذر التحقق عبر MSG91");
        },
      };
      if (typeof (window as any).initMSG91 === "function") {
        (window as any).initMSG91(cfg);
      } else {
        setMsg("تعذر تحميل خدمة التحقق");
      }
    } catch {
      setMsg("حدث خطأ");
    }
     setBusy(false);
   }
 
   return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 10px 25px rgba(0,0,0,0.08)", maxWidth: 920, margin: "0 auto" }}>
      <h2 style={{ fontWeight: 900, fontSize: 22, marginBottom: 16 }}>تسجيل مقدم خدمة</h2>
      {step === "form" ? (
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", alignItems: "center" }}>
          <input placeholder="الاسم" value={name} onChange={(e) => setName(e.target.value)} style={{ height: 46, borderRadius: 10, border: "1px solid #ddd", padding: "0 12px", gridColumn: "1 / span 2" }} />
          <input placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} style={{ height: 46, borderRadius: 10, border: "1px solid #ddd", padding: "0 12px", gridColumn: "1 / span 2" }} />
          <input placeholder="الجوال" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ height: 46, borderRadius: 10, border: "1px solid #ddd", padding: "0 12px", gridColumn: "1 / span 2" }} />
          <select
            value={city}
            onChange={(e) => {
              const v = e.target.value;
              setCity(v);
              try {
                window.localStorage.setItem("lk_city", v);
                window.dispatchEvent(new Event("lk_city_changed"));
              } catch {}
            }}
            style={{ height: 46, borderRadius: 10, border: "1px solid #ddd", padding: "0 12px", gridColumn: "1 / span 2" }}
          >
            <option value="">اختر المدينة</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div style={{ gridColumn: "1 / span 2" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>اختر نوع الخدمة (اختيار مفتوح)</div>
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(2, 1fr)" }}>
              {serviceOptions.map((opt) => {
                const checked = serviceTypes.includes(opt);
                return (
                  <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: "1px solid #eee", borderRadius: 10, cursor: "pointer", background: checked ? "#f7f7f7" : "#fff" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setServiceTypes((prev) => {
                          const set = new Set(prev);
                          if (on) set.add(opt);
                          else set.delete(opt);
                          const next = Array.from(set);
                          if (next.length > 3) {
                            // enforce max 3 selections
                            next.pop();
                          }
                          return next;
                        });
                      }}
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
            <div style={{ marginTop: 10, display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: "1px solid #eee", borderRadius: 10, cursor: "pointer", background: otherEnabled ? "#f7f7f7" : "#fff" }}>
                <input
                  type="checkbox"
                  checked={otherEnabled}
                  onChange={(e) => setOtherEnabled(e.target.checked)}
                />
                <span>أخرى</span>
              </label>
              {otherEnabled && (
                <input
                  placeholder="اذكر نوع خدمة آخر"
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value.slice(0, 40))}
                  style={{ height: 40, borderRadius: 10, border: "1px solid #ddd", padding: "0 12px" }}
                />
              )}
            </div>
            <div style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>
              يمكن اختيار حتى 3 خدمات، ويمكن إضافة “أخرى”.
            </div>
          </div>
          <input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} style={{ height: 46, borderRadius: 10, border: "1px solid #ddd", padding: "0 12px", gridColumn: "1 / span 2" }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#555" }}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>أوافق على <a href="/ar/terms" target="_blank" style={{ color: "#111", fontWeight: 900, textDecoration: "underline" }}>الشروط والأحكام</a></span>
          </label>
          {msg && <div style={{ color: "#b91c1c", fontSize: 13 }}>{msg}</div>}
          <button onClick={submit} disabled={busy} style={{ height: 50, borderRadius: 12, background: "#111", color: "#fff", border: "none", fontWeight: 900, cursor: "pointer", gridColumn: "1 / span 2" }}>
            {busy ? "جارٍ الإرسال..." : "تسجيل"}
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          <p style={{ textAlign: "center", fontSize: 14, color: "#666" }}>{msg || `سيتم فتح واجهة MSG91 للتحقق`}</p>
        </div>
      )}
     </div>
   );
 }

function AutoSendOTP() { return null; }
