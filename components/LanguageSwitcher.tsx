"use client";

import { usePathname, useRouter } from "next/navigation";

function normalizePath(pathname: string) {
  if (!pathname) return "/";
  // تأكد يبدأ بشرطة
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function getLocaleFromPath(pathname: string): "ar" | "en" | null {
  const p = normalizePath(pathname);
  const m = p.match(/^\/(ar|en)(\/|$)/);
  return (m?.[1] as "ar" | "en") ?? null;
}

function switchLocaleInPath(pathname: string, nextLocale: "ar" | "en") {
  const p = normalizePath(pathname);

  // إذا المسار يبدأ بـ /ar أو /en -> استبدله
  if (/^\/(ar|en)(\/|$)/.test(p)) {
    return p.replace(/^\/(ar|en)(\/|$)/, `/${nextLocale}$2`);
  }

  // إذا ما فيه locale في المسار -> أضف locale كبادئة
  return `/${nextLocale}${p === "/" ? "" : p}`;
}

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const current = getLocaleFromPath(pathname) ?? "ar";

  const go = (next: "ar" | "en") => {
    const nextPath = switchLocaleInPath(pathname, next);
    router.replace(nextPath);
    router.refresh();
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        type="button"
        onClick={() => go("ar")}
        style={{
          padding: "6px 10px",
          border: "1px solid #e5e5e5",
          borderRadius: 6,
          background: current === "ar" ? "#333" : "#fff",
          color: current === "ar" ? "#fff" : "#111",
          cursor: "pointer",
        }}
        aria-label="Switch to Arabic"
      >
        AR
      </button>

      <button
        type="button"
        onClick={() => go("en")}
        style={{
          padding: "6px 10px",
          border: "1px solid #e5e5e5",
          borderRadius: 6,
          background: current === "en" ? "#333" : "#fff",
          color: current === "en" ? "#fff" : "#111",
          cursor: "pointer",
        }}
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  );
}
