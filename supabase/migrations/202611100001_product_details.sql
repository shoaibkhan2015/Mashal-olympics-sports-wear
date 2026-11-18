alter table public.products
  add column if not exists fabric_details text not null default '',
  add column if not exists fit_details text not null default '',
  add column if not exists care_instructions text not null default '',
  add column if not exists customization_options text not null default '',
  add column if not exists size_guide text not null default '',
  add column if not exists fabric_image_urls text[] not null default '{}',
  add column if not exists product_faqs jsonb not null default '[]'::jsonb;

alter table public.products
  add constraint products_product_faqs_array
  check (jsonb_typeof(product_faqs) = 'array');
