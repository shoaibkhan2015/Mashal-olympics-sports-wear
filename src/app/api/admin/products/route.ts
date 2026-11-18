import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isProductDetailsSchemaError,
  legacyProductColumns,
  productColumns,
  withProductDetails,
} from "@/lib/supabase/product-details";

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
    if (isProductDetailsSchemaError(error)) {
      const legacy = await supabase
        .from("products")
        .select(legacyProductColumns)
        .eq("id", id)
        .maybeSingle();
      if (legacy.error) {
        console.error("Could not load edited product:", legacy.error.message);
        return NextResponse.json({ error: "Could not load product." }, { status: 500 });
      }
      return NextResponse.json({
        products: legacy.data ? [withProductDetails(legacy.data)] : [],
      });
    }
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
  if (isProductDetailsSchemaError(error)) {
    const legacy = await supabase
      .from("products")
      .select(legacyProductColumns, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (legacy.error) {
      console.error("Could not load more products:", legacy.error.message);
      return NextResponse.json({ error: "Could not load more products." }, { status: 500 });
    }
    return NextResponse.json({
      products: (legacy.data ?? []).map(withProductDetails),
      total: legacy.count ?? 0,
    });
  }
  if (error) {
    console.error("Could not load more products:", error.message);
    return NextResponse.json({ error: "Could not load more products." }, { status: 500 });
  }
  return NextResponse.json({ products: data ?? [], total: count ?? 0 });
}
