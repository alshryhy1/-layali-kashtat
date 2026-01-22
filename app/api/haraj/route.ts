import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const res = await db.query('SELECT * FROM haraj_items ORDER BY created_at DESC');
    return NextResponse.json({ success: true, data: res.rows });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, price, city, category, contact_phone, image_url, delete_code } = body;

    const res = await db.query(
      `INSERT INTO haraj_items (title, description, price, city, category, contact_phone, image_url, delete_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, description, price, city, category, contact_phone, image_url, delete_code || "0000"]
    );

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create item' }, { status: 500 });
  }
}
