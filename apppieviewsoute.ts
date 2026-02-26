import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-customer";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("target_id");
  const targetType = searchParams.get("target_type") || "haraj";

  if (!targetId) {
    return NextResponse.json({ ok: false, error: "Missing target_id" }, { status: 400 });
  }

  try {
    // Join with customers to get reviewer name
    const query = `
      SELECT r.*, c.name as customer_name
      FROM reviews r
      LEFT JOIN customers c ON r.customer_id = c.id
      WHERE r.target_id = $1 AND r.target_type = $2
      ORDER BY r.created_at DESC
    `;
    const res = await db.query(query, [targetId, targetType]);

    return NextResponse.json({ ok: true, reviews: res.rows });
  } catch (e) {
    console.error("Fetch reviews error:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { target_id, target_type, rating, comment } = body;

    if (!target_id || !rating) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, error: "Invalid rating" }, { status: 400 });
    }

    // Check if user already reviewed this item (optional, but good practice)
    const existing = await db.query(
      "SELECT id FROM reviews WHERE customer_id = $1 AND target_id = $2 AND target_type = $3",
      [session.id, target_id, target_type || "haraj"]
    );

    if (existing.rows.length > 0) {
      // Update existing review
      await db.query(
        "UPDATE reviews SET rating = $1, comment = $2, created_at = NOW() WHERE id = $3",
        [rating, comment || "", existing.rows[0].id]
      );
    } else {
      // Insert new review
      await db.query(
        "INSERT INTO reviews (customer_id, target_id, target_type, rating, comment) VALUES ($1, $2, $3, $4, $5)",
        [session.id, target_id, target_type || "haraj", rating, comment || ""]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Post review error:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
