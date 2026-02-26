 "use client";
 
 import { useEffect } from "react";
 
 export default function ViewTracker() {
   useEffect(() => {
     fetch("/api/analytics/view", { method: "POST" }).catch((err) =>
       console.error("View tracking failed", err)
     );
   }, []);
 
   return null;
 }
