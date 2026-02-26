import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

function json(ok: boolean, data: any, status = 200) {
  return NextResponse.json({ ok, ...data }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const intentionId = String(body?.intention_id || "").trim();
    if (!intentionId) return json(false, { error: "missing_intention_id" }, 400);

    const API_KEY = (process.env.PAYMOB_API_KEY || "").trim();
    if (!API_KEY) return json(false, { error: "missing_api_key" }, 500);

    const res = await fetch(`https://ksa.paymob.com/v1/intention/${encodeURIComponent(intentionId)}/`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return json(false, { error: "provider_error", details: data }, 200);

    const status = String(data?.status || "").toLowerCase();
  const isPaid = ["succeeded", "success", "completed"].includes(status);
  const isFailed = ["failed", "voided", "canceled"].includes(status);

    try {
    const cur = await db.query("SELECT status FROM orders WHERE paymob_intention_id = $1 LIMIT 1", [intentionId]);
    const current = String(cur.rows?.[0]?.status || "pending").toLowerCase();
    let next = current;
    if (isPaid) next = "paid";
    else if (isFailed) next = "failed";
    else next = "pending"; // keep pending for other statuses
    await db.query("UPDATE orders SET status = $2, paymob_status = $3, updated_at = now() WHERE paymob_intention_id = $1", [intentionId, next, status]);
    } catch {}

    return json(true, { paid: isPaid, status }, 200);
  } catch (e: any) {
    return json(false, { error: String(e?.message || e) }, 500);
  }
}
