import LanguageSwitcher from "@/components/LanguageSwitcher";

type Locale = "ar" | "en";

export default function SiteHeader({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";

  return (
    <header
      style={{
        width: "100%",
        /* ✅ لا بار أبيض كامل */
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

          /* عربي: الشعار يمين – اللغة يسار */
          flexDirection: isAr ? "row-reverse" : "row",

          gap: 12,
          paddingTop: 8,
          paddingBottom: 8,

          /* ✅ سطر واحد بدون لف */
          flexWrap: "nowrap",
          overflow: "hidden",
        }}
      >
        {/* الشعار — نص فقط */}
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

        {/* اللغة — (نضبطها بالملف التالي إذا تبي نص AR/EN بدل الرموز) */}
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
    </header>
  );
}
