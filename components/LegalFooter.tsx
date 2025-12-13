"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LegalFooter() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "ar";

  return (
    <footer
      style={{
        marginTop: 40,
        padding: "16px 0",
        borderTop: "1px solid #eee",
        textAlign: "center",
        fontSize: 12,
        opacity: 0.7,
      }}
    >
      <p style={{ marginBottom: 8 }}>
        المنصة وسيط تقني لتنظيم الطلبات والتواصل ولا تتحمل مسؤولية التنفيذ
      </p>

      <Link
        href={`/${locale}/legal`}
        style={{
          textDecoration: "underline",
          color: "inherit",
        }}
      >
        النصوص القانونية
      </Link>
    </footer>
  );
}
