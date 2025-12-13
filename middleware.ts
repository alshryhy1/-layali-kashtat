import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const match = pathname.match(/^\/(ar|en)(\/.*)?$/);
  if (!match) return NextResponse.next();

  const locale = match[1] as "ar" | "en";

  // ✅ مسارات مفتوحة دائمًا
  if (
    pathname === `/${locale}/providers/docs` ||
    pathname.startsWith(`/${locale}/providers/docs/`) ||
    pathname === `/${locale}/providers/signup` ||
    pathname.startsWith(`/${locale}/providers/signup/`)
  ) {
    return NextResponse.next();
  }

  // 🔒 Dashboard يبقى مقفول دائمًا الآن
  const dashboardBase = `/${locale}/dashboard`;
  const dashboardClosed = `/${locale}/dashboard/closed`;

  const isDashboard =
    pathname === dashboardBase || pathname.startsWith(`${dashboardBase}/`);
  const isClosed = pathname === dashboardClosed;

  if (isDashboard && !isClosed) {
    const url = req.nextUrl.clone();
    url.pathname = dashboardClosed;
    return NextResponse.redirect(url);
  }

  // 2) قفل request نهائيًا
  const requestBase = `/${locale}/request`;
  const comingSoon = `/${locale}/coming-soon`;

  const isRequest =
    pathname === requestBase || pathname.startsWith(`${requestBase}/`);
  if (isRequest) {
    const url = req.nextUrl.clone();
    url.pathname = comingSoon;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/ar/:path*", "/en/:path*"],
};
