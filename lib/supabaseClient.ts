// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// التأكد من استخدام المتغيرات الصحيحة من .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn("Supabase URL or ANON KEY is missing in .env.local. Using placeholders.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
