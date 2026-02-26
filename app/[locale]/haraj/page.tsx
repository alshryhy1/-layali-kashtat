import { ShoppingBag, MapPin, Filter, Handshake, MessageSquare } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import HarajFilters from "./HarajFilters";
import { db } from "@/lib/db";

// ⚠️ IMPORTANT: Force dynamic rendering so we always get fresh DB data
export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

export default async function HarajPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { locale: rawLocale } = params;
  const locale = (rawLocale === "en" ? "en" : "ar") as Locale;
  const isAr = locale === "ar";
  
  const t = {
    title: isAr ? "حراج ليالي كشتات" : "Layali Kashtat Marketplace",
    desc: isAr
      ? "بيع وشراء مستلزمات الكشتات والتخييم المستعملة والجديدة."
      : "Buy and sell used and new camping gear.",
    addItem: isAr ? "أضف إعلانك" : "Post Ad",
    sar: isAr ? "ر.س" : "SAR",
  };
  
  return (
    <div className="page-container" dir={isAr ? "rtl" : "ltr"} style={{ background: "#fcfcfc", minHeight: "100vh" }}>
      {/* Header Section */}
      <div
        style={{
          background: "#eeeeee",
          color: "#333",
          padding: "32px 20px",
          borderRadius: 24,
          marginBottom: 24,
          border: "1px solid #e0e0e0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <h1 style={{ margin: "0 0 8px 0", fontSize: 28, fontWeight: 900, color: "#111" }}>
            {t.title}
          </h1>
          <div
            style={{
              margin: "10px auto 0",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid #ddd",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(238,238,238,0.9))",
              color: "#444",
            }}
          >
            <ShoppingBag size={16} />
            <span style={{ fontSize: 14 }}>{t.desc}</span>
          </div>
          
          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <Link
              href={`/${locale}/haraj/new`}
              style={{
                background: "#e0e0e0",
                color: "#333",
                padding: "10px 20px",
                borderRadius: 12,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid #ccc"
              }}
            >
              <ShoppingBag size={18} />
              {t.addItem}
            </Link>

            <Link
              href={`/${locale}/haraj/commission`}
              style={{
                background: "#e0e0e0",
                color: "#333",
                padding: "10px 20px",
                borderRadius: 12,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid #ccc"
              }}
            >
              <Handshake size={18} />
              {isAr ? "دفع العمولة" : "Pay Commission"}
            </Link>
          </div>
          
        </div>
      </div>

      

      {/* Client-side Filters (Search + Categories) */}
      <HarajFilters isAr={isAr} />
      
      {/* Listings Grid */}
      <HarajGrid searchParams={searchParams} t={t} locale={locale} isAr={isAr} />
      
      
    </div>
  );
}

// Separate component to handle async data fetching based on searchParams
async function HarajGrid({ 
  searchParams, 
  t, 
  locale,
  isAr
}: { 
  searchParams?: { [key: string]: string | string[] | undefined };
  t: any;
  locale: string;
  isAr: boolean;
}) {
  const q = searchParams?.q || "";
  const category = searchParams?.category || "";
  const city = searchParams?.city || "";
  const minPrice = searchParams?.min_price || "";
  const maxPrice = searchParams?.max_price || "";
  
  let items: any[] = [];
  try {
    let sql = `
      SELECT haraj_items.*, 
      (SELECT COUNT(*) FROM reviews WHERE target_id = haraj_items.id AND target_type = 'haraj') as reviews_count 
      FROM haraj_items WHERE 1=1
    `;
    const params: any[] = [];
    if (q) {
      params.push(`%${String(q)}%`);
      sql += ` AND (title ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }
    if (category && category !== "all") {
      params.push(String(category));
      sql += ` AND category = $${params.length}`;
    }
    if (city) {
      params.push(`%${String(city)}%`);
      sql += ` AND city ILIKE $${params.length}`;
    }
    if (minPrice) {
      params.push(Number(minPrice));
      sql += ` AND price >= $${params.length}`;
    }
    if (maxPrice) {
      params.push(Number(maxPrice));
      sql += ` AND price <= $${params.length}`;
    }
    sql += ` ORDER BY 
      CASE WHEN created_at > NOW() - INTERVAL '30 minutes' THEN 0 ELSE 1 END ASC,
      CASE 
        WHEN created_at > NOW() - INTERVAL '30 minutes' THEN EXTRACT(EPOCH FROM created_at)
        ELSE (SELECT COUNT(*) FROM reviews WHERE target_id = haraj_items.id AND target_type = 'haraj')
      END DESC,
      created_at DESC`;
    const res = await db.query(sql, params);
    items = res.rows || [];
  } catch (err) {
    console.error("Failed to query haraj items:", err);
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>
          {isAr ? "لا توجد نتائج مطابقة لبحثك." : "No items found matching your search."}
        </p>
      </div>
    );
  }

  return (
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
                background: "#f5f5f5",
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
                <Image
                  src={item.image_url || "https://placehold.co/400x300?text=No+Image"}
                  alt={item.title}
                  fill
                  style={{
                    objectFit: "cover",
                  }}
                  unoptimized={item.image_url?.startsWith("http")}
                />
                
                {/* New Badge (< 30 mins) */}
                {(new Date().getTime() - new Date(item.created_at).getTime()) < 30 * 60 * 1000 && (
                  <div style={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: isAr ? 'auto' : 8, 
                    left: isAr ? 8 : 'auto', 
                    background: '#f59e0b', 
                    color: 'white', 
                    padding: '4px 10px', 
                    borderRadius: 8, 
                    fontSize: 12, 
                    fontWeight: 'bold', 
                    zIndex: 2,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    {isAr ? 'جديد' : 'New'}
                  </div>
                )}

                {/* Listing Type Badge */}
                {item.listing_type === 'rent' && (
                  <div style={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: isAr ? 8 : 'auto', 
                    left: isAr ? 'auto' : 8, 
                    background: '#22c55e', 
                    color: 'white', 
                    padding: '4px 10px', 
                    borderRadius: 8, 
                    fontSize: 12, 
                    fontWeight: 'bold', 
                    zIndex: 2,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    {isAr ? 'إيجار' : 'Rent'}
                  </div>
                )}
                {item.listing_type === 'auction' && (
                  <div style={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: isAr ? 8 : 'auto', 
                    left: isAr ? 'auto' : 8, 
                    background: '#ef4444', 
                    color: 'white', 
                    padding: '4px 10px', 
                    borderRadius: 8, 
                    fontSize: 12, 
                    fontWeight: 'bold', 
                    zIndex: 2,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    {isAr ? 'مزاد' : 'Auction'}
                  </div>
                )}

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
                  
                  {Number(item.reviews_count) > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#666", fontSize: 13 }}>
                      <MessageSquare size={14} />
                      <span>{item.reviews_count}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
  );
}
