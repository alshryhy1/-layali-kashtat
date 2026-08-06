import { db } from "@/lib/db";
import Image from "next/image";
import { ArrowRight, MapPin, Phone, MessageCircle, Calendar, AlertTriangle } from "lucide-react";
import Link from "next/link";
import DeleteAdButton from "./DeleteAdButton";
import ShareButtons from "@/components/ShareButtons";
import FavoriteButton from "@/components/FavoriteButton";
import PrintAdButton from "@/components/PrintAdButton";
import ReviewsSection from "@/components/ReviewsSection";
import SubPageHeader, { SUB_PAGE_BG, SUB_PAGE_CARD_BG } from "@/components/SubPageHeader";
import { verifyAdminSession } from "@/lib/auth-admin";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth-customer";

export const dynamic = "force-dynamic";

export default async function HarajItemPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const isAr = locale === "ar";

  const t = {
    sar: isAr ? "ر.س" : "SAR",
    contact: isAr ? "تواصل" : "Contact",
    whatsapp: isAr ? "واتساب" : "WhatsApp",
    call: isAr ? "اتصال" : "Call",
    posted: isAr ? "نشر في" : "Posted on",
    city: isAr ? "المدينة" : "City",
    desc: isAr ? "التفاصيل" : "Description",
    back: isAr ? "عودة للحراج" : "Back to Marketplace",
    notFound: isAr ? "الإعلان غير موجود" : "Ad Not Found",
    notFoundDesc: isAr ? "عذراً، هذا الإعلان قد تم حذفه أو غير متوفر حالياً." : "Sorry, this ad has been deleted or is currently unavailable.",
    loginToContact: isAr ? "سجل الدخول لإظهار معلومات التواصل" : "Login to view contact info",
  };

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
    return (
      <div className="page-container" dir={isAr ? "rtl" : "ltr"} style={{ background: SUB_PAGE_BG, minHeight: "100vh" }}>
        <SubPageHeader locale={locale} title={isAr ? "تفاصيل الإعلان" : "Listing details"} fallbackHref="/haraj" />
        <div style={{ textAlign: "center", padding: 40, background: SUB_PAGE_CARD_BG, borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", maxWidth: 400, margin: "24px auto", border: "1px solid #E4D5C2" }}>
          <div style={{ background: "#fee2e2", color: "#ef4444", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <AlertTriangle size={32} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#173B5B", marginBottom: 12 }}>{t.notFound}</h1>
          <p style={{ color: "#666", marginBottom: 32, lineHeight: "1.6" }}>{t.notFoundDesc}</p>
          <Link
            href={`/${locale}/haraj`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#0B6B63",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 12,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <div style={{ transform: isAr ? "rotate(180deg)" : "none" }}>
              <ArrowRight size={20} />
            </div>
            {t.back}
          </Link>
        </div>
      </div>
    );
  }

  const session = await getSession();
  let isFavorited = false;
  if (session) {
    const favRes = await db.query("SELECT 1 FROM favorites WHERE customer_id = $1 AND item_id = $2", [
      session.id,
      item.id,
    ]);
    isFavorited = favRes.rows.length > 0;
  }

  // Check Admin
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("kashtat_admin")?.value;
  const isAdmin = verifyAdminSession(adminToken);

  const formattedDate = new Date(item.created_at).toLocaleDateString(
    isAr ? "ar-SA" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="page-container" dir={isAr ? "rtl" : "ltr"} style={{ background: SUB_PAGE_BG, minHeight: "100vh" }}>
      <SubPageHeader
        locale={locale}
        title={isAr ? "تفاصيل الإعلان" : "Listing details"}
        fallbackHref="/haraj"
      />
      <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 40, paddingTop: 4, paddingLeft: 16, paddingRight: 16 }}>

        {/* Main Content */}
        <div style={{
          background: SUB_PAGE_CARD_BG,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          border: "1px solid #E4D5C2",
        }}>
          
          {/* Image */}
          <div style={{ position: "relative", height: 400, background: "#eeeeee" }}>
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

          <div style={{ padding: 0 }}>
            {/* Header: Title & Price */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "flex-start", 
              flexWrap: "wrap", 
              gap: 16,
              padding: "24px 32px",
              background: "#eeeeee",
              borderBottom: "1px solid #e0e0e0",
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
                background: "#e0e0e0", 
                color: "#111", 
                padding: "8px 16px", 
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 24,
                whiteSpace: "nowrap"
              }}>
                {item.price} <small style={{ fontSize: 14 }}>{t.sar}</small>
              </div>
            </div>

            <div style={{ padding: 32 }}>
              {/* Admin Actions (Delete) & Share */}
              <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <ShareButtons title={item.title} text={item.description} isAr={isAr} />
                  <FavoriteButton itemId={item.id} initialIsFavorite={isFavorited} isLoggedIn={!!session} />
                  <PrintAdButton isAr={isAr} />
                </div>
                <DeleteAdButton id={item.id} locale={locale} isAdmin={isAdmin} />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 32, background: "#fafafa", padding: 20, borderRadius: 12 }}>
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
              {session ? (
                <>
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
                </>
              ) : (
                <Link
                  href={`/${locale}/customer/login`}
                  style={{
                    flex: 1,
                    background: "#92400e",
                    color: "#fff",
                    padding: "16px",
                    borderRadius: 12,
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%"
                  }}
                >
                  <div style={{ transform: isAr ? "rotate(180deg)" : "none" }}>
                    <ArrowRight size={20} />
                  </div>
                  {t.loginToContact}
                </Link>
              )}
            </div>

            </div>

          </div>
        </div>

        {/* Reviews Section */}
        <ReviewsSection 
          targetId={item.id} 
          targetType="haraj" 
          isLoggedIn={!!session} 
          locale={locale} 
        />

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
