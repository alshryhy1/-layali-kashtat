"use client";

import { useMemo, useState } from "react";

export default function AdminLoginClient({
  locale,
  next,
}: {
  locale: string;
  next: string;
}) {
  const isAr = locale === "ar";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const labels = useMemo(
    () => ({
      title: isAr ? "تسجيل دخول الإدارة" : "Admin Login",
      pass: isAr ? "كلمة المرور" : "Password",
      btn: isAr ? "دخول" : "Sign in",
      bad: isAr ? "كلمة المرور غير صحيحة" : "Wrong password",
    }),
    [isAr]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) {
        setErr(j?.error || labels.bad);
        setLoading(false);
        return;
      }

      window.location.href = next;
    } catch {
      setErr("Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 420,
        margin: "40px auto",
        direction: isAr ? "rtl" : "ltr",
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ marginBottom: 12 }}>{labels.title}</h1>

      <form
        onSubmit={onSubmit}
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 14,
        }}
      >
        <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
          {labels.pass}
        </label>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 10,
            border: "1px solid #ddd",
            marginBottom: 10,
          }}
          placeholder={labels.pass}
        />

        {err ? <div style={{ marginBottom: 10, color: "#a11" }}>{err}</div> : null}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          {loading ? "..." : labels.btn}
        </button>
      </form>
    </div>
  );
}
