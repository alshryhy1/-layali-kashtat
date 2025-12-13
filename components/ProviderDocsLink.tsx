"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ProviderDocsLink() {
  const pathname = usePathname() || "/";

  const isEn = pathname.startsWith("/en");
  const locale = isEn ? "en" : "ar";

  // ✅ إخفاء الرابط داخل dashboard (مقفل/مفتوح)
  if (pathname.startsWith(`/${locale}/dashboard`)) {
    return null;
  }

  const href = `/${locale}/providers/docs`;
  const label = isEn ? "Provider Docs" : "توثيق مقدّمي الخدمة";

  // ✅ Active إذا كنت داخل docs
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
