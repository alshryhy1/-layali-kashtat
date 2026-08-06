// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  supabasePublicAnonKey,
  supabasePublicUrl,
} from "@/lib/supabasePublicConfig";

if (!isSupabaseConfigured) {
  console.warn("Supabase URL or ANON KEY is missing in env. Using placeholders.");
}

/** Browser Supabase Auth client — same project as the native app. */
export const supabase = createClient(supabasePublicUrl, supabasePublicAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export { isSupabaseConfigured, supabasePublicAnonKey, supabasePublicUrl };
