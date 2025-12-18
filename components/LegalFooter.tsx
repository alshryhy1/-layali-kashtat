export default function LegalFooter() {
  // فوتر مختصر جدًا بدون نصوص طويلة
  return (
    <footer
      style={{
        padding: "14px 16px",
        borderTop: "1px solid #e5e5e5",
        opacity: 0.75,
        fontSize: 12,
        textAlign: "center",
      }}
    >
      © {new Date().getFullYear()} ليالي كشتات | Layali Kashtat
    </footer>
  );
}
