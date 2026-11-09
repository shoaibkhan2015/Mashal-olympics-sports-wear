create or replace function public.create_manual_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_customer_address text,
  p_notes text,
  p_product_ids uuid[],
  p_quantities integer[],
  p_sizes text[],
  p_colours text[],
  p_expected_subtotal numeric,
  p_checkout_request_id uuid
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
    or length(trim(coalesce(p_customer_phone, ''))) not between 7 and 30
    or length(regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g')) not between 7 and 15
    or p_customer_phone !~ '^\+?[\d\s().-]+$'
    or length(trim(coalesce(p_customer_address, ''))) not between 10 and 500
    or coalesce(length(p_notes), 0) > 4000
    or coalesce(array_length(p_product_ids, 1), 0) not between 1 and 20
    or coalesce(array_length(p_quantities, 1), 0) <> array_length(p_product_ids, 1)
    or coalesce(array_length(p_sizes, 1), 0) <> array_length(p_product_ids, 1)
    or coalesce(array_length(p_colours, 1), 0) <> array_length(p_product_ids, 1)
    or p_expected_subtotal is null
    or p_checkout_request_id is null
    or exists (select 1 from unnest(p_quantities) q where q not between 1 and 100)
    or exists (select 1 from unnest(p_sizes) s where length(s) > 40)
    or exists (select 1 from unnest(p_colours) c where length(c) > 60) then
    raise exception 'Invalid order details';
  end if;

  select o.id, o.order_number, o.currency, o.subtotal
    into v_order_id, v_order_number, v_currency, v_subtotal
  from public.orders o
  where o.checkout_request_id = p_checkout_request_id;

  if v_order_id is not null then
    return query select v_order_id, v_order_number, v_currency, v_subtotal;
    return;
  end if;

  v_currency := 'PKR';

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
        (cardinality(p.available_sizes) > 0 and
          (item.size = '' or not (item.size = any(p.available_sizes))))
        or (cardinality(p.available_sizes) = 0 and item.size <> '')
      )
      or (
        (cardinality(p.available_colours) > 0 and
          (item.colour = '' or not (item.colour = any(p.available_colours))))
        or (cardinality(p.available_colours) = 0 and item.colour <> '')
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

  if round(p_expected_subtotal, 2) <> v_subtotal then
    raise exception 'Prices have changed';
  end if;

  insert into public.orders (
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
    notes,
    currency,
    subtotal,
    payment_method,
    inventory_reserved,
    checkout_request_id
  ) values (
    trim(p_customer_name),
    lower(trim(p_customer_email)),
    trim(p_customer_phone),
    trim(p_customer_address),
    trim(coalesce(p_notes, '')),
    v_currency,
    v_subtotal,
    'manual',
    exists (
      select 1
      from unnest(p_product_ids) as requested(product_id)
      join public.products p on p.id = requested.product_id
      where p.stock_quantity is not null
    ),
    p_checkout_request_id
  )
  on conflict (checkout_request_id) do nothing
  returning orders.id, orders.order_number into v_order_id, v_order_number;

  if v_order_id is null then
    select o.id, o.order_number, o.currency, o.subtotal
      into v_order_id, v_order_number, v_currency, v_subtotal
    from public.orders o
    where o.checkout_request_id = p_checkout_request_id;
    return query select v_order_id, v_order_number, v_currency, v_subtotal;
    return;
  end if;

  insert into public.order_items (
    order_id, product_id, product_name, unit_price, quantity, selected_size, selected_colour
  )
  select v_order_id, p.id, p.name, p.price, item.quantity, item.size, item.colour
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
