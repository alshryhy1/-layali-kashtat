import type { Metadata } from "next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export const metadata: Metadata = {
  title: "ليالي كشتات | Layali Kashtat",
};

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = params?.locale === "en" ? "en" : "ar";
  const dir = locale === "en" ? "ltr" : "rtl";

  return (
    <div dir={dir} style={{ minHeight: "100vh" }}>
      <header
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(229,229,229,0.9)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(255,255,255,0.88)", // شفافية حتى تظهر الخلفية
          backdropFilter: "blur(6px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <strong>{locale === "en" ? "Layali Kashtat" : "ليالي كشتات"}</strong>
        <LanguageSwitcher />
      </header>

      {/* لا تحط background أبيض هنا */}
      <main style={{ minHeight: "calc(100vh - 70px)" }}>{children}</main>
    </div>
  );
}
