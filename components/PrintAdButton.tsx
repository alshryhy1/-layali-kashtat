 "use client";
 
 export default function PrintAdButton({ isAr }: { isAr?: boolean }) {
   function print() {
     try {
       window.print();
     } catch {}
   }
   return (
     <button onClick={print} style={{ height: 36, padding: "0 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fafafa", cursor: "pointer" }}>
       {isAr ? "طباعة" : "Print"}
     </button>
   );
 }
