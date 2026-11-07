import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const productColumns =
  "id, category_id, slug, name, description, image_url, image_urls, price, currency, available_sizes, available_colours, stock_quantity, is_active";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || auth.user?.app_metadata.role !== "admin") {
    return NextResponse.json({ error: "Administrator access required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("products")
      .select(productColumns)
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.error("Could not load edited product:", error.message);
      return NextResponse.json({ error: "Could not load product." }, { status: 500 });
    }
    return NextResponse.json({ products: data ? [data] : [] });
  }

  const offset = Number(url.searchParams.get("offset") ?? 0);
  const limit = Number(url.searchParams.get("limit") ?? 10);
  if (
    !Number.isInteger(offset) ||
    offset < 0 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 20
  ) {
    return NextResponse.json({ error: "Invalid pagination values." }, { status: 400 });
  }

  const { data, error, count } = await supabase
    .from("products")
    .select(productColumns, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) {
    console.error("Could not load more products:", error.message);
    return NextResponse.json({ error: "Could not load more products." }, { status: 500 });
  }
  return NextResponse.json({ products: data ?? [], total: count ?? 0 });
}
