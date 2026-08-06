import { NextResponse } from "next/server";

const PUBLIC_FILE = /\.[^/]+$/;

export default function proxy(req: Request) {
  const url = new URL(req.url);
  const { pathname } = url;

  // Apple Pay domain association
  if (pathname === "/.well-known/apple-developer-merchantid-domain-association") {
    url.pathname = "/api/apple-domain-association";
    return NextResponse.rewrite(url);
  }

  // Skip internals, API, and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/uploads") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // /ar and /ar/* → unprefixed (308)
  if (pathname === "/ar" || pathname.startsWith("/ar/")) {
    const rest = pathname.slice(3) || "/";
    const dest = new URL(`${rest}${url.search}`, req.url);
    return NextResponse.redirect(dest, 308);
  }

  // Store / legacy aliases for account & data deletion guidance (keep legal URLs stable)
  const deleteDataAliases = new Set([
    "/delete-data",
    "/data-deletion",
    "/en/delete-data",
    "/en/data-deletion",
  ]);
  if (deleteDataAliases.has(pathname)) {
    const destPath = pathname.startsWith("/en/") ? "/en/delete-account" : "/delete-account";
    const dest = new URL(`${destPath}${url.search}`, req.url);
    return NextResponse.redirect(dest, 308);
  }

  // English keeps /en prefix
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return NextResponse.next();
  }

  // Unprefixed paths → rewrite to /ar/... (Arabic default, URL stays unprefixed)
  url.pathname = pathname === "/" ? "/ar" : `/ar${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\..*).*)",
    "/.well-known/apple-developer-merchantid-domain-association",
  ],
};
