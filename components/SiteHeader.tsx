import LanguageSwitcher from "@/components/LanguageSwitcher";

type Locale = "ar" | "en";

export default function SiteHeader({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";

  return (
    <header
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid #e5e5e5",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <LanguageSwitcher />
      </div>

      <strong style={{ fontSize: 16 }}>{isAr ? "ليالي كشتات" : "Layali Kashtat"}</strong>
    </header>
  );
}
