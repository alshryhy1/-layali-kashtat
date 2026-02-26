 "use client";
 
 import LanguageSwitcher from "@/components/LanguageSwitcher";
 import { usePathname } from "next/navigation";
 
 type Locale = "ar" | "en";
 
 export default function SiteHeader({ locale }: { locale: Locale }) {
   const isAr = locale === "ar";
   const pathname = usePathname();
   const isAdminLogin = pathname?.includes("/admin/login");
   const isHomePage = pathname === `/${locale}` || pathname === `/${locale}/`;
   const isHaraj = pathname?.includes("/haraj");
 
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
           paddingTop: 12,
           paddingBottom: 12,
           flexWrap: "nowrap",
           overflow: "hidden",
           position: "relative",
         }}
       >
         {!isHaraj && (
           <div
             style={{
               position: "absolute",
               left: "50%",
               top: "50%",
               transform: "translate(-50%, -50%)",
               maxWidth: "70%",
               textAlign: "center",
               whiteSpace: "nowrap",
               pointerEvents: "none",
               zIndex: 1,
             }}
           >
             <span
               style={{
                 fontSize: 24,
                 fontWeight: 900,
                 display: "inline-block",
                 background:
                   "linear-gradient(90deg, #f59e0b, #ef4444, #8b5cf6, #10b981)",
                 backgroundSize: "200% 200%",
                 WebkitBackgroundClip: "text",
                 backgroundClip: "text",
                 color: "transparent",
                 animation: "lkPulse 3s ease-in-out infinite, lkGradientShift 3s ease-in-out infinite",
               }}
             >
               {isAr ? "ليالي" : "Layali"}
             </span>
             <span>&nbsp;</span>
             <span
               style={{
                 fontSize: 24,
                 fontWeight: 900,
                 display: "inline-block",
                 background:
                   "linear-gradient(90deg, #10b981, #8b5cf6, #ef4444, #f59e0b)",
                 backgroundSize: "200% 200%",
                 WebkitBackgroundClip: "text",
                 backgroundClip: "text",
                 color: "transparent",
                 animation: "lkPulse 3s ease-in-out infinite, lkGradientShift 3s ease-in-out infinite",
                 animationDelay: "0.18s",
               }}
             >
               {isAr ? "كشتات" : "Kashtat"}
             </span>
           </div>
         )}
         <div style={{ display: "flex", flexDirection: "column" }}>
           {isHomePage ? (
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
           ) : (
             <a
               href={`/${locale}`}
               style={{
                 fontSize: 11,
                 color: "#64748b",
                 textDecoration: "none",
                 marginTop: 2,
                 fontWeight: 500,
               }}
             >
               {isAr ? "العودة للرئيسية" : "Back to Home"}
             </a>
           )}
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
           ) : pathname?.includes("/haraj") ? (
             <a
               href={`/${locale}`}
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
               <span>🏠</span>
               <span>{isAr ? "الرئيسية" : "Home"}</span>
             </a>
           ) : null}
 
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
       <style
         dangerouslySetInnerHTML={{
           __html: `
             @keyframes lkPulse {
               0%, 100% { transform: scale(1); }
               50% { transform: scale(1.06); }
             }
             @keyframes lkGradientShift {
               0% { background-position: 0% 50%; }
               50% { background-position: 100% 50%; }
               100% { background-position: 0% 50%; }
             }
             @media (max-width: 480px) {
               .lk-site-header span[style*="lkGradientShift"] { font-size: 20px !important; }
             }
           `,
         }}
       />
     </header>
   );
 }
