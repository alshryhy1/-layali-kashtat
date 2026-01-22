import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id INTEGER NOT NULL REFERENCES customer_requests(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id),
        sender_role VARCHAR(20) NOT NULL, -- 'customer', 'provider', 'system'
        content TEXT NOT NULL,
        media_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'voice', 'location'
        media_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    return NextResponse.json({ ok: true, message: "Chat tables created successfully" });
  } catch (e) {
    console.error("Setup Chat DB failed:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
