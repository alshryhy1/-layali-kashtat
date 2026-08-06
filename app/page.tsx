import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

/**
 * Fallback for `/` if proxy rewrite to `/ar` is skipped.
 * Keep parity with app/[locale]/page.tsx (V5 home) — do not redirect
 * authenticated users to legacy JWT dashboards.
 */
export default function RootPage() {
  return <HomeClient locale="ar" />;
}
