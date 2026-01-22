import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sender_name, amount, bank_name, transfer_date, notes } = body;

    if (!sender_name || !amount || !bank_name || !transfer_date) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const res = await db.query(
      `INSERT INTO haraj_transfers (sender_name, amount, bank_name, transfer_date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [sender_name, amount, bank_name, transfer_date, notes]
    );

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit transfer' }, { status: 500 });
  }
}
