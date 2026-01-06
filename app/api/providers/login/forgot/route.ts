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

function genTempPassword(len = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < len; i++) {
    const r = crypto.randomInt(0, alphabet.length);
    s += alphabet[r];
  }
  return s;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonError(400, "invalid_email", "يرجى إدخال بريد إلكتروني صحيح.");
    }

    const r = await db.query(
      "SELECT id, name, email, status FROM provider_requests WHERE email = $1 LIMIT 1",
      [email]
    );
    if (r.rows.length === 0) {
      return NextResponse.json({ ok: true, mail_ok: true });
    }

    const user = r.rows[0];
    if (String(user.status || "") !== "approved") {
      return jsonError(403, "not_approved", "الحساب غير معتمد.");
    }

    const temp = genTempPassword(10);
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(temp, salt, 64).toString("hex");
    const password_hash = `${salt}:${hash}`;

    await db.query("UPDATE provider_requests SET password_hash = $1 WHERE id = $2", [
      password_hash,
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

    const subject = "استعادة كلمة المرور";
    const text = [
      "تم إنشاء كلمة مرور مؤقتة لحسابك كمقدم خدمة في ليالي كشتات.",
      "",
      `البريد: ${user.email}`,
      `كلمة المرور المؤقتة: ${temp}`,
      "",
      "يمكنك تسجيل الدخول ثم تغييرها لاحقًا عند توفير صفحة تعديل كلمة المرور.",
    ].join("\n");
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.8">
        <h2 style="margin:0 0 10px">استعادة كلمة المرور</h2>
        <div style="padding:12px;border:1px solid #eee;border-radius:10px;background:#fafafa">
          <div><strong>البريد:</strong> ${user.email}</div>
          <div><strong>كلمة المرور المؤقتة:</strong> ${temp}</div>
        </div>
        <p style="margin-top:12px">يمكنك استخدامها للدخول إلى لوحة مقدم الخدمة ثم تغييرها لاحقًا.</p>
      </div>
    `;

    await transporter.sendMail({
      from: SMTP_FROM,
      to: user.email,
      subject,
      text,
      html,
    });

    return NextResponse.json({ ok: true, mail_ok: true });
  } catch (e) {
    return jsonError(500, "server_error", "حدث خطأ غير متوقع.");
  }
}
