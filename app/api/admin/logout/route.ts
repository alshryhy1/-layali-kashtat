import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

function clearCookie(res: NextResponse, name: string) {
  // مسح كوكي بشكل مؤكد
  res.cookies.set({
    name,
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
  });

  // بعض الإعدادات قد تكون بدون httpOnly — نمسحها أيضًا
  res.cookies.set({
    name,
    value: "",
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 0,
  });
}

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // ✅ الكوكي الحقيقي للدخول
  clearCookie(res, "kashtat_admin");

  // ✅ أي أسماء قديمة (للاحتياط بدون ضرر)
  clearCookie(res, "admin_auth");
  clearCookie(res, "admin_token");
  clearCookie(res, "admin_session");
  clearCookie(res, "admin");
  clearCookie(res, "lk_admin");
  clearCookie(res, "lk_admin_auth");
  clearCookie(res, "adminLoggedIn");

  return noStore(res);
}

export async function GET() {
  return POST();
}
