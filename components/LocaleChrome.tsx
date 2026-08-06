"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import TopInfoBar from "@/components/TopInfoBar";
import LegalFooter from "@/components/LegalFooter";
import AppTabBar from "@/components/AppTabBar";
import { APP_TAB_BAR_HEIGHT, shouldShowAppTabBar, stripLocale } from "@/lib/appTabBar";
import type { Locale } from "@/lib/locales";

/**
 * App-shell routes (tabs visible) match native MainTabs: no marketing TopInfoBar /
 * SiteHeader / LegalFooter — only the floating tab bar + cream page background.
 * Admin routes: no public legal footer / marketing chrome (AdminPageShell owns UI).
 */
export default function LocaleChrome({
  locale,
  weatherText,
  topBannerText,
  children,
}: {
  locale: Locale;
  weatherText?: string;
  topBannerText: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const bare = stripLocale(pathname);
  const isAdminRoute = bare === "/admin" || bare.startsWith("/admin/");
  const showTabs = shouldShowAppTabBar(pathname);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const tabPad = showTabs ? APP_TAB_BAR_HEIGHT + 28 : 0;

  if (isAdminRoute) {
    return <>{children}</>;
  }

  if (showTabs) {
    return (
      <>
        <main
          dir={dir}
          style={{
            minHeight: "100vh",
            margin: 0,
            paddingTop: 0,
            paddingRight: 0,
            paddingLeft: 0,
            paddingBottom: tabPad,
            background: "#EFE3D2",
            boxSizing: "border-box",
          }}
        >
          {children}
        </main>
        <AppTabBar locale={locale} />
      </>
    );
  }

  return (
    <>
      <TopInfoBar locale={locale} weatherText={weatherText} text={topBannerText} />
      <SiteHeader locale={locale} />
      <main
        className="page-container"
        dir={dir}
        style={{
          minHeight: "calc(100vh - 120px)",
          paddingTop: 16,
          paddingBottom: 24,
          boxSizing: "border-box",
        }}
      >
        {children}
      </main>
      <LegalFooter locale={locale} />
    </>
  );
}
