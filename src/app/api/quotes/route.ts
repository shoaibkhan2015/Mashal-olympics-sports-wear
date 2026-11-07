import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  }

  const name = String(form.get("name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const categorySlug = String(form.get("product") ?? "");
  const productId = form.get("productId") ? String(form.get("productId")) : null;
  const rawQuantity = String(form.get("quantity") ?? "");
  const quantity = rawQuantity ? Number(rawQuantity) : null;
  const neededBy = String(form.get("deadline") ?? "") || null;
  const details = String(form.get("details") ?? "").trim();
  const attachment = form.get("design");

  if (
    name.length < 1 ||
    name.length > 120 ||
    phone.length < 5 ||
    phone.length > 40 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(categorySlug) ||
    (productId !== null && (typeof productId !== "string" || !uuidPattern.test(productId))) ||
    (quantity !== null && (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000)) ||
    (neededBy !== null &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(neededBy) ||
        Number.isNaN(Date.parse(`${neededBy}T00:00:00Z`)) ||
        neededBy < new Date().toISOString().slice(0, 10))) ||
    details.length > 4000 ||
    (productId !== null && !uuidPattern.test(productId)) ||
    (!(attachment instanceof File) && attachment !== null) ||
    (attachment instanceof File && attachment.size > 4 * 1024 * 1024)
  ) {
    return NextResponse.json(
      { error: "Please check the inquiry details and try again." },
      { status: 400 },
    );
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Quote submission is not configured yet." }, { status: 503 });
  }

  const supabase = createPublicSupabaseClient();
  let attachmentPath: string | null = null;
  if (attachment instanceof File && attachment.size > 0) {
    const bytes = new Uint8Array(await attachment.arrayBuffer());
    const type = detectImageType(bytes);
    if (!type) {
      return NextResponse.json(
        { error: "Attach a valid JPG, PNG, or WebP image up to 4 MB." },
        { status: 400 },
      );
    }
    attachmentPath = `${crypto.randomUUID()}.${type.extension}`;
    const { error: uploadError } = await supabase.storage
      .from("quote-attachments")
      .upload(attachmentPath, attachment, { contentType: type.mime, upsert: false });
    if (uploadError) {
      console.error("Could not save quote attachment:", uploadError.message);
      return NextResponse.json(
        { error: "The design image could not be uploaded. Please try again." },
        { status: 503 },
      );
    }
  }

  const { data, error } = await supabase.rpc("submit_quote", {
    p_customer_name: name,
    p_customer_phone: phone,
    p_category_slug: categorySlug,
    p_product_id: productId,
    p_quantity: quantity,
    p_needed_by: neededBy,
    p_details: details,
    p_attachment_path: attachmentPath,
  });

  if (error) {
    console.error("Could not save quote request:", error.message);
    return NextResponse.json(
      { error: "We could not save your request. Please try again shortly." },
      { status: 503 },
    );
  }

  return NextResponse.json({ id: data }, { status: 201 });
}

function detectImageType(bytes: Uint8Array) {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { extension: "png", mime: "image/png" };
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: "jpg", mime: "image/jpeg" };
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return { extension: "webp", mime: "image/webp" };
  }
  return null;
}
