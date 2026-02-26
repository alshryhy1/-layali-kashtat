import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-customer";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await db.query(`
      SELECT f.item_id, h.* 
      FROM favorites f
      JOIN haraj_items h ON f.item_id = h.id
      WHERE f.customer_id = $1
      ORDER BY f.created_at DESC
    `, [session.id]);
    
    return NextResponse.json({ ok: true, data: res.rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { itemId } = await req.json();
    if (!itemId) {
      return NextResponse.json({ ok: false, error: "Missing itemId" }, { status: 400 });
    }

    // Check if exists
    const existing = await db.query(
      "SELECT id FROM favorites WHERE customer_id = $1 AND item_id = $2",
      [session.id, itemId]
    );

    let isFavorited = false;
    if (existing.rows.length > 0) {
      // Remove
      await db.query("DELETE FROM favorites WHERE customer_id = $1 AND item_id = $2", [session.id, itemId]);
      isFavorited = false;
    } else {
      // Add
      await db.query("INSERT INTO favorites (customer_id, item_id) VALUES ($1, $2)", [session.id, itemId]);
      isFavorited = true;
    }

    return NextResponse.json({ ok: true, isFavorited });
  } catch (e) {
    console.error("Favorite error:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
