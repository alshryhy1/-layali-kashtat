import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sqlPath = path.join(process.cwd(), "scripts", "setup_chat.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    
    await db.query(sql);
    
    return NextResponse.json({ ok: true, message: "Chat setup executed successfully" });
  } catch (e: any) {
    console.error("Setup Error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
