import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function GET() {
  try {
    const res = await db.query(`
      SELECT id, ref, status, accepted_meeting_location, city, provider_status, provider_current_lat, provider_current_lng, created_at
      FROM customer_requests 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    return NextResponse.json(res.rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}