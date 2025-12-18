"use client";

import { usePathname } from "next/navigation";

function switchLocale(pathname: string, nextLocale: "ar" | "en") {
  const p = pathname || "/";
  const parts = p.split("/").filter(Boolean);

  // إذا أول جزء لغة (ar/en) استبدله
  if (parts[0] === "ar" || parts[0] === "en") {
    parts[0] = nextLocale;
    return "/" + parts.join("/");
  }

  // إذا ما فيه لغة، أضفها
  return "/" + [nextLocale, ...parts].join("/");
}

export default function LanguageSwitcher() {
  const pathname = usePathname() || "/";
  const parts = pathname.split("/").filter(Boolean);
  const current = parts[0] === "en" ? "en" : "ar";

  const toAr = switchLocale(pathname, "ar");
  const toEn = switchLocale(pathname, "en");

  const btn: React.CSSProperties = {
    border: "1px solid #ddd",
    padding: "6px 10px",
    borderRadius: 10,
    fontWeight: 900,
    background: "rgba(255,255,255,0.85)",
    cursor: "pointer",
  };

  const active: React.CSSProperties = {
    background: "#111",
    color: "#fff",
    borderColor: "#111",
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <a href={toAr} style={{ ...btn, ...(current === "ar" ? active : {}) }}>
        AR
      </a>
      <a href={toEn} style={{ ...btn, ...(current === "en" ? active : {}) }}>
        EN
      </a>
    </div>
  );
}
