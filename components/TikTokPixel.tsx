"use client";

import { Suspense, useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    ttq?: {
      page: () => void;
      track: (event: string, params?: Record<string, unknown>) => void;
    };
  }
}

const TIKTOK_PIXEL_ID = (
  process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "DA6DDV3C77U98E0UGDC0"
).trim();

function TikTokPixelInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      window.ttq?.page();
    } catch {}
  }, [pathname, searchParams]);

  return null;
}

export default function TikTokPixel() {
  const disabledByEnv =
    String(process.env.NEXT_PUBLIC_DISABLE_PIXELS || "").toLowerCase() === "true";

  if (!TIKTOK_PIXEL_ID || disabledByEnv) return null;

  return (
    <>
      <Script id="tiktok-pixel" strategy="afterInteractive">
        {`
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
            ttq.load(${JSON.stringify(TIKTOK_PIXEL_ID)});
            ttq.page();
          }(window, document, 'ttq');
        `}
      </Script>
      <Suspense fallback={null}>
        <TikTokPixelInner />
      </Suspense>
    </>
  );
}
