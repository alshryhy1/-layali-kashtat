import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get("ref");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const status = searchParams.get("status") || "en_route";

    if (!ref) return NextResponse.json({ ok: false, error: "Missing ref" });
    if (!lat || !lng) return NextResponse.json({ ok: false, error: "Missing lat/lng" });

    // Update DB
    await db.query(
        `UPDATE customer_requests 
         SET provider_status = $1,
             provider_current_lat = $2,
             provider_current_lng = $3,
             updated_at = NOW()
         WHERE ref = $4`,
        [status, lat, lng, ref]
    );

    return NextResponse.json({ 
        ok: true, 
        ref,
        status,
        lat, 
        lng
    });
}