import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET() {
  try {
    await db.query(`
      INSERT INTO customer_requests (ref, status, phone, email, city, service_type)
      VALUES ('LK-TEST1', 'approved', '0512345678', 'test@example.com', 'Riyadh', 'Camping')
      ON CONFLICT (ref) DO NOTHING;
    `);
    return NextResponse.json({ ok: true, message: "Test request created" });
  } catch (e) {
    console.error("Setup Test Request failed:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
