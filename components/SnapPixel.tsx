"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

declare global {
  interface Window {
    snaptr: any;
  }
}

export default function SnapPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (window.snaptr) {
      window.snaptr('track', 'PAGE_VIEW');
    }
  }, [pathname, searchParams]);

  return (
    <>
      <Script id="snap-pixel" strategy="afterInteractive">
        {`
        (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
        {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
        a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
        r.src=n;var u=t.getElementsByTagName(s)[0];
        u.parentNode.insertBefore(r,u);})(window,document,
        'https://sc-static.net/scevent.min.js');

        snaptr('init', '29fc505e-0da7-47a9-bcdb-80b2c49a852c', {});

        snaptr('track', 'PAGE_VIEW');
        `}
      </Script>
    </>
  );
}
