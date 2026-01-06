import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(ok: boolean, data: any = {}, status = 200) {
  return NextResponse.json({ ok, ...data }, { status });
}

function safe(v: unknown) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ref = safe(url.searchParams.get("ref"));
    const providerIdRaw = safe(url.searchParams.get("provider_id"));
    const providerId = parseInt(providerIdRaw || "0", 10);

    if (!ref || !providerId || providerId <= 0) {
      return json(false, { error: "missing_params" }, 400);
    }

    let rq: any = null;
    try {
      const r = await db.query(
        "SELECT id, ref, city, service_type, status, created_at, group_type, people_count, cooking, equip, notes FROM customer_requests WHERE ref = $1 LIMIT 1",
        [ref]
      );
      rq = r.rows[0] || null;
    } catch {
      return json(false, { error: "db_error" }, 500);
    }

    if (!rq) return json(false, { error: "not_found" }, 404);

    // التحقق من صلاحية المقدم (اختياري هنا للعرض فقط، لكن يفضل التأكد أنه مطابق)
    let pv: any = null;
    try {
      const r2 = await db.query(
        "SELECT id, city, service_type, status FROM provider_requests WHERE id = $1 LIMIT 1",
        [providerId]
      );
      pv = r2.rows[0] || null;
    } catch {
      return json(false, { error: "db_error" }, 500);
    }

    if (!pv) return json(false, { error: "provider_not_found" }, 404);

    // لا نمنع العرض حتى لو اختلفت المدينة، فقط نعرض البيانات
    // لكن يفضل التحقق البسيط
    const cityRq = normalizeCityAr(String(rq.city || ""));
    const cityPv = normalizeCityAr(String(pv.city || ""));
    const isMatchingCity = cityRq === cityPv;

    return json(true, {
      request: rq,
      provider_status: pv.status,
      is_matching_city: isMatchingCity,
    });
  } catch (e: any) {
    return json(false, { error: String(e?.message || e) }, 500);
  }
}
