import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

function getEnv(name: string) {
  return String(process.env[name] || "").trim();
}

function maskEmail(e: string) {
  const s = String(e || "").trim();
  const at = s.indexOf("@");
  if (at <= 1) return s;
  return `${s.slice(0, 2)}***${s.slice(at)}`;
}

function stringifyErr(err: any) {
  try {
    if (!err) return "unknown_error";
    if (typeof err === "string") return err;
    const msg = err?.message ? String(err.message) : "";
    const code = err?.code ? String(err.code) : "";
    const response = err?.response ? String(err.response) : "";
    const responseCode = err?.responseCode ? String(err.responseCode) : "";
    const stack = err?.stack ? String(err.stack) : "";
    const best =
      [code && `code=${code}`, responseCode && `responseCode=${responseCode}`, msg, response]
        .filter(Boolean)
        .join(" | ") || "unknown_error";
    return stack ? `${best}\n${stack}` : best;
  } catch {
    return "unknown_error";
  }
}

async function sendAdminEmail(payload: {
  id: string;
  name: string;
  phone: string;
  service_type: string;
  city: string;
}) {
  const SMTP_HOST = getEnv("SMTP_HOST");
  const SMTP_PORT_RAW = getEnv("SMTP_PORT");
  const SMTP_PORT = Number(SMTP_PORT_RAW || "587");
  const SMTP_USER = getEnv("SMTP_USER");
  const SMTP_PASS = getEnv("SMTP_PASS");
  const SMTP_FROM = getEnv("SMTP_FROM");
  const ADMIN_EMAIL = getEnv("ADMIN_EMAIL");

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM || !ADMIN_EMAIL) {
    throw new Error(
      `Missing env: SMTP_HOST=${SMTP_HOST ? "ok" : "missing"}; SMTP_PORT=${SMTP_PORT_RAW ? "ok" : "missing"}; SMTP_USER=${SMTP_USER ? "ok" : "missing"}; SMTP_PASS=${SMTP_PASS ? "ok" : "missing"}; SMTP_FROM=${SMTP_FROM ? "ok" : "missing"}; ADMIN_EMAIL=${ADMIN_EMAIL ? "ok" : "missing"}`
    );
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // 465 => SSL, 587 => STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const subject = `طلب تسجيل مقدم خدمة جديد (#${payload.id})`;

  const text = [
    "تم استلام طلب تسجيل مقدم خدمة جديد.",
    "",
    `رقم الطلب: ${payload.id}`,
    `الاسم: ${payload.name}`,
    `الجوال: ${payload.phone}`,
    `نوع الخدمة: ${payload.service_type}`,
    `المدينة: ${payload.city}`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.8">
      <h2 style="margin:0 0 10px">طلب تسجيل مقدم خدمة جديد</h2>
      <div style="padding:12px;border:1px solid #eee;border-radius:10px;background:#fafafa">
        <div><strong>رقم الطلب:</strong> ${escapeHtml(payload.id)}</div>
        <div><strong>الاسم:</strong> ${escapeHtml(payload.name)}</div>
        <div><strong>الجوال:</strong> ${escapeHtml(payload.phone)}</div>
        <div><strong>نوع الخدمة:</strong> ${escapeHtml(payload.service_type)}</div>
        <div><strong>المدينة:</strong> ${escapeHtml(payload.city)}</div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: SMTP_FROM,
    to: ADMIN_EMAIL,
    subject,
    text,
    html,
  });

  return {
    smtp_host: SMTP_HOST,
    smtp_port: SMTP_PORT,
    smtp_user: maskEmail(SMTP_USER),
    admin_to: maskEmail(ADMIN_EMAIL),
    from: SMTP_FROM,
  };
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const name = String(body?.name || "").trim();
    const phone = String(body?.phone || "").trim();
    const service_type = String(body?.service_type || "").trim();
    const city = String(body?.city || "").trim();

    const accepted =
      body?.accepted === true ||
      body?.accepted === "true" ||
      body?.accepted === "on";

    if (!name) return jsonError(400, "invalid_name", "يرجى إدخال اسم مقدم الخدمة.");
    if (!phone) return jsonError(400, "invalid_phone", "يرجى إدخال رقم الجوال.");
    if (!service_type) return jsonError(400, "invalid_service", "يرجى اختيار نوع الخدمة.");
    if (!city) return jsonError(400, "invalid_city", "يرجى اختيار المدينة.");
    if (!accepted)
      return jsonError(400, "terms_not_accepted", "يجب الموافقة على الشروط والأحكام.");

    const insertPayload: Record<string, any> = {
      name,
      phone,
      service_type,
      city,
      status: "pending",
      accepted,
    };

    const { data, error } = await supabase
      .from("provider_requests")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      console.error("signup insert error:", error);
      return jsonError(500, "db_error", "تعذر حفظ الطلب بسبب خطأ في قاعدة البيانات.");
    }

    // ✅ إرسال الإيميل فقط بعد نجاح التسجيل + إظهار سبب الفشل بوضوح
    let mail_ok = false;
    let mail_error = "";
    let mail_debug: any = null;

    try {
      mail_debug = await sendAdminEmail({
        id: String(data.id),
        name,
        phone,
        service_type,
        city,
      });
      mail_ok = true;
    } catch (mailErr) {
      mail_error = stringifyErr(mailErr);
      console.error("signup email error:", mail_error);
    }

    return NextResponse.json({
      ok: true,
      id: data.id,
      mail_ok,
      mail_error: mail_ok ? "" : mail_error,
      mail_debug: mail_ok ? mail_debug : null,
    });
  } catch (e) {
    console.error("signup fatal error:", e);
    return jsonError(500, "fatal_error", "حدث خطأ غير متوقع.");
  }
}
