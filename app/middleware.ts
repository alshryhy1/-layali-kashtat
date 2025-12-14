import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["ar", "en"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // استثناءات لازم ما نمسكها
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // لو المسار يبدأ بلغة صحيحة (ar/en) نخليه يمر
  const first = pathname.split("/")[1];
  if (LOCALES.includes(first)) {
    return NextResponse.next();
  }

  // أي مسار بدون لغة → وجهه للعربية
  const url = request.nextUrl.clone();
  url.pathname = `/ar${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)"],
};
