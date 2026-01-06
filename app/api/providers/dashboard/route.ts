import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { cookies } from "next/headers";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verify(token: string) {
  const SECRET = process.env.PROVIDER_SESSION_SECRET || "lk_provider_secret_123";
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const i = raw.lastIndexOf(".");
    const payload = raw.slice(0, i);
    const sig = raw.slice(i + 1);
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return JSON.parse(payload);
  } catch { return null; }
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("kashtat_provider_token")?.value;
  const user = verify(token || "");
  
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    // Re-fetch provider to get latest data/status
    const pRes = await db.query("SELECT * FROM provider_requests WHERE id = $1", [user.id]);
    const provider = pRes.rows[0];
    if (!provider) return NextResponse.json({ ok: false, error: "not_found" }, { status: 401 });

    // Service matching
    const services = (provider.service_type || "").split(",").map((s: string) => s.trim());
    
    // Find matching requests
    const requests = await db.query(
      "SELECT * FROM customer_requests WHERE city = $1 AND service_type = ANY($2) AND status IN ('new', 'pending') ORDER BY created_at DESC LIMIT 50",
      [provider.city, services]
    );

    const accepted = await db.query(
      "SELECT * FROM customer_requests WHERE accepted_provider_id = $1 AND completed = false ORDER BY updated_at DESC NULLS LAST, created_at DESC LIMIT 50",
      [provider.id]
    );
    const completed = await db.query(
      "SELECT * FROM customer_requests WHERE accepted_provider_id = $1 AND completed = true ORDER BY updated_at DESC NULLS LAST, created_at DESC LIMIT 50",
      [provider.id]
    );

    return NextResponse.json({
      ok: true,
      provider: { ...provider, password_hash: undefined },
      requests: requests.rows,
      accepted: accepted.rows,
      completed: completed.rows,
    });
  } catch (e) {
    console.error("Dashboard error:", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
