alter table public.products
  add column if not exists image_urls text[] not null default '{}',
  add column if not exists available_sizes text[] not null default '{}',
  add column if not exists available_colours text[] not null default '{}',
  add column if not exists stock_quantity integer,
  add constraint products_stock_quantity_nonnegative check (stock_quantity is null or stock_quantity >= 0);

update public.products
set image_urls = case
  when image_url <> '' and cardinality(image_urls) = 0 then array[image_url]
  else image_urls
end,
currency = case when price is not null then 'PKR' else null end;

alter table public.products alter column currency set default 'PKR';
alter table public.products
  add constraint products_currency_pkr check (currency is null or currency = 'PKR');

alter table public.order_items
  add column if not exists selected_size text not null default '',
  add column if not exists selected_colour text not null default '';

alter table public.order_items drop constraint if exists order_items_order_id_product_id_key;
alter table public.order_items
  add constraint order_items_order_product_options_key
  unique (order_id, product_id, selected_size, selected_colour);

alter table public.orders
  alter column currency set default 'PKR',
  add column if not exists inventory_reserved boolean not null default false;

drop function if exists public.create_manual_order(text, text, text, text, uuid[], integer[]);

create function public.create_manual_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_notes text,
  p_product_ids uuid[],
  p_quantities integer[],
  p_sizes text[],
  p_colours text[]
)
returns table (id uuid, order_number bigint, currency text, subtotal numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_currency text := 'PKR';
  v_subtotal numeric(12, 2);
  v_order_id uuid;
  v_order_number bigint;
begin
  if length(trim(coalesce(p_customer_name, ''))) not between 1 and 120
    or length(trim(coalesce(p_customer_email, ''))) not between 3 and 254
    or p_customer_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or length(trim(coalesce(p_customer_phone, ''))) not between 5 and 40
    or coalesce(length(p_notes), 0) > 4000
    or coalesce(array_length(p_product_ids, 1), 0) not between 1 and 20
    or coalesce(array_length(p_quantities, 1), 0) <> array_length(p_product_ids, 1)
    or coalesce(array_length(p_sizes, 1), 0) <> array_length(p_product_ids, 1)
    or coalesce(array_length(p_colours, 1), 0) <> array_length(p_product_ids, 1)
    or exists (select 1 from unnest(p_quantities) q where q not between 1 and 100)
    or exists (select 1 from unnest(p_sizes) s where length(s) > 40)
    or exists (select 1 from unnest(p_colours) c where length(c) > 60) then
    raise exception 'Invalid order details';
  end if;

  perform p.id
  from public.products p
  where p.id = any(p_product_ids)
  order by p.id
  for update;

  if (
    select count(*) from (
      select product_id, size, colour
      from unnest(p_product_ids, p_sizes, p_colours) as item(product_id, size, colour)
      group by product_id, size, colour
      having count(*) > 1
    ) duplicates
  ) > 0 then
    raise exception 'Duplicate product options are not allowed';
  end if;

  if exists (
    select 1
    from unnest(p_product_ids, p_quantities, p_sizes, p_colours)
      as item(product_id, quantity, size, colour)
    left join public.products p on p.id = item.product_id
    where p.id is null
      or not p.is_active
      or p.price is null
      or (
        cardinality(p.available_sizes) > 0
        and (item.size = '' or not (item.size = any(p.available_sizes)))
      )
      or (
        cardinality(p.available_colours) > 0
        and (item.colour = '' or not (item.colour = any(p.available_colours)))
      )
  ) then
    raise exception 'Products are unavailable or selected options are invalid';
  end if;

  if exists (
    select 1
    from public.products p
    join (
      select product_id, sum(quantity) as quantity
      from unnest(p_product_ids, p_quantities) as item(product_id, quantity)
      group by product_id
    ) item on item.product_id = p.id
    where p.stock_quantity is not null and p.stock_quantity < item.quantity
  ) then
    raise exception 'Products are unavailable: insufficient stock';
  end if;

  select round(sum(p.price * item.quantity), 2)
    into v_subtotal
  from unnest(p_product_ids, p_quantities) as item(product_id, quantity)
  join public.products p on p.id = item.product_id;

  insert into public.orders (
    customer_name, customer_email, customer_phone, notes, currency, subtotal, inventory_reserved
  ) values (
    trim(p_customer_name), lower(trim(p_customer_email)), trim(p_customer_phone),
    trim(coalesce(p_notes, '')), v_currency, v_subtotal,
    exists (
      select 1
      from unnest(p_product_ids) as requested(product_id)
      join public.products p on p.id = requested.product_id
      where p.stock_quantity is not null
    )
  ) returning orders.id, orders.order_number into v_order_id, v_order_number;

  insert into public.order_items (
    order_id, product_id, product_name, unit_price, quantity, selected_size, selected_colour
  )
  select v_order_id, p.id, p.name, p.price, item.quantity,
    item.size, item.colour
  from unnest(p_product_ids, p_quantities, p_sizes, p_colours)
    as item(product_id, quantity, size, colour)
  join public.products p on p.id = item.product_id;

  update public.products p
  set stock_quantity = p.stock_quantity - item.quantity
  from (
    select product_id, sum(quantity) as quantity
    from unnest(p_product_ids, p_quantities) as requested(product_id, quantity)
    group by product_id
  ) item
  where p.id = item.product_id and p.stock_quantity is not null;

  return query select v_order_id, v_order_number, v_currency, v_subtotal;
end;
$$;

revoke all on function public.create_manual_order(text, text, text, text, uuid[], integer[], text[], text[]) from public;
grant execute on function public.create_manual_order(text, text, text, text, uuid[], integer[], text[], text[]) to anon, authenticated;

create function public.restore_order_stock_on_cancellation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status <> 'cancelled' and new.status = 'cancelled' and old.inventory_reserved then
    update public.products p
    set stock_quantity = p.stock_quantity + item.quantity
    from (
      select product_id, sum(quantity) as quantity
      from public.order_items
      where order_id = new.id and product_id is not null
      group by product_id
    ) item
    where p.id = item.product_id and p.stock_quantity is not null;

    update public.orders set inventory_reserved = false where id = new.id;
  elsif old.status = 'cancelled' and new.status <> 'cancelled' then
    if exists (
      select 1
      from public.products p
      join (
        select product_id, sum(quantity) as quantity
        from public.order_items
        where order_id = new.id and product_id is not null
        group by product_id
      ) item on item.product_id = p.id
      where p.stock_quantity is not null and p.stock_quantity < item.quantity
    ) then
      raise exception 'Products are unavailable: insufficient stock';
    end if;

    update public.products p
    set stock_quantity = p.stock_quantity - item.quantity
    from (
      select product_id, sum(quantity) as quantity
      from public.order_items
      where order_id = new.id and product_id is not null
      group by product_id
    ) item
    where p.id = item.product_id and p.stock_quantity is not null;

    update public.orders
    set inventory_reserved = exists (
      select 1
      from public.order_items oi
      join public.products p on p.id = oi.product_id
      where oi.order_id = new.id and p.stock_quantity is not null
    )
    where id = new.id;
  end if;
  return new;
end;
$$;

create trigger orders_restore_stock_after_cancellation
after update of status on public.orders
for each row execute function public.restore_order_stock_on_cancellation();

notify pgrst, 'reload schema';
