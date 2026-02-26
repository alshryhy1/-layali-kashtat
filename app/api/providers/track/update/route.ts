import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProviderSession } from "@/lib/auth-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(ok: boolean, data: any, status = 200) {
  return NextResponse.json({ ok, ...data }, { status, headers: { "Cache-Control": "no-store" } });
}

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function normalizeStatus(v: string) {
  const s = clean(v).toLowerCase();
  const allowed = new Set(["accepted", "en_route", "arrived", "in_trip", "completed"]);
  return allowed.has(s) ? s : "accepted";
}

export async function POST(req: Request) {
  try {
    const session = await getProviderSession();
    if (!session) return json(false, { error: "unauthorized" }, 401);

    const body = await req.json().catch(() => null);
    const ref = clean(body?.ref);
    const status = normalizeStatus(clean(body?.status));
    const lat = Number(body?.lat);
    const lng = Number(body?.lng);
    const polyline = Array.isArray(body?.polyline) ? body.polyline : null;
    const eta = Number(body?.eta);

    if (!ref) return json(false, { error: "missing_ref" }, 400);

    try {
      await db.query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS provider_status text DEFAULT 'accepted'");
      await db.query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS provider_last_lat numeric");
      await db.query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS provider_last_lng numeric");
      await db.query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS provider_last_at timestamptz");
      await db.query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS route_polyline jsonb");
      await db.query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS route_eta integer");
    } catch {}

    let lastAt: Date | null = null;
    try {
      const q = await db.query("SELECT provider_last_at FROM customer_requests WHERE ref = $1 AND accepted_provider_id = $2 LIMIT 1", [ref, session.id]);
      const v = q.rows?.[0]?.provider_last_at;
      if (v) lastAt = new Date(v);
    } catch {}
    if (lastAt) {
      const diffMs = Date.now() - lastAt.getTime();
      if (diffMs < 5000) return json(false, { error: "rate_limited" }, 429);
    }

    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
    const polyJson = polyline ? JSON.stringify(polyline) : null;
    const etaVal = Number.isFinite(eta) ? eta : null;

    try {
      await db.query(
        "UPDATE customer_requests SET provider_status = $2, provider_last_lat = $3, provider_last_lng = $4, provider_last_at = now(), route_polyline = $5, route_eta = $6, updated_at = now() WHERE ref = $1 AND accepted_provider_id = $7",
        [ref, status, hasCoords ? lat : null, hasCoords ? lng : null, polyJson, etaVal, session.id]
      );
    } catch (e) {
      return json(false, { error: "db_update_failed" }, 500);
    }

    try {
      await db.query("CREATE TABLE IF NOT EXISTS status_history (id bigserial primary key, ref text, event text, provider_id bigint, note text, created_at timestamptz default now())");
      const noteParts = [
        hasCoords ? `lat=${lat}` : "",
        hasCoords ? `lng=${lng}` : "",
        etaVal !== null ? `eta=${etaVal}` : "",
      ].filter(Boolean);
      const note = noteParts.join(" ");
      await db.query(
        "INSERT INTO status_history (ref, event, provider_id, note) VALUES ($1,$2,$3,$4)",
        [ref, `provider_status:${status}`, session.id, note || null]
      );
    } catch {}

    return json(true, { updated: true, status }, 200);
  } catch (e: any) {
    return json(false, { error: e?.message || "server_error" }, 500);
  }
}
