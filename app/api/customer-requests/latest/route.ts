import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
 
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
 
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const city = (url.searchParams.get("city") || "").trim();
    const service_type = (url.searchParams.get("service_type") || "").trim();
 
    let sql =
      "SELECT id::text as id, ref, name, phone, email, city, service_type, created_at FROM customer_requests";
    const args: any[] = [];
    const conds: string[] = [];
    if (city) {
      args.push(city);
      conds.push(`city = $${args.length}`);
    }
    if (service_type) {
      args.push(service_type);
      conds.push(`service_type = $${args.length}`);
    }
    if (conds.length) {
      sql += " WHERE " + conds.join(" AND ");
    }
    sql += " ORDER BY created_at DESC LIMIT 1";
 
    const r = await db.query(sql, args);
    const row = r.rows[0] || null;
 
    return NextResponse.json(
      {
        ok: true,
        latest: row
          ? {
              id: String(row.id || ""),
              ref: String(row.ref || ""),
              city: String(row.city || ""),
              service_type: String(row.service_type || ""),
              created_at: row.created_at,
            }
          : null,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
