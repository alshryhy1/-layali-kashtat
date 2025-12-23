import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  name?: string;
  phone?: string;
  serviceType?: string; // من الفورم
  service_type?: string; // احتياط لو جت بهذا الاسم
  city?: string;
  accepted?: boolean;
};

function pickFirstIp(v: string | null): string | null {
  if (!v) return null;
  // x-forwarded-for قد يحتوي عدة IPs
  const first = v.split(",")[0]?.trim();
  if (!first) return null;
  return first;
}

function getClientIp(req: Request): string | null {
  // أكثر الهيدرز شيوعًا في Vercel/Cloudflare/Proxy
  const xff = pickFirstIp(req.headers.get("x-forwarded-for"));
  if (xff) return xff;

  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim()) return cfIp.trim();

  return null;
}

function jsonError(status: number, error: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { ok: false, error, message, ...(extra || {}) },
    { status }
  );
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

    // الأفضل دائمًا Service Role داخل Route (عشان RLS ما يكسر التسجيل)
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

    const name = String(body?.name || "").trim();
    const phone = String(body?.phone || "").trim();
    const service_type = String(body?.serviceType || body?.service_type || "").trim();
    const city = String(body?.city || "").trim();
    const accepted = Boolean(body?.accepted);

    // تحقق نهائي (لا يعتمد على الواجهة)
    if (!name) return jsonError(400, "invalid_name", "يرجى إدخال اسم مقدم الخدمة.");
    if (!phone) return jsonError(400, "invalid_phone", "يرجى إدخال رقم الجوال.");
    // رقم سعودي 10 أرقام يبدأ بـ 05
    if (!/^05\d{8}$/.test(phone)) {
      return jsonError(400, "invalid_phone", "رقم الجوال غير صحيح. مثال: 05xxxxxxxx");
    }
    if (!service_type) return jsonError(400, "invalid_service", "يرجى اختيار نوع الخدمة من القائمة.");
    if (!city) return jsonError(400, "invalid_city", "يرجى اختيار المدينة من القائمة.");
    if (!accepted) return jsonError(400, "must_accept", "يلزم الموافقة على الشروط قبل الإرسال.");

    const ip = getClientIp(req); // ممكن تكون null (وهذا طبيعي)

    // إدخال ثابت:
    // - status نرسله صراحة (حتى لو فيه default)
    // - ip نرسله إذا توفر، وإذا ما توفر نخليه null (وقاعدة البيانات لازم تتقبل)
    const insertPayload: Record<string, any> = {
  name,
  phone,
  service_type,
  city,
  status: "pending",
  accepted,          // ✅ هذا السطر
  ip: ip ?? null,
};
};

    const { data, error } = await supabase
      .from("provider_requests")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      // نرجّع سبب مفهوم بدل server_error
      // ونضيف تفاصيل تقنية بسيطة للمساعدة (بدون بيانات حساسة)
      return jsonError(500, "db_insert_failed", "تعذر حفظ الطلب بسبب خطأ في قاعدة البيانات.", {
        db_code: error.code || null,
        db_message: error.message || null,
        db_details: error.details || null,
      });
    }

    return NextResponse.json({ ok: true, id: data?.id || null });
  } catch (e: any) {
    return jsonError(500, "server_error", "تعذر إرسال الطلب الآن. حاول لاحقًا.", {
      hint: String(e?.message || e || ""),
    });
  }
}
