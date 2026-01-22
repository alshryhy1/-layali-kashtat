"use client";

import * as React from "react";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

function getParam(sp: URLSearchParams, k: string) {
  return String(sp.get(k) || "").trim();
}

function safeText(v: unknown) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

function maskPhone(p: string) {
  const s = safeText(p);
  if (!s) return "";
  if (s.length <= 4) return s;
  return `${s.slice(0, 2)}***${s.slice(-2)}`;
}

function maskEmail(e: string) {
  const s = safeText(e);
  const at = s.indexOf("@");
  if (at <= 1) return s;
  return `${s.slice(0, 2)}***${s.slice(at)}`;
}

function row(label: string, value: string) {
  return { label, value };
}

type ApiOk = {
  ok: true;
  created: boolean;
  ref: string;
  status: string;
  completed: boolean;
  reason?: string;
};

type ApiFail = { ok: false; code?: string; message?: string };

export default function ConfirmPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale: Locale = asLocale(params?.locale);
  const isAr = locale === "ar";

  const sp = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );

  const name = getParam(sp, "name");
  const phone = getParam(sp, "phone");
  const email = getParam(sp, "email");

  const city = getParam(sp, "city");
  const service_type = getParam(sp, "service"); // من صفحة options نخزنها في query باسم service
  const customer_location = getParam(sp, "loc");
  const group_type = getParam(sp, "group");
  const people_count = getParam(sp, "people");
  const cooking = getParam(sp, "cooking"); // yes/no
  const equip = getParam(sp, "equip"); // "a,b,c"
  const notes = getParam(sp, "notes");

  // حماية: لازم أساسيات الطلب
  React.useEffect(() => {
    if (!name || !phone || !email || !city || !service_type) {
      window.location.href = `/${locale}/request/customer`;
    }
  }, [name, phone, email, city, service_type, locale]);

  const t = {
    title: isAr ? "تأكيد الطلب" : "Confirm Request",
    hint: isAr ? "راجع تفاصيل الطلب قبل الإرسال." : "Review your request details before sending.",
    section: isAr ? "ملخص الطلب" : "Request Summary",
    send: isAr ? "إرسال الطلب" : "Send Request",
    sending: isAr ? "جاري الإرسال..." : "Sending...",
    back: isAr ? "رجوع" : "Back",
    edit: isAr ? "تعديل الخيارات" : "Edit Options",
    req1Title: isAr ? "إقرار المستلزمات" : "Supplies Acknowledgement",
    req1Text: isAr
      ? "أقرّ بأن جميع مستلزمات القهوة والشاي والطبخ تكون على العميل، ويلتزم مقدم الخدمة بتوفير الأواني فقط ما لم يوجد اتفاق صريح مكتوب بخلاف ذلك بين الطرفين."
      : "I acknowledge that coffee/tea/cooking supplies are the customer’s responsibility, and the provider supplies utensils only unless there is an explicit written agreement otherwise.",
    req2Title: isAr ? "إقرار المنصة" : "Platform Acknowledgement",
    req2Text: isAr
      ? "أقرّ بأن منصة ليالي كشتات هي حلقة وصل تقنية فقط لعرض الطلبات وربط العملاء بمقدمي الخدمات، ولا تُعد طرفًا في الاتفاق، ولا تتحمل أي مسؤولية عن التنفيذ أو الجودة أو الالتزامات المالية أو أي نزاعات تنشأ بين الطرفين."
      : "I acknowledge that Layali Kashtat is a technical intermediary only and is not a party to the agreement, nor responsible for execution, quality, payments, or disputes between parties.",
    mustAgree: isAr ? "لازم توافق على الإقرارين قبل الإرسال." : "You must accept both acknowledgements to send.",
    apiFail: isAr ? "تعذر إرسال الطلب. حاول مرة أخرى." : "Failed to send the request. Please try again.",
    apiMsgPrefix: isAr ? "تنبيه:" : "Notice:",
    cookingYes: isAr ? "طبخ" : "Cooking",
    cookingNo: isAr ? "بدون طبخ" : "No Cooking",
  };

  const cookingText =
    cooking === "yes" ? t.cookingYes : cooking === "no" ? t.cookingNo : "";

  const summary = [
    row(isAr ? "الاسم" : "Name", name),
    row(isAr ? "الجوال" : "Mobile", maskPhone(phone)),
    row(isAr ? "الإيميل" : "Email", maskEmail(email)),
    row(isAr ? "المدينة" : "City", city),
    row(isAr ? "نوع الخدمة" : "Service Type", service_type),
    row(isAr ? "موقع الكشتة" : "Location", customer_location),
    row(isAr ? "نوع الحضور" : "Group", group_type),
    row(isAr ? "عدد الأشخاص" : "People", people_count),
    row(isAr ? "الطبخ" : "Cooking", cookingText),
    row(isAr ? "التجهيزات" : "Setup", equip),
    row(isAr ? "ملاحظات" : "Notes", notes),
  ].filter((x) => safeText(x.value));

  const [agree1, setAgree1] = React.useState(false);
  const [agree2, setAgree2] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);

  async function onSend() {
    setError(null);
    setInfo(null);

    if (!agree1 || !agree2) {
      setError(t.mustAgree);
      return;
    }

    setSending(true);

    try {
      const payload = {
        name,
        phone,
        email,
        city,
        service_type, // مطابق للجدول
        customer_location,
        group_type,
        people_count,
        cooking,
        equip,
        notes,
      };

      const res = await fetch("/api/customer-requests/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as ApiOk | ApiFail;

      if (!res.ok || !("ok" in data) || data.ok === false) {
        const msg = (data as ApiFail)?.message ? String((data as ApiFail).message) : t.apiFail;
        setError(msg);
        setSending(false);
        return;
      }

      // ok true
      const ok = data as ApiOk;

      // إذا فيه طلب فعّال موجود -> روح للمتابعة مباشرة
      if (ok.created === false && ok.ref) {
        setInfo(
          isAr
            ? "لديك طلب فعّال سابق بهذا الرقم. تم تحويلك لصفحة المتابعة."
            : "You already have an active request. Redirecting to tracking page."
        );

        const q = new URLSearchParams();
        q.set("ref", ok.ref);
        q.set("contact", phone);
        window.location.href = `/${locale}/request/track?${q.toString()}`;
        return;
      }

      // طلب جديد -> نجاح
      if (ok.ref) {
        const q = new URLSearchParams();
        q.set("ref", ok.ref);
        q.set("city", city);
        q.set("service", service_type);
        window.location.href = `/${locale}/request/success?${q.toString()}`;
        return;
      }

      setError(t.apiFail);
      setSending(false);
    } catch (e: any) {
      setError(t.apiFail);
      setSending(false);
    }
  }

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    padding: "24px 16px",
    display: "flex",
    justifyContent: "center",
    background: "linear-gradient(135deg, #fdfbf7 0%, #d4c5b0 100%)",
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.6)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 18,
    fontWeight: 900,
    color: "#111",
  };

  const hintStyle: React.CSSProperties = {
    margin: "8px 0 12px",
    fontSize: 12.5,
    color: "#666",
    lineHeight: 1.7,
  };

  const kvStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "110px 1fr",
    gap: 10,
    alignItems: "start",
    padding: "10px 0",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 900,
    color: "#111",
    opacity: 0.9,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 12.5,
    fontWeight: 850,
    color: "#111",
    lineHeight: 1.7,
    wordBreak: "break-word",
  };

  const boxStyle: React.CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 12,
    padding: 12,
    background: "#fbfaf8",
  };

  const checkboxRow: React.CSSProperties = {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    cursor: "pointer",
  };

  const btnPrimary: React.CSSProperties = {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid #92400e",
    background: "#92400e",
    color: "#fff",
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(146, 64, 14, 0.3)",
  };

  const alertErr: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(180, 0, 0, 0.25)",
    background: "rgba(180, 0, 0, 0.06)",
    color: "#7a0000",
    fontSize: 12.5,
    fontWeight: 900,
  };

  const alertInfo: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0, 0, 0, 0.16)",
    background: "#fbfaf8",
    color: "#111",
    fontSize: 12.5,
    fontWeight: 900,
    lineHeight: 1.7,
  };

  const linkBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.2)",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    fontSize: 13,
    textDecoration: "none",
  };

  return (
    <main style={pageStyle} dir={isAr ? "rtl" : "ltr"}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>{t.title}</h1>
          <p style={hintStyle}>{t.hint}</p>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#111", marginBottom: 6 }}>
              {t.section}
            </div>

            <div
              style={{
                border: "1px solid rgba(0,0,0,0.10)",
                borderRadius: 12,
                padding: "0 12px",
              }}
            >
              {summary.map((x) => (
                <div key={x.label} style={kvStyle}>
                  <div style={labelStyle}>{x.label}</div>
                  <div style={valueStyle}>{x.value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a
                href={`/${locale}/request/service?name=${encodeURIComponent(
                  name
                )}&phone=${encodeURIComponent(phone)}&email=${encodeURIComponent(
                  email
                )}&city=${encodeURIComponent(city)}&accepted=1`}
                style={linkBtn}
              >
                {t.edit}
              </a>

              <button type="button" onClick={() => window.history.back()} style={linkBtn}>
                {t.back}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <div style={boxStyle}>
              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>{t.req1Title}</div>
              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  checked={agree1}
                  onChange={(e) => setAgree1(e.target.checked)}
                  style={{ marginTop: 2 }}
                />
                <span style={{ fontSize: 12.5, fontWeight: 850, lineHeight: 1.7 }}>
                  {t.req1Text}
                </span>
              </label>
            </div>

            <div style={boxStyle}>
              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>{t.req2Title}</div>
              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  checked={agree2}
                  onChange={(e) => setAgree2(e.target.checked)}
                  style={{ marginTop: 2 }}
                />
                <span style={{ fontSize: 12.5, fontWeight: 850, lineHeight: 1.7 }}>
                  {t.req2Text}
                </span>
              </label>
            </div>

            {info ? <div style={alertInfo}>{info}</div> : null}
            {error ? <div style={alertErr}>{error}</div> : null}

            <button
              type="button"
              onClick={onSend}
              style={{
                ...btnPrimary,
                opacity: sending ? 0.7 : 1,
                cursor: sending ? "not-allowed" : "pointer",
              }}
              disabled={sending}
            >
              {sending ? t.sending : t.send}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
