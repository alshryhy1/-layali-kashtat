import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { cookies } from "next/headers";
import crypto from "crypto";

export const runtime = "nodejs";

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

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("kashtat_provider_token")?.value;
  const user = verify(token || "");
  
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { ref, status, lat, lng } = body;

    if (!ref || !status) return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });

    const nextStatus = String(status || "").trim().toLowerCase();
    const latNum = lat === undefined || lat === null ? null : Number(lat);
    const lngNum = lng === undefined || lng === null ? null : Number(lng);
    const hasCoords =
      Number.isFinite(latNum) &&
      Number.isFinite(lngNum) &&
      Math.abs(latNum as number) <= 90 &&
      Math.abs(lngNum as number) <= 180;

    // Verify ownership
    const check = await db.query("SELECT id FROM customer_requests WHERE ref = $1 AND accepted_provider_id = $2", [ref, user.id]);
    if (check.rows.length === 0) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

    // Update
    if (nextStatus === "completed") {
      await db.query("UPDATE customer_requests SET provider_status = 'completed' WHERE ref = $1", [ref]);
    } else if (nextStatus === "en_route" || nextStatus === "arrived" || nextStatus === "in_trip") {
      const polyline = body.polyline;
      const eta = body.eta ? Number(body.eta) : null;
      
      if (hasCoords) {
        if (polyline && eta !== null) {
             await db.query(
                "UPDATE customer_requests SET provider_status = $2, provider_current_lat = $3, provider_current_lng = $4, route_polyline = $5, eta = $6 WHERE ref = $1",
                [ref, nextStatus, latNum, lngNum, JSON.stringify(polyline), eta]
              );
        } else {
            await db.query(
              "UPDATE customer_requests SET provider_status = $2, provider_current_lat = $3, provider_current_lng = $4 WHERE ref = $1",
              [ref, nextStatus, latNum, lngNum]
            );
        }
      } else {
        await db.query("UPDATE customer_requests SET provider_status = $2 WHERE ref = $1", [ref, nextStatus]);
      }
    } else if (nextStatus === "accepted") {
      await db.query("UPDATE customer_requests SET provider_status = 'accepted' WHERE ref = $1", [ref]);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Tracking update error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
