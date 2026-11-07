import { categories as localCategories, type Category } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export type StorefrontCategory = Category & {
  id: string;
  is_active: boolean;
  position: number;
};

const contentDefaults: Record<string, Record<string, unknown>> = {
  home: {
    seo_title: "Mashal Olympics Sports Wear | Custom Sportswear & Martial Arts Uniforms",
    seo_description:
      "Custom sports shorts, shirts, tank tops, gym wear, tracksuits, football kits and martial arts uniforms made to your design.",
    hero_eyebrow: "Custom Sportswear Manufacturer",
    hero_title: "Mashal",
    hero_highlight: "Olympics",
    hero_subtitle: "Sports Wear",
    hero_description:
      "Shorts, shirts, tank tops, gym wear, tracksuits, football kits and martial arts uniforms — every piece stitched to your design, your colors, your team.",
    hero_image: "",
    primary_button: "Explore Collection",
    secondary_button: "Custom Order",
    collections_eyebrow: "What We Make",
    collections_title: "Every Sport.",
    collections_highlight: "Every Design.",
    collection_cta: "Get Quote",
    gallery_heading: "Scroll — the lineup rotates",
    design_eyebrow: "Made To Order",
    design_title: "Customize",
    design_highlight: "Your Design",
    design_description:
      "Upload your design or logo, pick the product you want it on, and we'll get back to you with a quote.",
    design_upload_title: "Upload Your Design",
    design_upload_description:
      "Drag & drop an image here, or click to browse — logo, sketch or a photo of your idea (JPG / PNG).",
    design_category_title: "Pick A Category",
    design_category_prompt: "What should we make it on?",
    design_button: "Request A Quote",
    cta_title: "Your Team.",
    cta_highlight: "Your Kit.",
    cta_description:
      "Send us your design or idea and get a quote with pricing and delivery time — no obligation.",
    cta_button: "Start Your Order",
    feature_1_title: "Fully Custom",
    feature_1_text:
      "Your colors, logos, names and numbers — sublimation, embroidery and printing under one roof.",
    feature_2_title: "Low Minimums",
    feature_2_text:
      "From single kits to full team orders, we produce the quantity your club needs.",
    feature_3_title: "Competition Grade",
    feature_3_text: "Fabric and cuts built for taekwondo, wushu, karate and football.",
    feature_4_title: "Fast Dispatch",
    feature_4_text: "Streamlined production and dispatch so your kit arrives before match day.",
  },
  about: {
    seo_title: "About Us | Mashal Olympics Sports Wear",
    seo_description:
      "Mashal Olympics Sports Wear manufactures custom sportswear and martial arts uniforms for teams, clubs and athletes.",
    eyebrow: "Our Story",
    title: "The Torch Behind",
    highlight: "Every Kit",
    banner_image: "",
    cta_title: "Ready When",
    cta_highlight: "You Are",
    cta_button: "Start Your Order",
    description:
      "Mashal means torch — the light athletes walk out behind. We make the gear they walk out in.",
    stats: [
      { value: "10+", label: "Product Lines" },
      { value: "100%", label: "Made to Order" },
      { value: "1 Roof", label: "Cut, Stitch & Print" },
    ],
    values: [
      {
        title: "Made Around Your Design",
        text: "Nothing off the shelf unless you want it. Send a sketch, a photo or just your club colors — our team turns it into a production-ready kit.",
      },
      {
        title: "Sport-Specific Craft",
        text: "A taekwondo dobok, a wushu satin set and a football kit all demand different fabric, cut and finish. We build each one the way its sport needs.",
      },
      {
        title: "Built for Match Day",
        text: "Reinforced stitching, color-fast sublimation and competition-appropriate weights, so your kit performs as hard as you do.",
      },
    ],
  },
  site: {
    nav_home: "Home",
    nav_shop: "Shop",
    nav_about: "About",
    nav_contact: "Contact",
    brand_name: "Mashal Olympics Sports Wear",
    logo_url: "",
    footer_text:
      "Custom sportswear and martial arts uniforms — stitched, sublimated and finished to your team's design.",
    header_cta: "Custom Order",
    phone: "",
    email: "",
    instagram_url: "",
    facebook_url: "",
    tiktok_url: "",
    whatsapp_number: "",
    show_about: true,
    show_contact: true,
    footer_shop_heading: "Shop",
    footer_company_heading: "Company",
    footer_quote_heading: "Get a Quote",
    footer_all_products: "All Products",
    footer_about: "About Us",
    footer_custom_orders: "Custom Orders",
    footer_team_quotes: "Team & Club Quotes",
    footer_quote_text:
      "Send us your design, logo or team list and we’ll come back with pricing and delivery time.",
    footer_quote_cta: "Start Inquiry",
  },
  shop: {
    seo_title: "Shop | Mashal Olympics Sports Wear",
    seo_description:
      "Browse custom sportswear and martial arts uniforms made to your team's design.",
    eyebrow: "The Collection",
    title: "Shop",
    highlight: "All Products",
    description:
      "Every item is made to order — pick a product, send us your design, logo and sizes, and we handle the rest.",
    collection_cta: "Get Quote",
    collection_badge: "Made to Order",
  },
  contact: {
    seo_title: "Custom Order & Quote | Mashal Olympics Sports Wear",
    seo_description: "Request a quote for custom sportswear and martial arts uniforms.",
    eyebrow: "Get a Quote",
    title: "Custom",
    highlight: "Order",
    description:
      "Tell us what you need — product, design, quantities — and we’ll reply with pricing and delivery time.",
    steps_title: "What Happens Next",
    step_1: "We review your design and confirm fabric, colors and sizing.",
    step_2: "You get a quote with price per piece and delivery time.",
    step_3: "Approve a digital sample, then we cut, stitch and ship.",
    side_title: "Not Sure Yet?",
    side_description:
      "Browse the collection first — every product page links back here with the item pre-noted.",
    side_button: "View Collection",
  },
};

export async function getStorefrontContent(key: "home" | "about" | "site" | "shop" | "contact") {
  if (!isSupabaseConfigured()) return contentDefaults[key];

  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("storefront_content")
    .select("content")
    .eq("content_key", key)
    .maybeSingle();
  if (error && isMissingCmsSchemaError(error)) {
    console.warn("Storefront CMS migration is not applied; using built-in content.");
    return contentDefaults[key];
  }
  if (error) throw new Error(`Could not load ${key} storefront content: ${error.message}`);
  return { ...contentDefaults[key], ...(data?.content as Record<string, unknown> | undefined) };
}

export function isMissingCmsSchemaError(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST205" ||
    (error.message ?? "").includes("Could not find the table 'public.storefront_content'")
  );
}

export async function getStorefrontCategories() {
  if (!isSupabaseConfigured()) {
    return localCategories.map((category, position) => ({
      ...category,
      id: category.slug,
      is_active: true,
      position,
    }));
  }

  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, tagline, image_url, is_active, position")
    .eq("is_active", true)
    .order("position", { ascending: true });
  if (error) throw new Error(`Could not load storefront collections: ${error.message}`);

  return (data ?? []).map((category, position) => {
    const local = localCategories.find((item) => item.slug === category.slug);
    return {
      ...category,
      image: category.image_url || local?.image || "",
      position: category.position ?? position,
    };
  }) satisfies StorefrontCategory[];
}

export function contentString(content: Record<string, unknown>, key: string, fallback = "") {
  const value = content[key];
  return typeof value === "string" ? value : fallback;
}

export function contentBoolean(content: Record<string, unknown>, key: string, fallback: boolean) {
  const value = content[key];
  return typeof value === "boolean" ? value : fallback;
}
