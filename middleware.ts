import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // لا تلمس API / Next internals / ملفات ثابتة (favicon, css, js, images...)
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/ar") ||
    pathname.startsWith("/en") ||
    /\.[^/]+$/.test(pathname) // أي مسار فيه امتداد ملف
  ) {
    return NextResponse.next();
  }

  // لو فتح الجذر /
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/ar", req.url));
  }

  // أي مسار بدون لغة → حطه تحت /ar
  return NextResponse.redirect(new URL(`/ar${pathname}`, req.url));
}

export const config = {
  // شغّل الميدلوير فقط على المسارات "الصفحات" وليس ملفات/Api/_next أو /ar /en
  matcher: ["/((?!api|_next|ar|en|.*\\..*).*)"],
};
