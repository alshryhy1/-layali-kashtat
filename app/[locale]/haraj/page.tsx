import { ShoppingBag, MapPin, Filter, Handshake } from "lucide-react";
import Link from "next/link";

// ⚠️ IMPORTANT: Force dynamic rendering so we always get fresh DB data
export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

export default async function HarajPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === "en" ? "en" : "ar") as Locale;
  const isAr = locale === "ar";

  const t = {
    title: isAr ? "حراج ليالي كشتات" : "Layali Kashtat Marketplace",
    desc: isAr
      ? "بيع وشراء مستلزمات الكشتات والتخييم المستعملة والجديدة."
      : "Buy and sell used and new camping gear.",
    categories: {
      tents: isAr ? "خيام وبيوت شعر" : "Tents",
      gear: isAr ? "أدوات تخييم" : "Camping Gear",
      cars: isAr ? "سيارات مجهزة" : "Modified Cars",
      others: isAr ? "أخرى" : "Others",
    },
    addItem: isAr ? "أضف إعلانك" : "Post Ad",
    search: isAr ? "ابحث عن سلعة..." : "Search for items...",
    sar: isAr ? "ر.س" : "SAR",
  };

  // Fetch items from API (DB)
  let items = [];
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/haraj`, { cache: "no-store" });
    const json = await res.json();
    if (json.success) {
      items = json.data;
    }
  } catch (err) {
    console.error("Failed to fetch haraj items:", err);
  }

  return (
    <div className="page-container" dir={isAr ? "rtl" : "ltr"}>
      {/* Header Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #92400e 0%, #78350f 100%)",
          color: "#fff",
          padding: "32px 20px",
          borderRadius: 24,
          marginBottom: 24,
          boxShadow: "0 10px 30px rgba(146, 64, 14, 0.2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <h1 style={{ margin: "0 0 8px 0", fontSize: 28, fontWeight: 900 }}>
            {t.title}
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: 16 }}>{t.desc}</p>
          
          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <Link
              href={`/${locale}/haraj/new`}
              style={{
                background: "#fff",
                color: "#92400e",
                padding: "10px 20px",
                borderRadius: 12,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <ShoppingBag size={18} />
              {t.addItem}
            </Link>

            <Link
              href={`/${locale}/haraj/commission`}
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: 12,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid rgba(255,255,255,0.4)"
              }}
            >
              <Handshake size={18} />
              {isAr ? "دفع العمولة" : "Pay Commission"}
            </Link>
          </div>
        </div>
        
        {/* Decorative Circles */}
        <div style={{
          position: "absolute",
          top: -20,
          left: isAr ? -20 : "auto",
          right: isAr ? "auto" : -20,
          width: 150,
          height: 150,
          background: "rgba(255,255,255,0.1)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute",
          bottom: -40,
          right: isAr ? -40 : "auto",
          left: isAr ? "auto" : -40,
          width: 200,
          height: 200,
          background: "rgba(255,255,255,0.05)",
          borderRadius: "50%",
        }} />
      </div>

      {/* Commission Banner */}
      <div style={{
        background: "#fffbeb",
        border: "1px dashed #f59e0b",
        borderRadius: 16,
        padding: "16px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        gap: 12
      }}>
        <div style={{
          background: "#fef3c7",
          color: "#d97706",
          width: 40,
          height: 40,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}>
          <Handshake size={20} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, color: "#92400e", fontWeight: 600, lineHeight: "1.5" }}>
            {isAr 
              ? "إبراءً للذمة: الموقع يأخذ عمولة 1% من قيمة المبايعة في حال تمت عن طريق الموقع، وهي أمانة في ذمة البائع."
              : "Disclaimer: The site takes a 1% commission on sales made through the platform, which is a trust payable by the seller."}
          </p>
        </div>
      </div>

      {/* Categories */}
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16, marginBottom: 16 }}>
        {Object.entries(t.categories).map(([key, label]) => (
          <button
            key={key}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              border: "1px solid #e5e7eb",
              background: "#fff",
              whiteSpace: "nowrap",
              fontSize: 14,
              fontWeight: 600,
              color: "#374151",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <input
          type="text"
          placeholder={t.search}
          style={{
            width: "100%",
            padding: "14px 20px",
            paddingInlineStart: 48,
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            background: "#fff",
            fontSize: 16,
            outline: "none",
          }}
        />
        <SearchIcon isAr={isAr} />
      </div>

      {/* Listings Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 16,
        }}
      >
        {items.map((item: any) => (
          <Link
            href={`/${locale}/haraj/${item.id}`}
            key={item.id}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              className="card"
              style={{
                background: "#fff",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                transition: "transform 0.2s",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ position: "relative", paddingTop: "75%" }}>
                <img
                  src={item.image_url || "https://placehold.co/400x300?text=No+Image"}
                  alt={item.title}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: isAr ? 8 : "auto",
                    left: isAr ? "auto" : 8,
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    padding: "4px 8px",
                    borderRadius: 8,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <MapPin size={12} />
                  {item.city}
                </div>
              </div>
              <div style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column" }}>
                <h3
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: 15,
                    fontWeight: 700,
                    lineHeight: "1.4",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {item.title}
                </h3>
                <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ color: "#92400e", fontWeight: 800, fontSize: 16 }}>
                    {item.price} <small style={{ fontSize: 12 }}>{t.sar}</small>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SearchIcon({ isAr }: { isAr: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        left: isAr ? "auto" : 16,
        right: isAr ? 16 : "auto",
        color: "#9ca3af",
        pointerEvents: "none",
      }}
    >
      <Filter size={20} />
    </div>
  );
}
