import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  locale?: "ar" | "en" | string;
  name?: string;
  phone?: string;
  serviceType?: string;
  service_type?: string;
  city?: string;
  accepted?: boolean;
};

function pickFirstIp(v: string | null): string | null {
  if (!v) return null;
  const first = v.split(",")[0]?.trim();
  return first || null;
}

function getClientIp(req: Request): string | null {
  const xff = pickFirstIp(req.headers.get("x-forwarded-for"));
  if (xff) return xff;

  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim()) return cfIp.trim();

  return null;
}

function jsonError(status: number, error: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, message, ...(extra || {}) }, { status });
}

function normalizeToSaudi05(raw: string) {
  let s = String(raw || "").trim().replace(/[^\d]/g, "");

  if (s.startsWith("00966")) s = s.replace(/^00966/, "");
  if (s.startsWith("966")) s = s.replace(/^966/, "");

  if (s.length === 9 && s.startsWith("5")) s = `0${s}`;
  return s;
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const SERVICE_ROLE =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      "";
    const ANON =
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";

    if (!SUPABASE_URL) {
      return jsonError(500, "missing_env", "Missing env: SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL");
    }

    const supabaseKey = SERVICE_ROLE || ANON;
    if (!supabaseKey) {
      return jsonError(
        500,
        "missing_env",
        "Missing env: SUPABASE_SERVICE_ROLE_KEY (recommended) or SUPABASE_ANON_KEY"
      );
    }

    const supabase = createClient(SUPABASE_URL, supabaseKey, {
      auth: { persistSession: false },
    });

    const body = (await req.json().catch(() => null)) as Body | null;

    const localeRaw = String(body?.locale || "").trim();
    const locale = localeRaw === "en" ? "en" : "ar";

    const name = String(body?.name || "").trim();
    const phone = normalizeToSaudi05(String(body?.phone || ""));
    const service_type = String(body?.serviceType || body?.service_type || "").trim();
    const city = String(body?.city || "").trim();
   const accepted = body?.accepted === true || body?.accepted === "true" || body?.accepted === "on";
const accepted = body?.accepted === true || body?.accepted === "true" || body?.accepted === "on";


    if (!name) return jsonError(400, "invalid_name", "يرجى إدخال اسم مقدم الخدمة.");
    if (!phone) return jsonError(400, "invalid_phone", "يرجى إدخال رقم الجوال.");
    if (!/^05\d{8}$/.test(phone)) {
      return jsonError(400, "invalid_phone", "رقم الجوال غير صحيح. مثال: 05xxxxxxxx");
    }
    if (!service_type) return jsonError(400, "invalid_service", "يرجى اختيار نوع الخدمة من القائمة.");
    if (!city) return jsonError(400, "invalid_city", "يرجى اختيار المدينة من القائمة.");
    if (!accepted) return jsonError(400, "must_accept", "يلزم الموافقة على الشروط قبل الإرسال.");

    const ip = getClientIp(req);

    const insertPayload: Record<string, any> = {
      locale,
      name,
      phone,
      service_type,
      city,
      status: "pending",
      accepted, // ✅ حفظ الموافقة في الجدول
      ip: ip ?? null, // ✅ إذا ما توفر نخليه null
    };

    const { data, error } = await supabase
      .from("provider_requests")
      .insert(insertPayload)
      .select("id, ref_code")
      .single();

    if (error) {
      return jsonError(500, "db_insert_failed", "تعذر حفظ الطلب بسبب خطأ في قاعدة البيانات.", {
        db_code: (error as any)?.code || null,
        db_message: (error as any)?.message || null,
        db_details: (error as any)?.details || null,
      });
    }

    return NextResponse.json({
      ok: true,
      id: data?.id ?? null,
      ref: data?.ref_code ?? null,
    });
  } catch (e: any) {
    return jsonError(500, "server_error", "تعذر إرسال الطلب الآن. حاول لاحقًا.", {
      hint: String(e?.message || e || ""),
    });
  }
}
