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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const ref = safe(body?.ref);
    const providerId = parseInt(String(body?.provider_id || "0"), 10);
    const reason = safe(body?.reason || "");

    if (!ref || !providerId || providerId <= 0) {
      return json(false, { error: "missing_params" }, 400);
    }

    try {
      await db.query(
        "CREATE TABLE IF NOT EXISTS provider_responses (id bigserial primary key, ref text, provider_id bigint, response text, reason text, created_at timestamptz default now())"
      );
      await db.query(
        "INSERT INTO provider_responses (ref, provider_id, response, reason) VALUES ($1, $2, 'rejected', $3)",
        [ref, providerId, reason]
      );
      await db.query(
        "CREATE TABLE IF NOT EXISTS status_history (id bigserial primary key, ref text, event text, provider_id bigint, note text, created_at timestamptz default now())"
      );
      await db.query(
        "INSERT INTO status_history (ref, event, provider_id, note) VALUES ($1,'rejected',$2,$3)",
        [ref, providerId, reason]
      );
    } catch (e) {
      console.error("reject log error:", e);
      return json(false, { error: "db_error" }, 500);
    }

    return json(true, { message: "rejected" });
  } catch (e: any) {
    return json(false, { error: String(e?.message || e) }, 500);
  }
}
