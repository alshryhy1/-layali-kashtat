"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeHref } from "@/lib/locales";

export default function ProviderDocsLink() {
  const pathname = usePathname() || "/";

  const isEn = pathname.startsWith("/en");
  const locale = isEn ? "en" : "ar";

  // Hide link inside dashboard
  if (pathname.includes("/dashboard")) {
    return null;
  }

  const href = localeHref(locale, "/providers/docs");
  const label = isEn ? "Provider Docs" : "توثيق مقدّمي الخدمة";

  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      style={{
        textDecoration: "underline",
        fontSize: 14,
        fontWeight: isActive ? 700 : 400,
        opacity: isActive ? 1 : 0.85,
      }}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </Link>
  );
}
