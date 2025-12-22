"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Locale = "ar" | "en";

function normalizePath(p: string) {
  if (!p) return "/";
  // تأكد يبدأ بـ /
  return p.startsWith("/") ? p : `/${p}`;
}

function stripLocalePrefix(pathname: string) {
  const p = normalizePath(pathname);
  if (p === "/ar" || p.startsWith("/ar/")) return p.slice(3) || "/";
  if (p === "/en" || p.startsWith("/en/")) return p.slice(3) || "/";
  return p; // نادر: مسار بدون لوكال
}

function buildLocaleHref(currentPathname: string, target: Locale) {
  const rest = stripLocalePrefix(currentPathname);
  // rest يكون "/" أو "/something"
  if (rest === "/") return `/${target}`;
  return `/${target}${rest}`;
}

export default function SiteHeader({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const pathname = usePathname() || `/${locale}`;

  const arHref = buildLocaleHref(pathname, "ar");
  const enHref = buildLocaleHref(pathname, "en");

  const flagBtn = (active: boolean) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 28,
    borderRadius: 10,
    border: active ? "1px solid #111" : "1px solid #d0d0d0",
    background: active ? "#111" : "#fff",
    color: active ? "#fff" : "#111",
    textDecoration: "none" as const,
    fontWeight: 900 as const,
    lineHeight: 1,
    userSelect: "none" as const,
  });

  return (
    <header
      dir={isAr ? "rtl" : "ltr"}
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid #e5e5e5",
        background: "rgba(255,255,255,0.86)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <strong style={{ fontSize: 16, fontWeight: 900 }}>
          {isAr ? "ليالي كشتات" : "Layali Kashtat"}
        </strong>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href={arHref}
            prefetch={false}
            style={flagBtn(locale === "ar")}
            aria-label="العربية"
            title="العربية"
          >
            🇸🇦
          </Link>

          <Link
            href={enHref}
            prefetch={false}
            style={flagBtn(locale === "en")}
            aria-label="English"
            title="English"
          >
            🇬🇧
          </Link>
        </div>
      </div>
    </header>
  );
}
