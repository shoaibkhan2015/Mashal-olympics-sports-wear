-- Run against a test database with all migrations applied.
begin;

do $$
declare
  collection_id uuid;
  discounted_id uuid;
  regular_id uuid;
  request_id uuid := gen_random_uuid();
  saved_order_id uuid;
  saved_subtotal numeric;
  invalid_percentage numeric;
begin
  insert into public.categories (name, slug)
  values ('Discount test', 'discount-test-' || gen_random_uuid())
  returning id into collection_id;

  insert into public.products (category_id, name, slug, price, currency, is_active, discount_percentage)
  values (collection_id, 'Discounted item', 'discounted-test-' || request_id, 10.05, 'PKR', true, 50)
  returning id into discounted_id;

  insert into public.products (category_id, name, slug, price, currency, is_active)
  values (collection_id, 'Regular item', 'regular-test-' || request_id, 7.19, 'PKR', true)
  returning id into regular_id;

  assert (select effective_price = 5.03 from public.products where id = discounted_id);
  assert (select effective_price = price from public.products where id = regular_id);

  foreach invalid_percentage in array array[-0.01, 100.01, 12.345, 'NaN'::numeric]
  loop
    begin
      update public.products set discount_percentage = invalid_percentage where id = discounted_id;
      raise exception 'Invalid percentage was accepted: %', invalid_percentage;
    exception when check_violation then
      null;
    end;
  end loop;

  update public.products set discount_percentage = 12.50 where id = discounted_id;
  assert (select effective_price = 8.79 from public.products where id = discounted_id);

  begin
    perform public.create_manual_order(
      'Test Customer', 'test@example.com', '03001234567', '123 Example Street', '',
      array[discounted_id, regular_id], array[3, 2], array['', ''], array['', ''], 29.47, request_id
    );
    raise exception 'Checkout accepted the stale discount';
  exception when raise_exception then
    if sqlerrm <> 'Prices have changed' then raise; end if;
  end;
  assert not exists (select 1 from public.orders where checkout_request_id = request_id);

  select result.id, result.subtotal into strict saved_order_id, saved_subtotal
  from public.create_manual_order(
    'Test Customer', 'test@example.com', '03001234567', '123 Example Street', '',
    array[discounted_id, regular_id], array[3, 2], array['', ''], array['', ''], 40.75, request_id
  ) result;

  assert saved_subtotal = 40.75;
  assert exists (
    select 1 from public.order_items
    where order_id = saved_order_id and product_id = discounted_id
      and unit_price = 8.79 and quantity = 3 and line_total = 26.37
  );
  assert exists (
    select 1 from public.order_items
    where order_id = saved_order_id and product_id = regular_id
      and unit_price = 7.19 and quantity = 2 and line_total = 14.38
  );

  update public.products set discount_percentage = 100 where id = discounted_id;
  assert (select effective_price = 0 from public.products where id = discounted_id);
  update public.products set discount_percentage = 0 where id = discounted_id;
  assert (select effective_price = 10.05 from public.products where id = discounted_id);
  assert exists (
    select 1 from public.order_items
    where order_id = saved_order_id and product_id = discounted_id and unit_price = 8.79
  );
end;
$$;

rollback;
