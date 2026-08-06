"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { localeHref, type Locale } from "@/lib/locales";
import { resetPasswordWithEmailOtp } from "@/lib/auth/otp";

const PENDING_RESET_OTP_STORAGE_KEY = "layali_pending_reset_password_otp";

function normalizeDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/\D/g, "");
}

export default function ResetPasswordClient({ locale }: { locale: Locale }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const initialMode = searchParams.get("mode") || "";

  const [otpEmail, setOtpEmail] = React.useState(initialEmail);
  const [otpMode, setOtpMode] = React.useState(initialMode);
  const isOtpMode = otpMode === "otp" && !!otpEmail;

  const [ready, setReady] = React.useState(isOtpMode);
  const [busy, setBusy] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(
    isOtpMode ? "أدخل رمز الاستعادة وكلمة المرور الجديدة" : null
  );

  React.useEffect(() => {
    if (isOtpMode) {
      setReady(true);
      setNotice("أدخل رمز الاستعادة وكلمة المرور الجديدة");
      return;
    }
    try {
      const raw = localStorage.getItem(PENDING_RESET_OTP_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { email?: string; createdAt?: number };
      const fresh = Date.now() - Number(parsed.createdAt || 0) <= 10 * 60 * 1000;
      if (fresh && parsed.email) {
        setOtpEmail(parsed.email);
        setOtpMode("otp");
        setReady(true);
        setNotice("أدخل رمز الاستعادة وكلمة المرور الجديدة");
      } else {
        localStorage.removeItem(PENDING_RESET_OTP_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [isOtpMode]);

  const canSubmit = isOtpMode
    ? otpCode.length === 4 && newPassword.length >= 6 && newPassword === confirmPassword && !busy
    : newPassword.length >= 6 && newPassword === confirmPassword && !busy && ready;

  const onUpdatePassword = async () => {
    setError(null);
    setNotice(null);
    if (isOtpMode && otpCode.length !== 4) {
      setError("رمز الاستعادة يجب أن يكون 4 أرقام");
      return;
    }
    if (newPassword.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("كلمة المرور وتأكيدها غير متطابقين");
      return;
    }
    setBusy(true);
    try {
      if (isOtpMode) {
        const res = await resetPasswordWithEmailOtp({
          email: otpEmail,
          otp: otpCode,
          password: newPassword,
        });
        if (!res.ok) throw new Error(res.reason || "reset_failed");
      } else {
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        if (updateError) throw updateError;
      }
      localStorage.removeItem(PENDING_RESET_OTP_STORAGE_KEY);
      await supabase.auth.signOut();
      window.alert("تم تغيير كلمة المرور بنجاح");
      router.replace(localeHref(locale, "/account?view=login"));
    } catch (e: any) {
      setError(String(e?.message || "") || "تعذر تغيير كلمة المرور الآن. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: 16,
    border: "1px solid #E8D5B7",
    background: "#FFFDF8",
    color: "#173B5B",
    fontSize: 16,
    fontWeight: 800,
    textAlign: "right",
    padding: "13px 14px",
    marginBottom: 12,
    boxSizing: "border-box",
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "70vh",
        background: "#EFE3D2",
        borderRadius: 20,
        padding: 20,
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      <h1 style={{ color: "#173B5B", fontSize: 25, fontWeight: 900 }}>تعيين كلمة مرور جديدة</h1>
      <p style={{ color: "#6B5A45", fontSize: 14, fontWeight: 700, lineHeight: 1.6 }}>
        {isOtpMode
          ? "أدخل رمز الاستعادة المرسل إلى بريدك ثم اختر كلمة مرور جديدة"
          : "أدخل كلمة مرور جديدة لحسابك في ليالي كشتات"}
      </p>
      <div
        style={{
          background: "#FFF8E7",
          borderRadius: 24,
          padding: 18,
          border: "1px solid rgba(200, 149, 77, 0.32)",
          marginTop: 18,
        }}
      >
        {isOtpMode ? (
          <div
            style={{
              color: "#173B5B",
              fontSize: 14,
              fontWeight: 900,
              textAlign: "right",
              background: "#F2E5D3",
              borderRadius: 14,
              padding: "10px 12px",
              marginBottom: 12,
            }}
          >
            {otpEmail}
          </div>
        ) : null}
        {notice ? (
          <p style={{ color: "#173B5B", fontWeight: 800, textAlign: "right" }}>{notice}</p>
        ) : null}
        {error ? (
          <p style={{ color: "#9A3B2F", fontWeight: 800, textAlign: "right" }}>{error}</p>
        ) : null}
        {isOtpMode ? (
          <input
            style={inputStyle}
            placeholder="رمز الاستعادة"
            value={otpCode}
            onChange={(e) => setOtpCode(normalizeDigits(e.target.value).slice(0, 4))}
            disabled={!ready || busy}
            maxLength={4}
            inputMode="numeric"
            autoComplete="one-time-code"
          />
        ) : null}
        <input
          style={inputStyle}
          placeholder="كلمة المرور الجديدة"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={!ready || busy}
        />
        <input
          style={inputStyle}
          placeholder="تأكيد كلمة المرور"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={!ready || busy}
        />
        <button
          type="button"
          onClick={onUpdatePassword}
          disabled={!canSubmit}
          style={{
            width: "100%",
            borderRadius: 18,
            background: "#173B5B",
            color: "#FFF8E7",
            fontSize: 16,
            fontWeight: 900,
            padding: "15px 0",
            border: "none",
            cursor: canSubmit ? "pointer" : "default",
            opacity: canSubmit ? 1 : 0.55,
          }}
        >
          {busy ? "جاري الحفظ..." : "تغيير كلمة المرور"}
        </button>
      </div>
    </div>
  );
}
