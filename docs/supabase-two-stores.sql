-- ===========================================================
-- MAGGIE'S COLLECTION — docs/supabase-two-stores.sql
-- Run ONCE in the Supabase SQL editor, AFTER supabase-rls.sql.
-- Safe to run again.
--
-- What it does
--   1. Adds two boutiques: Maggie's Collection (MC) and
--      David's Boutique (DB).
--   2. Tags every product and order with its store, and adds the
--      marked price (compare_price) used for discount badges.
--   3. Adds order verification (verified_at / verified_by).
--   4. Replaces "any staff member sees everything" with:
--        store_admin  -> only their own store's products + orders
--        owner        -> both stores
--   5. Replaces the open order insert with place_checkout(),
--      which prices every line from the products table, so a
--      shopper can no longer post their own prices.
--
-- Existing rows: all current products and orders become
-- Maggie's Collection. The existing staff account becomes the
-- OWNER (it can see both stores). Create the two store admins
-- with the inserts at the bottom.
-- ===========================================================

-- ---------- stores --------------------------------------------------

create table if not exists public.stores (
  slug         text primary key,
  name         text not null,
  order_prefix text not null unique
);

insert into public.stores (slug, name, order_prefix) values
  ('maggies', 'Maggie''s Collection', 'MC'),
  ('davids',  'David''s Boutique',    'DB')
on conflict (slug) do update
  set name = excluded.name, order_prefix = excluded.order_prefix;

alter table public.stores enable row level security;

drop policy if exists "stores readable by everyone" on public.stores;
create policy "stores readable by everyone"
  on public.stores for select using (true);

-- ---------- staff: roles ---------------------------------------------

alter table public.staff add column if not exists role  text not null default 'store_admin';
alter table public.staff add column if not exists store text references public.stores (slug);

-- Anyone already in the table (with no store) was the single admin: make them owner.
update public.staff set role = 'owner', store = null where store is null;

alter table public.staff drop constraint if exists staff_role_check;
alter table public.staff add  constraint staff_role_check
  check (role in ('store_admin', 'owner'));

alter table public.staff drop constraint if exists staff_store_matches_role;
alter table public.staff add  constraint staff_store_matches_role
  check ((role = 'owner' and store is null) or (role = 'store_admin' and store is not null));

-- ---------- permission helpers ----------------------------------------

create or replace function public.is_owner()
returns boolean
language sql stable security invoker set search_path = public
as $$
  select exists (
    select 1 from public.staff s where s.user_id = auth.uid() and s.role = 'owner'
  );
$$;

create or replace function public.can_manage(target_store text)
returns boolean
language sql stable security invoker set search_path = public
as $$
  select exists (
    select 1 from public.staff s
    where s.user_id = auth.uid()
      and (s.role = 'owner' or s.store = target_store)
  );
$$;

-- ---------- products ----------------------------------------------------

alter table public.products
  add column if not exists store text not null default 'maggies' references public.stores (slug);

-- marked (original) price. null = no discount. Must sit above the selling price.
alter table public.products add column if not exists compare_price numeric(10, 2);

alter table public.products drop constraint if exists products_compare_above_price;
alter table public.products add  constraint products_compare_above_price
  check (compare_price is null or compare_price > price);

create index if not exists products_store_idx on public.products (store);

-- ---------- orders --------------------------------------------------------

alter table public.orders
  add column if not exists store text not null default 'maggies' references public.stores (slug);
alter table public.orders add column if not exists discount_total numeric(10, 2) not null default 0;
alter table public.orders add column if not exists group_code     text;
alter table public.orders add column if not exists verified_at    timestamptz;
alter table public.orders add column if not exists verified_by    text;

create index if not exists orders_store_idx    on public.orders (store);
create index if not exists orders_verified_idx on public.orders (verified_at);

-- ---------- policies: products ----------------------------------------------

drop policy if exists "products readable when active" on public.products;
create policy "products readable when active"
  on public.products for select
  using (active = true or public.can_manage(store));

drop policy if exists "staff insert products" on public.products;
create policy "staff insert products"
  on public.products for insert to authenticated
  with check (public.can_manage(store));

drop policy if exists "staff update products" on public.products;
create policy "staff update products"
  on public.products for update to authenticated
  using (public.can_manage(store)) with check (public.can_manage(store));

drop policy if exists "staff delete products" on public.products;
create policy "staff delete products"
  on public.products for delete to authenticated
  using (public.can_manage(store));

-- ---------- policies: orders ---------------------------------------------------
-- No public insert any more: shoppers go through place_checkout() below.

drop policy if exists "anyone may place an order" on public.orders;

drop policy if exists "staff read orders" on public.orders;
create policy "staff read orders"
  on public.orders for select to authenticated
  using (public.can_manage(store));

drop policy if exists "staff update orders" on public.orders;
create policy "staff update orders"
  on public.orders for update to authenticated
  using (public.can_manage(store)) with check (public.can_manage(store));

-- only the owner may delete an order outright
drop policy if exists "staff delete orders" on public.orders;
drop policy if exists "owner delete orders" on public.orders;
create policy "owner delete orders"
  on public.orders for delete to authenticated
  using (public.is_owner());

-- ---------- checkout ---------------------------------------------------------------
-- One call from the storefront. p_orders looks like:
--   [ { "store": "maggies", "code": "MC-260929-4412",
--       "lines": [ { "id": "<product uuid>", "size": "M", "qty": 2 } ] },
--     { "store": "davids",  "code": "DB-260929-1187", "lines": [ ... ] } ]
-- Prices, names and discounts are read from the products table here,
-- never from the browser. One order row is written per store, so each
-- boutique only ever sees its own. The delivery fee is charged once per
-- checkout and recorded on the first order.

create or replace function public.place_checkout(
  p_name         text,
  p_phone        text,
  p_location     text,
  p_notes        text,
  p_zone         text,
  p_delivery_fee numeric,
  p_group_code   text,
  p_orders       jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  o          jsonb;
  l          jsonb;
  prod       public.products%rowtype;
  v_store    text;
  v_code     text;
  v_prefix   text;
  v_items    jsonb;
  v_sub      numeric;
  v_disc     numeric;
  v_qty      integer;
  v_fee_all  numeric;
  v_fee      numeric;
  v_first    boolean := true;
  v_result   jsonb := '[]'::jsonb;
begin
  if char_length(coalesce(p_name, ''))     not between 2 and 120 then raise exception 'Name is required'; end if;
  if char_length(coalesce(p_phone, ''))    not between 7 and 20  then raise exception 'Phone is required'; end if;
  if char_length(coalesce(p_location, '')) not between 2 and 240 then raise exception 'Delivery point is required'; end if;

  if jsonb_typeof(p_orders) is distinct from 'array'
     or jsonb_array_length(p_orders) = 0
     or jsonb_array_length(p_orders) > (select count(*) from public.stores) then
    raise exception 'Nothing to order';
  end if;

  v_fee_all := least(greatest(coalesce(p_delivery_fee, 0), 0), 2000);

  for o in select * from jsonb_array_elements(p_orders) loop
    v_store := o ->> 'store';
    v_code  := o ->> 'code';

    select order_prefix into v_prefix from public.stores where slug = v_store;
    if v_prefix is null then raise exception 'Unknown boutique'; end if;
    if v_code is null or v_code !~ ('^' || v_prefix || '-[0-9]{6}-[0-9]{4}$') then
      raise exception 'Bad order code';
    end if;

    v_items := '[]'::jsonb;
    v_sub   := 0;
    v_disc  := 0;

    for l in select * from jsonb_array_elements(coalesce(o -> 'lines', '[]'::jsonb)) loop
      v_qty := (l ->> 'qty')::integer;
      if v_qty is null or v_qty < 1 or v_qty > 50 then raise exception 'Bad quantity'; end if;

      select * into prod
      from public.products
      where id = (l ->> 'id')::uuid and store = v_store and active = true;
      if not found then raise exception 'A piece in your cart is no longer available'; end if;

      v_items := v_items || jsonb_build_array(jsonb_build_object(
        'id', prod.id,
        'name', prod.name,
        'price', prod.price,
        'compare_price', prod.compare_price,
        'size', coalesce(l ->> 'size', ''),
        'qty', v_qty
      ));
      v_sub := v_sub + prod.price * v_qty;
      if prod.compare_price is not null and prod.compare_price > prod.price then
        v_disc := v_disc + (prod.compare_price - prod.price) * v_qty;
      end if;
    end loop;

    if v_items = '[]'::jsonb then raise exception 'Empty order'; end if;

    v_fee := case when v_first then v_fee_all else 0 end;

    insert into public.orders (
      code, store, group_code, customer_name, customer_phone, customer_location,
      notes, zone, items, subtotal, delivery_fee, discount_total, total, status
    ) values (
      v_code, v_store, nullif(p_group_code, ''), p_name, p_phone, p_location,
      nullif(p_notes, ''), p_zone, v_items, v_sub, v_fee, v_disc, v_sub + v_fee, 'new'
    );

    v_result := v_result || jsonb_build_array(jsonb_build_object(
      'code', v_code, 'store', v_store, 'subtotal', v_sub, 'total', v_sub + v_fee
    ));
    v_first := false;
  end loop;

  return v_result;
end;
$$;

revoke all on function public.place_checkout(text, text, text, text, text, numeric, text, jsonb) from public;
grant execute on function public.place_checkout(text, text, text, text, text, numeric, text, jsonb)
  to anon, authenticated;

-- ---------- adding the store admins ---------------------------------------------------
-- For each person: Authentication > Users > Add user (email + password),
-- copy the UID, then run ONE of these with the UID and email swapped in.
--
--   Maggie's admin  (lands on admin/maggie.html)
--   insert into public.staff (user_id, email, role, store)
--   values ('paste-uid', 'maggie@example.com', 'store_admin', 'maggies');
--
--   David's admin   (lands on admin/david.html)
--   insert into public.staff (user_id, email, role, store)
--   values ('paste-uid', 'david@example.com', 'store_admin', 'davids');
--
--   Owner           (lands on admin/owner.html, sees both boutiques)
--   insert into public.staff (user_id, email, role, store)
--   values ('paste-uid', 'owner@example.com', 'owner', null);
--
-- The account you already had is now the owner.
