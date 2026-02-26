 "use client";
 
 import * as React from "react";
 
 export default function MapClient() {
   return (
     <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "#e5e7eb" }}>
       <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }}>
         <div style={{ fontWeight: 900, color: "#111", marginBottom: 6 }}>الخريطة</div>
         <div style={{ color: "#666", fontSize: 13 }}>سيتم تحميل الخريطة هنا لاحقًا</div>
       </div>
     </div>
   );
 }
