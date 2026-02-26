import { NextResponse } from "next/server";
import { sendOTP } from "@/lib/msg91";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(ok: boolean, data: any = {}, status = 200) {
  return NextResponse.json({ ok, ...data }, { status, headers: { "Cache-Control": "no-store" } });
}
function clean(v: unknown) {
  return String(v ?? "").trim();
}
function normalizePhone(raw: string) {
  let s = clean(raw).replace(/[^\d]/g, "");
  if (!s) return "";
  if (s.startsWith("00966")) s = s.slice(5);
  if (s.startsWith("966")) s = s.slice(3);
  if (s.startsWith("05")) s = s.slice(1);
  if (s.startsWith("5")) s = s;
  return "966" + s;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const phoneRaw = clean(body?.phone || "");
    if (!phoneRaw) return json(false, { error: "missing_phone" }, 400);
    const phone = normalizePhone(phoneRaw);

    const cookieStore = await cookies();
    const last = Number(cookieStore.get("lk_otp_last_server")?.value || "0");
    if (last && Date.now() - last < 90_000) {
      return json(false, { error: "rate_limited" }, 429);
    }

    const res = await sendOTP(phone);
    cookieStore.set("lk_otp_last_server", String(Date.now()), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return json(true, { sent: true, provider: "msg91", info: res });
  } catch (e: any) {
    return json(false, { error: e?.message || "server_error" }, 500);
  }
}
