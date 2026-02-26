 "use client";
 
 import React, { useState } from "react";
 
 export default function ReviewForm({
   targetId,
   targetType,
   isLoggedIn,
   onSuccess,
   locale,
 }: {
   targetId: string;
   targetType: string;
   isLoggedIn: boolean;
   onSuccess: () => void;
   locale: string;
 }) {
   const [rating, setRating] = useState(0);
   const [comment, setComment] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");
   const isAr = locale === "ar";
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!rating) {
       setError(isAr ? "الرجاء اختيار التقييم" : "Please select a rating");
       return;
     }
     setLoading(true);
     setError("");
     try {
       const res = await fetch("/api/reviews", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ target_id: targetId, target_type: targetType, rating, comment }),
       });
       const data = await res.json();
       if (data.ok) {
         setRating(0);
         setComment("");
         onSuccess();
       } else {
         setError(data.error || (isAr ? "فشل إرسال الرد" : "Failed to submit reply"));
       }
     } catch {
       setError(isAr ? "خطأ في الإرسال" : "Submission error");
     } finally {
       setLoading(false);
     }
   };
 
   if (!isLoggedIn) {
     return (
       <div style={{ padding: 16, background: "#f9fafb", borderRadius: 12, marginBottom: 16, color: "#6b7280", textAlign: "center" }}>
         {isAr ? "سجّل الدخول لإضافة رد" : "Login to add a reply"}
       </div>
     );
   }
 
   return (
     <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
       <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
         {[1, 2, 3, 4, 5].map((n) => (
           <button
             key={n}
             type="button"
             onClick={() => setRating(n)}
             style={{
               width: 32,
               height: 32,
               borderRadius: 8,
               border: "1px solid #e5e7eb",
               background: rating >= n ? "#fde68a" : "#fff",
               cursor: "pointer",
               fontWeight: 800,
               color: "#111",
             }}
           >
             {n}
           </button>
         ))}
       </div>
       <textarea
         value={comment}
         onChange={(e) => setComment(e.target.value)}
         placeholder={isAr ? "اكتب ردك..." : "Write your reply..."}
         style={{
           width: "100%",
           minHeight: 80,
           borderRadius: 12,
           border: "1px solid #e5e7eb",
           padding: 12,
           outline: "none",
           marginBottom: 8,
         }}
       />
       {error && <div style={{ color: "#b91c1c", marginBottom: 8, fontWeight: 700 }}>{error}</div>}
       <button
         type="submit"
         disabled={loading}
         style={{
           padding: "10px 16px",
           borderRadius: 12,
           background: "#111",
           color: "#fff",
           fontWeight: 800,
           border: "none",
           cursor: "pointer",
         }}
       >
         {loading ? (isAr ? "جارٍ الإرسال..." : "Submitting...") : (isAr ? "إرسال" : "Submit")}
       </button>
     </form>
   );
 }
