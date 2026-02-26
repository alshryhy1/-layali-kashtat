 "use client";
 
 import { Suspense } from "react";
 import Script from "next/script";
 import { usePathname, useSearchParams } from "next/navigation";
 import { useEffect } from "react";
 
 declare global {
   interface Window {
     snaptr: any;
   }
 }
 
 function SnapPixelInner() {
   const pathname = usePathname();
   const searchParams = useSearchParams();
 
   useEffect(() => {
     try {
       if (window.snaptr) {
         window.snaptr("track", "PAGE_VIEW");
       }
     } catch {}
   }, [pathname, searchParams]);
 
   return null;
 }
 
 export default function SnapPixel() {
   const isProd = process.env.NODE_ENV === "production";
   const disabledByEnv = String(process.env.NEXT_PUBLIC_DISABLE_PIXELS || "").toLowerCase() === "true";
   const consent = typeof window !== "undefined" ? localStorage.getItem("lk_consent_marketing") === "true" : false;
 
   // Load pixel only in production, not explicitly disabled, and with consent
   const shouldLoad = isProd && !disabledByEnv && consent;
   if (!shouldLoad) return null;
 
   return (
     <>
       <Script id="snap-pixel" strategy="afterInteractive">
         {`
         try {
           (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
           {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
           a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
           r.src=n;var u=t.getElementsByTagName(s)[0];
           u.parentNode.insertBefore(r,u);})(window,document,
           'https://sc-static.net/scevent.min.js');
 
           snaptr('init', '29fc505e-0da7-47a9-bcdb-80b2c49a852c', {});
           snaptr('track', 'PAGE_VIEW');
         } catch (e) {}
         `}
       </Script>
       <Suspense fallback={null}>
         <SnapPixelInner />
       </Suspense>
     </>
   );
 }
