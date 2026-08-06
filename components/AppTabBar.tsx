"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, MessageCircle, User } from "lucide-react";
import { localeHref, type Locale } from "@/lib/locales";
import {
  APP_TAB_BAR_HEIGHT,
  shouldShowAppTabBar,
  stripLocale,
} from "@/lib/appTabBar";

export { APP_TAB_BAR_HEIGHT, shouldShowAppTabBar } from "@/lib/appTabBar";

/** Matches native TabsNavigator (TabsNavigator.tsx) — 4 tabs, no Community tab. */

type TabId = "home" | "chat" | "sections" | "account";

type TabDef = {
  id: TabId;
  href: string;
  labelAr: string;
  labelEn: string;
  /** Native Ionicons: home / grid / chatbubble / person */
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; fill?: string; color?: string }>;
  match: (pathname: string) => boolean;
};

const PRIMARY = "#0B6B63";
const INACTIVE = "#9CA3AF";
const BAR_BG = "#EFE6D8";
const FOCUS_WELL = "#F5E9DA";

function buildTabs(locale: Locale): TabDef[] {
  return [
    // DOM order matches native Tab.Screen registration; with dir=rtl, Account sits at the start (right).
    {
      id: "account",
      href: localeHref(locale, "/account"),
      labelAr: "الحساب",
      labelEn: "Account",
      Icon: User,
      match: (p) => p === "/account" || p.startsWith("/account/"),
    },
    {
      id: "sections",
      href: localeHref(locale, "/sections"),
      labelAr: "الأقسام",
      labelEn: "Sections",
      Icon: LayoutGrid,
      match: (p) =>
        p === "/sections" ||
        p.startsWith("/sections/") ||
        p === "/haraj" ||
        p.startsWith("/haraj/") ||
        p === "/gallery" ||
        p.startsWith("/gallery/"),
    },
    {
      id: "chat",
      href: localeHref(locale, "/chat"),
      labelAr: "المحادثة",
      labelEn: "Chat",
      Icon: MessageCircle,
      match: (p) => p === "/chat" || p.startsWith("/chat/"),
    },
    {
      id: "home",
      href: localeHref(locale, "/"),
      labelAr: "الرئيسية",
      labelEn: "Home",
      Icon: Home,
      match: (p) =>
        p === "/" ||
        p === "/customer/dashboard" ||
        p.startsWith("/customer/dashboard/") ||
        p === "/map" ||
        p.startsWith("/map/"),
    },
  ];
}

export default function AppTabBar({ locale }: { locale: Locale }) {
  const pathname = usePathname() || "";
  const path = stripLocale(pathname);
  const isAr = locale === "ar";
  const tabs = buildTabs(locale);

  if (!shouldShowAppTabBar(pathname)) return null;

  return (
    <nav
      aria-label={isAr ? "التنقل الرئيسي" : "Primary navigation"}
      dir={isAr ? "rtl" : "ltr"}
      style={{
        position: "fixed",
        left: "max(18px, env(safe-area-inset-left))",
        right: "max(18px, env(safe-area-inset-right))",
        bottom: "max(0px, env(safe-area-inset-bottom))",
        height: APP_TAB_BAR_HEIGHT,
        zIndex: 1000,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "space-between",
        gap: 2,
        background: BAR_BG,
        borderRadius: 28,
        padding: "8px 6px 10px",
        boxShadow: "0 8px 14px rgba(0,0,0,0.08)",
        border: "none",
        overflow: "visible",
      }}
    >
      {tabs.map((tab) => {
        const active = tab.match(path);
        const color = active ? PRIMARY : INACTIVE;
        const Icon = tab.Icon;
        const label = isAr ? tab.labelAr : tab.labelEn;
        return (
          <a
            key={tab.id}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            style={{
              flex: "1 1 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              textDecoration: "none",
              color,
              padding: "4px 2px",
              minWidth: 0,
              maxWidth: "100%",
            }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                display: "grid",
                placeItems: "center",
                background: active ? FOCUS_WELL : "transparent",
                flexShrink: 0,
              }}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.4 : 2}
                color={color}
                fill={active && tab.id !== "sections" ? color : "none"}
              />
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                lineHeight: 1.15,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
                textAlign: "center",
              }}
            >
              {label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
