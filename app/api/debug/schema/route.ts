import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function GET() {
  try {
    const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customer_requests'
    `);
    return NextResponse.json(res.rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}