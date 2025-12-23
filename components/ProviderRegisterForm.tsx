"use client";

import * as React from "react";
import Link from "next/link";

type Locale = "ar" | "en";

type Props = {
  locale: Locale;
};

type State =
  | { ok: false; message: string }
  | { ok: true; message: string; ref?: string };

function normalizePhone(raw: string) {
  const s = String(raw || "").trim();
  return s.replace(/[^\d]/g, "");
}

export default function ProviderRegisterForm({ locale }: Props) {
  const isAr = locale === "ar";

  const t = {
    title: isAr ? "ط§ظ„طھط³ط¬ظٹظ„ ظƒظ…ظ‚ط¯ظ… ط®ط¯ظ…ط©" : "Provider Signup",
    hint: isAr
      ? "ط£ط¯ط®ظ„ ط¨ظٹط§ظ†ط§طھظƒ ط¨ط¯ظ‚ط© â€” ط§ظ„ظ…ط¯ظٹظ†ط© ظˆظ†ظˆط¹ ط§ظ„ط®ط¯ظ…ط© ظ…ظ† ط§ظ„ظ‚ط§ط¦ظ…ط© ظپظ‚ط·."
      : "Enter your details carefully â€” city and service from the list only.",
    name: isAr ? "ط§ط³ظ… ظ…ظ‚ط¯ظ… ط§ظ„ط®ط¯ظ…ط©" : "Provider name",
    phone: isAr ? "ط±ظ‚ظ… ط§ظ„ط¬ظˆط§ظ„" : "Mobile number",
    service: isAr ? "ظ†ظˆط¹ ط§ظ„ط®ط¯ظ…ط©" : "Service type",
    city: isAr ? "ط§ظ„ظ…ط¯ظٹظ†ط©" : "City",
    agree: isAr ? "ظ…ظˆط§ظپظ‚" : "I agree",
    read: isAr ? "ظ‚ط±ط§ط،ط© ط§ظ„ظ†طµظˆطµ ط§ظ„ظ‚ط§ظ†ظˆظ†ظٹط©" : "Read legal texts",
    submit: isAr ? "ط¥ط±ط³ط§ظ„ ط·ظ„ط¨ ط§ظ„طھط³ط¬ظٹظ„" : "Submit signup request",
    sending: isAr ? "ط¬ط§ط±ظچ ط§ظ„ط¥ط±ط³ط§ظ„..." : "Sending...",
    required: isAr ? "ط§ظƒظ…ظ„ ط¬ظ…ظٹط¹ ط§ظ„ط­ظ‚ظˆظ„ ط§ظ„ظ…ط·ظ„ظˆط¨ط©." : "Please complete all required fields.",
    agreeReq: isAr ? "ظٹظ„ط²ظ… ط§ظ„ظ…ظˆط§ظپظ‚ط© ط¹ظ„ظ‰ ط§ظ„ظ†طµظˆطµ ط§ظ„ظ‚ط§ظ†ظˆظ†ظٹط©." : "You must agree to the legal texts.",
    phoneInvalid: isAr ? "ط±ظ‚ظ… ط§ظ„ط¬ظˆط§ظ„ ط؛ظٹط± طµط­ظٹط­." : "Invalid mobile number.",
    serverError: isAr ? "ط­ط¯ط« ط®ط·ط£. ط­ط§ظˆظ„ ظ…ط±ط© ط£ط®ط±ظ‰." : "Something went wrong. Please try again.",
    success: isAr ? "طھظ… ط¥ط±ط³ط§ظ„ ط·ظ„ط¨ظƒ ط¨ظ†ط¬ط§ط­." : "Your request was sent successfully.",
    pickService: isAr ? "ط§ط®طھط± ظ†ظˆط¹ ط§ظ„ط®ط¯ظ…ط©" : "Select service type",
    pickCity: isAr ? "ط§ط®طھط± ط§ظ„ظ…ط¯ظٹظ†ط©" : "Select city",
  };

  const servicesAr = [
    "ظƒط´طھط§طھ ط¨ط±ظٹط©",
    "ظƒط´طھط§طھ ط³ط§ط­ظ„ظٹط©",
    "ظƒط´طھط§طھ ط¬ط¨ظ„ظٹط©",
    "ظƒط´طھط§طھ ط±ظ…ظ„ظٹط©",
    "ظ…ظ†طھط¬ط¹",
    "ط´ط§ظ„ظٹظ‡",
    "ظ…ط®ظٹظ…",
    "ط§ط³طھط±ط§ط­ط©",
    "ظ…ط²ط±ط¹ط©",
  ];

  const servicesEn = [
    "Desert trips",
    "Coastal trips",
    "Mountain trips",
    "Sandy trips",
    "Resort",
    "Chalet",
    "Camp",
    "Rest house",
    "Farm",
  ];

  const citiesAr = [
    "ظ…ظƒط© ط§ظ„ظ…ظƒط±ظ…ط©",
    "ط§ظ„ظ…ط¯ظٹظ†ط© ط§ظ„ظ…ظ†ظˆط±ط©",
    "ط§ظ„ط±ظٹط§ط¶",
    "ط¬ط¯ظ‡",
    "ط§ظ„ط¯ظ…ط§ظ…",
    "ط§ظ„ظ‚طµظٹظ…",
    "ط­ط§ط¦ظ„",
    "ط¹ط±ط¹ط±",
    "ط·ط±ظٹظپ",
    "ط§ظ„ظ‚ط±ظٹط§طھ",
    "ط·ط¨ط±ط¬ظ„",
    "ط§ظ„ط¬ظˆظپ",
    "ط³ظƒط§ظƒط§",
    "طھط¨ظˆظƒ",
    "ط§ظ„ط¹ظ„ط§",
    "ظٹظ†ط¨ط¹",
    "ط§ظ…ظ„ط¬",
    "ط­ظ‚ظ„",
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
  const [phone, setPhone] = React.useState("");
  const [serviceType, setServiceType] = React.useState("");
  const [city, setCity] = React.useState("");
  const [agree, setAgree] = React.useState(false);

  const [busy, setBusy] = React.useState(false);
  const [state, setState] = React.useState<State | null>(null);

  function friendlyServerMessage(raw: any) {
    const s = String(raw || "").trim();
    if (!s) return "";

    const key = s.toLowerCase();
    if (key === "missing_fields") return t.required;
    if (key === "invalid_phone") return t.phoneInvalid;
    if (key === "must_agree") return t.agreeReq;

    return s;
  }

  function missingMessage(missing: string[]) {
    if (missing.length === 0) return t.required;
    if (isAr) return `ط§ظƒظ…ظ„ ط§ظ„ط­ظ‚ظˆظ„ ط§ظ„طھط§ظ„ظٹط©: ${missing.join("طŒ ")}`;
    return `Please complete: ${missing.join(", ")}`;
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

    const fd = new FormData(form);

    const n = String(fd.get("provider_name") ?? "").trim();
    const p = normalizePhone(String(fd.get("provider_phone") ?? ""));
    const s = String(fd.get("service_type") ?? "").trim();
    const c = String(fd.get("city") ?? "").trim();
    const a = fd.get("agree") === "on";

    const missing: string[] = [];
    if (!n) missing.push(t.name);
    if (!p) missing.push(t.phone);
    if (!s) missing.push(t.service);
    if (!c) missing.push(t.city);

    if (missing.length > 0) {
      setState({ ok: false, message: missingMessage(missing) });
      return;
    }

    const looksOk =
      (p.length === 10 && p.startsWith("05")) ||
      (p.length === 9 && p.startsWith("5")) ||
      (p.length === 12 && p.startsWith("9665")) ||
      (p.length === 13 && p.startsWith("009665"));

    if (!looksOk) {
      setState({ ok: false, message: t.phoneInvalid });
      return;
    }

    if (!a) {
      setState({ ok: false, message: t.agreeReq });
      return;
    }

    setBusy(true);
    setState(null);

    try {
      const res = await fetch("/api/providers/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          name: n,
          phone: p,
          service_type: s,
          city: c,
          accepted: a, // ✅ هذا هو الإصلاح الوحيد
        }),
      });

      const data = (await res.json().catch(() => null)) as any;

      if (!res.ok || !data?.ok) {
        const rawMsg = data?.message ?? data?.error ?? "";
        const msg = friendlyServerMessage(rawMsg);
        setState({ ok: false, message: msg || t.serverError });
        setBusy(false);
        return;
      }

      const ref = String(data?.ref || data?.request_id || data?.id || "").trim();
      setState({ ok: true, message: t.success, ref });

      const to = `/${locale}/providers/success${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`;
      window.location.href = to;
    } catch {
      setState({ ok: false, message: t.serverError });
      setBusy(false);
    }
  }

  return (
    <form className="lk-form" dir={isAr ? "rtl" : "ltr"} onSubmit={onSubmit} noValidate>
      <h1>{t.title}</h1>
      <p className="lk-hint">{t.hint}</p>

      <div className="lk-field">
        <label htmlFor="lk-name">{t.name}</label>
        <input
          id="lk-name"
          name="provider_name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (state) setState(null);
          }}
          autoComplete="name"
          placeholder={isAr ? "ظ…ط«ط§ظ„: ط®ط§ظ„ط¯" : "e.g. Khalid"}
          required
        />
      </div>

      <div className="lk-field">
        <label htmlFor="lk-phone">{t.phone}</label>
        <input
          id="lk-phone"
          name="provider_phone"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (state) setState(null);
          }}
          inputMode="tel"
          autoComplete="tel"
          placeholder={isAr ? "05xxxxxxxx" : "05xxxxxxxx"}
          required
        />
      </div>

      <div className="lk-field">
        <label htmlFor="lk-service">{t.service}</label>
        <select
          id="lk-service"
          name="service_type"
          value={serviceType}
          onChange={(e) => {
            setServiceType(e.target.value);
            if (state) setState(null);
          }}
          aria-label={t.service}
          required
        >
          <option value="" disabled hidden>
            {t.pickService}
          </option>
          {serviceOptions.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>

      <div className="lk-field">
        <label htmlFor="lk-city">{t.city}</label>
        <select
          id="lk-city"
          name="city"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            if (state) setState(null);
          }}
          aria-label={t.city}
          required
        >
          <option value="" disabled hidden>
            {t.pickCity}
          </option>
          {cityOptions.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>

      <div className="lk-agree" aria-label={isAr ? "ط§ظ„ظ…ظˆط§ظپظ‚ط© ط¹ظ„ظ‰ ط§ظ„ظ†طµظˆطµ ط§ظ„ظ‚ط§ظ†ظˆظ†ظٹط©" : "Legal agreement"}>
        <div className="lk-agree-box">
          <label className="lk-agree-row">
            <input
              type="checkbox"
              name="agree"
              checked={agree}
              onChange={(e) => {
                setAgree(e.target.checked);
                if (state) setState(null);
              }}
              aria-label={isAr ? "ظ…ظˆط§ظپظ‚ط©" : "Agree"}
            />
            <span className="lk-agree-text">{t.agree}</span>
          </label>

          <Link href={`/${locale}/legal`} className="lk-legal-link">
            {t.read}
          </Link>
        </div>
      </div>

      {state?.message ? (
        <div className={`lk-msg ${state.ok ? "ok" : "bad"}`} role="status" aria-live="polite">
          {state.message}
        </div>
      ) : null}

      <button type="submit" className="lk-submit" disabled={busy}>
        {busy ? t.sending : t.submit}
      </button>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          :root{
            --lk-h: 44px;
            --lk-r: 12px;
            --lk-b: rgba(0,0,0,.18);
            --lk-bf: rgba(0,0,0,.38);
            --lk-bg: rgba(255,255,255,0.96);
          }

          .lk-form{
            box-sizing:border-box;
            width:100%;
            background:rgba(255,255,255,0.90);
            border:1px solid rgba(0,0,0,0.08);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            padding:16px;
            border-radius:18px;
            box-shadow:0 12px 28px rgba(0,0,0,0.10);
          }

          .lk-form *{ box-sizing:border-box; }

          .lk-form h1{
            margin:0 0 6px;
            font-size:18px;
            font-weight:900;
            text-align:center;
          }

          .lk-hint{
            margin:0 0 14px;
            font-size:12px;
            opacity:.78;
            text-align:center;
            line-height: 1.7;
          }

          .lk-field{ margin-top:12px; }

          .lk-field label{
            font-size:12px;
            font-weight:900;
            display:block;
            margin:0 0 6px;
            opacity: .92;
          }

          .lk-form input:not([type="checkbox"]),
          .lk-form select{
            width:100%;
            height:var(--lk-h);
            padding:0 14px;
            border-radius:var(--lk-r);
            border:1px solid var(--lk-b);
            background:var(--lk-bg);
            outline:none;
            font-size:14px;
            line-height: var(--lk-h);
          }

          .lk-form input:not([type="checkbox"])::placeholder{
            opacity: .55;
          }

          .lk-form input:not([type="checkbox"]):focus,
          .lk-form select:focus{
            border-color: var(--lk-bf);
          }

          /* طھظˆط­ظٹط¯ select ظˆط±ط§ط­ط© ط§ظ„ط³ظ‡ظ… ط¨ط¯ظˆظ† ظƒط³ط± RTL/LTR */
          .lk-form select{
            appearance:none;
            -webkit-appearance:none;
            -moz-appearance:none;
            padding-inline-end: 40px;
            background-image:
              linear-gradient(45deg, transparent 50%, rgba(0,0,0,.55) 50%),
              linear-gradient(135deg, rgba(0,0,0,.55) 50%, transparent 50%);
            background-position:
              calc(100% - 18px) calc(50% + 2px),
              calc(100% - 12px) calc(50% + 2px);
            background-size: 6px 6px, 6px 6px;
            background-repeat:no-repeat;
          }

          .lk-form[dir="rtl"] select{
            background-position:
              18px calc(50% + 2px),
              12px calc(50% + 2px);
            padding-inline-end: 14px;
            padding-inline-start: 40px;
          }

          .lk-agree{ margin-top: 14px; }

          .lk-agree-box{
            width:100%;
            border-radius: 14px;
            border:1px solid rgba(0,0,0,0.10);
            background: rgba(255,255,255,0.88);
            padding:10px 12px;
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:10px;
          }

          .lk-agree-row{
            display:inline-flex;
            align-items:center;
            gap:10px;
            font-size:13px;
            font-weight:900;
            cursor:pointer;
            user-select:none;
            -webkit-tap-highlight-color: transparent;
            margin:0;
          }

          .lk-agree-row input[type="checkbox"]{
            width:18px;
            height:18px;
            margin:0;
            flex:0 0 auto;
            cursor:pointer;
          }

          .lk-agree-text{ line-height: 18px; }

          .lk-legal-link{
            flex:0 0 auto;
            font-size:12px;
            font-weight:900;
            opacity:.78;
            text-decoration:underline;
            white-space: nowrap;
          }

          .lk-msg{
            margin-top:12px;
            padding:10px 12px;
            border-radius:12px;
            font-size:12px;
            font-weight:900;
            border:1px solid rgba(0,0,0,0.10);
            background: rgba(255,255,255,0.90);
            line-height: 1.7;
          }
          .lk-msg.bad{ border-color: rgba(239,68,68,0.35); }
          .lk-msg.ok{ border-color: rgba(34,197,94,0.35); }

          .lk-submit{
            margin-top:12px;
            width:100%;
            height:46px;
            border-radius:14px;
            border:0;
            background:#000;
            color:#fff;
            font-weight:900;
            cursor:pointer;
            opacity:1;
          }
          .lk-submit:disabled{
            opacity:.65;
            cursor:not-allowed;
          }
        `,
        }}
      />
    </form>
  );
}
