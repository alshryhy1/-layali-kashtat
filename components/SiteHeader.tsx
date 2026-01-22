"use client";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { usePathname } from "next/navigation";

type Locale = "ar" | "en";

export default function SiteHeader({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const pathname = usePathname();
  const isAdminLogin = pathname?.includes("/admin/login");

  return (
    <header
      className="lk-site-header"
      style={{
        width: "100%",
        background: "transparent",
        borderBottom: "none",
      }}
    >
      <div
        className="page-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexDirection: isAr ? "row-reverse" : "row",
          gap: 12,
          paddingTop: 8,
          paddingBottom: 8,
          flexWrap: "nowrap",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <strong
            style={{
              fontSize: 16,
              fontWeight: 900,
              lineHeight: "20px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: "#111",
            }}
            title={isAr ? "ليالي كشتات" : "Layali Kashtat"}
          >
            {isAr ? "ليالي كشتات" : "Layali Kashtat"}
          </strong>
          <a
            href={`/${locale}/admin/login`}
            style={{
              fontSize: 11,
              color: "#64748b",
              textDecoration: "none",
              marginTop: 2,
              fontWeight: 500,
            }}
          >
            {isAr ? "الإدارة" : "Administration"}
          </a>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isAdminLogin ? (
            <a
              href={`/${locale}`}
              style={{
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                color: "#1e293b",
                background: "rgba(30, 41, 59, 0.08)",
                padding: "6px 12px",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>↩️</span>
              <span>{isAr ? "رجوع" : "Return"}</span>
            </a>
          ) : (
            <a
              href={`/${locale}/haraj`}
              style={{
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                color: "#92400e",
                background: "rgba(146, 64, 14, 0.08)",
                padding: "6px 12px",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>🛍️</span>
              <span>{isAr ? "حراج" : "Haraj"}</span>
            </a>
          )}

          <div
            style={{
              display: "inline-flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          <LanguageSwitcher />
        </div>
        </div>
      </div>

      {/* ✅ Mobile-First: إخفاء البنر الأبيض على الجوال فقط -> REMOVED to show language switcher on mobile */}
      {/* <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 767.98px) {
              .lk-site-header { display: none !important; }
            }
          `,
        }}
      /> */}
    </header>
  );
}
