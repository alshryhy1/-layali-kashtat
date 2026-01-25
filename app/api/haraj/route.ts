import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const category = searchParams.get('category');

    let queryText = 'SELECT * FROM haraj_items WHERE 1=1';
    const queryParams: any[] = [];

    if (q) {
      queryParams.push(`%${q}%`);
      queryText += ` AND (title ILIKE $${queryParams.length} OR description ILIKE $${queryParams.length})`;
    }

    if (category && category !== 'all') {
      queryParams.push(category);
      queryText += ` AND category = $${queryParams.length}`;
    }

    queryText += ' ORDER BY created_at DESC';

    const res = await db.query(queryText, queryParams);
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
