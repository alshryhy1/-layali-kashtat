
"use client";

import * as React from "react";
import Link from "next/link";
import ProviderRequestNotifier from "@/components/ProviderRequestNotifier";
import { useRouter } from "next/navigation";

type Locale = "ar" | "en";

type Props = {
  locale: Locale;
};

type State =
  | { ok: false; message: string }
  | { ok: true; message: string; ref?: string };

function normalizePhone(raw: string) {
  let s = String(raw || "").trim().replace(/[^\d]/g, "");

  // 00966xxxxxxxxx -> 5xxxxxxxx
  if (s.startsWith("00966")) s = s.replace(/^00966/, "");
  // 966xxxxxxxxx -> 5xxxxxxxx
  if (s.startsWith("966")) s = s.replace(/^966/, "");

  // 5xxxxxxxx -> 05xxxxxxxx
  if (s.length === 9 && s.startsWith("5")) s = `0${s}`;

  return s;
}

export default function ProviderRegisterForm({ locale }: Props) {
  const router = useRouter();
  const isAr = locale === "ar";

  const t = {
    title: isAr ? "التسجيل كمقدم خدمة" : "Provider Signup",
    hint: isAr
      ? "أدخل بياناتك بدقة — المدينة ونوع الخدمة من القائمة فقط."
      : "Enter your details carefully — city and service from the list only.",
    name: isAr ? "اسم مقدم الخدمة" : "Provider name",
    email: isAr ? "البريد الإلكتروني (اختياري)" : "Email (Optional)",
    password: isAr ? "كلمة المرور" : "Password",
    phone: isAr ? "رقم الجوال" : "Mobile number",
    service: isAr ? "نوع الخدمة" : "Service type",
    city: isAr ? "المدينة" : "City",
    agree: isAr ? "موافق" : "I agree",
    read: isAr ? "قراءة النصوص القانونية" : "Read legal texts",
    submit: isAr ? "إرسال طلب التسجيل" : "Submit signup request",
    sending: isAr ? "جارٍ الإرسال..." : "Sending...",
    required: isAr ? "اكمل جميع الحقول المطلوبة." : "Please complete all required fields.",
    agreeReq: isAr ? "يلزم الموافقة على الشروط قبل الإرسال." : "You must agree to the legal texts.",
    phoneInvalid: isAr ? "رقم الجوال غير صحيح." : "Invalid mobile number.",
    emailInvalid: isAr ? "البريد الإلكتروني غير صحيح." : "Invalid email address.",
    serverError: isAr ? "تعذر إرسال الطلب الآن. حاول لاحقًا." : "Something went wrong. Please try again.",
    success: isAr ? "تم إرسال طلبك بنجاح." : "Your request was sent successfully.",
    pickService: isAr ? "اختر نوع الخدمة" : "Select service type",
    pickCity: isAr ? "اختر المدينة" : "Select city",
    verifyTitle: isAr ? "تفعيل الحساب" : "Verify Account",
    verifyHint: isAr ? "تم إرسال رمز التحقق إلى جوالك." : "Verification code sent to your mobile.",
    verifyBtn: isAr ? "تأكيد الرمز" : "Confirm Code",
    verifyBack: isAr ? "عودة" : "Back",
  };

  const servicesAr = [
    "كشته بريه رمليه",
    "كشته بريه ساحليه",
    "كشته بريه جبليه",
    "مخيم",
    "شاليه",
    "منتجع",
    "مزرعة",
    "استراحة",
  ];

  const servicesEn = [
    "Desert (sandy)",
    "Desert (coastal)",
    "Desert (mountain)",
    "Camp",
    "Chalet",
    "Resort",
    "Farm",
    "Rest area",
  ];

  const citiesAr = [
    "مكة المكرمة",
    "المدينة المنورة",
    "الرياض",
    "جدة",
    "الدمام",
    "القصيم",
    "حائل",
    "عرعر",
    "طريف",
    "القريات",
    "طبرجل",
    "الجوف",
    "سكاكا",
    "تبوك",
    "العلا",
    "ينبع",
    "أملج",
    "حقل",
  ];

  const citiesEn = [
    "Makkah",
    "Madinah",
    "Riyadh",
    "Jeddah",
    "Dammam",
    "Qassim",
    "Hail",
    "Arar",
    "Turaif",
    "Al Qurayyat",
    "Tabarjal",
    "Al Jouf",
    "Sakaka",
    "Tabuk",
    "Al Ula",
    "Yanbu",
    "Umluj",
    "Haql",
  ];

  const serviceOptions = isAr ? servicesAr : servicesEn;
  const cityOptions = isAr ? citiesAr : citiesEn;

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [serviceTypes, setServiceTypes] = React.useState<string[]>([]);
  const [serviceMenuOpen, setServiceMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);

  const [step, setStep] = React.useState<"form" | "otp">("form");
  const [otp, setOtp] = React.useState("");

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node | null;
      if (!serviceMenuOpen) return;
      if (menuRef.current && menuRef.current.contains(t)) return;
      if (btnRef.current && btnRef.current.contains(t)) return;
      setServiceMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setServiceMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [serviceMenuOpen]);
  const [city, setCity] = React.useState("");
  const [agree, setAgree] = React.useState(false);

  // ✅ (طقس فقط) لو فيه مدينة محفوظة مسبقًا نخليها الافتراضية في صفحة التسجيل
  React.useEffect(() => {
    try {
      const saved = String(window.localStorage.getItem("lk_city") || "").trim();
      if (!saved) return;
      if (city) return;
      if (cityOptions.includes(saved)) setCity(saved);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr]);

  const [busy, setBusy] = React.useState(false);
  const [state, setState] = React.useState<State | null>(null);

  function friendlyServerMessage(raw: any) {
    const s = String(raw || "").trim();
    if (!s) return "";
    const key = s.toLowerCase();

    if (key === "missing_fields") return t.required;
    if (key === "invalid_phone") return t.phoneInvalid;
    if (key === "duplicate_entry") return isAr ? "عفواً، رقم الجوال أو البريد الإلكتروني مسجل مسبقاً." : "Phone or Email already registered.";
    if (key === "db_error") return isAr ? "حدث خطأ في النظام (قاعدة البيانات)." : "System/Database Error.";
    if (key === "must_agree" || key === "must_accept") return t.agreeReq;

    return s;
  }

  function missingMessage(missing: string[]) {
    if (missing.length === 0) return t.required;
    if (isAr) return `اكمل الحقول التالية: ${missing.join("، ")}`;
    return `Please complete: ${missing.join(", ")}`;
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setState(null);
    
    try {
        const res = await fetch("/api/auth/verify-otp", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ phone: normalizePhone(phone), otp }),
        });
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || "Invalid OTP");
        }

        // Success
        setState({ ok: true, message: isAr ? "تم التحقق وتفعيل الحساب!" : "Account verified!" });
        // Maybe redirect to login?
        setTimeout(() => {
            router.push(`/${locale}/providers/login?verified=true`);
        }, 1500);

    } catch (err: any) {
        setState({ ok: false, message: err.message });
    } finally {
        setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    const form = e.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      setState({ ok: false, message: t.required });
      return;
    }

    if (!agree) {
      setState({ ok: false, message: t.agreeReq });
      return;
    }

    const missing: string[] = [];
    if (!name) missing.push(t.name);
    // email is optional now
    if (!password) missing.push(t.password);
    if (!phone) missing.push(t.phone);
    if (!serviceTypes.length) missing.push(t.service);
    if (!city) missing.push(t.city);

    if (missing.length > 0) {
      setState({ ok: false, message: missingMessage(missing) });
      return;
    }

    // Phone format
    const p = normalizePhone(phone);
    if (p.length < 9) {
      setState({ ok: false, message: t.phoneInvalid });
      return;
    }

    setBusy(true);
    setState(null);

    try {
      // We send first service type as primary for now, logic might change
      const primaryService = serviceTypes[0];

      const res = await fetch("/api/providers/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email, // Optional
          phone: p,
          password,
          service_type: primaryService,
          service_types: serviceTypes,
          city,
          accepted: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBusy(false);
        setState({
          ok: false,
          message:
            data.message && data.code
              ? friendlyServerMessage(data.code)
              : friendlyServerMessage(data.message) || t.serverError,
        });
        return;
      }
      
      if (data.message === "verification_required_otp") {
          setStep("otp");
          setState(null); // Clear errors
          setBusy(false);
          return;
      }

      setState({ ok: true, message: t.success, ref: String(data.id || "") });
      setBusy(false);
    } catch (err) {
      console.error(err);
      setBusy(false);
      setState({ ok: false, message: t.serverError });
    }
  }

  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontSize: "15px",
    background: "#fff",
    outline: "none",
  };

  if (state?.ok && step !== "otp") {
    // Legacy success screen if not using OTP or finished
    return (
      <div
        style={{
          background: "#fff",
          padding: 30,
          borderRadius: 16,
          textAlign: "center",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
        <h2 style={{ margin: "0 0 12px", fontSize: 22 }}>{t.success}</h2>
        <p style={{ margin: 0, color: "#666", lineHeight: 1.6 }}>
          {isAr
            ? "تم استلام طلبك بنجاح. سنقوم بمراجعته وإشعارك عند القبول."
            : "We have received your request. We will review it and notify you once approved."}
        </p>
        {state.ref && (
          <div
            style={{
              marginTop: 20,
              padding: 12,
              background: "#f5f5f5",
              borderRadius: 8,
              fontFamily: "monospace",
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            Ref: {state.ref}
          </div>
        )}
        <div style={{ marginTop: 24 }}>
          <Link
            href={`/${locale}`}
            style={{
              display: "inline-block",
              textDecoration: "none",
              color: "#111",
              fontWeight: "bold",
              borderBottom: "2px solid #eee",
            }}
          >
            {isAr ? "العودة للرئيسية" : "Back to home"}
          </Link>
        </div>
      </div>
    );
  }

  if (step === "otp") {
      return (
        <div className="lk-form" style={{ maxWidth: 460, margin: "0 auto" }}>
            <div
                style={{
                background: "#fff",
                padding: "24px",
                borderRadius: 16,
                boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.04)",
                }}
            >
                <h3 style={{marginTop: 0, textAlign: "center"}}>{t.verifyTitle}</h3>
                <p style={{textAlign: "center", color: "#666"}}>{t.verifyHint}</p>
                <p style={{textAlign: "center", direction: "ltr", fontWeight: "bold"}}>{phone}</p>
                
                {state?.ok === false && (
                    <div
                        style={{
                        marginBottom: 16,
                        padding: 12,
                        borderRadius: 8,
                        background: "#fff0f0",
                        color: "#d32f2f",
                        fontSize: 14,
                        textAlign: "center",
                        }}
                    >
                        {state.message}
                    </div>
                )}
                {state?.ok === true && (
                    <div
                        style={{
                        marginBottom: 16,
                        padding: 12,
                        borderRadius: 8,
                        background: "#e6fffa",
                        color: "green",
                        fontSize: 14,
                        textAlign: "center",
                        }}
                    >
                        {state.message}
                    </div>
                )}

                <form onSubmit={handleVerifyOTP} style={{display: "flex", flexDirection: "column", gap: 16}}>
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="1234"
                        style={{...inputStyle, textAlign: "center", fontSize: 24, letterSpacing: 8}}
                        maxLength={6}
                        required
                    />
                    <button
                        type="submit"
                        disabled={busy}
                        style={{
                            padding: "14px",
                            borderRadius: "10px",
                            border: "none",
                            background: "#111",
                            color: "#fff",
                            fontSize: "16px",
                            fontWeight: 700,
                            cursor: busy ? "wait" : "pointer",
                            opacity: busy ? 0.7 : 1,
                        }}
                    >
                        {busy ? t.sending : t.verifyBtn}
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep("form")}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#666",
                            textDecoration: "underline",
                            cursor: "pointer"
                        }}
                    >
                        {t.verifyBack}
                    </button>
                </form>
            </div>
        </div>
      );
  }

  return (
    <div className="lk-form" style={{ maxWidth: 460, margin: "0 auto" }}>
      <form
        onSubmit={onSubmit}
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: 16,
          boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.04)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {state?.ok === false && (
          <div
            style={{
              marginBottom: 0,
              padding: 12,
              borderRadius: 8,
              background: "#fff0f0",
              color: "#d32f2f",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {state.message}
          </div>
        )}

        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: "#444" }}>
            {t.name} <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            required
            placeholder={t.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: "#444" }}>
            {t.phone} <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="tel"
            required
            placeholder="05xxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
            dir="ltr"
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: "#444" }}>
            {t.email}
          </label>
          <input
            type="email"
            // Not required
            placeholder={t.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            dir="ltr"
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: "#444" }}>
            {t.password} <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="password"
            required
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            dir="ltr"
          />
        </div>

        {/* City Selection */}
        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: "#444" }}>
            {t.city} <span style={{ color: "red" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{
                ...inputStyle,
                appearance: "none",
                cursor: "pointer",
              }}
              required
            >
              <option value="">{t.pickCity}</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div
              style={{
                position: "absolute",
                left: isAr ? 12 : undefined,
                right: isAr ? undefined : 12,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                opacity: 0.5,
              }}
            >
              ▼
            </div>
          </div>
        </div>

        {/* Services Selection */}
        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: "#444" }}>
            {t.service} <span style={{ color: "red" }}>*</span>
          </label>
          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              type="button"
              ref={btnRef}
              onClick={() => setServiceMenuOpen(!serviceMenuOpen)}
              style={{
                ...inputStyle,
                textAlign: isAr ? "right" : "left",
                cursor: "pointer",
                color: serviceTypes.length ? "#000" : "#888",
              }}
            >
              {serviceTypes.length > 0
                ? serviceTypes.join("، ")
                : t.pickService}
            </button>
            <div
              style={{
                position: "absolute",
                left: isAr ? 12 : undefined,
                right: isAr ? undefined : 12,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                opacity: 0.5,
              }}
            >
              ▼
            </div>

            {serviceMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  marginTop: 4,
                  zIndex: 100,
                  maxHeight: 200,
                  overflowY: "auto",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                }}
              >
                {serviceOptions.map((svc) => {
                  const selected = serviceTypes.includes(svc);
                  return (
                    <div
                      key={svc}
                      onClick={() => {
                        if (selected) {
                          setServiceTypes(serviceTypes.filter((x) => x !== svc));
                        } else {
                          if (serviceTypes.length >= 3) return; // Max 3
                          setServiceTypes([...serviceTypes, svc]);
                        }
                      }}
                      style={{
                        padding: "10px 12px",
                        borderBottom: "1px solid #f5f5f5",
                        cursor: "pointer",
                        background: selected ? "#f0f9ff" : "#fff",
                        color: selected ? "#0070f3" : "#333",
                        fontWeight: selected ? "bold" : "normal",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>{svc}</span>
                      {selected && <span>✓</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
            {isAr ? "يمكنك اختيار حتى 3 خدمات" : "You can select up to 3 services"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            marginTop: 4,
          }}
        >
          <input
            type="checkbox"
            id="agree_chk"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            style={{ marginTop: 4, width: 16, height: 16, cursor: "pointer" }}
          />
          <label
            htmlFor="agree_chk"
            style={{ fontSize: 13, lineHeight: 1.6, color: "#555", cursor: "pointer" }}
          >
            {t.agree}{" "}
            <Link
              href={`/${locale}/terms`}
              target="_blank"
              style={{ color: "#111", fontWeight: "bold", textDecoration: "underline" }}
            >
              {t.read}
            </Link>
          </label>
        </div>

        <button
          type="submit"
          disabled={busy}
          style={{
            marginTop: 10,
            padding: "14px",
            borderRadius: "10px",
            border: "none",
            background: "#111",
            color: "#fff",
            fontSize: "16px",
            fontWeight: 700,
            cursor: busy ? "wait" : "pointer",
            opacity: busy ? 0.7 : 1,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {busy ? t.sending : t.submit}
        </button>
      </form>

      <ProviderRequestNotifier locale={locale} />
    </div>
  );
}
