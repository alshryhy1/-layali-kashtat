import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  name?: string;
  phone?: string;
  serviceType?: string;
  city?: string;
  agree?: boolean;
  locale?: "ar" | "en";
};

function bad(error: string, message: string, code = 400) {
  return NextResponse.json({ ok: false, error, message }, { status: code });
}

function getEnv(name: string) {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

function normalizePhone(v: string) {
  return (v || "").trim().replace(/\s+/g, "");
}

function makeRefCode() {
  // LK-000001 أو LK-4fd15ac (حسب الموجود عندك)
  return "LK-" + Math.random().toString(36).slice(2, 8);
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = getEnv("SUPABASE_URL");
    const SERVICE_ROLE = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return bad(
        "missing_env",
        "Missing env: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
        500
      );
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body) return bad("invalid_json", "Invalid JSON.");

    const name = (body.name || "").trim();
    const phone = normalizePhone(body.phone || "");
    const serviceType = (body.serviceType || "").trim();
    const city = (body.city || "").trim();
    const agree = body.agree === true;
    const locale = body.locale === "en" ? "en" : "ar";
    const isAr = locale === "ar";

    if (!agree) {
      return bad(
        "verification_required",
        isAr ? "التوثيق إلزامي لإرسال الطلب." : "Verification is required.",
        400
      );
    }

    if (!name || !phone || !serviceType || !city) {
      return bad(
        "missing_fields",
        isAr ? "فضلاً أكمل جميع الحقول." : "Please complete all fields.",
        400
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    // هل الرقم مسجل من قبل؟
    const { data: existing, error: selErr } = await supabase
      .from("provider_requests")
      .select("id,ref_code")
      .eq("phone", phone)
      .limit(1);

    if (selErr) {
      return NextResponse.json(
        { ok: false, error: "db_error", details: selErr.message },
        { status: 500 }
      );
    }

    if (existing && existing.length > 0) {
      return bad(
        "already_registered",
        isAr
          ? "هذا رقم الجوال مسجّل مسبقًا. تابع حالة طلبك."
          : "This phone number is already registered.",
        409
      );
    }

    const ref_code = makeRefCode();

    const { data, error: insErr } = await supabase
      .from("provider_requests")
      .insert([
        {
          name,
          phone,
          service_type: serviceType,
          city,
          status: "pending",
          locale,
          ref_code,
        },
      ])
      .select("ref_code")
      .single();

    if (insErr) {
      return NextResponse.json(
        { ok: false, error: "db_error", details: insErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, ref_code: data.ref_code },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "server_error", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}
