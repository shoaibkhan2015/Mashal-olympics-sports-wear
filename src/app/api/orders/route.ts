import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  const items = Array.isArray(body.items) ? body.items : [];
  const validItems = items.every(isOrderItem);
  const itemIds = validItems ? items.map((item) => item.productId) : [];
  const quantities = validItems ? items.map((item) => item.quantity) : [];

  if (
    name.length < 1 ||
    name.length > 120 ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
    email.length > 254 ||
    phone.length < 5 ||
    phone.length > 40 ||
    notes.length > 4000 ||
    items.length < 1 ||
    items.length > 20 ||
    !validItems ||
    new Set(itemIds).size !== itemIds.length
  ) {
    return NextResponse.json(
      { error: "Please check your order details and try again." },
      { status: 400 },
    );
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Order submission is not configured yet." }, { status: 503 });
  }

  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase.rpc("create_manual_order", {
    p_customer_name: name,
    p_customer_email: email,
    p_customer_phone: phone,
    p_notes: notes,
    p_product_ids: itemIds,
    p_quantities: quantities,
  });

  if (error || !data?.[0]) {
    console.error("Could not create order:", error?.message ?? "No order returned");
    const unavailable =
      error?.message.includes("unavailable") || error?.message.includes("mixed currencies");
    return NextResponse.json(
      {
        error: unavailable
          ? "One or more products are unavailable. Please refresh your basket."
          : "We could not place your order. Please try again shortly.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ order: data[0] }, { status: 201 });
}

function isOrderItem(item: unknown): item is { productId: string; quantity: number } {
  if (!item || typeof item !== "object") return false;
  const record = item as Record<string, unknown>;
  return (
    typeof record.productId === "string" &&
    uuidPattern.test(record.productId) &&
    typeof record.quantity === "number" &&
    Number.isInteger(record.quantity) &&
    record.quantity >= 1 &&
    record.quantity <= 100
  );
}
