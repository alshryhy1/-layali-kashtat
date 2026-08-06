/** Shared tab-shell helpers (no React) — keeps layout chrome free of AppTabBar UI deps. */

export const APP_TAB_BAR_HEIGHT = 82;

export function stripLocale(pathname: string): string {
  if (pathname === "/en" || pathname === "/ar") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3) || "/";
  if (pathname.startsWith("/ar/")) return pathname.slice(3) || "/";
  return pathname || "/";
}

/** Routes that show the native-like primary tab bar. */
export function shouldShowAppTabBar(pathname: string): boolean {
  const p = stripLocale(pathname);
  if (
    p.startsWith("/admin") ||
    p.startsWith("/providers/login") ||
    p.startsWith("/providers/signup") ||
    p.startsWith("/providers/docs") ||
    p.startsWith("/customer/login") ||
    p.startsWith("/signup") ||
    p.startsWith("/provider-signup") ||
    p.startsWith("/delete-account") ||
    p.startsWith("/delete-data") ||
    p.startsWith("/data-deletion") ||
    p.startsWith("/privacy") ||
    p.startsWith("/terms") ||
    p.startsWith("/legal") ||
    p.startsWith("/waitlist") ||
    p.startsWith("/coming-soon") ||
    p.startsWith("/developer") ||
    p.startsWith("/contact") ||
    p.startsWith("/calculator") ||
    p.startsWith("/sos")
  ) {
    return false;
  }
  return (
    p === "/" ||
    p === "/account" ||
    p.startsWith("/account/") ||
    p === "/sections" ||
    p.startsWith("/sections/") ||
    p === "/chat" ||
    p.startsWith("/chat/") ||
    p === "/haraj" ||
    p.startsWith("/haraj/") ||
    p === "/gallery" ||
    p.startsWith("/gallery/") ||
    p === "/customer/dashboard" ||
    p.startsWith("/customer/dashboard/") ||
    p === "/customer/request" ||
    p.startsWith("/customer/request/") ||
    p === "/map" ||
    p.startsWith("/map/") ||
    p === "/providers/dashboard" ||
    p.startsWith("/providers/dashboard/")
  );
}
