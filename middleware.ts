import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // السماح لمسارات اللغة + API
  if (
    pathname.startsWith("/ar") ||
    pathname.startsWith("/en") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // إعادة التوجيه الافتراضي للعربية
  request.nextUrl.pathname = `/ar${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!_next).*)"],
};
