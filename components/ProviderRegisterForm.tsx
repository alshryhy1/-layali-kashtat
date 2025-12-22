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
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.18)",
    outline: "none",
    fontSize: 14,
    background: "#fff",
    direction: isAr ? "rtl" : "ltr",
    textAlign: isAr ? "right" : "left",
  });

  const labelStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 900,
    marginBottom: 6,
    textAlign: isAr ? "right" : "left",
  };

  const errStyle: CSSProperties = {
    color: "#b00020",
    fontWeight: 900,
    fontSize: 13,
    marginTop: 6,
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
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 520,
        margin: "0 auto",
        background: "rgba(255,255,255,0.92)",
        padding: 18,
        borderRadius: 18,
        border: "1px solid rgba(0,0,0,0.10)",
        boxShadow: "0 12px 28px rgba(0,0,0,0.10)",
      }}
    >
      <h2 style={{ margin: "0 0 14px", fontSize: 20, fontWeight: 900, textAlign: "center" }}>
        {ui.h2}
      </h2>

      <div style={{ display: "grid", gap: 10 }}>
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
              if (fieldErrors.serviceType)
                setFieldErrors((p) => ({ ...p, serviceType: undefined }));
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

        <div
          style={{
            marginTop: 6,
            padding: 12,
            borderRadius: 14,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.12)",
            textAlign: isAr ? "right" : "left",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
              flexDirection: isAr ? "row-reverse" : "row",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 13 }}>{ui.legalTitle}</div>
            <a
              href={`/${locale}/legal`}
              style={{
                fontSize: 13,
                fontWeight: 900,
                textDecoration: "underline",
                color: "#111",
                whiteSpace: "nowrap",
              }}
            >
              {ui.legalLink}
            </a>
          </div>

          <label
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              marginTop: 10,
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
              style={{ marginTop: 3 }}
              disabled={state.loading}
            />
            <div>
              <div style={{ fontWeight: 900, fontSize: 13 }}>{ui.legalAgree}</div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{ui.legalHint}</div>
              {fieldErrors.agree && <div style={{ ...errStyle, marginTop: 8 }}>{fieldErrors.agree}</div>}
            </div>
          </label>
        </div>

        {state.error && <div style={errStyle}>{state.error}</div>}

        <button
          type="submit"
          disabled={state.loading}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 14,
            border: "none",
            background: "#000",
            color: "#fff",
            fontWeight: 900,
            cursor: state.loading ? "not-allowed" : "pointer",
            opacity: state.loading ? 0.88 : 1,
          }}
        >
          {state.loading ? ui.sending : ui.submit}
        </button>
      </div>
    </form>
  );
}
