import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET() {
  try {
    await db.query(`
      ALTER TABLE customer_requests 
      ADD COLUMN IF NOT EXISTS route_polyline TEXT,
      ADD COLUMN IF NOT EXISTS eta NUMERIC;
    `);
    return NextResponse.json({ ok: true, message: "Columns added successfully" });
  } catch (e) {
    console.error("Setup DB failed:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
