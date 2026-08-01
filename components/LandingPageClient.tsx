"use client";

import * as React from "react";
import { localeHref } from "@/lib/locales";

export default function LandingPageClient({ locale }: { locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  return (
   <div
     className="page-container"
     dir={isAr ? "rtl" : "ltr"}
     style={{
       minHeight: "70vh",
       display: "grid",
       placeItems: "center",
       background: "linear-gradient(180deg,#efe7de 0%,#f4eee6 100%)",
     }}
   >
     <div
       style={{
         width: 420,
         maxWidth: "90vw",
         background: "#fff",
         borderRadius: 24,
         boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
         padding: 24,
         textAlign: "center",
         border: "1px solid #eee",
       }}
     >
       <div style={{ marginBottom: 16 }}>
         <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>{isAr ? "ليالي كشتات" : "Layali Kashtat"}</h1>
         <div style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>
           {isAr ? "منصة خدمات الكشتات والرحلات" : "Services platform for camping and trips"}
         </div>
       </div>
       <div style={{ display: "grid", gap: 12 }}>
         <a
           href={localeHref(locale, "/providers/login")}
           style={{
             display: "inline-block",
             padding: "12px 16px",
             borderRadius: 12,
             background: "#92400e",
             color: "#fff",
             fontWeight: 900,
             textDecoration: "none",
           }}
         >
           {isAr ? "تسجيل الدخول" : "Login"}
         </a>
         <a
           href={localeHref(locale, "/signup")}
           style={{
             display: "inline-block",
             padding: "12px 16px",
             borderRadius: 12,
             border: "1px solid #e5e7eb",
             background: "#fff",
             color: "#111",
             fontWeight: 900,
             textDecoration: "none",
           }}
         >
           {isAr ? "تسجيل جديد" : "Sign Up"}
         </a>
         <div
           style={{
             display: "grid",
             gridTemplateColumns: "1fr 1fr",
             gap: 12,
             marginTop: 6,
           }}
         >
           <a
             href={localeHref(locale, "/haraj")}
             style={{
               display: "inline-block",
               padding: "16px 12px",
               borderRadius: 16,
               background: "#f6fef8",
               border: "1px solid #d1fae5",
               color: "#111",
               fontWeight: 900,
               textDecoration: "none",
             }}
           >
             {isAr ? "تصفح الحراج" : "Browse Haraj"}
           </a>
           <a
             href={localeHref(locale, "/gallery")}
             style={{
               display: "inline-block",
               padding: "16px 12px",
               borderRadius: 16,
               background: "#f5f3ff",
               border: "1px solid #ddd6fe",
               color: "#111",
               fontWeight: 900,
               textDecoration: "none",
             }}
           >
             {isAr ? "تصفح المعرض" : "Browse Gallery"}
           </a>
         </div>
       </div>
       <div style={{ marginTop: 14 }}>
         <a
           href={localeHref(locale, "/coming-soon")}
           style={{
             display: "inline-flex",
             alignItems: "center",
             justifyContent: "center",
             height: 40,
             padding: "0 18px",
             borderRadius: 999,
             background: "#111",
             color: "#fff",
             fontWeight: 900,
             textDecoration: "none",
           }}
         >
           {isAr ? "ثبت التطبيق" : "Install App"}
         </a>
       </div>
     </div>
   </div>
  );
}
