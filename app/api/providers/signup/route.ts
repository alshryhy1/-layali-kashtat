import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const name = String(body?.name || "").trim();
    const phone = String(body?.phone || "").trim();
    const service_type = String(body?.service_type || "").trim();
    const city = String(body?.city || "").trim();

    // ✅ تعريف واحد فقط — حل جذري
    const accepted =
      body?.accepted === true ||
      body?.accepted === "true" ||
      body?.accepted === "on";

    if (!name)
      return jsonError(400, "invalid_name", "يرجى إدخال اسم مقدم الخدمة.");
    if (!phone)
      return jsonError(400, "invalid_phone", "يرجى إدخال رقم الجوال.");
    if (!service_type)
      return jsonError(400, "invalid_service", "يرجى اختيار نوع الخدمة.");
    if (!city)
      return jsonError(400, "invalid_city", "يرجى اختيار المدينة.");
    if (!accepted)
      return jsonError(
        400,
        "terms_not_accepted",
        "يجب الموافقة على الشروط والأحكام."
      );

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    const insertPayload: Record<string, any> = {
      name,
      phone,
      service_type,
      city,
      status: "pending",
      accepted, // ✅ محفوظ صراحة
      ip,
    };

    const { data, error } = await supabase
      .from("provider_requests")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      console.error("signup insert error:", error);
      return jsonError(
        500,
        "db_error",
        "تعذر حفظ الطلب بسبب خطأ في قاعدة البيانات."
      );
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (e) {
    console.error("signup fatal error:", e);
    return jsonError(500, "fatal_error", "حدث خطأ غير متوقع.");
  }
}
