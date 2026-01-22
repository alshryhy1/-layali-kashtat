import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ArrowRight, MapPin, Phone, MessageCircle, Calendar } from "lucide-react";
import Link from "next/link";
import DeleteAdButton from "./DeleteAdButton";

export const dynamic = "force-dynamic";

export default async function HarajItemPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const isAr = locale === "ar";

  // Basic UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  let item = null;
  try {
    const res = await db.query("SELECT * FROM haraj_items WHERE id = $1", [id]);
    if (res.rows.length > 0) {
      item = res.rows[0];
    }
  } catch (err) {
    console.error("Error fetching item:", err);
  }

  if (!item) {
    notFound();
  }

  const t = {
    sar: isAr ? "ر.س" : "SAR",
    contact: isAr ? "تواصل" : "Contact",
    whatsapp: isAr ? "واتساب" : "WhatsApp",
    call: isAr ? "اتصال" : "Call",
    posted: isAr ? "نشر في" : "Posted on",
    city: isAr ? "المدينة" : "City",
    desc: isAr ? "التفاصيل" : "Description",
    back: isAr ? "عودة للحراج" : "Back to Marketplace",
  };

  const formattedDate = new Date(item.created_at).toLocaleDateString(
    isAr ? "ar-SA" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="page-container" dir={isAr ? "rtl" : "ltr"}>
      <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 40 }}>
        
        {/* Back Button */}
        <Link
          href={`/${locale}/haraj`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "#6b7280",
            textDecoration: "none",
            marginBottom: 24,
            fontWeight: 600,
          }}
        >
          <div style={{ transform: isAr ? "rotate(180deg)" : "none" }}>
            <ArrowRight size={20} />
          </div>
          {t.back}
        </Link>

        {/* Main Content */}
        <div style={{
          background: "#fff",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}>
          
          {/* Image */}
          <div style={{ position: "relative", height: 400, background: "#f3f4f6" }}>
            <Image
              src={item.image_url || "https://placehold.co/800x600?text=No+Image"}
              alt={item.title}
              fill
              style={{
                objectFit: "cover",
              }}
              unoptimized={item.image_url?.startsWith("http")}
            />
          </div>

          <div style={{ padding: 32 }}>
            {/* Header: Title & Price */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "flex-start", 
              flexWrap: "wrap", 
              gap: 16,
              marginBottom: 24,
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: 24
            }}>
              <div style={{ flex: 1 }}>
                <h1 style={{ 
                  margin: "0 0 12px 0", 
                  fontSize: 28, 
                  fontWeight: 800, 
                  color: "#111827",
                  lineHeight: "1.3"
                }}>
                  {item.title}
                </h1>
                <div style={{ display: "flex", gap: 16, color: "#6b7280", fontSize: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={16} />
                    {item.city}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={16} />
                    {formattedDate}
                  </div>
                </div>
              </div>
              
              <div style={{ 
                background: "#fef3c7", 
                color: "#92400e", 
                padding: "8px 16px", 
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 24,
                whiteSpace: "nowrap"
              }}>
                {item.price} <small style={{ fontSize: 14 }}>{t.sar}</small>
              </div>
            </div>

            {/* Admin Actions (Delete) */}
            <div style={{ marginBottom: 24, display: "flex", justifyContent: "flex-end" }}>
              <DeleteAdButton id={item.id} locale={locale} />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#374151" }}>
                {t.desc}
              </h2>
              <p style={{ 
                fontSize: 16, 
                lineHeight: "1.8", 
                color: "#4b5563", 
                whiteSpace: "pre-wrap" 
              }}>
                {item.description}
              </p>
            </div>

            {/* Contact Actions */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a
                href={`https://wa.me/966${item.contact_phone?.replace(/^0/, "")}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  background: "#25D366",
                  color: "#fff",
                  padding: "16px",
                  borderRadius: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  minWidth: 140
                }}
              >
                <MessageCircle size={20} />
                {t.whatsapp}
              </a>
              
              <a
                href={`tel:${item.contact_phone}`}
                style={{
                  flex: 1,
                  background: "#1f2937",
                  color: "#fff",
                  padding: "16px",
                  borderRadius: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  minWidth: 140
                }}
              >
                <Phone size={20} />
                {t.call}
              </a>
            </div>

          </div>
        </div>

        {/* Disclaimer */}
        <div style={{
          marginTop: 24,
          padding: 16,
          background: "#fffbeb",
          border: "1px dashed #f59e0b",
          borderRadius: 12,
          color: "#92400e",
          fontSize: 14,
          textAlign: "center",
          lineHeight: "1.5"
        }}>
          ⚠️ {isAr 
            ? "تنبيه: لا تقم بأي تحويل بنكي قبل معاينة السلعة واستلامها. الموقع مجرد وسيط للعرض ولا يتحمل مسؤولية البيع."
            : "Warning: Do not make any bank transfers before inspecting and receiving the item. The site is only a display platform."}
        </div>

      </div>
    </div>
  );
}
