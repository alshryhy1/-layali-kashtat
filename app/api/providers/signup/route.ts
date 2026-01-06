import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import nodemailer from "nodemailer";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const SMTP_FROM = getEnv("SMTP_FROM") || getEnv("MAIL_FROM") || (getEnv("SMTP_USER") ? `"Layali Kashtat" <${getEnv("SMTP_USER")}>` : "");
  const ADMIN_EMAIL = getEnv("ADMIN_EMAIL") || getEnv("ADMIN_NOTIFY_EMAIL");

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
  const approveKey = process.env.ADMIN_SECRET || "lk_admin_secret_123";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://layali-kashtat.vercel.app";
  const approveLink = `${baseUrl}/api/providers/approve?id=${payload.id}&key=${approveKey}`;

  const text = [
    "تم استلام طلب تسجيل مقدم خدمة جديد.",
    "",
    `رقم الطلب: ${payload.id}`,
    `الاسم: ${payload.name}`,
    `الجوال: ${payload.phone}`,
    `نوع الخدمة: ${payload.service_type}`,
    `المدينة: ${payload.city}`,
    "",
    `رابط القبول: ${approveLink}`,
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
      <div style="margin-top:20px">
        <a href="${approveLink}" style="background:#111;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block">قبول مقدم الخدمة</a>
      </div>
    </div>
  `;

  const bccRaw = getEnv("PROVIDER_DISPATCH_BCC") || getEnv("PROVIDER_NOTIFY_BCC");
  const bccList = bccRaw
    ? bccRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  await transporter.sendMail({
    from: SMTP_FROM,
    to: ADMIN_EMAIL,
    bcc: bccList.length ? bccList : undefined,
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

function normalizeCityAr(input: string) {
  const s = String(input || "").trim();
  const m = s.replace(/\s+/g, " ").toLowerCase();
  const maps: Record<string, string[]> = {
    "مكة المكرمة": ["مكة", "مكه", "مكه المكرمه", "مكة المكرمة"],
    "المدينة المنورة": ["المدينة", "المدينه", "المدينه المنوره", "المدينة المنورة"],
    "جدة": ["جدة", "جده"],
    "العلا": ["العلا", "العلاء"],
    "حائل": ["حائل", "حايل"],
    "الرياض": ["الرياض", "رياض"],
    "القصيم": ["القصيم", "قصيم"],
    "تبوك": ["تبوك"],
    "الجوف": ["الجوف"],
    "ينبع": ["ينبع"],
    "أملج": ["أملج", "املج"],
    "حقل": ["حقل"],
    "عرعر": ["عرعر"],
  };
  let canon = s;
  for (const [k, variants] of Object.entries(maps)) {
    if (variants.includes(m)) {
      canon = k;
      break;
    }
  }
  return canon;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const phone = String(body?.phone || "").trim();
    const service_type_single = String(body?.service_type || "").trim();
    const service_types_raw = Array.isArray(body?.service_types) ? body?.service_types : [];
    const allowed = [
      "كشته بريه رمليه",
      "كشته بريه ساحليه",
      "كشته بريه جبليه",
      "مخيم",
      "شاليه",
      "مزرعة",
      "استراحة",
      "Desert (sandy)",
      "Desert (coastal)",
      "Desert (mountain)",
      "Camp",
      "Chalet",
      "Farm",
      "Rest area",
    ];
    let service_type = "";
    try {
      const picked = (service_types_raw as any[])
        .map((x) => String(x || "").trim())
        .filter((x) => allowed.includes(x));
      const uniq = Array.from(new Set(picked));
      if (uniq.length > 0) {
        if (uniq.length > 3) uniq.splice(3);
        service_type = uniq.join(", ");
      } else if (service_type_single) {
        service_type = allowed.includes(service_type_single) ? service_type_single : "";
      }
    } catch {
      service_type = service_type_single;
    }
    const cityRaw = String(body?.city || "").trim();
    const city = normalizeCityAr(cityRaw);
    const password = String(body?.password || "").trim();

    const accepted =
      body?.accepted === true ||
      body?.accepted === "true" ||
      body?.accepted === "on";

    if (!name) return jsonError(400, "invalid_name", "يرجى إدخال اسم مقدم الخدمة.");
    if (!phone) return jsonError(400, "invalid_phone", "يرجى إدخال رقم الجوال.");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return jsonError(400, "invalid_email", "يرجى إدخال بريد إلكتروني صحيح.");
    if (!password || password.length < 6) return jsonError(400, "invalid_password", "يرجى إدخال كلمة مرور (6 أحرف على الأقل).");
    if (!service_type) return jsonError(400, "invalid_service", "يرجى اختيار نوع الخدمة (حتى 3 أنواع).");
    if (!city) return jsonError(400, "invalid_city", "يرجى اختيار المدينة.");
    if (!accepted)
      return jsonError(400, "terms_not_accepted", "يجب الموافقة على الشروط والأحكام.");

    let insertedId: number | null = null;
    try {
      await db.query("ALTER TABLE provider_requests ADD COLUMN IF NOT EXISTS email text");
      await db.query("ALTER TABLE provider_requests ADD COLUMN IF NOT EXISTS password_hash text");
      
      const salt = crypto.randomBytes(16).toString("hex");
      const hash = crypto.scryptSync(password, salt, 64).toString("hex");
      const password_hash = `${salt}:${hash}`;

      const r = await db.query(
        "INSERT INTO provider_requests (name, email, phone, service_type, city, status, accepted, password_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
        [name, email, phone, service_type, city, "pending", accepted, password_hash]
      );
      insertedId = Number(r.rows[0]?.id || 0);
      if (!insertedId) throw new Error("insert_failed");
    } catch (e) {
      console.error("signup insert error:", e);
      return jsonError(500, "db_error", "تعذر حفظ الطلب بسبب خطأ في قاعدة البيانات.");
    }

    // ✅ إرسال الإيميل فقط بعد نجاح التسجيل + إظهار سبب الفشل بوضوح
    let mail_ok = false;
    let mail_error = "";
    let mail_debug: any = null;

    try {
      mail_debug = await sendAdminEmail({
        id: String(insertedId),
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
      id: insertedId,
      mail_ok,
      mail_error: mail_ok ? "" : mail_error,
      mail_debug: mail_ok ? mail_debug : null,
    });
  } catch (e) {
    console.error("signup fatal error:", e);
    return jsonError(500, "fatal_error", "حدث خطأ غير متوقع.");
  }
}
