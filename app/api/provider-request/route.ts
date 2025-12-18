import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  name: string;
  phone: string;
  service_type: string;
  city: string;
};

function cleanText(v: unknown) {
  return String(v ?? "").trim();
}

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function sendEmail(subject: string, text: string) {
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
    const SUPABASE_URL =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env" },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => null)) as Payload | null;
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const name = cleanText(body.name);
    const phone = cleanText(body.phone);
    const service_type = cleanText(body.service_type);
    const city = cleanText(body.city);

    if (!name || !phone || !service_type || !city) {
      return NextResponse.json(
        { ok: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { error } = await supabase.from("provider_requests").insert([
      { name, phone, service_type, city },
    ]);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    await sendEmail(
      "طلب تسجيل مقدم خدمة",
      `الاسم: ${name}\nالجوال: ${phone}\nنوع الخدمة: ${service_type}\nالمدينة: ${city}`
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
