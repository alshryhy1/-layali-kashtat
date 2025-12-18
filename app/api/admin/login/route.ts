import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

type Body = { username?: string; password?: string };

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function POST(req: Request) {
  try {
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
    const SECRET = process.env.ADMIN_SESSION_SECRET || "";

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !SECRET) {
      return NextResponse.json(
        { ok: false, error: "Missing env: ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_SESSION_SECRET" },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "").trim();

    if (!username || !password) {
      return NextResponse.json({ ok: false, error: "Missing username/password" }, { status: 400 });
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    const exp = Date.now() + 1000 * 60 * 60 * 12; // 12 hours
    const payload = JSON.stringify({ u: username, exp });
    const sig = sign(payload, SECRET);
    const token = Buffer.from(`${payload}.${sig}`, "utf8").toString("base64url");

    const res = NextResponse.json({ ok: true });

    res.cookies.set("kashtat_admin", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
