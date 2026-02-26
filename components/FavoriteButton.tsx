 "use client";
 
 import * as React from "react";
 
 export default function FavoriteButton({ itemId, initialIsFavorite, isLoggedIn }: { itemId: string; initialIsFavorite?: boolean; isLoggedIn?: boolean }) {
   const [fav, setFav] = React.useState(!!initialIsFavorite);
   async function toggle() {
     if (!isLoggedIn) return;
     setFav((v) => !v);
     try {
       await fetch("/api/favorites/toggle", {
         method: "POST",
         headers: { "content-type": "application/json" },
         body: JSON.stringify({ itemId }),
       });
     } catch {}
   }
   return (
     <button onClick={toggle} disabled={!isLoggedIn} style={{ height: 36, padding: "0 12px", borderRadius: 8, border: "1px solid #ddd", background: fav ? "#fde68a" : "#fafafa", cursor: "pointer" }}>
       {fav ? "❤️" : "🤍"}
     </button>
   );
 }
