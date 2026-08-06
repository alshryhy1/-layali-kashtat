"use client";

import * as React from "react";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { localeHref, type Locale } from "@/lib/locales";
import {
  fetchVerificationStatus,
  isFullyVerified,
  mapToUserMessage,
  requestEmailOtp,
  requestPasswordResetOtp,
  sanitizeOptionalPhone,
  verifyEmailOtp,
  verifySignupEmailOtp,
  VERIFICATION_STATUS_TIMEOUT,
  type VerificationStatus,
} from "@/lib/auth/otp";

const FORGOT_PASSWORD_COOLDOWN_SECONDS = 60;
const PENDING_SIGNUP_OTP_STORAGE_KEY = "layali_pending_signup_email_otp";
const PENDING_ACCOUNT_VERIFY_OTP_STORAGE_KEY = "layali_pending_account_verify_email_otp";
const PENDING_RESET_OTP_STORAGE_KEY = "layali_pending_reset_password_otp";
const PENDING_OTP_TTL_MS = 10 * 60 * 1000;
const VERIFICATION_UI_WATCHDOG_MS = 14_000;

type StoredPendingSignupOtp = {
  name: string;
  phone: string;
  email: string;
  password: string;
  createdAt: number;
};

type StoredPendingAccountVerifyOtp = {
  email: string;
  phone: string;
  createdAt: number;
};

function normalizeArabicNumberInput(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

/** Log Auth errors to the browser Console only — never render technical details in the UI. */
function logAuthError(context: string, err: unknown) {
  const e = err as Record<string, unknown> | null;
  console.error(`[auth:${context}]`, {
    code: e?.code ?? null,
    message: e?.message ?? null,
    status: e?.status ?? null,
    name: e?.name ?? null,
    details: e && typeof e === "object" ? { ...e } : err,
  });
}

function normalizeRemoteUri(value: unknown) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/^[`'"]+/, "").replace(/[`'"]+$/, "").trim();
  if (!cleaned) return null;
  if (cleaned.startsWith("http://")) return `https://${cleaned.slice("http://".length)}`;
  if (cleaned.startsWith("https://")) return cleaned;
  return null;
}

const C = {
  bg: "#EFE3D2",
  navy: "#173B5B",
  cream: "#F7EFE5",
  cardBorder: "#D5C7B7",
  sectionBorder: "#F0E2D1",
  inputBg: "#FFF8EC",
  inputBorder: "#B9853D",
  inputText: "#1F160D",
  muted: "#4B5563",
  muted2: "#6B7280",
  error: "#B42318",
  notice: "#7A4E19",
  supportTitle: "#8A6B3E",
  supportCard: "#FFF8E7",
  switcherBg: "#E8D7C3",
  gold: "rgba(200, 149, 77, 0.9)",
  green: "#16A34A",
  userSub: "#1F2A37",
  avatarBg: "#F2E3D1",
  infoBorder: "#E6D6C4",
};

function IconPerson({ size = 18, color = "#173B5B" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconCalendar({ size = 18, color = "#173B5B" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function IconBriefcase({ size = 18, color = "#173B5B" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}
function IconBell({ size = 18, color = "#173B5B" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function IconChat({ size = 18, color = "#173B5B" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 21l2.1-5.1A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}
function IconWarning({ size = 18, color = "#B42318" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}
function IconBack({ size = 22, color = "#173B5B" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
function IconImageEmpty({ size = 20, color = "#A89886" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

export default function AccountClient({
  locale,
  initialView,
}: {
  locale: Locale;
  initialView?: "menu" | "profile" | "bookings" | "services" | "notifications" | "signup" | "login";
}) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"signup" | "login">(
    initialView === "login" ? "login" : "signup"
  );
  const [name, setName] = React.useState("");
  const [signupPhone, setSignupPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [verificationStatus, setVerificationStatus] = React.useState<VerificationStatus | null>(null);
  const [verificationCheckError, setVerificationCheckError] = React.useState<string | null>(null);
  const [verificationRetryKey, setVerificationRetryKey] = React.useState(0);
  const [verifyPhase, setVerifyPhase] = React.useState<"idle" | "emailSent">("idle");
  const [emailOtpCode, setEmailOtpCode] = React.useState("");
  const [verifyPhoneInput, setVerifyPhoneInput] = React.useState("");
  const [verifyEmailInput, setVerifyEmailInput] = React.useState("");
  const [pendingSignup, setPendingSignup] = React.useState<{
    name: string;
    phone: string;
    email: string;
    password: string;
  } | null>(null);
  const [verifyBusy, setVerifyBusy] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);
  const [verifyNotice, setVerifyNotice] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [authBooting, setAuthBooting] = React.useState(true);
  const [otpFlowHydrated, setOtpFlowHydrated] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [forgotPasswordBusy, setForgotPasswordBusy] = React.useState(false);
  const [forgotPasswordCooldown, setForgotPasswordCooldown] = React.useState(0);
  const [signedView, setSignedView] = React.useState<
    "menu" | "profile" | "bookings" | "services" | "notifications"
  >(
    initialView === "profile" ||
      initialView === "bookings" ||
      initialView === "services" ||
      initialView === "notifications"
      ? initialView
      : "menu"
  );

  const [profileName, setProfileName] = React.useState<string | null>(null);
  const [profilePhone, setProfilePhone] = React.useState<string | null>(null);
  const [profilePhoneVerified, setProfilePhoneVerified] = React.useState<boolean | null>(null);
  const [profileImageUrl, setProfileImageUrl] = React.useState<string | null>(null);
  const [profileSaving, setProfileSaving] = React.useState(false);

  const [bookingsLoading, setBookingsLoading] = React.useState(false);
  const [bookings, setBookings] = React.useState<
    Array<{
      id: string;
      status: string | null;
      created_at: string | null;
      provider_service_id: string | null;
      scheduled_at: string | null;
      end_at: string | null;
    }>
  >([]);
  const [bookingMetaById, setBookingMetaById] = React.useState<
    Record<
      string,
      {
        serviceTitle?: string;
        serviceTypeName?: string;
        cityName?: string;
        providerName?: string;
        providerImageUrl?: string;
      }
    >
  >({});

  const [servicesLoading, setServicesLoading] = React.useState(false);
  const [services, setServices] = React.useState<
    Array<{
      id: string;
      title: string | null;
      is_active?: boolean | null;
      starting_price?: number | null;
      base_price?: number | null;
      currency?: string | null;
    }>
  >([]);
  const [serviceMetaById, setServiceMetaById] = React.useState<
    Record<string, { serviceTypeName?: string; cityName?: string; coverImageUrl?: string | null }>
  >({});

  const [messagesNotificationsEnabled, setMessagesNotificationsEnabled] = React.useState(true);
  const [bookingsNotificationsEnabled, setBookingsNotificationsEnabled] = React.useState(true);
  const [trackingNotificationsEnabled, setTrackingNotificationsEnabled] = React.useState(true);
  const [harajNotificationsEnabled, setHarajNotificationsEnabled] = React.useState(true);
  const [harajNewItemsNotificationsEnabled, setHarajNewItemsNotificationsEnabled] =
    React.useState(false);
  const [galleryNotificationsEnabled, setGalleryNotificationsEnabled] = React.useState(true);
  const [notificationsLoading, setNotificationsLoading] = React.useState(false);
  const [parityBlocked, setParityBlocked] = React.useState<string | null>(null);

  const pendingSignupRef = React.useRef(pendingSignup);
  const verifyPhaseRef = React.useRef(verifyPhase);
  React.useEffect(() => {
    pendingSignupRef.current = pendingSignup;
    verifyPhaseRef.current = verifyPhase;
  }, [pendingSignup, verifyPhase]);

  const isSignedIn = !!session?.user;
  const userId = session?.user?.id ?? null;

  React.useEffect(() => {
    if (forgotPasswordCooldown <= 0) return;
    const timer = setInterval(() => {
      setForgotPasswordCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [forgotPasswordCooldown]);

  React.useEffect(() => {
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!alive) return;
        setSession(data.session ?? null);
      })
      .catch(() => {
        if (!alive) return;
        setSession(null);
      })
      .finally(() => {
        if (!alive) return;
        setAuthBooting(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setAuthBooting(false);
      setSession(nextSession);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    const restorePendingOtpState = async () => {
      try {
        const rawSignup = localStorage.getItem(PENDING_SIGNUP_OTP_STORAGE_KEY);
        if (rawSignup) {
          const parsed = JSON.parse(rawSignup) as StoredPendingSignupOtp;
          const fresh = Date.now() - Number(parsed.createdAt || 0) <= PENDING_OTP_TTL_MS;
          if (fresh && parsed.email && parsed.password && mounted) {
            const nextPendingSignup = {
              name: String(parsed.name || ""),
              phone: sanitizeOptionalPhone(String(parsed.phone || "")),
              email: String(parsed.email || ""),
              password: String(parsed.password || ""),
            };
            setMode("signup");
            setPendingSignup(nextPendingSignup);
            setEmail(nextPendingSignup.email);
            setSignupPhone(nextPendingSignup.phone);
            setName(nextPendingSignup.name);
            setPassword(nextPendingSignup.password);
            setConfirmPassword(nextPendingSignup.password);
            setVerifyPhoneInput(nextPendingSignup.phone);
            setVerifyEmailInput(nextPendingSignup.email);
            setEmailOtpCode("");
            setVerifyError(null);
            setVerifyNotice("أدخل رمز التحقق المرسل إلى بريدك الإلكتروني");
            setNotice(null);
            setError(null);
            setVerifyPhase("emailSent");
          } else {
            localStorage.removeItem(PENDING_SIGNUP_OTP_STORAGE_KEY);
          }
        } else {
          const rawAccountVerify = localStorage.getItem(PENDING_ACCOUNT_VERIFY_OTP_STORAGE_KEY);
          if (rawAccountVerify) {
            const parsed = JSON.parse(rawAccountVerify) as StoredPendingAccountVerifyOtp;
            const fresh = Date.now() - Number(parsed.createdAt || 0) <= PENDING_OTP_TTL_MS;
            if (fresh && parsed.email && mounted) {
              setVerifyPhoneInput(sanitizeOptionalPhone(String(parsed.phone || "")));
              setVerifyEmailInput(String(parsed.email || ""));
              setVerifyPhase("emailSent");
              setVerifyError(null);
              setVerifyNotice("أدخل رمز التحقق المرسل إلى بريدك الإلكتروني");
            } else {
              localStorage.removeItem(PENDING_ACCOUNT_VERIFY_OTP_STORAGE_KEY);
            }
          }
        }

        const rawReset = localStorage.getItem(PENDING_RESET_OTP_STORAGE_KEY);
        if (rawReset) {
          const parsed = JSON.parse(rawReset) as { email?: string; createdAt?: number };
          const fresh = Date.now() - Number(parsed.createdAt || 0) <= PENDING_OTP_TTL_MS;
          if (fresh && parsed.email && mounted) {
            router.replace(
              localeHref(locale, `/account/reset-password?mode=otp&email=${encodeURIComponent(parsed.email)}`)
            );
          } else {
            localStorage.removeItem(PENDING_RESET_OTP_STORAGE_KEY);
          }
        }
      } catch {
        // ignore restore errors
      } finally {
        if (mounted) setOtpFlowHydrated(true);
      }
    };
    void restorePendingOtpState();
    return () => {
      mounted = false;
    };
  }, [locale, router]);

  React.useEffect(() => {
    if (!isSignedIn || !userId) {
      setVerificationStatus(null);
      setVerificationCheckError(null);
      return;
    }
    let alive = true;
    setVerificationStatus(null);
    setVerificationCheckError(null);
    void fetchVerificationStatus(userId)
      .then((status) => {
        if (!alive) return;
        setVerificationStatus(status);
        setVerificationCheckError(null);
      })
      .catch((e) => {
        if (!alive) return;
        const timedOut = (e as Error)?.message === VERIFICATION_STATUS_TIMEOUT;
        setVerificationCheckError(
          timedOut
            ? "استغرق التحقق من الحساب وقتًا أطول من المتوقع. تحقق من الاتصال وحاول مرة أخرى."
            : "تعذر التحقق من حالة الحساب. حاول مرة أخرى."
        );
      });
    return () => {
      alive = false;
    };
  }, [isSignedIn, userId, verificationRetryKey]);

  React.useEffect(() => {
    if (!isSignedIn || !userId || verificationStatus !== null || verificationCheckError) return;
    const timer = setTimeout(() => {
      setVerificationCheckError(
        "استغرق التحقق من الحساب وقتًا أطول من المتوقع. تحقق من الاتصال وحاول مرة أخرى."
      );
    }, VERIFICATION_UI_WATCHDOG_MS);
    return () => clearTimeout(timer);
  }, [isSignedIn, userId, verificationStatus, verificationCheckError, verificationRetryKey]);

  React.useEffect(() => {
    if (!isSignedIn || !userId) return;
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("name, phone, phone_verified")
          .eq("id", userId)
          .maybeSingle();
        if (!alive) return;
        setProfileName((data as any)?.name ?? null);
        setProfilePhone((data as any)?.phone ?? null);
        setProfilePhoneVerified(
          typeof (data as any)?.phone_verified === "boolean" ? (data as any).phone_verified : null
        );
      } catch {
        // ignore
      }
      try {
        const imageRes = await supabase
          .from("profile_images")
          .select("image_url")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!alive) return;
        setProfileImageUrl(normalizeRemoteUri((imageRes.data as any)?.image_url));
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [isSignedIn, userId]);

  const resetMessages = () => {
    setError(null);
    setNotice(null);
  };

  const resetLocalUserState = () => {
    setSession(null);
    setName("");
    setSignupPhone("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setMode("login");
    setSignedView("menu");
    setProfileName(null);
    setProfilePhone(null);
    setProfilePhoneVerified(null);
    setProfileImageUrl(null);
    setBookings([]);
    setServices([]);
    setServiceMetaById({});
    setBookingMetaById({});
    setVerificationStatus(null);
    setVerificationCheckError(null);
    setVerifyPhase("idle");
    localStorage.removeItem(PENDING_ACCOUNT_VERIFY_OTP_STORAGE_KEY);
    setEmailOtpCode("");
    setVerifyPhoneInput("");
    setVerifyEmailInput("");
    setVerifyBusy(false);
    setVerifyError(null);
    setVerifyNotice(null);
    setParityBlocked(null);
  };

  const cancelPendingSignupVerification = () => {
    setPendingSignup(null);
    localStorage.removeItem(PENDING_SIGNUP_OTP_STORAGE_KEY);
    localStorage.removeItem(PENDING_ACCOUNT_VERIFY_OTP_STORAGE_KEY);
    setVerifyPhase("idle");
    setEmailOtpCode("");
    setVerifyError(null);
    setVerifyNotice(null);
    setNotice(null);
    setError(null);
    setMode("signup");
  };

  const runSmartVerification = async () => {
    setVerifyError(null);
    setVerifyNotice(null);
    const phone = sanitizeOptionalPhone(verifyPhoneInput);
    const emailVal =
      verifyEmailInput.trim() || (session?.user?.email ?? "").trim() || email.trim();
    if (!emailVal) {
      setVerifyError("أدخل البريد الإلكتروني");
      return;
    }
    setVerifyBusy(true);
    try {
      const res = await requestEmailOtp(emailVal, phone || undefined);
      if (!res.ok) {
        setVerifyError(mapToUserMessage(res));
        return;
      }
      if (!verifyEmailInput.trim()) setVerifyEmailInput(emailVal);
      setVerifyPhase("emailSent");
      setEmailOtpCode("");
      setVerifyNotice("تم إرسال رمز التحقق إلى البريد الإلكتروني");
      if (!pendingSignup) {
        localStorage.setItem(
          PENDING_ACCOUNT_VERIFY_OTP_STORAGE_KEY,
          JSON.stringify({
            email: emailVal,
            phone,
            createdAt: Date.now(),
          } satisfies StoredPendingAccountVerifyOtp)
        );
      }
    } finally {
      setVerifyBusy(false);
    }
  };

  const onVerifyEmailOtp = async () => {
    setVerifyError(null);
    setVerifyNotice(null);
    const emailVal = verifyEmailInput.trim();
    const code = emailOtpCode.replace(/\D/g, "");
    if (!emailVal) {
      setVerifyError("أدخل البريد الإلكتروني");
      return;
    }
    if (code.length !== 4) {
      setVerifyError("رمز الإيميل يجب أن يكون 4 أرقام");
      return;
    }
    setVerifyBusy(true);
    try {
      if (pendingSignup) {
        const phoneForSignup =
          sanitizeOptionalPhone(verifyPhoneInput) || sanitizeOptionalPhone(pendingSignup.phone);
        const res = await verifySignupEmailOtp({
          email: pendingSignup.email,
          otp: code,
          name: pendingSignup.name,
          phone: phoneForSignup || undefined,
          password: pendingSignup.password,
        });
        if (!res.ok) {
          setVerifyError(mapToUserMessage(res));
          return;
        }
        const signInRes = await supabase.auth.signInWithPassword({
          email: pendingSignup.email,
          password: pendingSignup.password,
        });
        if (signInRes.error) {
          logAuthError("signup-verify-signin", signInRes.error);
          const msg = (signInRes.error.message ?? "").toLowerCase();
          const code = String((signInRes.error as { code?: string }).code ?? "").toLowerCase();
          if (
            ["already registered", "already exists", "user_already_exists", "duplicate key"].some(
              (p) => msg.includes(p) || code.includes(p)
            )
          ) {
            setVerifyError("الحساب مسجل مسبقًا");
          } else if (msg.includes("invalid login credentials") || code === "invalid_credentials") {
            setVerifyError("تم إنشاء الحساب لكن تعذر تسجيل الدخول. جرّب تسجيل الدخول يدويًا.");
          } else {
            setVerifyError("تم إنشاء الحساب لكن تعذر تسجيل الدخول الآن. حاول مرة أخرى.");
          }
          return;
        }
        setPendingSignup(null);
        localStorage.removeItem(PENDING_SIGNUP_OTP_STORAGE_KEY);
        setEmailOtpCode("");
        setVerifyPhase("idle");
        setVerificationStatus({
          phoneVerified: false,
          emailVerified: true,
          verificationMethod: "email",
        });
        setSession(signInRes.data.session ?? null);
        setNotice("تم إنشاء الحساب وتفعيل البريد بنجاح");
        return;
      }

      const res = await verifyEmailOtp(emailVal, code);
      if (!res.ok) {
        setVerifyError(mapToUserMessage(res));
        return;
      }
      setEmailOtpCode("");
      setVerifyPhase("idle");
      localStorage.removeItem(PENDING_ACCOUNT_VERIFY_OTP_STORAGE_KEY);
      setVerificationStatus((prev) => ({
        phoneVerified: prev?.phoneVerified === true,
        emailVerified: true,
        verificationMethod: "email",
      }));
    } finally {
      setVerifyBusy(false);
    }
  };

  const onForgotPassword = async () => {
    const mail = email.trim();
    if (forgotPasswordBusy) return;
    if (forgotPasswordCooldown > 0) {
      window.alert(`يمكنك طلب رمز جديد بعد ${forgotPasswordCooldown} ثانية`);
      return;
    }
    if (!mail) {
      window.alert("أدخل البريد الإلكتروني أولاً");
      return;
    }
    try {
      setForgotPasswordBusy(true);
      const res = await requestPasswordResetOtp(mail);
      if (!res.ok) {
        const retryAfter =
          typeof (res as any).retryAfterSeconds === "number" ? (res as any).retryAfterSeconds : 0;
        if (Number.isFinite(retryAfter) && retryAfter > 0) {
          setForgotPasswordCooldown(retryAfter);
          window.alert(`يمكنك طلب رمز جديد بعد ${retryAfter} ثانية`);
          return;
        }
        throw new Error(res.reason || "reset_otp_failed");
      }
      localStorage.setItem(
        PENDING_RESET_OTP_STORAGE_KEY,
        JSON.stringify({ email: mail, createdAt: Date.now() })
      );
      setForgotPasswordCooldown(FORGOT_PASSWORD_COOLDOWN_SECONDS);
      router.push(
        localeHref(locale, `/account/reset-password?mode=otp&email=${encodeURIComponent(mail)}`)
      );
    } catch {
      window.alert("حدث خطأ أثناء طلب رمز استعادة كلمة المرور");
    } finally {
      setForgotPasswordBusy(false);
    }
  };

  const onSubmit = async () => {
    resetMessages();
    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !password) {
        setError("تعذر التنفيذ: أكمل البريد الإلكتروني وكلمة المرور");
        return;
      }
      setLoading(true);
      if (mode === "signup") {
        if (password.length < 6) {
          setError("تعذر إنشاء الحساب: كلمة المرور يجب أن تكون 6 أحرف على الأقل");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("تعذر إنشاء الحساب: كلمة المرور وتأكيدها غير متطابقين");
          setLoading(false);
          return;
        }
        const trimmedName = name.trim();
        const trimmedPhone = sanitizeOptionalPhone(signupPhone);
        const otpRes = await requestEmailOtp(trimmedEmail, trimmedPhone || undefined);
        if (!otpRes.ok) {
          setError(mapToUserMessage(otpRes));
          setLoading(false);
          return;
        }
        const nextPendingSignup = {
          name: trimmedName,
          phone: trimmedPhone,
          email: trimmedEmail,
          password,
        };
        setPendingSignup(nextPendingSignup);
        localStorage.setItem(
          PENDING_SIGNUP_OTP_STORAGE_KEY,
          JSON.stringify({ ...nextPendingSignup, createdAt: Date.now() })
        );
        setVerifyPhoneInput(trimmedPhone);
        setVerifyEmailInput(trimmedEmail);
        setEmailOtpCode("");
        setVerifyPhase("emailSent");
        setVerifyError(null);
        setVerifyNotice("تم إرسال رمز التحقق إلى البريد الإلكتروني");
        setNotice(null);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) throw signInError;
        setNotice("تم تسجيل الدخول بنجاح");
      }
    } catch (e: any) {
      logAuthError(mode === "signup" ? "signup" : "login", e);
      const message = (e?.message ?? "") as string;
      const lower = message.toLowerCase();
      const code = String(e?.code ?? "").toLowerCase();
      const isDuplicate = [
        "already registered",
        "already exists",
        "user_already_exists",
        "duplicate key",
        "unique constraint",
      ].some((p) => lower.includes(p) || code.includes(p));
      const isBadCredentials =
        lower.includes("invalid login credentials") || code === "invalid_credentials";
      if (mode === "signup" && isDuplicate) {
        setError("الحساب مسجل مسبقًا");
      } else if (mode === "signup") {
        setError("تعذر إنشاء الحساب الآن. حاول مرة أخرى لاحقًا.");
      } else if (isBadCredentials) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else {
        setError("تعذر تسجيل الدخول الآن. حاول مرة أخرى لاحقًا.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onSignOut = async () => {
    resetMessages();
    setLoading(true);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      resetLocalUserState();
      setNotice(null);
    } catch {
      setError("تعذر تسجيل الخروج الآن. حاول مرة أخرى لاحقًا.");
    } finally {
      setLoading(false);
    }
  };

  const onSaveProfile = async () => {
    resetMessages();
    if (!userId) return;
    setProfileSaving(true);
    try {
      const payload = {
        name: (profileName ?? "").trim() || null,
        phone: (profilePhone ?? "").trim() || null,
      };
      const { error: updateError } = await supabase.from("profiles").update(payload).eq("id", userId);
      if (updateError) throw updateError;
      setNotice("تم حفظ البيانات");
    } catch {
      setError("تعذر حفظ البيانات الآن. حاول مرة أخرى لاحقًا.");
    } finally {
      setProfileSaving(false);
    }
  };

  const onPickProfileImage = async (file: File | null) => {
    resetMessages();
    if (!userId || !file) return;
    setProfileSaving(true);
    try {
      const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
      const path = `${userId}/avatar-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("profile-images").upload(path, file, {
        contentType: file.type || `image/${fileExt === "jpg" ? "jpeg" : fileExt}`,
        upsert: true,
      });
      if (uploadError) throw uploadError;
      const publicUrl = supabase.storage.from("profile-images").getPublicUrl(path).data.publicUrl;
      const normalized = normalizeRemoteUri(publicUrl);
      if (!normalized) {
        setError("تعذر حفظ الصورة");
        return;
      }
      const { error: insertError } = await supabase
        .from("profile_images")
        .insert({ user_id: userId, image_url: normalized });
      if (insertError) throw insertError;
      setProfileImageUrl(normalized);
      setNotice("تم تحديث الصورة");
    } catch {
      setError("تعذر تحديث الصورة الآن. حاول مرة أخرى لاحقًا.");
    } finally {
      setProfileSaving(false);
    }
  };

  const performDeleteAccount = async () => {
    resetMessages();
    if (!session?.access_token) {
      setError("تعذر حذف الحساب: يلزم تسجيل الدخول");
      return;
    }
    setLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("delete-account", {
        body: {},
      });
      if (invokeError) throw invokeError;
      if (!data || (data as any).success !== true) {
        setError("تعذر حذف الحساب: استجابة غير متوقعة من الخادم");
        return;
      }
      await supabase.auth.signOut();
      resetLocalUserState();
      setNotice("تم حذف الحساب");
    } catch {
      setError("تعذر حذف الحساب الآن. حاول مرة أخرى لاحقًا.");
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    if (!userId) return;
    setBookingsLoading(true);
    try {
      const { data, error: qError } = await supabase
        .from("bookings")
        .select("id, status, created_at, provider_service_id, scheduled_at, end_at")
        .eq("customer_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (qError) throw qError;
      setBookings((data as any) ?? []);
      const bookingRows = ((data as any) ?? []) as Array<{
        id: string;
        provider_service_id: string | null;
      }>;
      const providerServiceIds = Array.from(
        new Set(bookingRows.map((b) => b.provider_service_id).filter(Boolean))
      ) as string[];
      if (providerServiceIds.length === 0) {
        setBookingMetaById({});
        return;
      }
      const { data: psData } = await supabase
        .from("provider_services")
        .select("id, title, service_type_id, city_id, user_id")
        .in("id", providerServiceIds);
      const providerServices = (psData as any) ?? [];
      const serviceTypeIds = Array.from(
        new Set(providerServices.map((s: any) => s.service_type_id).filter(Boolean))
      );
      const cityIds = Array.from(new Set(providerServices.map((s: any) => s.city_id).filter(Boolean)));
      const providerUserIds = Array.from(
        new Set(providerServices.map((s: any) => s.user_id).filter(Boolean))
      );
      const [typesRes, citiesRes, providersRes, providerImagesRes] = await Promise.all([
        serviceTypeIds.length > 0
          ? supabase.from("service_types").select("id, name").in("id", serviceTypeIds)
          : Promise.resolve({ data: [] as any }),
        cityIds.length > 0
          ? supabase.from("cities").select("id, name").in("id", cityIds)
          : Promise.resolve({ data: [] as any }),
        providerUserIds.length > 0
          ? supabase.from("profiles").select("id, name").in("id", providerUserIds)
          : Promise.resolve({ data: [] as any }),
        providerUserIds.length > 0
          ? supabase
              .from("profile_images")
              .select("user_id, image_url, created_at")
              .in("user_id", providerUserIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as any }),
      ]);
      const typeNameById = new Map(
        ((typesRes as any).data ?? []).map((t: any) => [t.id, t.name])
      );
      const cityNameById = new Map(
        ((citiesRes as any).data ?? []).map((c: any) => [c.id, c.name])
      );
      const providerNameById = new Map(
        ((providersRes as any).data ?? []).map((p: any) => [p.id, p.name])
      );
      const providerImageByUserId = new Map<string, string>();
      for (const row of ((providerImagesRes as any).data ?? []) as any[]) {
        if (providerImageByUserId.has(row.user_id)) continue;
        const uri = normalizeRemoteUri(row.image_url);
        if (uri) providerImageByUserId.set(row.user_id, uri);
      }
      const psById = new Map<
        string,
        {
          id: string;
          title?: string | null;
          service_type_id?: string | null;
          city_id?: string | null;
          user_id?: string | null;
        }
      >(providerServices.map((s: any) => [String(s.id), s]));
      const nextMeta: typeof bookingMetaById = {};
      for (const b of bookingRows) {
        const ps = b.provider_service_id ? psById.get(b.provider_service_id) : undefined;
        nextMeta[b.id] = {
          serviceTitle: ps?.title ?? undefined,
          serviceTypeName: ps?.service_type_id
            ? (typeNameById.get(ps.service_type_id) as string | undefined)
            : undefined,
          cityName: ps?.city_id ? (cityNameById.get(ps.city_id) as string | undefined) : undefined,
          providerName: ps?.user_id
            ? (providerNameById.get(ps.user_id) as string | undefined)
            : undefined,
          providerImageUrl: ps?.user_id ? providerImageByUserId.get(ps.user_id) : undefined,
        };
      }
      setBookingMetaById(nextMeta);
    } catch {
      setError("تعذر تحميل الحجوزات الآن. حاول مرة أخرى لاحقًا.");
    } finally {
      setBookingsLoading(false);
    }
  };

  const loadServices = async () => {
    if (!userId) return;
    setServicesLoading(true);
    try {
      const { data, error: qError } = await supabase
        .from("provider_services")
        .select(
          "id, title, is_active, created_at, service_type_id, city_id, starting_price, base_price, currency, service_mode"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (qError) throw qError;
      const rows = ((data as any) ?? []) as any[];
      setServices(rows);
      const serviceTypeIds = Array.from(
        new Set(rows.map((s) => s.service_type_id).filter(Boolean))
      );
      const cityIds = Array.from(new Set(rows.map((s) => s.city_id).filter(Boolean)));
      const serviceIds = rows.map((s) => s.id).filter(Boolean);
      const [typesRes, citiesRes, imagesRes] = await Promise.all([
        serviceTypeIds.length > 0
          ? supabase.from("service_types").select("id, name").in("id", serviceTypeIds)
          : Promise.resolve({ data: [] as any }),
        cityIds.length > 0
          ? supabase.from("cities").select("id, name").in("id", cityIds)
          : Promise.resolve({ data: [] as any }),
        serviceIds.length > 0
          ? supabase
              .from("provider_service_images")
              .select("provider_service_id, image_url, is_cover, created_at")
              .in("provider_service_id", serviceIds)
          : Promise.resolve({ data: [] as any }),
      ]);
      const typeNameById = new Map<string, string>(
        ((typesRes as any).data ?? []).map((t: any) => [String(t.id), String(t.name ?? "")])
      );
      const cityNameById = new Map<string, string>(
        ((citiesRes as any).data ?? []).map((c: any) => [String(c.id), String(c.name ?? "")])
      );
      const coverByService = new Map<string, string>();
      for (const row of ((imagesRes as any).data ?? []) as any[]) {
        const sid = String(row.provider_service_id);
        if (coverByService.has(sid) && !row.is_cover) continue;
        const uri = normalizeRemoteUri(row.image_url);
        if (uri) coverByService.set(sid, uri);
      }
      const nextMeta: typeof serviceMetaById = {};
      for (const s of rows) {
        nextMeta[s.id] = {
          serviceTypeName: s.service_type_id
            ? typeNameById.get(String(s.service_type_id))
            : undefined,
          cityName: s.city_id ? cityNameById.get(String(s.city_id)) : undefined,
          coverImageUrl: coverByService.get(String(s.id)) ?? null,
        };
      }
      setServiceMetaById(nextMeta);
    } catch {
      setError("تعذر تحميل الخدمات الآن. حاول مرة أخرى لاحقًا.");
    } finally {
      setServicesLoading(false);
    }
  };

  const toggleServiceActive = async (serviceId: string, next: boolean) => {
    try {
      const { error: uError } = await supabase
        .from("provider_services")
        .update({ is_active: next })
        .eq("id", serviceId);
      if (uError) throw uError;
      setServices((prev) => prev.map((s) => (s.id === serviceId ? { ...s, is_active: next } : s)));
    } catch {
      setError("تعذر تحديث حالة الاستقبال الآن.");
    }
  };

  React.useEffect(() => {
    if (!isSignedIn) return;
    if (signedView === "bookings") void loadBookings();
    if (signedView === "services") void loadServices();
    if (signedView === "notifications") {
      setNotificationsLoading(true);
      void (async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;
          const { data } = await supabase
            .from("notification_preferences")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();
          if (data) {
            setMessagesNotificationsEnabled(Boolean((data as any).messages_enabled));
            setBookingsNotificationsEnabled(Boolean((data as any).bookings_enabled));
            setTrackingNotificationsEnabled(Boolean((data as any).tracking_enabled));
            setHarajNotificationsEnabled(Boolean((data as any).haraj_enabled));
            setHarajNewItemsNotificationsEnabled(Boolean((data as any).haraj_new_items_enabled));
            setGalleryNotificationsEnabled(Boolean((data as any).gallery_enabled));
          }
        } catch {
          // ignore
        } finally {
          setNotificationsLoading(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedView, isSignedIn, userId]);

  const updateNotif = async (updates: Record<string, boolean>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notification_preferences").update(updates).eq("user_id", user.id);
  };

  const mapStatus = (status: string | null) => {
    if (!status) return "قيد المعالجة";
    const s = status.toLowerCase();
    if (s === "confirmed") return "تم تأكيد الحجز";
    if (s === "in_progress") return "قيد التنفيذ";
    if (s === "completed") return "مكتمل";
    if (s === "cancelled") return "ملغي";
    if (s === "pending") return "تم تأكيد الحجز";
    return "قيد المعالجة";
  };

  const formatBookingNumber = (id: string) => {
    const raw = id.replace(/[^a-fA-F0-9]/g, "").slice(0, 4);
    const n = raw ? parseInt(raw, 16) : 0;
    const short = ((Number.isFinite(n) ? n : 0) % 999) + 1;
    return `#${short}`;
  };

  const verificationKnown = verificationStatus !== null;
  const accountVerified = verificationKnown && isFullyVerified(verificationStatus as VerificationStatus);
  const inEmailOtpEntry = !!pendingSignup || verifyPhase === "emailSent";
  const showVerificationGate =
    inEmailOtpEntry || (isSignedIn && verificationKnown && !accountVerified);
  const showVerificationLoading =
    !inEmailOtpEntry && isSignedIn && !verificationKnown && !verificationCheckError;
  const showVerificationCheckFailed =
    !inEmailOtpEntry && isSignedIn && !verificationKnown && !!verificationCheckError;


  const placeholderCss = `
    .lk-account input::placeholder { color: #1F160D; opacity: 1; font-weight: 800; }
    .lk-account input::-webkit-input-placeholder { color: #1F160D; opacity: 1; font-weight: 800; }
    .lk-account button:disabled { opacity: 0.6; }
  `;
  const shell: React.CSSProperties = {
    minHeight: "100vh",
    background: C.bg,
    // Longhand only — avoid React "Removing paddingTop" when overriding.
    paddingTop: 54,
    paddingRight: 16,
    paddingBottom: 120,
    paddingLeft: 16,
    maxWidth: 480,
    margin: "0 auto",
    boxSizing: "border-box",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: C.inputBg,
    borderRadius: 16,
    padding: "14px 16px",
    fontSize: 16,
    fontWeight: 800,
    color: C.inputText,
    marginBottom: 12,
    textAlign: "right",
    border: `1.5px solid ${C.inputBorder}`,
    boxSizing: "border-box",
    outline: "none",
  };
  const primaryBtn: React.CSSProperties = {
    width: "100%",
    background: C.navy,
    borderRadius: 18,
    padding: "15px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: 800,
    border: "none",
    cursor: "pointer",
    marginTop: 4,
  };
  const secondaryBtn: React.CSSProperties = {
    width: "100%",
    background: C.cream,
    borderRadius: 18,
    padding: "14px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: C.navy,
    fontSize: 15,
    fontWeight: 900,
    border: "1px solid #D5C7B7",
    cursor: "pointer",
    marginTop: 4,
  };
  const deleteBtn: React.CSSProperties = {
    width: "100%",
    marginTop: 8,
    background: "transparent",
    borderRadius: 22,
    padding: "12px 16px",
    border: "1px solid rgba(180, 35, 24, 0.55)",
    color: C.error,
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
    textAlign: "center",
  };
  const logoutBtn: React.CSSProperties = {
    width: "100%",
    marginTop: 6,
    background: "#F9E6E5",
    borderRadius: 22,
    padding: "16px",
    border: `1px solid ${C.error}`,
    color: C.error,
    fontSize: 20,
    fontWeight: 900,
    cursor: "pointer",
    textAlign: "center",
  };
  const cardStyle: React.CSSProperties = {
    marginTop: 18,
    background: C.cream,
    borderRadius: 24,
    padding: 18,
    border: `1px solid ${C.sectionBorder}`,
    boxShadow: "0 8px 14px rgba(0,0,0,0.07)",
  };
  const sectionCard: React.CSSProperties = {
    background: C.cream,
    borderRadius: 24,
    padding: 16,
    border: `1px solid ${C.sectionBorder}`,
  };
  const menuCard: React.CSSProperties = {
    width: "100%",
    background: C.cream,
    borderRadius: 22,
    padding: "16px",
    border: `1px solid ${C.cardBorder}`,
    minHeight: 64,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    boxSizing: "border-box",
  };
  const menuIconWrap: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 17,
    background: C.cream,
    display: "grid",
    placeItems: "center",
    border: `1px solid ${C.cardBorder}`,
    flexShrink: 0,
  };
  const titleStyle: React.CSSProperties = {
    fontSize: 26,
    fontWeight: 800,
    color: C.navy,
    margin: "0 0 8px",
    textAlign: "right",
  };
  const subtitleStyle: React.CSSProperties = {
    fontSize: 15,
    lineHeight: "24px",
    color: C.muted,
    margin: 0,
    textAlign: "right",
  };
  const noticeStyle: React.CSSProperties = {
    color: C.notice,
    fontWeight: 800,
    fontSize: 13,
    textAlign: "right",
    marginTop: 10,
  };
  const errorStyle: React.CSSProperties = {
    color: C.error,
    fontWeight: 900,
    fontSize: 13,
    textAlign: "right",
    marginTop: 10,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };
  const gateLabel: React.CSSProperties = {
    color: C.navy,
    fontSize: 13,
    fontWeight: 900,
    textAlign: "right",
    marginBottom: 6,
    marginTop: 4,
    display: "block",
  };
  const infoRow: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    background: C.cream,
    borderRadius: 16,
    border: `1px solid ${C.infoBorder}`,
    padding: "12px 14px",
    marginBottom: 12,
  };

  const openSupportEmail = (kind: "contact" | "complaint") => {
    const to = "support@layalikashtat.com";
    const subject =
      kind === "complaint" ? "شكوى من تطبيق ليالي كشتات" : "تواصل من تطبيق ليالي كشتات";
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}`;
  };

  if (!otpFlowHydrated) {
    return (
      <div className="lk-account" data-parity="1" style={{ ...shell, display: "grid", placeItems: "center", gap: 12 }} dir="rtl">
        <div style={{ color: C.navy, fontWeight: 900, fontSize: 16 }}>...</div>
        <div
          style={{
            marginTop: 8,
            textAlign: "center",
            fontSize: 12,
            fontWeight: 800,
            color: C.muted2,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <a href={localeHref(locale, "/privacy")} style={{ color: C.navy, textDecoration: "none" }}>
            سياسة الخصوصية
          </a>
          <span style={{ color: C.cardBorder }}>|</span>
          <a href={localeHref(locale, "/terms")} style={{ color: C.navy, textDecoration: "none" }}>
            الشروط والأحكام
          </a>
          <span style={{ color: C.cardBorder }}>|</span>
          <a href={localeHref(locale, "/delete-account")} style={{ color: C.navy, textDecoration: "none" }}>
            حذف الحساب / البيانات
          </a>
        </div>
      </div>
    );
  }

  if (showVerificationCheckFailed) {
    return (
      <div className="lk-account" data-parity="1" style={shell} dir="rtl">
        <style dangerouslySetInnerHTML={{ __html: placeholderCss }} />
        <div style={{ padding: "20px 4px 0" }}>
          <h1 style={titleStyle}>تعذر التحقق</h1>
          <p style={subtitleStyle}>{verificationCheckError}</p>
        </div>
        <div style={cardStyle}>
          <button
            type="button"
            style={primaryBtn}
            onClick={() => {
              setVerificationCheckError(null);
              setVerificationStatus(null);
              setVerificationRetryKey((k) => k + 1);
            }}
          >
            إعادة المحاولة
          </button>
          <button
            type="button"
            style={secondaryBtn}
            onClick={() => {
              setVerificationCheckError(null);
              setVerificationStatus({
                phoneVerified: false,
                emailVerified: false,
                verificationMethod: null,
              });
            }}
          >
            متابعة لتأكيد الحساب
          </button>
          <button type="button" style={deleteBtn} onClick={onSignOut} disabled={loading}>
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  if (showVerificationLoading) {
    return (
      <div className="lk-account" data-parity="1" style={shell} dir="rtl">
        <div style={{ padding: "20px 4px 0" }}>
          <h1 style={titleStyle}>جاري التحقق...</h1>
          <p style={subtitleStyle}>يتم تحميل حالة الحساب</p>
          <div style={{ marginTop: 16, textAlign: "center", color: C.navy, fontWeight: 900 }}>...</div>
        </div>
      </div>
    );
  }

  if (showVerificationGate) {
    const isCodePhase = verifyPhase === "emailSent";
    return (
      <div className="lk-account" data-parity="1" style={shell} dir="rtl">
        <div style={{ padding: "20px 4px 0" }}>
          <h1 style={titleStyle}>تأكيد الحساب</h1>
          <p style={subtitleStyle}>
            سيصل رمز التحقق إلى بريدك الإلكتروني. رقم الجوال اختياري
          </p>
        </div>
        <div style={cardStyle}>
          <label style={gateLabel}>رقم الجوال (اختياري)</label>
          <input
            style={inputStyle}
            placeholder="05XXXXXXXX"
            value={verifyPhoneInput}
            onChange={(e) => setVerifyPhoneInput(normalizeArabicNumberInput(e.target.value))}
            disabled={verifyBusy || isCodePhase}
            inputMode="tel"
          />
          {isCodePhase ? (
            <>
              <label style={gateLabel}>رمز التحقق</label>
              <input
                style={inputStyle}
                placeholder="رمز البريد الإلكتروني"
                value={emailOtpCode}
                onChange={(e) =>
                  setEmailOtpCode(
                    normalizeArabicNumberInput(e.target.value).replace(/\D/g, "").slice(0, 4)
                  )
                }
                disabled={verifyBusy}
                inputMode="numeric"
                maxLength={4}
                autoComplete="one-time-code"
              />
              <button
                type="button"
                style={primaryBtn}
                onClick={onVerifyEmailOtp}
                disabled={verifyBusy || emailOtpCode.length !== 4}
              >
                {verifyBusy ? "جاري التحقق..." : "تحقق"}
              </button>
              <button
                type="button"
                style={secondaryBtn}
                onClick={runSmartVerification}
                disabled={verifyBusy}
              >
                {verifyBusy ? "جاري الإرسال..." : "إعادة إرسال الرمز"}
              </button>
            </>
          ) : (
            <button
              type="button"
              style={primaryBtn}
              onClick={runSmartVerification}
              disabled={verifyBusy}
            >
              {verifyBusy ? "جاري الإرسال..." : "إرسال رمز التحقق"}
            </button>
          )}
          {verifyNotice ? <p style={noticeStyle}>{verifyNotice}</p> : null}
          {verifyError ? <p style={errorStyle}>{verifyError}</p> : null}
          <p
            style={{
              color: C.notice,
              fontSize: 12,
              fontWeight: 900,
              textAlign: "center",
              marginTop: 14,
            }}
          >
            لا يمكن إكمال التسجيل قبل التحقق
          </p>
          <button
            type="button"
            style={deleteBtn}
            onClick={pendingSignup ? cancelPendingSignupVerification : onSignOut}
            disabled={verifyBusy || loading}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  if (isSignedIn) {
    const isNameMissing = !profileName?.trim();
    const displayName = isNameMissing ? "مستخدم" : (profileName as string);
    const placeholderLetter = (displayName.trim()?.[0] ?? "م").toString();
    const menuItems: Array<{
      key: "profile" | "bookings" | "services" | "notifications";
      label: string;
      icon: React.ReactNode;
      value?: string;
    }> = [
      { key: "profile", label: "بياناتي", icon: <IconPerson /> },
      { key: "bookings", label: "حجوزاتي", icon: <IconCalendar /> },
      { key: "services", label: "خدماتي", icon: <IconBriefcase /> },
      {
        key: "notifications",
        label: "الإشعارات",
        icon: <IconBell />,
        value: "مفعلة",
      },
    ];

    return (
      <div className="lk-account" data-parity="1" style={{ ...shell, display: "flex", flexDirection: "column", gap: 11 }} dir="rtl">
        <style dangerouslySetInnerHTML={{ __html: placeholderCss }} />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {signedView !== "menu" ? (
            <button
              type="button"
              onClick={() => setSignedView("menu")}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
              aria-label="رجوع"
              disabled={loading || profileSaving}
            >
              <IconBack />
            </button>
          ) : (
            <div style={{ width: 40, height: 40 }} />
          )}
          <h1
            style={{
              color: C.navy,
              fontSize: 26,
              fontWeight: 900,
              flex: 1,
              margin: 0,
              textAlign: "right",
            }}
          >
            الحساب
          </h1>
        </div>

        <div
          style={{
            background: C.cream,
            borderRadius: 22,
            padding: 14,
            border: `1px solid ${C.cardBorder}`,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                overflow: "hidden",
                background: C.cream,
                display: "grid",
                placeItems: "center",
                border: `2px solid ${C.gold}`,
                boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
                flexShrink: 0,
                color: C.navy,
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              {profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileImageUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                placeholderLetter
              )}
            </div>
            <div style={{ flex: 1, textAlign: "right" }}>
              <div
                style={{
                  color: C.navy,
                  fontSize: 20,
                  fontWeight: 900,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  marginTop: 4,
                  color: C.userSub,
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                مرحبًا بك
              </div>
            </div>
          </div>
        </div>

        {parityBlocked ? <p style={errorStyle}>{parityBlocked}</p> : null}

        {signedView === "menu" ? (
          <>
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSignedView(item.key)}
                disabled={loading}
                style={menuCard}
              >
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div style={menuIconWrap}>{item.icon}</div>
                    <span
                      style={{
                        color: C.navy,
                        fontSize: 18,
                        fontWeight: 900,
                        textAlign: "right",
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                  {item.value ? (
                    <span style={{ color: C.green, fontSize: 16, fontWeight: 900 }}>
                      {item.value}
                    </span>
                  ) : null}
                </div>
              </button>
            ))}

            {notice ? <p style={noticeStyle}>{notice}</p> : null}
            {error ? <p style={errorStyle}>{error}</p> : null}

            <button type="button" style={logoutBtn} onClick={onSignOut} disabled={loading}>
              {loading ? "جاري التنفيذ..." : "تسجيل الخروج"}
            </button>

            <div style={{ marginTop: 8, marginBottom: 2, width: "82%", alignSelf: "center" }}>
              <div
                style={{
                  marginBottom: 6,
                  color: C.supportTitle,
                  fontSize: 13,
                  fontWeight: 900,
                  textAlign: "right",
                }}
              >
                الدعم
              </div>
              <div
                style={{
                  borderRadius: 18,
                  border: `1px solid ${C.cardBorder}`,
                  background: C.supportCard,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => openSupportEmail("contact")}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: C.navy,
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  <IconChat />
                  تواصل
                </button>
                <div style={{ width: 1, height: 24, background: C.cardBorder }} />
                <button
                  type="button"
                  onClick={() => openSupportEmail("complaint")}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: C.navy,
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  <IconWarning />
                  شكاوي
                </button>
              </div>
              <div
                style={{
                  marginTop: 8,
                  borderRadius: 18,
                  border: `1px solid ${C.cardBorder}`,
                  background: C.supportCard,
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                <a href={localeHref(locale, "/privacy")} style={{ color: C.navy, textDecoration: "none" }}>
                  سياسة الخصوصية
                </a>
                <span style={{ color: C.cardBorder }}>|</span>
                <a href={localeHref(locale, "/terms")} style={{ color: C.navy, textDecoration: "none" }}>
                  الشروط والأحكام
                </a>
                <span style={{ color: C.cardBorder }}>|</span>
                <a href={localeHref(locale, "/delete-account")} style={{ color: C.navy, textDecoration: "none" }}>
                  حذف الحساب / البيانات
                </a>
              </div>
            </div>
          </>
        ) : null}

        {signedView === "notifications" ? (
          <div style={{ ...sectionCard, paddingBottom: 28, background: C.cream }}>
            <h2
              style={{
                color: C.navy,
                fontSize: 18,
                fontWeight: 900,
                textAlign: "right",
                margin: "0 0 12px",
              }}
            >
              الإشعارات
            </h2>
            <p
              style={{
                marginTop: 10,
                color: "#374151",
                fontSize: 15,
                lineHeight: "24px",
                textAlign: "right",
                fontWeight: 600,
              }}
            >
              اختر أنواع التنبيهات التي ترغب في استقبالها داخل التطبيق وعلى جهازك.
            </p>
            {(
              [
                [
                  "messages",
                  "إشعارات الرسائل",
                  messagesNotificationsEnabled,
                  setMessagesNotificationsEnabled,
                  "messages_enabled",
                ],
                [
                  "bookings",
                  "إشعارات الحجوزات",
                  bookingsNotificationsEnabled,
                  setBookingsNotificationsEnabled,
                  "bookings_enabled",
                ],
                [
                  "tracking",
                  "إشعارات التتبع",
                  trackingNotificationsEnabled,
                  setTrackingNotificationsEnabled,
                  "tracking_enabled",
                ],
                [
                  "haraj",
                  "إشعارات الحراج",
                  harajNotificationsEnabled,
                  setHarajNotificationsEnabled,
                  "haraj_enabled",
                ],
                [
                  "harajNew",
                  "إعلانات حراج جديدة",
                  harajNewItemsNotificationsEnabled,
                  setHarajNewItemsNotificationsEnabled,
                  "haraj_new_items_enabled",
                ],
                [
                  "gallery",
                  "إشعارات المعرض",
                  galleryNotificationsEnabled,
                  setGalleryNotificationsEnabled,
                  "gallery_enabled",
                ],
              ] as const
            ).map(([key, label, value, setter, field]) => (
              <div
                key={key}
                style={{
                  marginTop: 18,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    color: "#111827",
                    fontSize: 16,
                    fontWeight: 700,
                    textAlign: "right",
                  }}
                >
                  {label}
                </span>
                <input
                  type="checkbox"
                  checked={value}
                  disabled={notificationsLoading}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setter(next);
                    void updateNotif({ [field]: next });
                  }}
                  style={{ width: 44, height: 24, accentColor: C.green }}
                />
              </div>
            ))}
          </div>
        ) : null}

        {signedView === "profile" ? (
          <div style={sectionCard}>
            <h2
              style={{
                color: C.navy,
                fontSize: 18,
                fontWeight: 900,
                textAlign: "right",
                margin: "0 0 12px",
              }}
            >
              بياناتي
            </h2>
            {session?.user?.email ? (
              <div style={infoRow}>
                <span
                  style={{
                    color: C.userSub,
                    fontSize: 13,
                    fontWeight: 900,
                    maxWidth: "65%",
                    textAlign: "left",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {session.user.email}
                </span>
                <span style={{ color: C.navy, fontSize: 13, fontWeight: 900 }}>
                  البريد الإلكتروني
                </span>
              </div>
            ) : null}
            {typeof profilePhoneVerified === "boolean" ? (
              <div style={infoRow}>
                <span style={{ color: C.userSub, fontSize: 13, fontWeight: 900 }}>
                  {verificationStatus?.emailVerified ? "موثق" : "غير موثق"}
                </span>
                <span style={{ color: C.navy, fontSize: 13, fontWeight: 900 }}>حالة التحقق</span>
              </div>
            ) : null}
            <input
              style={inputStyle}
              placeholder="الاسم"
              value={profileName ?? ""}
              onChange={(e) => setProfileName(e.target.value)}
              disabled={profileSaving}
            />
            <input
              style={inputStyle}
              placeholder="رقم الجوال (اختياري)"
              value={profilePhone ?? ""}
              onChange={(e) => setProfilePhone(normalizeArabicNumberInput(e.target.value))}
              disabled={profileSaving}
              inputMode="tel"
            />
            {notice ? <p style={noticeStyle}>{notice}</p> : null}
            {error ? <p style={errorStyle}>{error}</p> : null}
            <label style={{ ...secondaryBtn, cursor: "pointer" }}>
              {profileSaving ? "جاري التنفيذ..." : "تغيير الصورة"}
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                disabled={profileSaving}
                onChange={(e) => void onPickProfileImage(e.target.files?.[0] ?? null)}
              />
            </label>
            <button type="button" style={primaryBtn} onClick={onSaveProfile} disabled={profileSaving}>
              {profileSaving ? "جاري التنفيذ..." : "حفظ"}
            </button>
            {error ? <p style={errorStyle}>{error}</p> : null}
            {notice ? <p style={noticeStyle}>{notice}</p> : null}
            <button
              type="button"
              style={deleteBtn}
              disabled={loading}
              onClick={() => {
                if (window.confirm("حذف الحساب\n\nهل أنت متأكد من حذف الحساب؟ لا يمكن التراجع")) {
                  void performDeleteAccount();
                }
              }}
            >
              {loading ? "جاري التنفيذ..." : "حذف الحساب"}
            </button>
          </div>
        ) : null}

        {signedView === "bookings" ? (
          <div style={sectionCard}>
            <h2
              style={{
                color: C.navy,
                fontSize: 18,
                fontWeight: 900,
                textAlign: "right",
                margin: "0 0 12px",
              }}
            >
              حجوزاتي
            </h2>
            {bookingsLoading ? (
              <p style={{ color: C.muted2, fontSize: 13, fontWeight: 800, textAlign: "right" }}>
                جاري التحميل...
              </p>
            ) : null}
            {!bookingsLoading && bookings.length === 0 ? (
              <p style={{ color: C.muted2, fontSize: 13, fontWeight: 800, textAlign: "right" }}>
                لا توجد حجوزات
              </p>
            ) : null}
            {bookings.map((b) => (
              <div
                key={b.id}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: C.cream,
                  borderRadius: 18,
                  border: `1px solid ${C.infoBorder}`,
                  padding: "12px 14px",
                  marginTop: 10,
                }}
              >
                <div style={{ flex: 1, textAlign: "right", marginLeft: 10 }}>
                  <div style={{ color: C.userSub, fontSize: 13, fontWeight: 900 }}>
                    {formatBookingNumber(b.id)}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      color: C.userSub,
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {bookingMetaById[b.id]?.serviceTypeName ??
                      bookingMetaById[b.id]?.serviceTitle ??
                      "—"}
                    {bookingMetaById[b.id]?.cityName
                      ? ` • ${bookingMetaById[b.id]?.cityName}`
                      : ""}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      color: C.navy,
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {mapStatus(b.status)}
                  </div>
                </div>
                <div style={{ width: 110, textAlign: "center" }}>
                  {bookingMetaById[b.id]?.providerImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={bookingMetaById[b.id]?.providerImageUrl}
                      alt=""
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        objectFit: "cover",
                        margin: "0 auto",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        background: C.cream,
                        border: "1px solid #D5C7B7",
                        margin: "0 auto",
                      }}
                    />
                  )}
                  <div
                    style={{
                      color: C.navy,
                      fontSize: 12,
                      fontWeight: 900,
                      marginTop: 8,
                    }}
                  >
                    {bookingMetaById[b.id]?.providerName ?? "—"}
                  </div>
                </div>
              </div>
            ))}
            {error ? <p style={errorStyle}>{error}</p> : null}
          </div>
        ) : null}

        {signedView === "services" ? (
          <div style={sectionCard}>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <h2
                style={{
                  color: C.navy,
                  fontSize: 18,
                  fontWeight: 900,
                  textAlign: "right",
                  margin: 0,
                }}
              >
                خدماتي
              </h2>
              <button
                type="button"
                style={{
                  background: C.navy,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: "pointer",
                }}
                onClick={() =>
                  setParityBlocked(
                    "تعذّر المطابقة: شاشة «أضف نشاطك» (ProviderMinimalActivity) غير منقولة للويب بعد — توقّف التنفيذ بانتظار موافقتك."
                  )
                }
              >
                + أضف نشاطك
              </button>
            </div>
            {servicesLoading ? (
              <p style={{ color: C.muted2, fontSize: 13, fontWeight: 800, textAlign: "right" }}>
                جاري التحميل...
              </p>
            ) : null}
            {!servicesLoading && services.length === 0 ? (
              <p style={{ color: C.muted2, fontSize: 13, fontWeight: 800, textAlign: "right" }}>
                لا توجد أنشطة بعد — اضغط «أضف نشاطك» للبدء.
              </p>
            ) : null}
            {services.map((s) => {
              const meta = serviceMetaById[s.id];
              return (
                <div
                  key={s.id}
                  style={{
                    background: C.cream,
                    borderRadius: 16,
                    border: `1px solid ${C.infoBorder}`,
                    padding: "12px 14px",
                    marginTop: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    {meta?.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={meta.coverImageUrl}
                        alt=""
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 12,
                          objectFit: "cover",
                          border: `1px solid ${C.infoBorder}`,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 12,
                          background: C.cream,
                          border: `1px solid ${C.infoBorder}`,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <IconImageEmpty />
                      </div>
                    )}
                    <div style={{ flex: 1, textAlign: "right" }}>
                      <div style={{ color: C.userSub, fontSize: 13, fontWeight: 900 }}>
                        {s.title ?? "—"}
                      </div>
                      <div
                        style={{
                          color: C.muted2,
                          fontSize: 13,
                          fontWeight: 800,
                          marginTop: 6,
                        }}
                      >
                        {meta?.serviceTypeName ?? "—"}
                        {meta?.cityName ? ` • ${meta.cityName}` : ""}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 6,
                      marginTop: 8,
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        background: C.cream,
                        border: "1px solid #D9E2EC",
                        color: C.navy,
                        fontSize: 12,
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setParityBlocked(
                          "تعذّر المطابقة: شاشة «إدارة الخدمة» (ProviderServiceDashboard) غير منقولة للويب بعد — توقّف التنفيذ بانتظار موافقتك."
                        )
                      }
                    >
                      إدارة الخدمة
                    </button>
                    {typeof s.is_active === "boolean" ? (
                      <button
                        type="button"
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          background: s.is_active ? C.cream : C.navy,
                          border: `1px solid ${s.is_active ? "#FCA5A5" : C.navy}`,
                          color: s.is_active ? C.error : "#FFFFFF",
                          fontSize: 12,
                          fontWeight: 900,
                          cursor: "pointer",
                        }}
                        onClick={() => void toggleServiceActive(s.id, !s.is_active)}
                      >
                        {s.is_active ? "إيقاف الاستقبال" : "أستقبل الطلبات"}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {error ? <p style={errorStyle}>{error}</p> : null}
          </div>
        ) : null}
      </div>
    );
  }

  if (authBooting && !inEmailOtpEntry) {
    return (
      <div className="lk-account" data-parity="1" style={{ ...shell, display: "grid", placeItems: "center", gap: 12 }} dir="rtl">
        <div style={{ color: C.navy, fontWeight: 900, fontSize: 16, textAlign: "center" }}>
          جاري التحقق من الحساب...
        </div>
        <div
          style={{
            marginTop: 8,
            textAlign: "center",
            fontSize: 12,
            fontWeight: 800,
            color: C.muted2,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <a href={localeHref(locale, "/privacy")} style={{ color: C.navy, textDecoration: "none" }}>
            سياسة الخصوصية
          </a>
          <span style={{ color: C.cardBorder }}>|</span>
          <a href={localeHref(locale, "/terms")} style={{ color: C.navy, textDecoration: "none" }}>
            الشروط والأحكام
          </a>
          <span style={{ color: C.cardBorder }}>|</span>
          <a href={localeHref(locale, "/delete-account")} style={{ color: C.navy, textDecoration: "none" }}>
            حذف الحساب / البيانات
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="lk-account" data-parity="1" style={{ ...shell, paddingTop: 20 }} dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: placeholderCss }} />
      <div style={{ padding: "40px 4px 0" }}>
        <h1 style={titleStyle}>الحساب</h1>
        <p style={subtitleStyle}>سجّل دخولك أو أنشئ حسابك لإدارة حجوزاتك وخدماتك</p>
      </div>

      <div
        style={{
          margin: "16px 0 0",
          background: C.switcherBg,
          borderRadius: 18,
          padding: 6,
          display: "flex",
          flexDirection: "row",
          gap: 6,
        }}
      >
        <button
          type="button"
          onClick={() => setMode("signup")}
          disabled={loading}
          style={{
            flex: 1,
            border: "none",
            borderRadius: 14,
            padding: "12px 0",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
            background: mode === "signup" ? C.navy : "transparent",
            color: mode === "signup" ? "#FFFFFF" : C.muted,
          }}
        >
          إنشاء حساب
        </button>
        <button
          type="button"
          onClick={() => setMode("login")}
          disabled={loading}
          style={{
            flex: 1,
            border: "none",
            borderRadius: 14,
            padding: "12px 0",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
            background: mode === "login" ? C.navy : "transparent",
            color: mode === "login" ? "#FFFFFF" : C.muted,
          }}
        >
          تسجيل دخول
        </button>
      </div>

      <div style={cardStyle}>
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: 46,
            alignSelf: "center",
            margin: "0 auto",
            background: C.avatarBg,
            display: "grid",
            placeItems: "center",
            border: "2px solid #C8954D",
            fontSize: 34,
          }}
        >
          👤
        </div>

        <div
          style={{
            alignSelf: "center",
            margin: "12px auto",
            background: C.cream,
            borderRadius: 16,
            padding: "10px 14px",
            border: `1px solid ${C.infoBorder}`,
            minWidth: 220,
            textAlign: "center",
          }}
        >
          <div style={{ color: C.navy, fontWeight: 900, fontSize: 13 }}>
            {isSignedIn ? "مسجل دخول" : "غير مسجل"}
          </div>
          {session?.user?.email ? (
            <div style={{ marginTop: 4, color: C.userSub, fontWeight: 800, fontSize: 13 }}>
              {session.user.email}
            </div>
          ) : null}
        </div>

        {notice ? <p style={noticeStyle}>{notice}</p> : null}
        {error ? <p style={errorStyle}>{error}</p> : null}

        {mode === "signup" ? (
          <>
            <input
              style={inputStyle}
              placeholder="الاسم"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            <input
              style={inputStyle}
              placeholder="رقم الجوال (اختياري)"
              value={signupPhone}
              onChange={(e) => setSignupPhone(normalizeArabicNumberInput(e.target.value))}
              disabled={loading}
              inputMode="tel"
            />
          </>
        ) : null}

        <input
          style={inputStyle}
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          autoCapitalize="none"
          inputMode="email"
        />
        <input
          style={inputStyle}
          placeholder="كلمة المرور"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        {mode === "login" ? (
          <button
            type="button"
            onClick={onForgotPassword}
            disabled={loading || forgotPasswordBusy || forgotPasswordCooldown > 0}
            style={{
              background: "none",
              border: "none",
              color: C.navy,
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              marginBottom: 12,
              opacity: loading || forgotPasswordBusy || forgotPasswordCooldown > 0 ? 0.55 : 1,
              display: "block",
              alignSelf: "flex-start",
              padding: 0,
            }}
          >
            {forgotPasswordBusy
              ? "جاري الإرسال..."
              : forgotPasswordCooldown > 0
                ? `إعادة الرمز بعد ${forgotPasswordCooldown} ث`
                : "نسيت كلمة المرور؟"}
          </button>
        ) : null}

        {mode === "signup" ? (
          <input
            style={inputStyle}
            placeholder="تأكيد كلمة المرور"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        ) : null}

        <button type="button" style={primaryBtn} onClick={onSubmit} disabled={loading}>
          {loading ? "جاري التنفيذ..." : mode === "signup" ? "إنشاء حساب" : "تسجيل دخول"}
        </button>
      </div>

      <div
        style={{
          marginTop: 18,
          marginBottom: 8,
          textAlign: "center",
          fontSize: 12,
          fontWeight: 800,
          color: C.muted2,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <a href={localeHref(locale, "/privacy")} style={{ color: C.navy, textDecoration: "none" }}>
          سياسة الخصوصية
        </a>
        <span style={{ color: C.cardBorder }}>|</span>
        <a href={localeHref(locale, "/terms")} style={{ color: C.navy, textDecoration: "none" }}>
          الشروط والأحكام
        </a>
        <span style={{ color: C.cardBorder }}>|</span>
        <a href={localeHref(locale, "/delete-account")} style={{ color: C.navy, textDecoration: "none" }}>
          حذف الحساب / البيانات
        </a>
      </div>
    </div>
  );
}
