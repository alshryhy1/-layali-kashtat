import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type Locale = "ar" | "en";

function preferredLocale(req: NextRequest): Locale {
  const cookie = req.cookies.get("locale")?.value;
  if (cookie === "en" || cookie === "ar") return cookie;

  const header = req.headers.get("accept-language") || "";
  return header.toLowerCase().includes("en") ? "en" : "ar";
}

function isPublicFile(pathname: string) {
  // أي مسار ينتهي بامتداد ملف: .jpg .png .css .js ...
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

// ✅ Next.js 16 proxy convention: يجب تصدير دالة باسم proxy
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ✅ اترك كل الملفات الثابتة/الصور/الأيقونات بدون أي Redirect
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    isPublicFile(pathname)
  ) {
    return NextResponse.next();
  }

  // ✅ إذا المسار يبدأ بلغة، اتركه
  if (
    pathname === "/ar" ||
    pathname.startsWith("/ar/") ||
    pathname === "/en" ||
    pathname.startsWith("/en/")
  ) {
    return NextResponse.next();
  }

  // ✅ أي مسار بدون لغة: ألحقه باللغة المفضلة
  const loc = preferredLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${loc}${pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
