import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

type Body = {
  name?: string;
  phone?: string;
  city?: string;
  serviceType?: string;
};

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function sendAdminEmail(subject: string, text: string) {
  const host = requireEnv("SMTP_HOST");
  const port = Number(requireEnv("SMTP_PORT"));
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");
  const to = requireEnv("ADMIN_EMAIL");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Layali Kashtat" <${user}>`,
    to,
    subject,
    text,
  });
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const city = String(body.city ?? "").trim();
    const serviceType = String(body.serviceType ?? "").trim();

    if (!name || !phone || !city || !serviceType) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("provider_requests")
      .insert({
        name,
        phone,
        city,
        service_type: serviceType,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // ✅ إرسال الإيميل بعد نجاح الحفظ
    await sendAdminEmail(
      "طلب تسجيل مقدم خدمة",
      `طلب جديد لتسجيل مقدم خدمة:\n\n` +
        `الاسم: ${name}\n` +
        `الجوال: ${phone}\n` +
        `نوع الخدمة: ${serviceType}\n` +
        `المدينة: ${city}\n` +
        `رقم الطلب: ${data.id}\n`
    );

    return NextResponse.json({ ok: true, id: data.id });
  } catch (e: any) {
    console.error("API ERROR:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
