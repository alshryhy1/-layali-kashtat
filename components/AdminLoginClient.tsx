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

    if (isLocked) {
      const remain = lockedUntilMs - Date.now();
      setMsg(`${t.lockedTitle} — ${t.lockedLeft} ${formatRemaining(remain)}. ${t.lockedTryLater}`);
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

      if (!res.ok || !json?.ok) {
        if (res.status === 401) {
          setMsg(t.errInvalid);
        } else {
          setMsg(String(json?.error || t.errServer));
        }
        setLoading(false);
        return;
      }

      setLockedUntilMs(0);

      // Redirect to the portal by default unless 'next' is explicitly set
      const dest = props.next && props.next.length > 3 ? props.next : `/${locale}/admin/portal`;
      router.replace(dest);
      router.refresh();
    } catch {
      setMsg(t.errServer);
      setLoading(false);
    }
  }

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
        padding: 12,
      }}
    >
      <div className="lk-admin-login-card">
        <h1 className="lk-admin-login-title">{t.title}</h1>
        <p className="lk-admin-login-hint">{t.hint}</p>

        <form onSubmit={onSubmit} className="lk-admin-login-form">
          <label className="lk-admin-login-label">
            <span className="lk-admin-login-labelText">{t.username}</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.username}
              autoComplete="username"
              inputMode="text"
              className="lk-admin-login-input"
              disabled={loading || isLocked}
            />
          </label>

          <label className="lk-admin-login-label">
            <span className="lk-admin-login-labelText">{t.password}</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.password}
              type="password"
              autoComplete="current-password"
              className="lk-admin-login-input"
              disabled={loading || isLocked}
            />
          </label>

          {msg ? (
            <div
              className={`lk-admin-login-msg ${isLocked ? "locked" : "bad"}`}
              role="status"
              aria-live="polite"
            >
              {msg}
            </div>
          ) : null}

          <button type="submit" disabled={loading || isLocked} className="lk-admin-login-btn">
            {loading ? t.loading : isLocked ? (isAr ? "مقفل مؤقتًا" : "Locked") : t.login}
          </button>
        </form>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          :root{
            --lk-card-r: 18px;
            --lk-in-r: 14px;
            --lk-h: 44px;
            --lk-b: rgba(0,0,0,0.14);
            --lk-bf: rgba(0,0,0,0.38);
            --lk-bg: rgba(255,255,255,0.92);
          }

          .lk-admin-login-card{
            width:100%;
            max-width: 380px;
            background: var(--lk-bg);
            border: 1px solid rgba(0,0,0,0.08);
            border-radius: var(--lk-card-r);
            box-shadow: 0 12px 28px rgba(0,0,0,0.08);
            padding: 14px;
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
          }

          .lk-admin-login-title{
            margin:0;
            font-size: 20px;
            font-weight: 900;
            text-align:center;
            line-height: 1.25;
          }

          .lk-admin-login-hint{
            margin: 8px 0 14px;
            text-align:center;
            color:#555;
            font-size: 12.5px;
            line-height: 1.7;
            opacity: .88;
          }

          .lk-admin-login-form{
            display:grid;
            gap: 10px;
          }

          .lk-admin-login-label{
            display:grid;
            gap: 6px;
          }

          .lk-admin-login-labelText{
            font-weight: 900;
            font-size: 12px;
            color:#111;
            opacity: .92;
          }

          .lk-admin-login-input{
            width:100%;
            height: var(--lk-h);
            padding: 0 12px;
            border-radius: var(--lk-in-r);
            border: 1px solid var(--lk-b);
            outline: none;
            font-size: 14px;
            background:#fff;
            line-height: var(--lk-h);
            box-sizing: border-box;
          }

          .lk-admin-login-input::placeholder{
            opacity: .55;
          }

          .lk-admin-login-input:focus{
            border-color: var(--lk-bf);
          }

          .lk-admin-login-msg{
            padding: 10px 12px;
            border-radius: 14px;
            border: 1px solid rgba(176,0,0,0.18);
            background: rgba(176,0,0,0.06);
            color: #b00;
            font-weight: 900;
            font-size: 12.5px;
            text-align: center;
            line-height: 1.7;
          }

          .lk-admin-login-msg.locked{
            border-color: rgba(0,0,0,0.14);
            background: rgba(0,0,0,0.04);
            color: #111;
          }

          .lk-admin-login-btn{
            margin-top: 2px;
            height: 46px;
            border-radius: 14px;
            border: 1px solid #111;
            background: #111;
            color:#fff;
            font-weight: 900;
            cursor: pointer;
            opacity: 1;
            font-size: 13.5px;
          }

          .lk-admin-login-btn:disabled{
            opacity: .75;
            cursor: not-allowed;
          }

          @media (min-width: 768px){
            .lk-admin-login-card{
              max-width: 460px;
              padding: 18px;
            }
            .lk-admin-login-title{
              font-size: 26px;
            }
            .lk-admin-login-hint{
              font-size: 14px;
              margin: 10px 0 14px;
            }
          }
        `,
        }}
      />
    </main>
  );
}
