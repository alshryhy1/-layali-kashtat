 "use client";
 
 import React, { useEffect, useState } from "react";
 
 type Review = {
   id: string;
   rating: number;
   comment: string;
   customer_name: string | null;
   is_owner?: boolean;
   created_at?: string;
 };
 
 export default function ReviewsList({
   targetId,
   targetType,
   refreshTrigger,
   locale,
 }: {
   targetId: string;
   targetType: string;
   refreshTrigger: number;
   locale: string;
 }) {
   const [reviews, setReviews] = useState<Review[]>([]);
   const [loading, setLoading] = useState(true);
   const isAr = locale === "ar";
 
   useEffect(() => {
     const fetchReviews = async () => {
       setLoading(true);
       try {
         const res = await fetch(`/api/reviews?target_id=${targetId}&target_type=${targetType}`);
         const data = await res.json();
         if (data.ok) {
           setReviews(data.reviews);
         }
       } catch {
       } finally {
         setLoading(false);
       }
     };
     fetchReviews();
   }, [targetId, targetType, refreshTrigger]);
 
   if (loading) {
     return <div style={{ padding: 16, color: "#6b7280" }}>{isAr ? "جاري تحميل الردود..." : "Loading replies..."}</div>;
   }
 
   if (reviews.length === 0) {
     return (
       <div style={{ padding: 16, color: "#6b7280", textAlign: "center", background: "#f9fafb", borderRadius: 8 }}>
         {isAr ? "لا توجد ردود بعد." : "No replies yet."}
       </div>
     );
   }
 
   return (
     <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
       {reviews.map((review) => (
         <div key={review.id} style={{ padding: 16, borderBottom: "1px solid #e5e7eb" }}>
           <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
             <span style={{ fontWeight: 800, color: "#111" }}>
               {review.customer_name || (isAr ? "زائر" : "Guest")}
             </span>
             {review.is_owner && (
               <span style={{ padding: "2px 8px", borderRadius: 999, background: "#fef3c7", border: "1px solid #fde68a", fontWeight: 900, fontSize: 12, color: "#92400e" }}>
                 {isAr ? "منشئ" : "Owner"}
               </span>
             )}
           </div>
           <div style={{ color: "#374151", marginBottom: 8 }}>{review.comment}</div>
           <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#6b7280", fontSize: 12 }}>
             <span>{isAr ? "تقييم:" : "Rating:"} {review.rating}</span>
             {review.created_at && <span>· {new Date(review.created_at).toLocaleString(isAr ? "ar-SA" : "en-US")}</span>}
           </div>
         </div>
       ))}
     </div>
   );
 }
