"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function swapLocale(pathname: string, to: "ar" | "en") {
  // يحافظ على نفس المسار ويبدل أول سيجمنت فقط (ar/en)
  const parts = (pathname || "/").split("?")[0].split("#")[0].split("/").filter(Boolean);

  if (parts.length === 0) return `/${to}`;

  const first = parts[0]?.toLowerCase();
  if (first === "ar" || first === "en") {
    parts[0] = to;
    return `/${parts.join("/")}`;
  }

  // لو ما فيه لغة في البداية، نضيفها
  return `/${to}/${parts.join("/")}`;
}

export default function SiteHeader() {
  const pathname = usePathname() || "/";
  const first = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  const locale: "ar" | "en" = first === "en" ? "en" : "ar";
  const isEn = locale === "en";

  const ui = isEn
    ? {
        brand: "Layali Kashtat",
        docs: "Provider Docs",
      }
    : {
        brand: "ليالي كشتات",
        docs: "توثيق مقدمي الخدمة",
      };

  const arHref = swapLocale(pathname, "ar");
  const enHref = swapLocale(pathname, "en");

  return (
    <header
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        backdropFilter: "blur(6px)",
        background: "rgba(255,255,255,0.55)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <strong style={{ fontSize: 16 }}>{ui.brand}</strong>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href={`/${locale}/provider-signup`} style={{ fontSize: 13, textDecoration: "underline" }}>
          {ui.docs}
        </Link>

        <div style={{ display: "flex", gap: 6 }}>
          <Link
            href={arHref}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.15)",
              background: !isEn ? "#111" : "#fff",
              color: !isEn ? "#fff" : "#111",
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            AR
          </Link>

          <Link
            href={enHref}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.15)",
              background: isEn ? "#111" : "#fff",
              color: isEn ? "#fff" : "#111",
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            EN
          </Link>
        </div>
      </div>
    </header>
  );
}
