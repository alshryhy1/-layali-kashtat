export type AdminUserListFilters = {
  q?: string;
  verified?: "all" | "verified" | "unverified";
  role?: "all" | "customer" | "provider" | "admin";
  status?: "all" | "active" | "suspended";
  limit?: number;
};

export type AdminUserRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
  phone_verified: boolean | null;
  email_verified: boolean | null;
  created_at: string | null;
  last_login: string | null;
  banned_until: string | null;
  services_count: number;
  bookings_count: number;
  haraj_count: number;
  ads_count: number;
  city: string | null;
};

export function isSuspended(bannedUntil: string | null | undefined): boolean {
  if (!bannedUntil) return false;
  const t = Date.parse(bannedUntil);
  if (!Number.isFinite(t)) return true;
  return t > Date.now();
}

/**
 * Product auth (Account / isFullyVerified): verified if email OR phone is verified.
 * Admin portal count + /admin/users badge/filter must use this same rule.
 */
export function isVerified(row: {
  phone_verified?: boolean | null;
  email_verified?: boolean | null;
}): boolean {
  return row.phone_verified === true || row.email_verified === true;
}

/** SQL WHERE fragment: profile is verified (prefix columns with alias if needed, e.g. "p."). */
export function sqlIsVerified(alias = ""): string {
  const a = alias ? `${alias}.` : "";
  return `(COALESCE(${a}phone_verified, false) = true OR COALESCE(${a}email_verified, false) = true)`;
}

/** SQL WHERE fragment: profile is unverified (neither phone nor email). */
export function sqlIsUnverified(alias = ""): string {
  const a = alias ? `${alias}.` : "";
  return `(COALESCE(${a}phone_verified, false) = false AND COALESCE(${a}email_verified, false) = false)`;
}

/** Parse ?verified= from URL. Accepts verified|unverified|all|1|0|true|false. */
export function parseVerifiedFilter(
  raw: string | string[] | undefined
): AdminUserListFilters["verified"] {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (v === "verified" || v === "1" || v === "true") return "verified";
  if (v === "unverified" || v === "0" || v === "false") return "unverified";
  return "all";
}

export function roleLabel(isAr: boolean, role: string | null | undefined): string {
  const r = String(role || "").toLowerCase();
  if (r === "provider") return isAr ? "مزوّد" : "Provider";
  if (r === "admin") return isAr ? "مشرف" : "Admin";
  if (r === "customer") return isAr ? "عميل" : "Customer";
  return isAr ? "غير محدد" : "Unset";
}

export function statusLabel(isAr: boolean, bannedUntil: string | null | undefined): string {
  if (isSuspended(bannedUntil)) return isAr ? "موقوف" : "Suspended";
  return isAr ? "نشط" : "Active";
}

/** Short membership-style id from UUID (no dedicated membership column). */
export function membershipId(id: string): string {
  return String(id || "").replace(/-/g, "").slice(0, 10).toUpperCase() || "—";
}
