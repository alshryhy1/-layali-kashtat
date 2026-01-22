import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import nodemailer from "nodemailer";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getEnv(name: string) {
  return String(process.env[name] || "").trim();
}

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

function getEmailTemplate(locale: "ar" | "en", resetLink: string) {
  const isAr = locale === "ar";
  const direction = isAr ? "rtl" : "ltr";
  const fontFamily = isAr ? "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" : "'Helvetica Neue', Helvetica, Arial, sans-serif";
  
  const title = isAr ? "استعادة كلمة المرور" : "Password Reset";
  const greeting = isAr ? "مرحباً شريكنا العزيز،" : "Hello Partner,";
  const message = isAr 
    ? "لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في ليالي كشتات." 
    : "We received a request to reset your password for your Layali Kashtat account.";
  const buttonText = isAr ? "تعيين كلمة مرور جديدة" : "Set New Password";
  const subText = isAr 
    ? "إذا لم تقم بهذا الطلب، يمكنك تجاهل هذه الرسالة بأمان. هذا الرابط صالح لمدة ساعة واحدة فقط."
    : "If you didn't request this, you can safely ignore this email. This link is valid for 1 hour only.";
  const copyLinkText = isAr ? "أو انسخ الرابط التالي:" : "Or copy this link:";
  const footerText = isAr 
    ? "© ليالي كشتات. جميع الحقوق محفوظة." 
    : "© Layali Kashtat. All rights reserved.";

  return `
    <!DOCTYPE html>
    <html lang="${locale}" dir="${direction}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: ${fontFamily};">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; color: #111; font-size: 24px; font-weight: 800;">Layali Kashtat</h1>
        </div>

        <!-- Card -->
        <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <h2 style="margin-top: 0; margin-bottom: 20px; color: #111; font-size: 20px;">${title}</h2>
          
          <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">${greeting}</p>
          
          <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.6;">
            ${message}
          </p>

          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${resetLink}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              ${buttonText}
            </a>
          </div>

          <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
            ${subText}
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
            <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px;">${copyLinkText}</p>
            <a href="${resetLink}" style="color: #2563eb; text-decoration: none; font-size: 13px; word-break: break-all;">
              ${resetLink}
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px;">
          <p style="margin: 0; color: #9ca3af; font-size: 13px;">
            ${footerText}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    const locale = String(body?.locale || "ar").toLowerCase() === "en" ? "en" : "ar";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonError(400, "invalid_email", "يرجى إدخال بريد إلكتروني صحيح.");
    }

    const r = await db.query(
      "SELECT id, name, email, status FROM provider_requests WHERE email = $1 LIMIT 1",
      [email]
    );
    if (r.rows.length === 0) {
      console.log(`[Forgot] Email not found: ${email}`);
      return NextResponse.json({ ok: true, mail_ok: true });
    }

    const user = r.rows[0];
    console.log(`[Forgot] User found: ${user.id}, status: ${user.status}`);

    if (String(user.status || "") !== "approved") {
      console.log(`[Forgot] User not approved`);
      return jsonError(403, "not_approved", "الحساب غير معتمد.");
    }

    // Ensure columns exist (Safe migration)
    try {
      await db.query(`
        ALTER TABLE provider_requests 
        ADD COLUMN IF NOT EXISTS reset_token text,
        ADD COLUMN IF NOT EXISTS reset_token_expiry timestamptz
      `);
    } catch (e) {
      console.error("Migration error:", e);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour

    await db.query("UPDATE provider_requests SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3", [
      resetToken,
      expiry,
      user.id,
    ]);

    const SMTP_HOST = getEnv("SMTP_HOST");
    const SMTP_PORT_RAW = getEnv("SMTP_PORT");
    const SMTP_PORT = Number(SMTP_PORT_RAW || "587");
    const SMTP_USER = getEnv("SMTP_USER");
    const SMTP_PASS = getEnv("SMTP_PASS");
    const SMTP_FROM =
      getEnv("SMTP_FROM") ||
      getEnv("MAIL_FROM") ||
      (getEnv("SMTP_USER") ? `"Layali Kashtat" <${getEnv("SMTP_USER")}>` : "");

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
      return jsonError(500, "smtp_missing", "إعدادات البريد غير مكتملة.");
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/${locale}/providers/reset-password?token=${resetToken}`;

    const subject = locale === "ar" ? "استعادة كلمة المرور - ليالي كشتات" : "Password Reset - Layali Kashtat";
    
    // Plain text version fallback
    const text = locale === "ar" 
      ? [
          "طلب استعادة كلمة المرور لحسابك في ليالي كشتات.",
          "",
          `اضغط على الرابط التالي لتعيين كلمة مرور جديدة:`,
          resetLink,
          "",
          "هذا الرابط صالح لمدة ساعة واحدة.",
          "إذا لم تطلب هذا التغيير، يمكنك تجاهل هذه الرسالة.",
        ].join("\n")
      : [
          "Password reset request for your Layali Kashtat account.",
          "",
          `Click the following link to set a new password:`,
          resetLink,
          "",
          "This link is valid for 1 hour.",
          "If you did not request this, please ignore this email.",
        ].join("\n");

    const html = getEmailTemplate(locale, resetLink);

    await transporter.sendMail({
      from: SMTP_FROM,
      to: user.email,
      subject,
      text,
      html,
    });

    return NextResponse.json({ ok: true, mail_ok: true });
  } catch (e) {
    console.error("Forgot API Error:", e);
    return jsonError(500, "server_error", "حدث خطأ غير متوقع.");
  }
}
