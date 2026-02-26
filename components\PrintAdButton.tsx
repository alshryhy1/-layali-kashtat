 "use client";
 
 import { Printer } from "lucide-react";
 
 export default function PrintAdButton({ isAr }: { isAr: boolean }) {
   return (
     <button
       onClick={() => window.print()}
       className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-bold text-sm"
       title={isAr ? "طباعة الإعلان" : "Print Ad"}
     >
       <Printer size={18} />
       <span>{isAr ? "طباعة" : "Print"}</span>
     </button>
   );
 }
