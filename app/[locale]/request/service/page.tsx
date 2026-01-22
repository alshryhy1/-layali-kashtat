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

export default function ServiceStepPage({
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
  const accepted = getParam(sp, "accepted");

  // حماية التدفق: لازم بيانات العميل
  React.useEffect(() => {
    if (!name || !phone || !email || accepted !== "1") {
      window.location.href = `/${locale}/request/customer`;
    }
  }, [name, phone, email, accepted, locale]);

  const t = {
    title: isAr ? "تفاصيل الطلب" : "Request Details",
    hint: isAr
      ? "اختر المدينة ونوع الخدمة وباقي الخيارات."
      : "Choose the city, service type, and other options.",
    city: isAr ? "المدينة" : "City",
    service: isAr ? "نوع الخدمة" : "Service Type",
    group: isAr ? "نوع الحضور" : "Group Type",
    cooking: isAr ? "الطبخ" : "Cooking",
    equip: isAr ? "التجهيزات" : "Setup",
    people: isAr ? "عدد الأشخاص" : "People Count",
    notes: isAr ? "ملاحظات (اختياري)" : "Notes (optional)",
    cityPh: isAr ? "اختر المدينة" : "Select a city",
    servicePh: isAr ? "اختر نوع الخدمة" : "Select a service",
    groupPh: isAr ? "اختر نوع الحضور" : "Select group type",
    peoplePh: isAr ? "اختر العدد" : "Select count",
    next: isAr ? "التالي" : "Next",
    back: isAr ? "رجوع" : "Back",
    err: isAr ? "تأكد من اختيار المدينة ونوع الخدمة." : "Please select city and service type.",
    cookYes: isAr ? "طبخ" : "Cooking",
    cookNo: isAr ? "بدون طبخ" : "No Cooking",
    location: isAr ? "رابط الموقع (Google Maps)" : "Location Link (Google Maps)",
    locationPh: isAr ? "الصق رابط الموقع هنا" : "Paste location link here",
    locErr: isAr ? "يرجى إضافة رابط الموقع." : "Please add location link.",
    locProvider: isAr ? "سيقوم مقدم الخدمة بإرسال الموقع لك بعد قبول الطلب." : "The provider will send you the location after accepting the request.",
  };

  // المدن (عربي/إنجليزي)
  const citiesAr = [
    "الرياض",
    "القصيم",
    "حائل",
    "مكه المكرمه",
    "المدينه المنوره",
    "جده",
    "الدمام",
    "عرعر",
    "تبوك",
    "الجوف",
    "العلاء",
    "املج",
    "القريات",
    "حقل",
    "نجران",
    "خميس مشيط",
    "جيزان",
    "عسير",
    "الباحه",
    "الطائف",
  ];

  const citiesEn = [
    "Riyadh",
    "Al Qassim",
    "Hail",
    "Makkah",
    "Madinah",
    "Jeddah",
    "Dammam",
    "Arar",
    "Tabuk",
    "Al Jouf",
    "Al Ula",
    "Umluj",
    "Al Qurayyat",
    "Haql",
    "Najran",
    "Khamis Mushait",
    "Jazan",
    "Asir",
    "Al Baha",
    "Taif",
  ];

  // نوع الخدمة
  const servicesAr = ["كشته بريه رمليه", "كشته بريه ساحليه", "كشته بريه جبليه", "مخيم", "شاليه", "منتجع", "مزرعة", "استراحة"];
  const servicesEn = ["Desert (sandy)", "Desert (coastal)", "Desert (mountain)", "Camp", "Chalet", "Resort", "Farm", "Rest area"];

  // نوع الحضور
  const groupsAr = ["شباب", "عوائل", "نساء"];
  const groupsEn = ["Men", "Families", "Women"];

  // عدد الأشخاص (مختصر)
  const peopleAr = ["1-5", "6-10", "11-20", "21-40", "40+"];
  const peopleEn = ["1-5", "6-10", "11-20", "21-40", "40+"];

  const cities = isAr ? citiesAr : citiesEn;
  const services = isAr ? servicesAr : servicesEn;
  const groups = isAr ? groupsAr : groupsEn;
  const people = isAr ? peopleAr : peopleEn;

  const [city, setCity] = React.useState("");
  const [service, setService] = React.useState("");
  const [group, setGroup] = React.useState("");
  const [peopleCount, setPeopleCount] = React.useState("");
  const [cooking, setCooking] = React.useState<"yes" | "no">("no");

  const [equipBayt, setEquipBayt] = React.useState(false); // بيت شعر
  const [equipTent1, setEquipTent1] = React.useState(false); // خيمة
  const [equipTent2, setEquipTent2] = React.useState(false); // خيمتين

  const [locationUrl, setLocationUrl] = React.useState("");
  const [gettingLoc, setGettingLoc] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // هل الخدمة تتطلب موقع من العميل؟
  const isOutdoor = service.includes("كشته") || service.toLowerCase().includes("desert");

  function handleJoyfulGetLocation() {
    if (!navigator.geolocation) {
      alert(isAr ? "المتصفح لا يدعم تحديد الموقع." : "Geolocation is not supported by your browser.");
      return;
    }
    setGettingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setLocationUrl(link);
        setGettingLoc(false);
      },
      (err) => {
        console.error(err);
        alert(isAr ? "تعذر تحديد الموقع. يرجى تفعيل الخدمة أو لصق الرابط يدوياً." : "Unable to retrieve your location.");
        setGettingLoc(false);
      }
    );
  }

  // حفظ/قراءة المدينة للطقس في الشريط العلوي
  React.useEffect(() => {
    try {
      const saved = String(window.localStorage.getItem("lk_city") || "").trim();
      if (!saved) return;
      if (city) return;
      if (cities.includes(saved)) setCity(saved);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr]);

  function toggleChip(current: boolean, setter: (v: boolean) => void) {
    setter(!current);
  }

  function goNext() {
    setError(null);

    if (!city || !service) {
      setError(t.err);
      return;
    }

    if (isOutdoor && !locationUrl.trim()) {
      setError(t.locErr);
      return;
    }

    const q = new URLSearchParams();
    q.set("name", name);
    q.set("phone", phone);
    q.set("email", email);
    q.set("accepted", "1");

    q.set("city", city);
    q.set("service", service);

    if (isOutdoor && locationUrl) {
      q.set("loc", locationUrl.trim());
    }

    if (group) q.set("group", group);
    if (peopleCount) q.set("people", peopleCount);

    q.set("cooking", cooking);

    // تجهيزات: نخزنها كقائمة قصيرة
    const equips: string[] = [];
    if (equipBayt) equips.push(isAr ? "بيت شعر" : "Bayt Shaar");
    if (equipTent1) equips.push(isAr ? "خيمة" : "Tent");
    if (equipTent2) equips.push(isAr ? "خيمتين" : "Two Tents");
    if (equips.length) q.set("equip", equips.join(","));

    const n = safeText(notes);
    if (n) q.set("notes", n);

    // إلى صفحة التأكيد
    window.location.href = `/${locale}/request/confirm?${q.toString()}`;
  }

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    padding: "24px 16px",
    display: "flex",
    justifyContent: "center",
    background: "linear-gradient(135deg, #fdfbf7 0%, #e6d0b8 100%)",
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.6)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 900,
    color: "#111",
    marginBottom: 6,
  };

  const selectWrap: React.CSSProperties = { position: "relative" };

  const caretStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    fontWeight: 900,
    opacity: 0.6,
    fontSize: 14,
    ...(isAr ? { left: 12 } : { right: 12 }),
  };

  const selectStyle: React.CSSProperties = {
    width: "100%",
    height: 44,
    padding: isAr ? "0 12px 0 40px" : "0 40px 0 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.16)",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    fontSize: 13,
    boxSizing: "border-box",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    outline: "none",
  };

  const row2: React.CSSProperties = {
    display: "grid",
    gap: 10,
    gridTemplateColumns: "1fr",
  };

  const chipRow: React.CSSProperties = {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  };

  const chipStyle = (active: boolean): React.CSSProperties => ({
    height: 34,
    padding: "0 12px",
    borderRadius: 999,
    border: active ? "2px solid #92400e" : "1px solid rgba(0,0,0,0.18)",
    background: active ? "#92400e" : "#fff",
    color: active ? "#fff" : "#111",
    fontWeight: 900,
    fontSize: 12.5,
    cursor: "pointer",
  });

  const toggleWrap: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  };

  const toggleBtn = (active: boolean): React.CSSProperties => ({
    height: 40,
    borderRadius: 12,
    border: active ? "2px solid #92400e" : "1px solid rgba(0,0,0,0.16)",
    background: active ? "#92400e" : "#fff",
    color: active ? "#fff" : "#111",
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
  });

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 64,
    resize: "none",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.16)",
    outline: "none",
    fontSize: 13,
    boxSizing: "border-box",
    lineHeight: 1.6,
  };

  return (
    <main style={pageStyle} dir={isAr ? "rtl" : "ltr"}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={cardStyle}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#92400e" }}>
            {t.title} ⛺
          </h1>
          <p style={{ margin: "8px 0 12px", fontSize: 12.5, color: "#666", lineHeight: 1.7 }}>
            {t.hint}
          </p>

          <div style={{ display: "grid", gap: 12 }}>
            {/* المدينة */}
            <div>
              <label style={labelStyle}>{t.city}</label>
              <div style={selectWrap}>
                <select
                  value={city}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCity(v);
                    try {
                      window.localStorage.setItem("lk_city", v);
                    } catch {
                      // ignore
                    }
                  }}
                  style={selectStyle}
                >
                  <option value="" disabled>
                    {t.cityPh}
                  </option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <span style={caretStyle}>▾</span>
              </div>
            </div>

            {/* نوع الخدمة */}
            <div>
              <label style={labelStyle}>{t.service}</label>
              <div style={selectWrap}>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  style={selectStyle}
                >
                  <option value="" disabled>
                    {t.servicePh}
                  </option>
                  {services.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <span style={caretStyle}>▾</span>
              </div>
            </div>

            {/* صف قصير: نوع الحضور + عدد الأشخاص */}
            <div style={row2}>
              <div>
                <label style={labelStyle}>{t.group}</label>
                <div style={selectWrap}>
                  <select value={group} onChange={(e) => setGroup(e.target.value)} style={selectStyle}>
                    <option value="" disabled>
                      {t.groupPh}
                    </option>
                    {groups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  <span style={caretStyle}>▾</span>
                </div>
              </div>

              <div>
                <label style={labelStyle}>{t.people}</label>
                <div style={selectWrap}>
                  <select
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="" disabled>
                      {t.peoplePh}
                    </option>
                    {people.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <span style={caretStyle}>▾</span>
                </div>
              </div>
            </div>

            {/* الطبخ (Toggle) */}
            <div>
              <label style={labelStyle}>{t.cooking}</label>
              <div style={toggleWrap}>
                <button
                  type="button"
                  style={toggleBtn(cooking === "yes")}
                  onClick={() => setCooking("yes")}
                >
                  {t.cookYes}
                </button>
                <button
                  type="button"
                  style={toggleBtn(cooking === "no")}
                  onClick={() => setCooking("no")}
                >
                  {t.cookNo}
                </button>
              </div>
            </div>

            {/* التجهيزات (Chips صغيرة) */}
            <div>
              <label style={labelStyle}>{t.equip}</label>
              <div style={chipRow}>
                <button
                  type="button"
                  style={chipStyle(equipBayt)}
                  onClick={() => toggleChip(equipBayt, setEquipBayt)}
                >
                  {isAr ? "بيت شعر" : "Bayt Shaar"}
                </button>
                <button
                  type="button"
                  style={chipStyle(equipTent1)}
                  onClick={() => toggleChip(equipTent1, setEquipTent1)}
                >
                  {isAr ? "خيمة" : "Tent"}
                </button>
                <button
                  type="button"
                  style={chipStyle(equipTent2)}
                  onClick={() => toggleChip(equipTent2, setEquipTent2)}
                >
                  {isAr ? "خيمتين" : "Two Tents"}
                </button>
              </div>
            </div>

            {/* الموقع (يظهر فقط إذا كانت كشته) */}
            {isOutdoor ? (
              <div>
                <label style={labelStyle}>{t.location}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={locationUrl}
                    onChange={(e) => setLocationUrl(e.target.value)}
                    placeholder={t.locationPh}
                    style={{ ...selectStyle, paddingRight: isAr ? 12 : 110, paddingLeft: isAr ? 110 : 12 }}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={handleJoyfulGetLocation}
                    disabled={gettingLoc}
                    style={{
                      position: "absolute",
                      top: 5,
                      bottom: 5,
                      ...(isAr ? { left: 5 } : { right: 5 }),
                      padding: "0 10px",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                      background: "#f9fafb",
                      color: "#111",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: gettingLoc ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    {gettingLoc ? (isAr ? "..." : "...") : (isAr ? "موقعي الحالي" : "My Location")}
                    {!gettingLoc && <span style={{fontSize: 14}}>📍</span>}
                  </button>
                </div>
              </div>
            ) : service ? (
              <div style={{ padding: "10px 12px", background: "rgba(0,0,0,0.04)", borderRadius: 12 }}>
                <label style={{ ...labelStyle, marginBottom: 4 }}>{isAr ? "الموقع" : "Location"}</label>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>{t.locProvider}</div>
              </div>
            ) : null}

            {/* ملاحظات صغيرة */}
            <div>
              <label style={labelStyle}>{t.notes}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={textareaStyle}
                placeholder={isAr ? "اختياري" : "Optional"}
                maxLength={180}
              />
            </div>

            {error ? (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(180, 0, 0, 0.25)",
                  background: "rgba(180, 0, 0, 0.06)",
                  color: "#7a0000",
                  fontSize: 12.5,
                  fontWeight: 900,
                }}
              >
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={goNext}
              style={{
                height: 48, // Slightly taller
                borderRadius: 12,
                border: "1px solid #92400e",
                background: "#92400e",
                color: "#fff",
                fontWeight: 900,
                fontSize: 14,
                cursor: "pointer",
                marginTop: 8,
                boxShadow: "0 4px 12px rgba(146, 64, 14, 0.2)", // Subtle glow
              }}
            >
              {t.next}
            </button>

            <button
              type="button"
              onClick={() => window.history.back()}
              style={{
                height: 40,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.2)",
                background: "#fff",
                color: "#111",
                fontWeight: 900,
                fontSize: 13,
              }}
            >
              {t.back}
            </button>
          </div>

          <style
            dangerouslySetInnerHTML={{
              __html: `
                @media (min-width: 720px) {
                  /* على الشاشات الأكبر نخلي نوع الحضور وعدد الأشخاص جنب بعض */
                }
              `,
            }}
          />
        </div>
      </div>
    </main>
  );
}
