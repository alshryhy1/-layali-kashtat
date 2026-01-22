import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

// Remove Supabase Admin for now if not used or causing issues
// import { createClient } from "@supabase/supabase-js";
// const supabase = createClient(...)

export async function POST(req: Request) {
  try {
    const { conversation_id, sender_role, content, media_type, media_url } = await req.json();

    if (!conversation_id || !content) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    // --- Content Sanitization (Privacy) ---
    // 1. Email
    let cleanContent = content.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "*****");
    // 2. Saudi Mobile (05xxxxxxxx, 5xxxxxxxx, +9665xxxxxxxx)
    // We use a regex that covers common formats. 
    // \b checks for word boundary for 05/5/009665. +9665 doesn't need \b start.
    // We ensure the match ends with a digit to avoid consuming trailing spaces.
    cleanContent = cleanContent.replace(/(?:\b05|\b5|\b009665|\+9665)(?:[0-9\s\-]{6,}[0-9])\b/g, "*****");
    // 3. Social Media Handles (@username)
    cleanContent = cleanContent.replace(/@[a-zA-Z0-9_.]+/g, "*****");

    // 1. Insert into Postgres
    const result = await db.query(
      `INSERT INTO messages (conversation_id, sender_role, content, media_type, media_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [conversation_id, sender_role, cleanContent, media_type, media_url]
    );

    const newMsg = result.rows[0];

    // 2. Broadcast via Supabase Realtime (optional if you rely on postgres_changes)
    // We rely on client subscription to "postgres_changes" so manual broadcast is not strictly needed
    // UNLESS we want to trigger other events. 
    // For now, let's trust Supabase CDC.

    return NextResponse.json({ ok: true, message: newMsg });
  } catch (e) {
    console.error("Send Message Error:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
