"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type Locale = "ar" | "en";

export default function AdminLoginClient(props: { locale: Locale; next: string }) {
  const router = useRouter();
  const locale: Locale = props.locale === "en" ? "en" : "ar";
  const isAr = locale === "ar";

  const t = {
    title: isAr ? "تسجيل دخول الإدارة" : "Admin Login",
    username: isAr ? "اسم المستخدم" : "Username",
    password: isAr ? "كلمة المرور" : "Password",
    login: isAr ? "تسجيل الدخول" : "Login",
    loading: isAr ? "جاري الدخول..." : "Signing in...",
    hint: isAr ? "أدخل اسم المستخدم وكلمة المرور." : "Enter username and password.",
    errRequired: isAr ? "الرجاء تعبئة الحقول." : "Please fill all fields.",
    errInvalid: isAr ? "بيانات الدخول غير صحيحة." : "Invalid credentials.",
    errServer: isAr ? "حدث خطأ. حاول مرة أخرى." : "Something went wrong. Try again.",
    lockedTitle: isAr ? "تم إيقاف الدخول مؤقتًا" : "Login temporarily locked",
    lockedLeft: isAr ? "الوقت المتبقي:" : "Time remaining:",
    lockedTryLater: isAr ? "حاول لاحقًا." : "Please try again later.",
  };

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [msg, setMsg] = React.useState<string>("");
  const [lockedUntilMs, setLockedUntilMs] = React.useState<number>(0);
  const [nowTick, setNowTick] = React.useState<number>(() => Date.now());

  const isLocked = lockedUntilMs > Date.now();

  React.useEffect(() => {
    if (!isLocked) return;

    const id = window.setInterval(() => setNowTick(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [isLocked]);

  React.useEffect(() => {
    // إذا انتهى القفل، نظّف الرسالة الخاصة بالقفل فقط
    if (lockedUntilMs && lockedUntilMs <= Date.now()) {
      setLockedUntilMs(0);
    }
  }, [lockedUntilMs, nowTick]);

  function formatRemaining(ms: number) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    if (isAr) return `${m} دقيقة ${s} ثانية`;
    return `${m}m ${s}s`;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // لو مقفول: لا ترسل أي طلب (نهائيًا)
    if (isLocked) {
      const remain = lockedUntilMs - Date.now();
      setMsg(
        `${t.lockedTitle} — ${t.lockedLeft} ${formatRemaining(remain)}. ${t.lockedTryLater}`
      );
      return;
    }

    setMsg("");

    const u = username.trim();
    const p = password.trim();

    if (!u || !p) {
      setMsg(t.errRequired);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
        cache: "no-store",
      });

      const json = await res.json().catch(() => null);

      // ✅ قفل (429)
      if (res.status === 429 && json?.error === "locked") {
        const retryAfterSec = Number(json?.retryAfterSec || 0);
        const until = Date.now() + Math.max(1, retryAfterSec) * 1000;

        setLockedUntilMs(until);

        const remainText = formatRemaining(until - Date.now());
        const serverMsg =
          typeof json?.message === "string" && json.message.trim().length > 0
            ? json.message.trim()
            : t.lockedTitle;

        setMsg(`${serverMsg} — ${t.lockedLeft} ${remainText}.`);
        setLoading(false);
        return;
      }

      // ❌ فشل دخول عادي
      if (!res.ok || !json?.ok) {
        if (res.status === 401) {
          setMsg(t.errInvalid);
        } else {
          setMsg(String(json?.error || t.errServer));
        }
        setLoading(false);
        return;
      }

      // ✅ نجاح: نظّف القفل (إن كان موجود)
      setLockedUntilMs(0);

      // ✅ نجاح: روح للصفحة المطلوبة
      router.replace(props.next || `/${locale}/admin/requests`);
      router.refresh();
    } catch {
      setMsg(t.errServer);
      setLoading(false);
    }
  }

  // تحديث رسالة العدّاد تلقائيًا أثناء القفل (بدون إرسال طلبات)
  React.useEffect(() => {
    if (!isLocked) return;

    const remain = lockedUntilMs - Date.now();
    setMsg(`${t.lockedTitle} — ${t.lockedLeft} ${formatRemaining(remain)}.`);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowTick]);

  return (
    <main
      dir={isAr ? "rtl" : "ltr"}
      style={{
        minHeight: "calc(100vh - 70px)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "rgba(255,255,255,0.85)",
          border: "1px solid #e7e7e7",
          borderRadius: 16,
          boxShadow: "0 10px 26px rgba(0,0,0,0.06)",
          padding: 18,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, textAlign: "center" }}>
          {t.title}
        </h1>
        <p style={{ margin: "10px 0 14px", textAlign: "center", color: "#555", fontSize: 14 }}>
          {t.hint}
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
          <label style={labelStyle}>
            <span style={labelText}>{t.username}</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.username}
              autoComplete="username"
              inputMode="text"
              style={inputStyle}
              disabled={loading || isLocked}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelText}>{t.password}</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.password}
              type="password"
              autoComplete="current-password"
              style={inputStyle}
              disabled={loading || isLocked}
            />
          </label>

          {msg ? (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(176,0,0,0.20)",
                background: "rgba(176,0,0,0.06)",
                color: "#b00",
                fontWeight: 900,
                fontSize: 13,
                textAlign: "center",
                lineHeight: 1.6,
              }}
            >
              {msg}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || isLocked}
            style={{
              marginTop: 4,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              fontWeight: 900,
              cursor: loading || isLocked ? "not-allowed" : "pointer",
              opacity: loading || isLocked ? 0.75 : 1,
            }}
          >
            {loading ? t.loading : isLocked ? (isAr ? "مقفل مؤقتًا" : "Locked") : t.login}
          </button>
        </form>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const labelText: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 13,
  color: "#111",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ccc",
  outline: "none",
  fontSize: 14,
  background: "#fff",
};
