 "use client";
 
 export default function ShareButtons({ title, text, isAr }: { title?: string; text?: string; isAr?: boolean }) {
   async function share() {
     try {
       if (navigator.share) {
         await navigator.share({ title, text, url: window.location.href });
       }
     } catch {}
   }
   return (
     <button onClick={share} style={{ height: 36, padding: "0 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fafafa", cursor: "pointer" }}>
       {isAr ? "مشاركة" : "Share"}
     </button>
   );
 }
