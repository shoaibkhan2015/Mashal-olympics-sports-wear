import { legacyProductColumns } from "@/lib/supabase/product-details";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { Product } from "@/lib/supabase/types";

export async function getCartProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(legacyProductColumns)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load cart products: ${error.message}`);
  return (data ?? []) as Product[];
}
