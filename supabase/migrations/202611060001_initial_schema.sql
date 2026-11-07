create extension if not exists pgcrypto;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (length(name) between 1 and 120),
  tagline text not null default '',
  image_url text not null default '',
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (length(name) between 1 and 160),
  description text not null default '',
  image_url text not null default '',
  price numeric(12, 2) check (price is null or price >= 0),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_price_currency_pair check ((price is null) = (currency is null)),
  constraint active_products_need_price check (not is_active or (price is not null and currency is not null))
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_name text not null check (length(customer_name) between 1 and 120),
  customer_email text not null check (length(customer_email) <= 254),
  customer_phone text not null check (length(customer_phone) between 5 and 40),
  notes text not null default '' check (length(notes) <= 4000),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'in_production', 'completed', 'cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'refunded')),
  payment_method text not null default 'manual',
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 100),
  line_total numeric(14, 2) generated always as (unit_price * quantity) stored,
  unique (order_id, product_id)
);

create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (length(customer_name) between 1 and 120),
  customer_phone text not null check (length(customer_phone) between 5 and 40),
  category_id uuid not null references public.categories(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer check (quantity is null or quantity between 1 and 10000),
  needed_by date,
  details text not null default '' check (length(details) <= 4000),
  attachment_path text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'quoted', 'accepted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_active_category_idx on public.products (category_id, created_at desc) where is_active;
create index orders_status_created_idx on public.orders (status, created_at desc);
create index quote_requests_status_created_idx on public.quote_requests (status, created_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_updated_at before update on public.categories
for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();
create trigger quote_requests_updated_at before update on public.quote_requests
for each row execute function public.set_updated_at();

create function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.quote_requests enable row level security;

create policy "Public can read active categories"
on public.categories for select to anon, authenticated
using (is_active or (select public.is_admin()));
create policy "Admins can manage categories"
on public.categories for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Public can read active products"
on public.products for select to anon, authenticated
using (is_active or (select public.is_admin()));
create policy "Admins can manage products"
on public.products for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can manage orders"
on public.orders for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy "Admins can manage order items"
on public.order_items for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy "Admins can manage quote requests"
on public.quote_requests for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

revoke all on public.orders, public.order_items, public.quote_requests from anon, authenticated;
grant select on public.categories, public.products to anon, authenticated;
grant all on public.categories, public.products to authenticated;
grant select, insert, update on public.orders, public.order_items, public.quote_requests to authenticated;

create function public.submit_quote(
  p_customer_name text,
  p_customer_phone text,
  p_category_slug text,
  p_product_id uuid,
  p_quantity integer,
  p_needed_by date,
  p_details text,
  p_attachment_path text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_category_id uuid;
  v_category_name text;
  v_product_name text;
  v_quote_id uuid;
begin
  if length(trim(coalesce(p_customer_name, ''))) not between 1 and 120
    or length(trim(coalesce(p_customer_phone, ''))) not between 5 and 40
    or coalesce(length(p_details), 0) > 4000
    or coalesce(length(p_attachment_path), 0) > 100
    or (p_attachment_path is not null and p_attachment_path !~ '^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$')
    or (p_quantity is not null and p_quantity not between 1 and 10000)
    or (p_needed_by is not null and p_needed_by < current_date) then
    raise exception 'Invalid quote request';
  end if;

  select id, name into v_category_id, v_category_name
  from public.categories
  where slug = p_category_slug and is_active;

  if v_category_id is null then
    raise exception 'Selected category is unavailable';
  end if;

  if p_product_id is not null then
    select name into v_product_name
    from public.products
    where id = p_product_id and category_id = v_category_id and is_active;

    if v_product_name is null then
      raise exception 'Selected product is unavailable';
    end if;
  else
    v_product_name := v_category_name;
  end if;

  insert into public.quote_requests (
    customer_name, customer_phone, category_id, product_id, product_name, quantity, needed_by, details,
    attachment_path
  ) values (
    trim(p_customer_name), trim(p_customer_phone), v_category_id, p_product_id, v_product_name,
    p_quantity, p_needed_by, trim(coalesce(p_details, '')), p_attachment_path
  ) returning id into v_quote_id;

  return v_quote_id;
end;
$$;

create function public.create_manual_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_notes text,
  p_product_ids uuid[],
  p_quantities integer[]
)
returns table (id uuid, order_number bigint, currency text, subtotal numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_currency text;
  v_subtotal numeric(12, 2);
  v_order_id uuid;
  v_order_number bigint;
begin
  perform p.id
  from public.products p
  where p.id = any(p_product_ids)
  order by p.id
  for share;

  if length(trim(coalesce(p_customer_name, ''))) not between 1 and 120
    or length(trim(coalesce(p_customer_email, ''))) not between 3 and 254
    or p_customer_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or length(trim(coalesce(p_customer_phone, ''))) not between 5 and 40
    or coalesce(length(p_notes), 0) > 4000
    or coalesce(array_length(p_product_ids, 1), 0) not between 1 and 20
    or array_length(p_product_ids, 1) <> array_length(p_quantities, 1)
    or exists (select 1 from unnest(p_quantities) q where q not between 1 and 100) then
    raise exception 'Invalid order details';
  end if;

  if (select count(distinct value) from unnest(p_product_ids) as items(value))
    <> array_length(p_product_ids, 1) then
    raise exception 'Duplicate products are not allowed';
  end if;

  select min(p.currency), round(sum(p.price * item.quantity), 2)
    into v_currency, v_subtotal
  from unnest(p_product_ids, p_quantities) as item(product_id, quantity)
  join public.products p on p.id = item.product_id and p.is_active
  where p.price is not null and p.currency is not null;

  if v_currency is null
    or (select count(*) from unnest(p_product_ids) as requested(id))
      <> (select count(*) from public.products p where p.id = any(p_product_ids)
        and p.is_active and p.price is not null and p.currency = v_currency) then
    raise exception 'Products are unavailable or have mixed currencies';
  end if;

  insert into public.orders (
    customer_name, customer_email, customer_phone, notes, currency, subtotal
  ) values (
    trim(p_customer_name), lower(trim(p_customer_email)), trim(p_customer_phone),
    trim(coalesce(p_notes, '')), v_currency, v_subtotal
  ) returning orders.id, orders.order_number into v_order_id, v_order_number;

  insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
  select v_order_id, p.id, p.name, p.price, item.quantity
  from unnest(p_product_ids, p_quantities) as item(product_id, quantity)
  join public.products p on p.id = item.product_id;

  return query select v_order_id, v_order_number, v_currency, v_subtotal;
end;
$$;

revoke all on function public.submit_quote(text, text, text, uuid, integer, date, text, text) from public;
revoke all on function public.create_manual_order(text, text, text, text, uuid[], integer[]) from public;
grant execute on function public.submit_quote(text, text, text, uuid, integer, date, text, text) to anon, authenticated;
grant execute on function public.create_manual_order(text, text, text, text, uuid[], integer[]) to anon, authenticated;

insert into public.categories (slug, name, tagline, image_url, position) values
  ('custom-shorts', 'Custom Sports Shorts', 'Sublimated, embroidered — made to your design', '', 1),
  ('shirts-tank-tops', 'Shirts & Tank Tops', 'Performance jerseys and gym tanks', '', 2),
  ('gym-wear', 'Gym & Training Wear', 'Breathable fabric, built to train hard', '', 3),
  ('tracksuits-sona-suits', 'Tracksuits & Sona Suits', 'Full tracksuits and warm-up suits', '', 4),
  ('football-kits', 'Customized Football Kits', 'Your club colors, names and numbers', '', 5),
  ('taekwondo', 'Taekwondo Dobok', 'WT-approved cuts, belt sizes all ages', '', 6),
  ('wushu', 'Wushu Uniforms', 'Satin competition and training sets', '', 7),
  ('karate', 'Karate Gi', 'Kumite and kata weights available', '', 8);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('quote-attachments', 'quote-attachments', false, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 4194304,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy "Anyone can upload quote attachments"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'quote-attachments'
  and storage.extension(name) in ('jpg', 'jpeg', 'png', 'webp')
);

create policy "Admins can read quote attachments"
on storage.objects for select to authenticated
using (bucket_id = 'quote-attachments' and (select public.is_admin()));
