import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get("ref");
    const providerId = searchParams.get("provider_id");
    const requestId = searchParams.get("request_id");

    // We need to find the request_id first if we only have ref
    let targetRequestId = requestId;
    
    if (!targetRequestId && ref) {
        const reqRes = await db.query("SELECT id, accepted_provider_id FROM customer_requests WHERE ref = $1", [ref]);
        if (reqRes.rows.length === 0) {
             return NextResponse.json({ ok: false, error: "Request not found" });
        }
        targetRequestId = reqRes.rows[0].id;
    }

    if (!targetRequestId) {
        return NextResponse.json({ ok: false, error: "Missing request info" });
    }

    // 1. Find or Create Conversation
    // A conversation is unique per request_id (assuming 1 request = 1 conversation between customer and provider)
    const convRes = await db.query(
        "SELECT id FROM conversations WHERE request_id = $1 LIMIT 1",
        [targetRequestId]
    );

    let conversation_id;

    if (convRes.rows.length === 0) {
        // Create new
        const newConv = await db.query(
            "INSERT INTO conversations (request_id) VALUES ($1) RETURNING id",
            [targetRequestId]
        );
        conversation_id = newConv.rows[0].id;
    } else {
        conversation_id = convRes.rows[0].id;
    }

    // 2. Fetch Messages
    const msgRes = await db.query(
        "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
        [conversation_id]
    );

    return NextResponse.json({
        ok: true,
        conversation_id,
        messages: msgRes.rows
    });

  } catch (e) {
    console.error("Chat History Error:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
