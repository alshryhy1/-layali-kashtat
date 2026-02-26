"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter, Search } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

export default function HarajFilters({ isAr }: { isAr: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentCategory = searchParams.get("category") || "all";

  const categories = {
    all: isAr ? "الكل" : "All",
    tents: isAr ? "خيام وبيوت شعر" : "Tents",
    gear: isAr ? "أدوات تخييم" : "Camping Gear",
    cars: isAr ? "سيارات مجهزة" : "Modified Cars",
    others: isAr ? "أخرى" : "Others",
  };

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleCategory = (category: string) => {
    const params = new URLSearchParams(searchParams);
    if (category === "all") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleFilter = useDebouncedCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, 500);

  return (
    <div>
      {/* Categories */}
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16, marginBottom: 16 }}>
        {Object.entries(categories).map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleCategory(key)}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              border: key === currentCategory ? "1px solid #92400e" : "1px solid #e5e7eb",
              background: key === currentCategory ? "#fffbeb" : "#fff",
              whiteSpace: "nowrap",
              fontSize: 14,
              fontWeight: key === currentCategory ? 700 : 600,
              color: key === currentCategory ? "#92400e" : "#374151",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
        gap: 12, 
        marginBottom: 16 
      }}>
        {/* City Filter */}
        <input
          type="text"
          placeholder={isAr ? "المدينة..." : "City..."}
          defaultValue={searchParams.get("city")?.toString()}
          onChange={(e) => handleFilter("city", e.target.value)}
          style={{
            padding: "10px",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            fontSize: 14,
            outline: "none"
          }}
        />
        
        {/* Min Price */}
        <input
          type="number"
          placeholder={isAr ? "أقل سعر" : "Min Price"}
          defaultValue={searchParams.get("min_price")?.toString()}
          onChange={(e) => handleFilter("min_price", e.target.value)}
          style={{
            padding: "10px",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            fontSize: 14,
            outline: "none"
          }}
        />

        {/* Max Price */}
        <input
          type="number"
          placeholder={isAr ? "أعلى سعر" : "Max Price"}
          defaultValue={searchParams.get("max_price")?.toString()}
          onChange={(e) => handleFilter("max_price", e.target.value)}
          style={{
            padding: "10px",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            fontSize: 14,
            outline: "none"
          }}
        />
      </div>

      {/* Search Bar */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <input
          type="text"
          placeholder={isAr ? "ابحث عن سلعة..." : "Search for items..."}
          defaultValue={searchParams.get("q")?.toString()}
          onChange={(e) => handleSearch(e.target.value)}
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
          <Search size={20} />
        </div>
      </div>
    </div>
  );
}
