import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { ref, meeting_location, status } = body;
        
        if (!ref) return NextResponse.json({ error: "Missing ref" }, { status: 400 });

        let query = "UPDATE customer_requests SET updated_at = NOW()";
        const params = [];
        let idx = 1;

        if (meeting_location) {
            query += `, accepted_meeting_location = $${idx++}`;
            params.push(meeting_location);
        }
        if (status) {
            query += `, provider_status = $${idx++}`;
            params.push(status);
        }

        query += ` WHERE ref = $${idx}`;
        params.push(ref);

        await db.query(query, params);

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}