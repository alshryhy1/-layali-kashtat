import { Suspense } from "react";
import AccountClient from "@/components/AccountClient";

type Locale = "ar" | "en";

function asLocale(v: unknown): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const locale = asLocale(p?.locale);
  const viewRaw = String(sp?.view || "").toLowerCase();
  const initialView =
    viewRaw === "login" ||
    viewRaw === "signup" ||
    viewRaw === "profile" ||
    viewRaw === "bookings" ||
    viewRaw === "services" ||
    viewRaw === "notifications"
      ? (viewRaw as
          | "login"
          | "signup"
          | "profile"
          | "bookings"
          | "services"
          | "notifications")
      : undefined;

  return (
    <Suspense fallback={<div dir="rtl" style={{ padding: 24, textAlign: "center" }}>...</div>}>
      <AccountClient locale={locale} initialView={initialView} />
    </Suspense>
  );
}
