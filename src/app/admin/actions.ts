"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getAdminClient() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user?.app_metadata.role !== "admin") {
    redirect("/admin?error=unauthorized");
  }
  return supabase;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/admin?error=credentials");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || data.user?.app_metadata.role !== "admin") {
    if (data.user) await supabase.auth.signOut();
    redirect("/admin?error=unauthorized");
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) redirect("/admin?error=signout");
  redirect("/admin");
}

export async function createProduct(formData: FormData) {
  const supabase = await getAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const imageUrls = parseProductImages(formData.get("image_urls"));
  const rawPrice = String(formData.get("price") ?? "").trim();
  const sizes = parseProductOptions(formData.get("available_sizes"), 40);
  const colours = parseProductOptions(formData.get("available_colours"), 60);
  const stockQuantity = parseStockQuantity(formData.get("stock_quantity"));
  const isActive = formData.get("is_active") === "on";

  if (
    name.length < 1 ||
    name.length > 160 ||
    description.length > 4000 ||
    !imageUrls ||
    !sizes ||
    !colours ||
    stockQuantity === undefined
  ) {
    redirect("/admin?error=product");
  }
  if (imageUrls.some((url) => !isSafeImageUrl(url))) redirect("/admin?error=image");

  const price = rawPrice ? Number(rawPrice) : null;
  if ((rawPrice && (!Number.isFinite(price) || price! < 0)) || (isActive && price === null)) {
    redirect("/admin?error=price");
  }

  const slugBase = slugify(name);
  if (!slugBase) redirect("/admin?error=product");
  const { error } = await supabase.from("products").insert({
    category_id: categoryId,
    slug: `${slugBase}-${crypto.randomUUID().slice(0, 8)}`,
    name,
    description,
    image_url: imageUrls[0] ?? "",
    image_urls: imageUrls,
    price,
    currency: rawPrice ? "PKR" : null,
    available_sizes: sizes,
    available_colours: colours,
    stock_quantity: stockQuantity,
    is_active: isActive,
  });
  if (error) {
    console.error("Could not create product:", error.message);
    redirect("/admin?error=product-save");
  }
  revalidatePath("/shop");
  revalidatePath("/admin");
  redirect("/admin?notice=product-created");
}

export async function createCategory(formData: FormData) {
  const supabase = await getAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const position = parsePosition(formData.get("position"));
  const isActive = formData.get("is_active") === "on";
  const slugBase = slugify(name);

  if (!name || name.length > 120 || tagline.length > 300 || !slugBase || position === null) {
    redirect("/admin?error=collection");
  }
  if (imageUrl && !isSafeImageUrl(imageUrl)) redirect("/admin?error=image");

  const { error } = await supabase.from("categories").insert({
    name,
    slug: `${slugBase}-${crypto.randomUUID().slice(0, 6)}`,
    tagline,
    image_url: imageUrl,
    position,
    is_active: isActive,
  });
  if (error) {
    console.error("Could not create collection:", error.message);
    redirect("/admin?error=collection-save");
  }
  revalidateStorefront();
  redirect("/admin?notice=collection-created");
}

export async function updateCategory(formData: FormData) {
  const supabase = await getAdminClient();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const position = parsePosition(formData.get("position"));

  if (
    !/^[0-9a-f-]{36}$/i.test(id) ||
    !name ||
    name.length > 120 ||
    tagline.length > 300 ||
    position === null
  ) {
    redirect("/admin?error=collection");
  }
  if (imageUrl && !isSafeImageUrl(imageUrl)) redirect("/admin?error=image");

  const { error } = await supabase
    .from("categories")
    .update({
      name,
      tagline,
      image_url: imageUrl,
      position,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id);
  if (error) {
    console.error("Could not update collection:", error.message);
    redirect("/admin?error=collection-save");
  }
  revalidateStorefront();
  redirect("/admin?notice=collection-updated");
}

export async function deleteCategory(formData: FormData) {
  const supabase = await getAdminClient();
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin?error=collection");
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    console.error("Could not delete collection:", error.message);
    redirect("/admin?error=collection-delete");
  }
  revalidateStorefront();
  redirect("/admin?notice=collection-deleted");
}

export async function deleteProduct(formData: FormData) {
  const supabase = await getAdminClient();
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin?error=product");
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("Could not delete product:", error.message);
    redirect("/admin?error=product-delete");
  }
  revalidateStorefront();
  redirect("/admin?notice=product-deleted");
}

export async function updateProduct(formData: FormData) {
  const supabase = await getAdminClient();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const imageUrls = parseProductImages(formData.get("image_urls"));
  const rawPrice = String(formData.get("price") ?? "").trim();
  const sizes = parseProductOptions(formData.get("available_sizes"), 40);
  const colours = parseProductOptions(formData.get("available_colours"), 60);
  const stockQuantity = parseStockQuantity(formData.get("stock_quantity"));
  const price = rawPrice ? Number(rawPrice) : null;

  if (
    !/^[0-9a-f-]{36}$/i.test(id) ||
    !/^[0-9a-f-]{36}$/i.test(categoryId) ||
    !name ||
    name.length > 160 ||
    description.length > 4000 ||
    !imageUrls ||
    !sizes ||
    !colours ||
    stockQuantity === undefined
  ) {
    redirect("/admin?error=product");
  }
  if (imageUrls.some((url) => !isSafeImageUrl(url))) redirect("/admin?error=image");
  if (
    (rawPrice && (!Number.isFinite(price) || price! < 0)) ||
    (formData.get("is_active") === "on" && price === null)
  ) {
    redirect("/admin?error=price");
  }
  const { error } = await supabase
    .from("products")
    .update({
      name,
      category_id: categoryId,
      description,
      image_url: imageUrls[0] ?? "",
      image_urls: imageUrls,
      price,
      currency: rawPrice ? "PKR" : null,
      available_sizes: sizes,
      available_colours: colours,
      stock_quantity: stockQuantity,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id);
  if (error) {
    console.error("Could not update product:", error.message);
    redirect("/admin?error=product-save");
  }
  revalidateStorefront();
  const requestedPageSize = Number(formData.get("list_page_size"));
  const pageSize =
    Number.isInteger(requestedPageSize) && requestedPageSize >= 10 && requestedPageSize <= 500
      ? requestedPageSize
      : 10;
  const expanded = formData.get("list_expanded") === "1";
  redirect(
    `/admin?notice=product-updated&expandedProduct=${encodeURIComponent(id)}&productPageSize=${pageSize}&productsExpanded=${expanded ? "1" : "0"}#products`,
  );
}

export async function saveStorefrontContent(formData: FormData) {
  const supabase = await getAdminClient();
  const key = String(formData.get("content_key") ?? "");
  const fields: Record<string, string[]> = {
    home: [
      "seo_title",
      "seo_description",
      "hero_eyebrow",
      "hero_title",
      "hero_highlight",
      "hero_subtitle",
      "hero_description",
      "hero_image",
      "primary_button",
      "secondary_button",
      "collections_eyebrow",
      "collections_title",
      "collections_highlight",
      "design_eyebrow",
      "design_title",
      "design_highlight",
      "design_description",
      "design_upload_title",
      "design_upload_description",
      "design_category_title",
      "design_category_prompt",
      "design_button",
      "cta_title",
      "cta_highlight",
      "cta_description",
      "cta_button",
      "feature_1_title",
      "feature_1_text",
      "feature_2_title",
      "feature_2_text",
      "feature_3_title",
      "feature_3_text",
      "feature_4_title",
      "feature_4_text",
      "collection_cta",
      "gallery_heading",
    ],
    about: [
      "seo_title",
      "seo_description",
      "eyebrow",
      "title",
      "highlight",
      "description",
      "banner_image",
      "cta_title",
      "cta_highlight",
      "cta_button",
      "stat_1_value",
      "stat_1_label",
      "stat_2_value",
      "stat_2_label",
      "stat_3_value",
      "stat_3_label",
      "value_1_title",
      "value_1_text",
      "value_2_title",
      "value_2_text",
      "value_3_title",
      "value_3_text",
    ],
    site: [
      "nav_home",
      "nav_shop",
      "nav_about",
      "nav_contact",
      "brand_name",
      "logo_url",
      "footer_text",
      "header_cta",
      "phone",
      "email",
      "instagram_url",
      "facebook_url",
      "tiktok_url",
      "whatsapp_number",
      "footer_shop_heading",
      "footer_company_heading",
      "footer_quote_heading",
      "footer_all_products",
      "footer_about",
      "footer_custom_orders",
      "footer_team_quotes",
      "footer_quote_text",
      "footer_quote_cta",
    ],
    shop: [
      "seo_title",
      "seo_description",
      "eyebrow",
      "title",
      "highlight",
      "description",
      "collection_cta",
      "collection_badge",
    ],
    contact: [
      "seo_title",
      "seo_description",
      "eyebrow",
      "title",
      "highlight",
      "description",
      "steps_title",
      "step_1",
      "step_2",
      "step_3",
      "side_title",
      "side_description",
      "side_button",
    ],
  };
  if (!(key in fields)) redirect("/admin?error=content");

  const content: Record<
    string,
    | string
    | boolean
    | Array<{ value: string; label: string }>
    | Array<{ title: string; text: string }>
  > = {};
  for (const field of fields[key]) {
    const value = String(formData.get(field) ?? "").trim();
    if (value.length > 5000) redirect("/admin?error=content");
    if (
      ["hero_image", "banner_image", "logo_url"].includes(field) &&
      value &&
      !isSafeImageUrl(value)
    ) {
      redirect("/admin?error=image");
    }
    if (
      (field === "instagram_url" && value && !isSocialProfileUrl(value, "instagram.com")) ||
      (field === "facebook_url" && value && !isSocialProfileUrl(value, "facebook.com")) ||
      (field === "tiktok_url" && value && !isSocialProfileUrl(value, "tiktok.com"))
    ) {
      redirect("/admin?error=content-url");
    }
    if (
      field === "whatsapp_number" &&
      value &&
      (!/^\+?[\d\s().-]+$/.test(value) ||
        value.replace(/\D/g, "").length < 7 ||
        value.replace(/\D/g, "").length > 15)
    ) {
      redirect("/admin?error=whatsapp");
    }
    if (field === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      redirect("/admin?error=content");
    }
    content[field] = value;
  }

  if (key === "site") {
    content.show_about = formData.get("show_about") === "on";
    content.show_contact = formData.get("show_contact") === "on";
  }
  if (key === "about") {
    content.stats = [1, 2, 3].map((index) => ({
      value: String(formData.get(`stat_${index}_value`) ?? "").trim(),
      label: String(formData.get(`stat_${index}_label`) ?? "").trim(),
    }));
    content.values = [1, 2, 3].map((index) => ({
      title: String(formData.get(`value_${index}_title`) ?? "").trim(),
      text: String(formData.get(`value_${index}_text`) ?? "").trim(),
    }));
  }

  const { error } = await supabase
    .from("storefront_content")
    .upsert({ content_key: key, content }, { onConflict: "content_key" });
  if (error) {
    console.error("Could not save storefront content:", error.message);
    redirect("/admin?error=content-save");
  }
  revalidateStorefront();
  redirect(`/admin?notice=content-updated#${key}`);
}

export async function updateOrder(formData: FormData) {
  const supabase = await getAdminClient();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const paymentStatus = String(formData.get("payment_status") ?? "");
  if (
    !/^[0-9a-f-]{36}$/i.test(id) ||
    !["pending", "confirmed", "in_production", "completed", "cancelled"].includes(status) ||
    !["unpaid", "paid", "refunded"].includes(paymentStatus)
  ) {
    redirect("/admin?error=order");
  }
  const { error } = await supabase
    .from("orders")
    .update({ status, payment_status: paymentStatus })
    .eq("id", id);
  if (error) {
    console.error("Could not update order:", error.message);
    redirect("/admin?error=order-save");
  }
  revalidatePath("/admin");
  redirect("/admin?notice=order-updated");
}

export async function updateQuote(formData: FormData) {
  const supabase = await getAdminClient();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (
    !/^[0-9a-f-]{36}$/i.test(id) ||
    !["new", "contacted", "quoted", "accepted", "closed"].includes(status)
  ) {
    redirect("/admin?error=quote");
  }
  const { error } = await supabase.from("quote_requests").update({ status }).eq("id", id);
  if (error) {
    console.error("Could not update quote request:", error.message);
    redirect("/admin?error=quote-save");
  }
  revalidatePath("/admin");
  redirect("/admin?notice=quote-updated");
}

function isSafeImageUrl(value: string) {
  if (value.startsWith("/")) return !value.startsWith("//") && !value.includes("\\");
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function parsePosition(value: FormDataEntryValue | null) {
  if (value === null || String(value).trim() === "") return null;
  const position = Number(value);
  return Number.isInteger(position) && position >= 0 && position <= 10000 ? position : null;
}

function parseProductImages(value: FormDataEntryValue | null): string[] | null {
  if (typeof value !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      !Array.isArray(parsed) ||
      parsed.length > 12 ||
      parsed.some((url) => typeof url !== "string" || url.length > 2048)
    ) {
      return null;
    }
    return [...new Set(parsed as string[])];
  } catch {
    return null;
  }
}

function parseProductOptions(value: FormDataEntryValue | null, maxLength: number): string[] | null {
  if (typeof value !== "string") return null;
  const options = value
    .split(",")
    .map((option) => option.trim())
    .filter(Boolean);
  if (options.length > 30 || options.some((option) => option.length > maxLength)) return null;
  return [...new Set(options)];
}

function parseStockQuantity(value: FormDataEntryValue | null): number | null | undefined {
  if (value === null || String(value).trim() === "") return null;
  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity >= 0 && quantity <= 100000 ? quantity : undefined;
}

function isSocialProfileUrl(value: string, domain: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === domain || url.hostname.endsWith(`.${domain}`))
    );
  } catch {
    return false;
  }
}
function revalidateStorefront() {
  for (const path of ["/", "/shop", "/about", "/contact", "/admin"]) {
    revalidatePath(path);
  }
  revalidatePath("/shop/[slug]", "page");
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
