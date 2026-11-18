export type Product = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  image_urls: string[];
  price: number | null;
  discount_percentage: number;
  effective_price: number | null;
  currency: string | null;
  available_sizes: string[];
  available_colours: string[];
  stock_quantity: number | null;
  is_active: boolean;
  fabric_details: string;
  fit_details: string;
  care_instructions: string;
  customization_options: string;
  size_guide: string;
  fabric_image_urls: string[];
  product_faqs: ProductFaq[];
};

export type ProductFaq = { question: string; answer: string };

export type CategoryRecord = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  image_url: string;
};

export type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  notes: string;
  status: string;
  payment_status: string;
  payment_method: string;
  currency: string;
  subtotal: number;
  created_at: string;
  order_items: Array<{
    id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
    selected_size?: string;
    selected_colour?: string;
  }>;
};
