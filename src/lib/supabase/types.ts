export type Product = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  price: number | null;
  currency: string | null;
  is_active: boolean;
};

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
  notes: string;
  status: string;
  payment_status: string;
  currency: string;
  subtotal: number;
  created_at: string;
  order_items: Array<{
    id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }>;
};
