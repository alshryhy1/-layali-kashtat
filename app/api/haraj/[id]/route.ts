import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({})); // Handle cases where body is missing
    const { code } = body;

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }

    // 1. Fetch the item to check the code
    const itemRes = await db.query('SELECT delete_code FROM haraj_items WHERE id = $1', [id]);
    if (itemRes.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    const item = itemRes.rows[0];
    // If the item has a code, verify it. If no code (old items), allow delete or block? 
    // Let's assume block if code is wrong, but if item has NO code, maybe allow? 
    // Safest: strict check. Code must match.
    
    // Normalize comparison (trim)
    if (!item.delete_code || String(item.delete_code).trim() !== String(code).trim()) {
      return NextResponse.json({ success: false, error: 'Incorrect delete code' }, { status: 403 });
    }

    // 2. Delete if code matches
    const res = await db.query('DELETE FROM haraj_items WHERE id = $1 RETURNING *', [id]);

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete item' }, { status: 500 });
  }
}
