import { NextResponse } from "next/server";
import { Client } from "pg";

export const runtime = "nodejs";

function json(ok: boolean, data: any, status = 200) {
  return NextResponse.json(
    { ok, ...data },
    {
      status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

function normalizePhone(raw: string) {
  let s = String(raw || "").trim().replace(/[^\d]/g, "");

  if (s.startsWith("00966")) s = s.replace(/^00966/, "");
  if (s.startsWith("966")) s = s.replace(/^966/, "");

  if (s.length === 9 && s.startsWith("5")) s = `0${s}`;
  return s;
}

export async function GET(req: Request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    // Add ssl: { rejectUnauthorized: false } if needed for some environments,
    // but usually DATABASE_URL handles it or default is fine for Supabase pooler
  });

  try {
    const url = new URL(req.url);

    const refRaw = String(url.searchParams.get("ref") || "").trim();
    const phoneRaw = String(url.searchParams.get("phone") || "").trim();

    const ref = Number(refRaw);

    if (!refRaw || !Number.isFinite(ref) || !Number.isInteger(ref) || ref <= 0) {
      return json(false, { error: "Invalid ref" }, 400);
    }

    if (!phoneRaw) {
      return json(false, { error: "Phone is required" }, 400);
    }

    const phone = normalizePhone(phoneRaw);
    if (!/^05\d{8}$/.test(phone)) {
      return json(false, { error: "Invalid phone" }, 400);
    }

    if (!process.env.DATABASE_URL) {
      return json(false, { error: "Missing env: DATABASE_URL" }, 500);
    }

    await client.connect();

    const query = `
      SELECT id, phone, status 
      FROM provider_requests 
      WHERE id = $1 
      LIMIT 1
    `;
    const res = await client.query(query, [ref]);

    if (res.rows.length === 0) {
      return json(false, { error: "Not found" }, 404);
    }

    const data = res.rows[0];
    const dbPhone = normalizePhone(String(data.phone || ""));

    if (!dbPhone) return json(false, { error: "Request phone missing in database" }, 500);

    if (dbPhone !== phone) {
      return json(false, { error: "Phone mismatch" }, 403);
    }

    const st = String(data.status || "pending").toLowerCase();
    const normalized = st === "approved" ? "approved" : st === "rejected" ? "rejected" : "pending";

    return json(true, { ref, status: normalized, updated_at: null }, 200);
  } catch (e: any) {
    console.error("Provider Status Error:", e);
    return json(false, { error: e?.message || "Server error" }, 500);
  } finally {
    await client.end().catch(() => {});
  }
}

export async function POST() {
  return json(false, { error: "Method Not Allowed" }, 405);
}
export async function PUT() {
  return json(false, { error: "Method Not Allowed" }, 405);
}
export async function PATCH() {
  return json(false, { error: "Method Not Allowed" }, 405);
}
export async function DELETE() {
  return json(false, { error: "Method Not Allowed" }, 405);
}
