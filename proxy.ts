import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function preferredLocale(req: NextRequest): "ar" | "en" {
  const h = req.headers.get("accept-language") || "";
  // لو في تفضيل إنجليزي، خلّه en، غير كذا ar
  return h.toLowerCase().includes("en") ? "en" : "ar";
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ✅ لا تعيد توجيه أي مسار يبدأ بـ /ar أو /en
  if (pathname.startsWith("/ar") || pathname.startsWith("/en")) {
    return NextResponse.next();
  }

  // ✅ لا تلمس ملفات النظام و الـ static
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // ✅ فقط الجذر "/" يتحول للغة المفضلة
  if (pathname === "/") {
    const loc = preferredLocale(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${loc}`;
    url.search = search;
    return NextResponse.redirect(url);
  }

  // ✅ أي مسار بدون لغة: ألحقه باللغة المفضلة
  const loc = preferredLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${loc}${pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}
