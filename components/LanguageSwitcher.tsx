"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Locale = "ar" | "en";

function normalizePath(p: string) {
  if (!p) return "/";
  return p.startsWith("/") ? p : `/${p}`;
}

function detectLocaleFromPath(pathname: string): Locale {
  const p = normalizePath(pathname);
  if (p === "/en" || p.startsWith("/en/")) return "en";
  return "ar";
}

function stripLocalePrefix(pathname: string) {
  const p = normalizePath(pathname);
  if (p === "/ar" || p.startsWith("/ar/")) return p.slice(3) || "/";
  if (p === "/en" || p.startsWith("/en/")) return p.slice(3) || "/";
  return p;
}

function buildLocaleHref(currentPathname: string, target: Locale) {
  const rest = stripLocalePrefix(currentPathname);
  if (rest === "/") return `/${target}`;
  return `/${target}${rest}`;
}

export default function LanguageSwitcher({ locale }: { locale?: Locale }) {
  const pathname = usePathname() || "/";
  const current: Locale =
    locale === "en" || locale === "ar" ? locale : detectLocaleFromPath(pathname);

  const arHref = buildLocaleHref(pathname, "ar");
  const enHref = buildLocaleHref(pathname, "en");

  const linkStyle = (active: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",

    /* ✅ نص فقط بدون كبسولة */
    background: "transparent",
    border: "none",
    boxShadow: "none",
    padding: 0,

    /* ✅ لمس ممتاز للجوال بدون شكل كبسولة */
    minWidth: 28,
    height: 28,

    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 0.3,
    color: active ? "#111" : "rgba(0,0,0,0.55)",
    textDecoration: "none",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    lineHeight: "28px",
    flexShrink: 0,
  });

  const sep: React.CSSProperties = {
    opacity: 0.35,
    fontWeight: 900,
    lineHeight: "28px",
    userSelect: "none",
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
      <Link
        href={arHref}
        prefetch={false}
        style={linkStyle(current === "ar")}
        aria-label="Arabic"
        title="Arabic"
      >
        AR
      </Link>

      <span style={sep}>|</span>

      <Link
        href={enHref}
        prefetch={false}
        style={linkStyle(current === "en")}
        aria-label="English"
        title="English"
      >
        EN
      </Link>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          a[aria-label="Arabic"]:focus-visible,
          a[aria-label="English"]:focus-visible {
            outline: 2px solid rgba(0,0,0,0.35);
            outline-offset: 3px;
            border-radius: 8px;
          }
          `,
        }}
      />
    </div>
  );
}
