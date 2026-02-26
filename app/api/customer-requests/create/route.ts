import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-customer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(ok: boolean, data: any = {}, status = 200) {
  return NextResponse.json({ ok, ...data }, { status, headers: { "Cache-Control": "no-store" } });
}
function clean(v: unknown) {
  return String(v ?? "").trim();
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return json(false, { error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const city = clean(body?.city);
    const service_type = clean(body?.service_type);
    const notes = clean(body?.notes);
    if (!city || !service_type) return json(false, { error: "missing_fields" }, 400);

    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS customer_requests (
          id bigserial primary key,
          ref text unique,
          email text,
          phone text,
          city text,
          service_type text,
          status text,
          provider_status text,
          notes text,
          accepted_price_total numeric,
          created_at timestamptz default now()
        )
      `);
    } catch {}

    const ref = `REQ-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    await db.query(
      "INSERT INTO customer_requests (ref, email, phone, city, service_type, status, notes) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [ref, clean(session.email), clean(session.phone), city, service_type, "new", notes || null]
    );

    return json(true, { ref });
  } catch (e: any) {
    return json(false, { error: String(e?.message || e) }, 500);
  }
}
