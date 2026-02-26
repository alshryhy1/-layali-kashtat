import { NextResponse } from "next/server";

export const runtime = "nodejs";

function json(ok: boolean, data: any, status = 200) {
  return NextResponse.json(
    { ok, ...data },
    {
      status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

async function post(url: string, body: any, headers?: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers || {}) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const amountRaw = Number(String(body?.amount ?? "").trim());
    const currency = String(body?.currency || "SAR").trim().toUpperCase();
    const description = String(body?.description || "Layali Kashtat Commission").trim();
    const name = String(body?.customer_name || "Customer").trim();
    const email = String(body?.customer_email || "").trim();
    const phone = String(body?.customer_phone || "").trim();

    if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
      return json(false, { error: "invalid_amount" }, 400);
    }

    const API_KEY = (process.env.PAYMOB_API_KEY || "").trim();
    const INTEGRATION_ID = (process.env.PAYMOB_INTEGRATION_ID || "").trim();
    const IFRAME_ID = (process.env.PAYMOB_IFRAME_ID || "").trim();
    if (!API_KEY || !INTEGRATION_ID || !IFRAME_ID) {
      return json(false, { error: "gateway_not_configured" }, 200);
    }

    const amountCents = Math.round(amountRaw * 100);

    const { res: authRes, data: authData } = await post("https://accept.paymob.com/api/auth/tokens", {
      api_key: API_KEY,
    });
    if (!authRes.ok || !authData?.token) {
      return json(false, { error: "provider_error", details: authData }, 200);
    }
    const token = String(authData.token);

    const { res: orderRes, data: orderData } = await post("https://accept.paymob.com/api/ecommerce/orders", {
      auth_token: token,
      amount_cents: amountCents,
      currency,
      delivery_needed: false,
      items: [],
      merchant_order_id: `${Date.now()}`,
    });
    if (!orderRes.ok || !orderData?.id) {
      return json(false, { error: "provider_error", details: orderData }, 200);
    }
    const orderId = Number(orderData.id);

    const billing = {
      apartment: "NA",
      email: email || "na@example.com",
      floor: "NA",
      first_name: name || "Customer",
      last_name: "NA",
      street: "NA",
      building: "NA",
      phone_number: phone || "0000000000",
      shipping_method: "NA",
      postal_code: "NA",
      city: "Riyadh",
      country: "SA",
      state: "NA",
    };

    const { res: keyRes, data: keyData } = await post("https://accept.paymob.com/api/acceptance/payment_keys", {
      auth_token: token,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      billing_data: billing,
      currency,
      integration_id: Number(INTEGRATION_ID),
      lock_order_when_paid: true,
    });
    if (!keyRes.ok || !keyData?.token) {
      return json(false, { error: "provider_error", details: keyData }, 200);
    }
    const paymentToken = String(keyData.token);
    const url = `https://accept.paymob.com/api/acceptance/iframes/${IFRAME_ID}?payment_token=${paymentToken}`;

    return json(true, { data: { redirect_url: url, provider: "paymob", order_id: orderId } }, 200);
  } catch (e: any) {
    return json(false, { error: "server_error", details: String(e?.message || e) }, 500);
  }
}
