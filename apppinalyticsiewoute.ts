import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    await db.query(`
      INSERT INTO site_analytics (key, value) 
      VALUES ('total_views', 1) 
      ON CONFLICT (key) 
      DO UPDATE SET value = site_analytics.value + 1
    `);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
