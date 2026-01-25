import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  // Instead of throwing, we warn and allow build to proceed, but runtime usage will fail
  // throw new Error("Supabase environment variables are missing");
  console.warn("Supabase environment variables are missing in lib/supabaseServer.ts");
}

export const supabaseServer = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  serviceRoleKey || "placeholder-key",
  {
    auth: { persistSession: false },
  }
);
