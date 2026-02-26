import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

function json(ok: boolean, data: any, status = 200) {
  return NextResponse.json({ ok, ...data }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const requestRef = String(body?.request_ref || "").trim();
    const providerId = Number(String(body?.provider_id || "").trim()) || null;
    const amountBody = Number(String(body?.amount ?? "").trim());
    const salePriceBody = Number(String(body?.sale_price ?? "").trim());
    const commissionPolicy = String(body?.commission_policy || "").trim().toLowerCase(); // e.g., "haraj"
    const currency = String(body?.currency || "SAR").trim().toUpperCase();
    const description = String(body?.description || "Layali Kashtat Commission").trim();
    const customerName = String(body?.customer_name || "Customer").trim();
    const customerEmail = String(body?.customer_email || "customer@example.com").trim();
    const customerPhone = String(body?.customer_phone || "966500000000").trim();
    const idempotencyKeyInput = String(body?.idempotency_key || "").trim();

    const API_KEY = (process.env.PAYMOB_API_KEY || "").trim();
    const INTEGRATION_ID_RAW = (process.env.PAYMOB_INTEGRATION_ID || "").trim();
    const INTEGRATION_ID = Number(INTEGRATION_ID_RAW || "0");
    if (!API_KEY) return json(false, { error: "missing_api_key" }, 500);
    if (!Number.isFinite(INTEGRATION_ID) || INTEGRATION_ID <= 0) return json(false, { error: "missing_integration_id" }, 500);

    // Commission calculation on server
    let amount = amountBody;
    // Provider flow: prefer request_ref accepted price (2.5%)
    if (requestRef) {
      try {
        const q = await db.query(
          "SELECT accepted_price_total FROM customer_requests WHERE ref = $1 LIMIT 1",
          [requestRef]
        );
        const acceptedPrice = Number(q.rows?.[0]?.accepted_price_total || 0);
        if (acceptedPrice > 0) {
          amount = Math.max(0, Math.round(acceptedPrice * 0.025 * 100) / 100);
        }
      } catch {}
    } else if (commissionPolicy === "haraj" && Number.isFinite(salePriceBody) && salePriceBody > 0) {
      // Haraj marketplace flow: commission = 1% of sale price
      amount = Math.max(0, Math.round(salePriceBody * 0.01 * 100) / 100);
    }
    if (!Number.isFinite(amount) || amount <= 0) return json(false, { error: "invalid_amount" }, 400);

    // Prepare schema (add columns if missing)
    try {
      await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS request_ref text");
      await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_id integer");
      await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE");
      await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS paymob_client_secret text");
      await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS paymob_intention_id text");
      await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS paymob_status text");
      await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()");
      await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()");
    } catch {}

    // Build idempotency key
    const idempotencyKey =
      idempotencyKeyInput ||
      (requestRef
        ? `commission:${requestRef}:${providerId || "na"}:${Math.round(amount * 100)}`
        : commissionPolicy === "haraj" && Number.isFinite(salePriceBody) && salePriceBody > 0
          ? `haraj:${Math.round(salePriceBody * 100)}:${(customerName || "na").toLowerCase()}`
          : "");

    // Check existing pending order to reuse client_secret
    if (idempotencyKey) {
      try {
        const ex = await db.query(
          "SELECT id, paymob_client_secret, paymob_intention_id, status FROM orders WHERE idempotency_key = $1 LIMIT 1",
          [idempotencyKey]
        );
        if (ex.rows.length > 0) {
          const row = ex.rows[0];
          if (row.paymob_client_secret) {
            return json(true, { client_secret: row.paymob_client_secret, intention_id: row.paymob_intention_id, order_id: row.id, reused: true }, 200);
          }
        }
      } catch {}
    }

    // Create internal order
    let orderId: number | null = null;
    try {
      const ins = await db.query(
        "INSERT INTO orders (amount, currency, status, description, customer_name, customer_email, customer_phone, request_ref, provider_id, idempotency_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id",
        [amount, currency, "pending", description, customerName, customerEmail, customerPhone, requestRef || null, providerId || null, idempotencyKey || null]
      );
      orderId = Number(ins.rows?.[0]?.id || 0) || null;
    } catch {}

    const res = await fetch("https://ksa.paymob.com/v1/intention/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency,
        payment_methods: [INTEGRATION_ID],
        billing_data: {
          first_name: customerName.split(" ")[0] || customerName,
          last_name: customerName.split(" ").slice(1).join(" ") || "-",
          email: customerEmail,
          phone_number: customerPhone,
          street: "Customer Street",
          building: "1",
          floor: "1",
          apartment: "1",
          city: "Riyadh",
          country: "SA",
          postal_code: "11564",
          state: "Riyadh",
          shipping_method: "PICKUP"
        },
        items: [],
        description: orderId ? `Order #${orderId}` : description,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return json(false, { error: "provider_error", details: data }, 200);

    const clientSecret = data?.client_secret || data?.clientSecret || null;
    if (!clientSecret) return json(false, { error: "no_client_secret" }, 200);

    // Save intention id on order
    const intentionId = data?.id ? String(data.id) : null;
    if (orderId && intentionId) {
      try {
        await db.query(
          "UPDATE orders SET paymob_intention_id = $2, paymob_status = $3, paymob_client_secret = $4, updated_at = now() WHERE id = $1",
          [orderId, intentionId, String(data?.status || ""), clientSecret]
        );
      } catch {}
    }

    // Audit log
    try {
      await db.query("CREATE TABLE IF NOT EXISTS audit_logs (id bigserial primary key, event text, ref text, order_id integer, provider_id integer, amount numeric, status text, meta_json text, created_at timestamptz default now())");
      await db.query(
        "INSERT INTO audit_logs (event, ref, order_id, provider_id, amount, status, meta_json) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        ["commission_intention_created", requestRef || null, orderId, providerId || null, amount, String(data?.status || ""), JSON.stringify({ intention_id: intentionId, idempotency_key: idempotencyKey, policy: commissionPolicy || (requestRef ? "provider" : "custom") })]
      );
    } catch {}

    return json(true, { client_secret: clientSecret, intention_id: intentionId, order_id: orderId }, 200);
  } catch (e: any) {
    return json(false, { error: String(e?.message || e) }, 500);
  }
}
