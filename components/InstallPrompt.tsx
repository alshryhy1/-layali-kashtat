 "use client";
 
 import * as React from "react";
 
 export default function InstallPrompt() {
   const [canInstall, setCanInstall] = React.useState(false);
   const deferredRef = React.useRef<any>(null);
 
   React.useEffect(() => {
     const handler = (e: any) => {
       e.preventDefault();
       deferredRef.current = e;
       setCanInstall(true);
     };
     window.addEventListener("beforeinstallprompt", handler);
     return () => window.removeEventListener("beforeinstallprompt", handler);
   }, []);
 
   async function install() {
     if (!deferredRef.current) return;
     deferredRef.current.prompt();
     await deferredRef.current.userChoice;
     deferredRef.current = null;
     setCanInstall(false);
   }
 
   if (!canInstall) return null;
   return (
     <div style={{ position: "fixed", bottom: 20, right: 20, background: "#111", color: "#fff", borderRadius: 12, padding: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.2)" }}>
       <div style={{ fontWeight: 800, marginBottom: 8 }}>ثبّت التطبيق</div>
       <button onClick={install} style={{ height: 36, borderRadius: 8, border: "none", background: "#fff", color: "#111", fontWeight: 800, padding: "0 14px", cursor: "pointer" }}>
         تثبيت
       </button>
     </div>
   );
 }
