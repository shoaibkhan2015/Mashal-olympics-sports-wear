import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

export function createPublicSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
