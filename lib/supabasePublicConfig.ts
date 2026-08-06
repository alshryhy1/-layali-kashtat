/**
 * Shared public Supabase config for browser + Edge Function calls.
 * Prefer NEXT_PUBLIC_* (inlined at build via next.config.js `env`).
 * Fall back to SUPABASE_* / EXPO_PUBLIC_* and the known project URL so
 * production never ships an empty URL while the anon key is present.
 */
const DEFAULT_SUPABASE_URL = "https://aslnkubwrdvtmlntfaee.supabase.co";
const PLACEHOLDER_URL = "https://placeholder-url.supabase.co";
const PLACEHOLDER_KEY = "placeholder-key";

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = String(value ?? "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}

export function readSupabaseUrl(): string {
  return firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    DEFAULT_SUPABASE_URL
  );
}

export function readSupabaseAnonKey(): string {
  return firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );
}

export const supabasePublicUrl = readSupabaseUrl() || PLACEHOLDER_URL;
export const supabasePublicAnonKey = readSupabaseAnonKey() || PLACEHOLDER_KEY;

export const isSupabaseConfigured =
  Boolean(readSupabaseAnonKey()) &&
  Boolean(supabasePublicUrl) &&
  supabasePublicUrl !== PLACEHOLDER_URL &&
  supabasePublicAnonKey !== PLACEHOLDER_KEY &&
  !supabasePublicUrl.includes("placeholder");
