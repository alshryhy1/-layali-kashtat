import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_SECRET = process.env.ADMIN_SECRET;

  if (!ADMIN_PASSWORD || !ADMIN_SECRET) {
    return NextResponse.json(
      { ok: false, error: "Missing env: ADMIN_PASSWORD or ADMIN_SECRET" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const password = body?.password;

  if (!password || password !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { ok: false, error: "Wrong password" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });

  // ✅ مهم: localhost لازم secure=false عشان الكوكي تنقرأ في middleware
  res.cookies.set("admin_auth", ADMIN_SECRET, {
    httpOnly: true,
    sameSite: "strict",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}
