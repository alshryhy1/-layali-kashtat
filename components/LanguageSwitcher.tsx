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
  const current: Locale = locale === "en" || locale === "ar" ? locale : detectLocaleFromPath(pathname);

  const arHref = buildLocaleHref(pathname, "ar");
  const enHref = buildLocaleHref(pathname, "en");

  const flagBtn = (active: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 28,
    borderRadius: 10,
    border: active ? "1px solid #111" : "1px solid #d0d0d0",
    background: active ? "#111" : "#fff",
    color: active ? "#fff" : "#111",
    textDecoration: "none",
    fontWeight: 900,
    lineHeight: 1,
    userSelect: "none",
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Link href={arHref} prefetch={false} style={flagBtn(current === "ar")} aria-label="العربية" title="العربية">
        🇸🇦
      </Link>

      <Link href={enHref} prefetch={false} style={flagBtn(current === "en")} aria-label="English" title="English">
        🇬🇧
      </Link>
    </div>
  );
}
