import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(ok: boolean, data: any, status = 200) {
  return NextResponse.json({ ok, ...data }, { status, headers: { "Cache-Control": "no-store" } });
}

function verifySignature(raw: string, secret: string, sigHeader: string) {
  if (!secret || !sigHeader) return false;
  const h = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(sigHeader));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const secret = (process.env.PAYMOB_WEBHOOK_SECRET || "").trim();
    if (!secret) return json(false, { error: "missing_webhook_secret" }, 500);

    const sig = req.headers.get("x-paymob-signature") || req.headers.get("x-signature") || "";
    const raw = await req.text();
    let payload: any = {};
    try {
      payload = JSON.parse(raw);
    } catch {}

    const valid = verifySignature(raw, secret, String(sig));
    if (!valid) return json(false, { error: "invalid_signature" }, 401);

    // Idempotency key derived from payload content
    const eventId =
      String(payload?.event_id || payload?.transaction_id || "").trim() ||
      crypto.createHash("sha256").update(raw).digest("hex");
    try {
      await db.query("CREATE TABLE IF NOT EXISTS paymob_events (id bigserial primary key, event_id text unique, intention_id text, status text, amount_cents integer, currency text, created_at timestamptz default now())");
      const ins = await db.query("INSERT INTO paymob_events (event_id, intention_id, status, amount_cents, currency) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (event_id) DO NOTHING RETURNING id", [
        eventId,
        String(payload?.id || payload?.intention_id || "").trim() || null,
        String(payload?.status || "").trim() || null,
        Number(payload?.amount_cents ?? payload?.amount ?? null) || null,
        String(payload?.currency || "").trim() || null,
      ]);
      if (ins.rows.length === 0) {
        return json(true, { received: true, deduped: true }, 200);
      }
    } catch {}

    const intentionId = String(payload?.id || payload?.intention_id || "").trim();
    const statusRaw = String(payload?.status || "").toLowerCase();
    if (!intentionId) return json(false, { error: "missing_intention_id" }, 400);

    const paid = ["succeeded", "success", "completed", "paid"].includes(statusRaw);

    try {
      await db.query("CREATE INDEX IF NOT EXISTS idx_orders_intention ON orders (paymob_intention_id)");
      await db.query("CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status)");
    } catch {}

    // Load order for verification
    let orderRow: any = null;
    try {
      const q = await db.query("SELECT id, amount, currency, status FROM orders WHERE paymob_intention_id = $1 LIMIT 1", [intentionId]);
      orderRow = q.rows[0] || null;
      if (!orderRow) return json(false, { error: "order_not_found" }, 404);
    } catch {
      return json(false, { error: "db_error" }, 500);
    }

    // Amount/currency verification when provided
    const amountCents = Number(payload?.amount_cents ?? payload?.amount ?? NaN);
    const currency = String(payload?.currency || "").toUpperCase();
    if (Number.isFinite(amountCents) && amountCents > 0) {
      const expected = Math.round(Number(orderRow.amount) * 100);
      if (expected !== amountCents) {
        try {
          await db.query("INSERT INTO audit_logs (event, status, meta_json) VALUES ($1,$2,$3)", ["paymob_webhook_amount_mismatch", statusRaw, JSON.stringify({ intention_id: intentionId, got: amountCents, expected })]);
        } catch {}
        return json(false, { error: "amount_mismatch" }, 400);
      }
    }
    if (currency && orderRow.currency && String(orderRow.currency).toUpperCase() !== currency) {
      try {
        await db.query("INSERT INTO audit_logs (event, status, meta_json) VALUES ($1,$2,$3)", ["paymob_webhook_currency_mismatch", statusRaw, JSON.stringify({ intention_id: intentionId, got: currency, expected: String(orderRow.currency).toUpperCase() })]);
      } catch {}
      return json(false, { error: "currency_mismatch" }, 400);
    }

    // Do not re-update already paid orders
    if (String(orderRow.status || "").toLowerCase() === "paid") {
      return json(true, { received: true, already_paid: true }, 200);
    }

    // Update order record respecting pending state
    try {
      let nextStatus = String(orderRow.status || "pending").toLowerCase();
      if (paid) nextStatus = "paid";
      else if (["failed", "voided", "canceled"].includes(statusRaw)) nextStatus = "failed";
      // keep pending otherwise
      await db.query("UPDATE orders SET status = $2, paymob_status = $3, updated_at = now() WHERE paymob_intention_id = $1", [intentionId, nextStatus, statusRaw]);
    } catch {}

    // Audit log
    try {
      await db.query("CREATE TABLE IF NOT EXISTS audit_logs (id bigserial primary key, event text, ref text, order_id integer, provider_id integer, amount numeric, status text, meta_json text, created_at timestamptz default now())");
      await db.query("INSERT INTO audit_logs (event, ref, status, meta_json) VALUES ($1,$2,$3,$4)", ["paymob_webhook", null, statusRaw, JSON.stringify({ intention_id: intentionId, event_id: eventId })]);
    } catch {}

    return json(true, { received: true, status: statusRaw, paid }, 200);
  } catch (e: any) {
    return json(false, { error: String(e?.message || e) }, 500);
  }
}
