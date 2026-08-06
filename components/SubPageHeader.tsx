"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { localeHref, type Locale } from "@/lib/locales";

const SHELL_CREAM = "#EFE3D2";
const HEADER_BG = "#F5E9DA";
const INK = "#173B5B";
const MUTED = "#6B7280";

type Props = {
  locale: Locale | string;
  title: string;
  /** Locale-free path used when history back is unavailable. Default: الأقسام */
  fallbackHref?: string;
  /** Optional short line under the title (kept compact). */
  subtitle?: string;
  right?: React.ReactNode;
  sticky?: boolean;
};

/**
 * Top chrome for secondary tab-shell pages (حراج / معرض / تفاصيل…).
 * Prefer in-app history when the referrer is same-origin; otherwise go to fallback.
 */
export default function SubPageHeader({
  locale,
  title,
  fallbackHref = "/sections",
  subtitle,
  right,
  sticky = true,
}: Props) {
  const router = useRouter();
  const isAr = locale !== "en";
  const fallback = localeHref(locale, fallbackHref);
  const BackIcon = isAr ? ChevronRight : ChevronLeft;

  const goBack = React.useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        const ref = document.referrer;
        if (ref) {
          const origin = window.location.origin;
          if (new URL(ref).origin === origin) {
            router.back();
            return;
          }
        }
      }
    } catch {
      /* ignore parse errors */
    }
    router.push(fallback);
  }, [fallback, router]);

  return (
    <header
      dir={isAr ? "rtl" : "ltr"}
      style={{
        position: sticky ? "sticky" : "relative",
        top: 0,
        zIndex: 40,
        background: HEADER_BG,
        borderBottom: "1px solid #E4D5C2",
        boxShadow: "0 1px 0 rgba(23,59,91,0.04)",
        padding: "10px 14px",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          maxWidth: 920,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          gap: 10,
          minHeight: 44,
        }}
      >
        <button
          type="button"
          onClick={goBack}
          aria-label={isAr ? "رجوع" : "Back"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            border: "1px solid #E0D0BC",
            background: SHELL_CREAM,
            color: INK,
            borderRadius: 12,
            padding: "8px 12px",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          <BackIcon size={18} strokeWidth={2.5} />
          <span>{isAr ? "رجوع" : "Back"}</span>
        </button>

        <div style={{ textAlign: "center", minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 900,
              color: INK,
              lineHeight: 1.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 12,
                fontWeight: 600,
                color: MUTED,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            minWidth: 72,
            gap: 8,
          }}
        >
          {right ?? <span aria-hidden style={{ width: 1 }} />}
        </div>
      </div>
    </header>
  );
}

/** Shared cream page surface — matches LocaleChrome tab shell. */
export const SUB_PAGE_BG = SHELL_CREAM;
export const SUB_PAGE_CARD_BG = "#FFFBF5";
export const SUB_PAGE_INK = INK;
