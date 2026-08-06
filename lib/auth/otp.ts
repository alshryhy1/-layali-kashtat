// Ported from layali-native-app/src/features/auth/otp.ts — same Edge Function contracts.

import { supabase } from "@/lib/supabaseClient";

export type OtpResult =
  | {
      ok: true;
      message: string;
      verificationMethod?: "phone" | "email";
      expiresInSeconds?: number;
    }
  | {
      ok: false;
      reason: string;
      retryAfterSeconds?: number;
      attemptsLeft?: number;
      code?: string;
      httpStatus?: number;
    };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const OTP_HTTP_TIMEOUT_MS = 15_000;
const VERIFICATION_STATUS_TIMEOUT_MS = 12_000;
const IS_DEV = process.env.NODE_ENV !== "production";

export const VERIFICATION_STATUS_TIMEOUT = "VERIFICATION_STATUS_TIMEOUT";

function withTimeout<T>(promise: PromiseLike<T>, ms: number, code: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(code)), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

const DUPLICATE_ACCOUNT_CODES = new Set<string>([
  "phone_already_verified_on_other_account",
  "email_already_verified_on_other_account",
  "account_already_exists",
  "phone_already_used",
  "auth_user_already_exists",
  "email_already_verified",
]);

async function callFunction(
  name: string,
  body: Record<string, unknown>,
  needsAuth: boolean
): Promise<OtpResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, reason: "إعدادات Supabase غير مكتملة في التطبيق" };
  }

  let accessToken = "";
  if (needsAuth) {
    const sessionRes = await supabase.auth.getSession();
    accessToken = sessionRes.data.session?.access_token ?? "";
    if (!accessToken) {
      return { ok: false, reason: "يلزم تسجيل الدخول لإتمام التحقق", httpStatus: 401 };
    }
  } else {
    const sessionRes = await supabase.auth.getSession();
    accessToken = sessionRes.data.session?.access_token ?? "";
  }

  const url = `${SUPABASE_URL.replace(/\/+$/, "")}/functions/v1/${name}`;
  let response: Response;
  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), OTP_HTTP_TIMEOUT_MS);
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: accessToken ? `Bearer ${accessToken}` : `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    const msg = (e as Error).message ?? "network_error";
    const timedOut =
      (e as { name?: string })?.name === "AbortError" || /aborted|timeout/i.test(msg);
    return {
      ok: false,
      reason: timedOut ? "انتهت مهلة الاتصال بالخادم" : "تعذر الاتصال بالخادم",
      httpStatus: 0,
      code: timedOut ? "otp_http_timeout" : undefined,
    };
  } finally {
    clearTimeout(abortTimer);
  }

  const rawText = await response.text().catch(() => "");
  let data: Record<string, unknown> | null = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      data = null;
    }
  }

  if (!response.ok || !data || data.ok !== true) {
    let reason: string | null = null;
    if (data) {
      if (typeof data.reason === "string" && data.reason) reason = data.reason as string;
      else if (typeof data.message === "string" && data.message) reason = data.message as string;
      else if (typeof data.error === "string" && data.error) reason = data.error as string;
    }
    if (!reason) {
      if (response.status === 404) reason = `Edge Function غير منشورة: ${name}`;
      else if (response.status === 401 || response.status === 403)
        reason = "صلاحية غير صالحة لاستدعاء الدالة";
      else if (response.status >= 500) reason = `خطأ في الخادم (${response.status})`;
      else if (rawText) reason = rawText.slice(0, 200);
      else reason = `استجابة غير متوقعة (HTTP ${response.status})`;
    }
    const retryAfterSeconds =
      typeof data?.retry_after_seconds === "number"
        ? (data!.retry_after_seconds as number)
        : undefined;
    const attemptsLeft =
      typeof data?.attempts_left === "number" ? (data!.attempts_left as number) : undefined;
    const code = typeof data?.code === "string" ? (data!.code as string) : undefined;
    return {
      ok: false,
      reason,
      retryAfterSeconds,
      attemptsLeft,
      code,
      httpStatus: response.status,
    };
  }

  return {
    ok: true,
    message: typeof data.message === "string" ? (data.message as string) : "تم",
    verificationMethod:
      data.verification_method === "phone" || data.verification_method === "email"
        ? (data.verification_method as "phone" | "email")
        : undefined,
    expiresInSeconds:
      typeof data.expires_in_seconds === "number" ? (data.expires_in_seconds as number) : undefined,
  };
}

export function sanitizeOptionalPhone(raw: string | null | undefined): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";
  const compact = trimmed.replace(/\s/g, "");
  if (/^05x{8,}$/i.test(compact) || /^x+$/i.test(compact)) return "";
  const digits = compact
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/\D/g, "");
  if (digits.length < 9) return "";
  return trimmed;
}

export function requestEmailOtp(email: string, phone?: string): Promise<OtpResult> {
  const cleaned = sanitizeOptionalPhone(phone);
  return callFunction("request-email-otp", cleaned ? { email, phone: cleaned } : { email }, false);
}

export function verifyEmailOtp(email: string, otp: string): Promise<OtpResult> {
  return callFunction("verify-email-otp", { email, otp }, true);
}

export function verifySignupEmailOtp(input: {
  email: string;
  otp: string;
  name: string;
  phone?: string;
  password: string;
}): Promise<OtpResult> {
  const phone = sanitizeOptionalPhone(input.phone);
  return callFunction(
    "verify-signup-email-otp",
    phone
      ? {
          email: input.email,
          otp: input.otp,
          name: input.name,
          phone,
          password: input.password,
        }
      : {
          email: input.email,
          otp: input.otp,
          name: input.name,
          password: input.password,
        },
    false
  );
}

export function requestPasswordResetOtp(email: string): Promise<OtpResult> {
  return callFunction("request-password-reset-otp", { email }, false);
}

export function resetPasswordWithEmailOtp(input: {
  email: string;
  otp: string;
  password: string;
}): Promise<OtpResult> {
  return callFunction("reset-password-with-email-otp", input, false);
}

export function isDuplicateAccountError(res: OtpResult): boolean {
  if (res.ok) return false;
  if (res.code && DUPLICATE_ACCOUNT_CODES.has(res.code)) return true;
  return false;
}

export function mapToUserMessage(res: OtpResult): string {
  if (res.ok) return "تم إرسال رمز التحقق";
  if (isDuplicateAccountError(res)) return "الحساب مسجل مسبقًا";
  if (!res.ok && res.reason === "الحساب مسجل مسبقًا") return "الحساب مسجل مسبقًا";
  const status = typeof res.httpStatus === "number" ? res.httpStatus : -1;
  if (status === 0 || status >= 500) return "حدث خطأ بالخادم";
  return res.reason || "تعذر إرسال رمز التحقق";
}

export function mapToUserMessageDev(res: OtpResult): string {
  const message = mapToUserMessage(res);
  if (IS_DEV && !res.ok && res.code) {
    return `${message} (${res.code})`;
  }
  return message;
}

export type VerificationStatus = {
  phoneVerified: boolean;
  emailVerified: boolean;
  verificationMethod: "phone" | "email" | null;
};

export async function fetchVerificationStatus(userId: string): Promise<VerificationStatus> {
  try {
    const { data } = await withTimeout(
      supabase
        .from("profiles")
        .select("phone_verified, email_verified, verification_method")
        .eq("id", userId)
        .maybeSingle(),
      VERIFICATION_STATUS_TIMEOUT_MS,
      VERIFICATION_STATUS_TIMEOUT
    );
    const phoneVerified = (data as { phone_verified?: boolean } | null)?.phone_verified === true;
    const emailVerified = (data as { email_verified?: boolean } | null)?.email_verified === true;
    const methodRaw = (data as { verification_method?: string | null } | null)?.verification_method;
    const verificationMethod = methodRaw === "phone" || methodRaw === "email" ? methodRaw : null;
    return { phoneVerified, emailVerified, verificationMethod };
  } catch (e) {
    if ((e as Error)?.message === VERIFICATION_STATUS_TIMEOUT) {
      throw e;
    }
    return { phoneVerified: false, emailVerified: false, verificationMethod: null };
  }
}

export function isFullyVerified(status: VerificationStatus): boolean {
  return status.phoneVerified === true || status.emailVerified === true;
}
