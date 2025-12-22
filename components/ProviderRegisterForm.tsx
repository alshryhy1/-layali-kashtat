"use client";

import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Locale = "ar" | "en";

type Props = {
  locale: Locale;
};

type SubmitState = {
  loading: boolean;
  error: string | null;
};

type FieldErrors = {
  name?: string;
  phone?: string;
  serviceType?: string;
  city?: string;
  agree?: string;
};

function normalizePhone(raw: string) {
  const v = String(raw || "").trim();
  const cleaned = v.replace(/[^\d+]/g, "");

  const reLocal = /^05\d{8}$/;
  const rePlus = /^\+9665\d{8}$/;
  const reNoPlus = /^9665\d{8}$/;

  const ok = reLocal.test(cleaned) || rePlus.test(cleaned) || reNoPlus.test(cleaned);
  return { cleaned, ok };
}

export default function ProviderRegisterForm({ locale }: Props) {
  const router = useRouter();
  const isAr = locale === "ar";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [city, setCity] = useState("");
  const [agree, setAgree] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<SubmitState>({
    loading: false,
    error: null,
  });

  const services = useMemo(
    () => [
      "كشتات برية",
      "كشتات ساحلية",
      "كشتات جبلية",
      "كشتات رملية",
      "منتجع",
      "شاليه",
      "مخيم",
      "استراحة",
      "مزرعة",
    ],
    []
  );

  const cities = useMemo(
    () => [
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
    ],
    []
  );

  const ui = useMemo(() => {
    return isAr
      ? {
          h2: "التسجيل كمقدّم خدمة",
          hint: "أدخل بياناتك بدقة — المدينة ونوع الخدمة من القائمة فقط.",
          name: "اسم مقدّم الخدمة",
          phone: "رقم الجوال",
          service: "نوع الخدمة",
          city: "المدينة",
          submit: "إرسال طلب التسجيل",
          sending: "جاري الإرسال...",
          legalTitle: "إقرار وتعهد",
          legalAgree: "أوافق على النصوص القانونية",
          legalHint: "يلزم الموافقة لإرسال الطلب.",
          legalLink: "قراءة النصوص القانونية",
          errName: "الاسم مطلوب (حد أدنى حرفين).",
          errPhone: "رقم الجوال غير صحيح.",
          errService: "اختر نوع الخدمة.",
          errCity: "اختر المدينة.",
          errAgree: "الموافقة على النصوص القانونية إلزامية.",
          errGeneric: "حدث خطأ أثناء الإرسال، حاول لاحقًا.",
        }
      : {
          h2: "Provider Signup",
          hint: "Enter accurate info — city and service type must be selected from the list.",
          name: "Provider name",
          phone: "Mobile number",
          service: "Service type",
          city: "City",
          submit: "Submit request",
          sending: "Submitting...",
          legalTitle: "Declaration",
          legalAgree: "I agree to the legal texts",
          legalHint: "Approval is required to submit.",
          legalLink: "Read legal texts",
          errName: "Name is required (min 2 chars).",
          errPhone: "Invalid mobile number.",
          errService: "Select service type.",
          errCity: "Select city.",
          errAgree: "You must agree to the legal texts.",
          errGeneric: "Submission failed. Please try again.",
        };
  }, [isAr]);

  const inputStyle = (): CSSProperties => ({
    width: "100%",
    padding: "10px 12px", // ✅ أقل قليلًا (بدون كسر اللمس)
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.18)",
    outline: "none",
    fontSize: 14,
    background: "#fff",
    direction: isAr ? "rtl" : "ltr",
    textAlign: isAr ? "right" : "left",
    minHeight: 44, // ✅ لمس للجوال (ثابت)
  });

  const labelStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 900,
    marginBottom: 5, // ✅ أقل
    textAlign: isAr ? "right" : "left",
  };

  const errStyle: CSSProperties = {
    color: "#b00020",
    fontWeight: 900,
    fontSize: 13,
    marginTop: 5, // ✅ أقل
    textAlign: isAr ? "right" : "left",
  };

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (name.trim().length < 2) e.name = ui.errName;
    if (!normalizePhone(phone).ok) e.phone = ui.errPhone;
    if (!serviceType) e.serviceType = ui.errService;
    if (!city) e.city = ui.errCity;
    if (!agree) e.agree = ui.errAgree;
    return e;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (state.loading) return;

    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setState({ loading: true, error: null });

    try {
      const { cleaned } = normalizePhone(phone);

      const res = await fetch("/api/provider-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleaned,
          city,
          serviceType,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.id) {
        const msg =
          typeof data?.error === "string" && data.error.trim() ? data.error.trim() : ui.errGeneric;
        throw new Error(msg);
      }

      const ref = String(data.id);
      router.replace(`/${locale}/providers/success?ref=${encodeURIComponent(ref)}`);
    } catch (err: any) {
      const msg =
        typeof err?.message === "string" && err.message.trim() ? err.message.trim() : ui.errGeneric;
      setState({ loading: false, error: msg });
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="lk-form"
        style={{
          width: "100%",
          maxWidth: 520,
          margin: "0 auto",
          background: "rgba(255,255,255,0.88)",
          padding: 16, // ✅ أقل قليلًا
          borderRadius: 18,
          border: "1px solid rgba(0,0,0,0.10)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.10)",
        }}
      >
        <h2
          className="lk-form-title"
          style={{
            margin: "0 0 6px", // ✅ أقل
            fontSize: 20,
            fontWeight: 900,
            textAlign: "center",
          }}
        >
          {ui.h2}
        </h2>

        <div
          className="lk-form-hint"
          style={{
            textAlign: "center",
            fontSize: 13,
            opacity: 0.72,
            marginBottom: 10, // ✅ أقل
            lineHeight: 1.25, // ✅ يقلل الارتفاع
          }}
        >
          {ui.hint}
        </div>

        <div className="lk-form-grid" style={{ display: "grid", gap: 9 }}>
          <div>
            <div style={labelStyle}>{ui.name}</div>
            <input
              value={name}
              onChange={(e2) => {
                setName(e2.target.value);
                if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
              }}
              style={inputStyle()}
              disabled={state.loading}
            />
            {fieldErrors.name && <div style={errStyle}>{fieldErrors.name}</div>}
          </div>

          <div>
            <div style={labelStyle}>{ui.phone}</div>
            <input
              value={phone}
              onChange={(e2) => {
                const v = e2.target.value.replace(/[^\d+]/g, "");
                setPhone(v);
                if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: undefined }));
              }}
              inputMode="tel"
              style={inputStyle()}
              disabled={state.loading}
            />
            {fieldErrors.phone && <div style={errStyle}>{fieldErrors.phone}</div>}
          </div>

          <div>
            <div style={labelStyle}>{ui.service}</div>
            <select
              value={serviceType}
              onChange={(e2) => {
                setServiceType(e2.target.value);
                if (fieldErrors.serviceType) setFieldErrors((p) => ({ ...p, serviceType: undefined }));
              }}
              style={inputStyle()}
              disabled={state.loading}
            >
              <option value="">{ui.service}</option>
              {services.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {fieldErrors.serviceType && <div style={errStyle}>{fieldErrors.serviceType}</div>}
          </div>

          <div>
            <div style={labelStyle}>{ui.city}</div>
            <select
              value={city}
              onChange={(e2) => {
                setCity(e2.target.value);
                if (fieldErrors.city) setFieldErrors((p) => ({ ...p, city: undefined }));
              }}
              style={inputStyle()}
              disabled={state.loading}
            >
              <option value="">{ui.city}</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {fieldErrors.city && <div style={errStyle}>{fieldErrors.city}</div>}
          </div>

          {/* ✅ الإقرار: خفيف + مضغوط */}
          <div
            className="lk-legal"
            style={{
              marginTop: 3, // ✅ أقل
              padding: 8,
              borderRadius: 12,
              background: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(0,0,0,0.08)",
              textAlign: isAr ? "right" : "left",
            }}
          >
            <label
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                flexDirection: isAr ? "row-reverse" : "row",
              }}
            >
              <input
                type="checkbox"
                checked={agree}
                onChange={(e2) => {
                  setAgree(e2.target.checked);
                  if (fieldErrors.agree) setFieldErrors((p) => ({ ...p, agree: undefined }));
                }}
                style={{
                  width: 16,
                  height: 16,
                  flex: "0 0 16px",
                  marginTop: 2,
                }}
                disabled={state.loading}
              />

              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 13, lineHeight: 1.2 }}>
                  {ui.legalAgree}
                </div>

                <div style={{ fontSize: 12, opacity: 0.72, marginTop: 2, lineHeight: 1.2 }}>
                  {ui.legalHint}
                </div>

                <a
                  href={`/${locale}/legal`}
                  style={{
                    display: "inline-block",
                    marginTop: 4,
                    fontSize: 12,
                    fontWeight: 900,
                    textDecoration: "underline",
                    color: "#111",
                    opacity: 0.9,
                  }}
                >
                  {ui.legalLink}
                </a>

                {fieldErrors.agree && <div style={{ ...errStyle, marginTop: 6 }}>{fieldErrors.agree}</div>}
              </div>
            </label>
          </div>

          {state.error && <div style={{ ...errStyle, marginTop: 4 }}>{state.error}</div>}

          <button
            type="submit"
            disabled={state.loading}
            className="lk-submit"
            style={{
              width: "100%",
              padding: 12,
              minHeight: 46, // ✅ لمس
              borderRadius: 14,
              border: "none",
              background: "#000",
              color: "#fff",
              fontWeight: 900,
              cursor: state.loading ? "not-allowed" : "pointer",
              opacity: state.loading ? 0.88 : 1,
              marginTop: 1, // ✅ يقرب الزر بصريًا
            }}
          >
            {state.loading ? ui.sending : ui.submit}
          </button>
        </div>
      </form>

      {/* ✅ Mobile-First: ضغط الفراغات العمودية على الجوال فقط */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media (max-width: 520px) {
            .lk-form {
              max-width: 460px !important;
              padding: 13px !important;
              border-radius: 16px !important;
              box-shadow: 0 10px 22px rgba(0,0,0,0.10) !important;
              background: rgba(255,255,255,0.86) !important;
            }
            .lk-form-title {
              font-size: 18px !important;
              margin-bottom: 5px !important;
            }
            .lk-form-hint {
              margin-bottom: 8px !important;
              font-size: 12.5px !important;
            }
            .lk-form-grid {
              gap: 8px !important;
            }
            .lk-legal {
              padding: 7px !important;
              border-radius: 10px !important;
              margin-top: 2px !important;
            }
          }
        `,
        }}
      />
    </>
  );
}
