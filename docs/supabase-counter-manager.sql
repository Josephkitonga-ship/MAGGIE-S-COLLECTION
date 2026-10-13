-- ===========================================================
-- MAGGIE'S COLLECTION — docs/supabase-counter-manager.sql
-- PHASE 1 of the single-store move. Run ONCE in the Supabase SQL
-- editor, after the earlier files. Safe to run again.
--
-- ADDITIVE ONLY: nothing is dropped, so the live shop and the old
-- staff desks keep working while you deploy the new admin.
--
-- What it does
--   1. Two new staff roles:  counter  (the one shop dashboard)
--                            manager  (the owner: full access)
--      The old roles store_admin / owner still work and are treated
--      as counter / manager until you run the Phase 4 cleanup file.
--   2. Permissions no longer depend on a store column. Any counter
--      or manager can add/edit products, adjust stock, sell at the
--      till and verify orders. The manager can also delete products,
--      void sales and approve staff.
--   3. Stock: product_stock (quantity per product and size) and
--      stock_movements (a ledger of every change, with who and why).
--      A product with NO stock rows is "not tracked": the shop keeps
--      working exactly as before until staff enter opening stock.
--   4. POS: pos_sales + record_pos_sale(), void_pos_sale().
--   5. verify_order(): verifying a website order takes its pieces
--      out of stock in the same step. Cancelling a verified order
--      puts them back.
--
-- All stock changes happen inside the database functions below, so
-- the till and the website can never oversell the same last piece.
-- ===========================================================

-- ---------- 1. roles ---------------------------------------------------

alter table public.staff drop constraint if exists staff_role_check;
alter table public.staff drop constraint if exists staff_store_matches_role;
alter table public.staff add  constraint staff_role_check
  check (role in ('counter', 'manager', 'store_admin', 'owner'));

-- Manager = new name for owner. Redefined so the existing staff
-- approval functions (list/assign/remove) recognise both.
create or replace function public.is_manager()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.staff s
    where s.user_id = auth.uid() and s.role in ('manager', 'owner')
  );
$$;

create or replace function public.is_owner()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_manager();
$$;

-- Anyone who works at the shop: counter or manager (or the old names).
create or replace function public.can_work()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.staff s
    where s.user_id = auth.uid()
      and s.role in ('counter', 'manager', 'store_admin', 'owner')
  );
$$;

-- Approve a person as counter staff or as a manager (manager only).
-- Existing manager accounts cannot be changed here, so nobody can lock
-- the shop out of its own desk; remove or demote a manager in SQL.
drop function if exists public.approve_staff(uuid);

create or replace function public.approve_staff(p_user uuid, p_role text default 'counter')
returns void
language plpgsql security definer set search_path = public, auth
as $$
declare
  v_email     text;
  v_confirmed timestamptz;
  v_role      text;
begin
  if not public.is_manager() then raise exception 'Only the manager can do this'; end if;
  if p_user = auth.uid() then raise exception 'You cannot change your own access'; end if;
  if p_role not in ('counter', 'manager') then raise exception 'Unknown role'; end if;

  select email, email_confirmed_at into v_email, v_confirmed from auth.users where id = p_user;
  if v_email is null then raise exception 'No such account'; end if;
  if v_confirmed is null then raise exception 'This person has not confirmed their email yet'; end if;

  select role into v_role from public.staff where user_id = p_user;
  if v_role in ('manager', 'owner') then raise exception 'Manager accounts cannot be changed here'; end if;

  insert into public.staff (user_id, email, role, store)
  values (p_user, v_email, p_role, null)
  on conflict (user_id) do update
    set role = excluded.role, store = null, email = excluded.email;
end;
$$;

-- remove_staff(): same as before, but managers are protected like owners were.
create or replace function public.remove_staff(p_user uuid)
returns void
language plpgsql security definer set search_path = public, auth
as $$
declare v_role text;
begin
  if not public.is_manager() then raise exception 'Only the manager can do this'; end if;
  if p_user = auth.uid() then raise exception 'You cannot remove your own access'; end if;
  select role into v_role from public.staff where user_id = p_user;
  if v_role in ('manager', 'owner') then raise exception 'Manager accounts are removed in SQL only'; end if;
  delete from public.staff where user_id = p_user;
end;
$$;

revoke all on function public.approve_staff(uuid, text) from public, anon;
grant execute on function public.approve_staff(uuid, text) to authenticated;

-- ---------- 2. policies: products, orders, photos ----------------------

drop policy if exists "products readable when active" on public.products;
create policy "products readable when active"
  on public.products for select
  using (active = true or public.can_work());

drop policy if exists "staff insert products" on public.products;
create policy "staff insert products"
  on public.products for insert to authenticated
  with check (public.can_work());

drop policy if exists "staff update products" on public.products;
create policy "staff update products"
  on public.products for update to authenticated
  using (public.can_work()) with check (public.can_work());

-- deleting a product for good is the manager's call; counter hides it instead
drop policy if exists "staff delete products" on public.products;
create policy "staff delete products"
  on public.products for delete to authenticated
  using (public.is_manager());

drop policy if exists "staff read orders" on public.orders;
create policy "staff read orders"
  on public.orders for select to authenticated
  using (public.can_work());

drop policy if exists "staff update orders" on public.orders;
create policy "staff update orders"
  on public.orders for update to authenticated
  using (public.can_work()) with check (public.can_work());

-- only CANCELLED orders can be deleted, as before
drop policy if exists "store admin delete cancelled orders" on public.orders;
drop policy if exists "owner delete orders" on public.orders;
drop policy if exists "staff delete orders" on public.orders;
drop policy if exists "staff delete cancelled orders" on public.orders;
create policy "staff delete cancelled orders"
  on public.orders for delete to authenticated
  using (public.can_work() and status = 'cancelled');

drop policy if exists "staff can upload product images" on storage.objects;
create policy "staff can upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.can_work());

drop policy if exists "staff can replace product images" on storage.objects;
create policy "staff can replace product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.can_work())
  with check (bucket_id = 'product-images' and public.can_work());

drop policy if exists "staff can delete product images" on storage.objects;
create policy "staff can delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.can_work());

-- ---------- 3. stock ----------------------------------------------------

create table if not exists public.product_stock (
  product_id uuid not null references public.products (id) on delete cascade,
  size       text not null default '',          -- '' = product has no sizes
  qty        integer not null default 0 check (qty >= 0),
  updated_at timestamptz not null default now(),
  primary key (product_id, size)
);

create table if not exists public.stock_movements (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product_id uuid not null references public.products (id) on delete cascade,
  size       text not null default '',
  delta      integer not null check (delta <> 0),
  reason     text not null
             check (reason in ('opening', 'restock', 'correction', 'damaged', 'return',
                               'sale_pos', 'sale_web', 'void', 'cancelled_order')),
  ref        text,                               -- sale code or order code
  note       text,
  by_user    uuid,
  by_email   text
);

create index if not exists stock_movements_product_idx on public.stock_movements (product_id, created_at desc);
create index if not exists stock_movements_created_idx on public.stock_movements (created_at desc);

alter table public.product_stock    enable row level security;
alter table public.stock_movements  enable row level security;

-- read-only from the app; every change goes through the functions below
drop policy if exists "staff read stock" on public.product_stock;
create policy "staff read stock" on public.product_stock for select to authenticated using (public.can_work());

drop policy if exists "staff read stock movements" on public.stock_movements;
create policy "staff read stock movements" on public.stock_movements for select to authenticated using (public.can_work());

-- ---------- 4. POS sales ------------------------------------------------

create table if not exists public.pos_sales (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  code           text not null unique,           -- PS-261012-4821
  cashier_id     uuid,
  cashier_email  text,
  payment        text not null check (payment in ('cash', 'mpesa', 'card', 'other')),
  customer_name  text,
  customer_phone text,
  note           text,
  items          jsonb not null default '[]'::jsonb,
  subtotal       numeric(10, 2) not null default 0,   -- what was charged
  discount_total numeric(10, 2) not null default 0,   -- (marked or list price - charged) x qty
  voided_at      timestamptz,
  voided_by      text,
  void_reason    text
);

create index if not exists pos_sales_created_idx on public.pos_sales (created_at desc);

alter table public.pos_sales enable row level security;

drop policy if exists "staff read pos sales" on public.pos_sales;
create policy "staff read pos sales" on public.pos_sales for select to authenticated using (public.can_work());

-- orders remember whether their stock has been taken out
alter table public.orders add column if not exists stock_deducted boolean not null default false;

-- ---------- 5. stock helpers (internal) ----------------------------------
-- Takes qty out of a TRACKED product. A product is tracked when it has
-- any row in product_stock. Returns true if stock was taken, false if the
-- product is not tracked (nothing to do). Raises if there is not enough,
-- unless p_force, which takes what is there (never below zero).

create or replace function public._take_stock(
  p_product uuid, p_size text, p_qty integer,
  p_reason text, p_ref text, p_force boolean
)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_size  text := coalesce(p_size, '');
  v_have  integer;
  v_take  integer;
  v_name  text;
begin
  if not exists (select 1 from public.product_stock where product_id = p_product) then
    return false;                                -- not tracked
  end if;

  select qty into v_have
  from public.product_stock
  where product_id = p_product and size = v_size
  for update;

  v_have := coalesce(v_have, 0);

  if v_have < p_qty and not p_force then
    select name into v_name from public.products where id = p_product;
    raise exception 'Not enough stock for % %: % left, % needed',
      coalesce(v_name, 'a product'),
      case when v_size = '' then '' else '(' || v_size || ')' end,
      v_have, p_qty;
  end if;

  v_take := least(v_have, p_qty);
  if v_take > 0 then
    update public.product_stock
      set qty = qty - v_take, updated_at = now()
      where product_id = p_product and size = v_size;
    insert into public.stock_movements (product_id, size, delta, reason, ref, by_user, by_email)
    values (p_product, v_size, -v_take, p_reason, p_ref, auth.uid(),
            (select email from public.staff where user_id = auth.uid()));
  end if;
  return true;
end;
$$;

create or replace function public._return_stock(
  p_product uuid, p_size text, p_qty integer, p_reason text, p_ref text
)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_size text := coalesce(p_size, '');
begin
  if not exists (select 1 from public.product_stock where product_id = p_product) then
    return;                                      -- not tracked
  end if;
  insert into public.product_stock (product_id, size, qty)
  values (p_product, v_size, p_qty)
  on conflict (product_id, size)
    do update set qty = public.product_stock.qty + excluded.qty, updated_at = now();
  insert into public.stock_movements (product_id, size, delta, reason, ref, by_user, by_email)
  values (p_product, v_size, p_qty, p_reason, p_ref, auth.uid(),
          (select email from public.staff where user_id = auth.uid()));
end;
$$;

revoke all on function public._take_stock(uuid, text, integer, text, text, boolean) from public, anon, authenticated;
revoke all on function public._return_stock(uuid, text, integer, text, text) from public, anon, authenticated;

-- ---------- 6. stock: adjust / set --------------------------------------

-- Add or remove pieces. p_delta may be negative.
create or replace function public.adjust_stock(
  p_product uuid, p_size text, p_delta integer, p_reason text, p_note text default null
)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_size text := coalesce(p_size, '');
  v_new  integer;
begin
  if not public.can_work() then raise exception 'Not allowed'; end if;
  if p_delta is null or p_delta = 0 then raise exception 'Enter a quantity to add or remove'; end if;
  if p_reason not in ('opening', 'restock', 'correction', 'damaged', 'return') then
    raise exception 'Unknown reason';
  end if;
  if not exists (select 1 from public.products where id = p_product) then
    raise exception 'No such product';
  end if;

  insert into public.product_stock (product_id, size, qty)
  values (p_product, v_size, 0)
  on conflict (product_id, size) do nothing;

  update public.product_stock
    set qty = qty + p_delta, updated_at = now()
    where product_id = p_product and size = v_size
  returning qty into v_new;

  if v_new < 0 then
    raise exception 'That would leave less than zero in stock';
  end if;

  insert into public.stock_movements (product_id, size, delta, reason, note, by_user, by_email)
  values (p_product, v_size, p_delta, p_reason, nullif(p_note, ''), auth.uid(),
          (select email from public.staff where user_id = auth.uid()));
  return v_new;
end;
$$;

-- Stock take: set the exact count. Logs the difference.
create or replace function public.set_stock(
  p_product uuid, p_size text, p_qty integer, p_note text default null
)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_size text := coalesce(p_size, '');
  v_old  integer;
begin
  if not public.can_work() then raise exception 'Not allowed'; end if;
  if p_qty is null or p_qty < 0 then raise exception 'Stock cannot be below zero'; end if;
  if not exists (select 1 from public.products where id = p_product) then
    raise exception 'No such product';
  end if;

  select qty into v_old from public.product_stock
  where product_id = p_product and size = v_size for update;

  if v_old is null then
    insert into public.product_stock (product_id, size, qty) values (p_product, v_size, p_qty);
    v_old := 0;
  else
    update public.product_stock set qty = p_qty, updated_at = now()
    where product_id = p_product and size = v_size;
  end if;

  if p_qty <> v_old then
    insert into public.stock_movements (product_id, size, delta, reason, note, by_user, by_email)
    values (p_product, v_size, p_qty - v_old,
            case when v_old = 0 then 'opening' else 'correction' end,
            nullif(p_note, ''), auth.uid(),
            (select email from public.staff where user_id = auth.uid()));
  end if;
  return p_qty;
end;
$$;

-- ---------- 7. POS: record a sale ----------------------------------------
-- p_items: [ { "id": "<product uuid>", "size": "M", "qty": 2, "unit_price": 1800 } ]
-- unit_price is optional (a negotiated price). It may not be above the
-- shop price. Everything else is read from the products table.

create or replace function public.record_pos_sale(
  p_items          jsonb,
  p_payment        text,
  p_customer_name  text default null,
  p_customer_phone text default null,
  p_note           text default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  l        jsonb;
  prod     public.products%rowtype;
  v_qty    integer;
  v_price  numeric;
  v_list   numeric;
  v_items  jsonb := '[]'::jsonb;
  v_sub    numeric := 0;
  v_disc   numeric := 0;
  v_code   text;
  v_id     uuid;
  v_email  text;
  v_tries  integer := 0;
begin
  if not public.can_work() then raise exception 'Not allowed'; end if;
  if p_payment not in ('cash', 'mpesa', 'card', 'other') then raise exception 'Choose how it was paid'; end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one piece to the sale';
  end if;

  select email into v_email from public.staff where user_id = auth.uid();

  loop
    v_code := 'PS-' || to_char(now() at time zone 'Africa/Nairobi', 'YYMMDD') || '-' ||
              lpad((floor(random() * 10000))::int::text, 4, '0');
    exit when not exists (select 1 from public.pos_sales where code = v_code);
    v_tries := v_tries + 1;
    if v_tries > 20 then raise exception 'Could not make a sale code, try again'; end if;
  end loop;

  for l in select * from jsonb_array_elements(p_items) loop
    v_qty := (l ->> 'qty')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 100 then raise exception 'Bad quantity'; end if;

    select * into prod from public.products where id = (l ->> 'id')::uuid;
    if not found then raise exception 'A piece in this sale no longer exists'; end if;

    v_list  := prod.price;
    v_price := coalesce(nullif(l ->> 'unit_price', '')::numeric, prod.price);
    if v_price < 0 or v_price > prod.price then
      raise exception 'The price for % cannot be above KSh %', prod.name, prod.price;
    end if;

    perform public._take_stock(prod.id, coalesce(l ->> 'size', ''), v_qty, 'sale_pos', v_code, false);

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'id', prod.id,
      'name', prod.name,
      'size', coalesce(l ->> 'size', ''),
      'qty', v_qty,
      'price', v_price,
      'list_price', v_list,
      'compare_price', prod.compare_price
    ));
    v_sub  := v_sub + v_price * v_qty;
    v_disc := v_disc + greatest(coalesce(prod.compare_price, v_list) - v_price, 0) * v_qty;
  end loop;

  insert into public.pos_sales (
    code, cashier_id, cashier_email, payment, customer_name, customer_phone, note,
    items, subtotal, discount_total
  ) values (
    v_code, auth.uid(), v_email, p_payment, nullif(p_customer_name, ''), nullif(p_customer_phone, ''),
    nullif(p_note, ''), v_items, v_sub, v_disc
  ) returning id into v_id;

  return jsonb_build_object('id', v_id, 'code', v_code, 'subtotal', v_sub, 'discount_total', v_disc);
end;
$$;

-- Manager only: cancel a sale and put its pieces back.
create or replace function public.void_pos_sale(p_sale uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  s public.pos_sales%rowtype;
  i jsonb;
begin
  if not public.is_manager() then raise exception 'Only the manager can void a sale'; end if;
  if char_length(coalesce(p_reason, '')) < 3 then raise exception 'Give a short reason'; end if;

  select * into s from public.pos_sales where id = p_sale for update;
  if not found then raise exception 'No such sale'; end if;
  if s.voided_at is not null then raise exception 'This sale is already voided'; end if;

  for i in select * from jsonb_array_elements(s.items) loop
    perform public._return_stock((i ->> 'id')::uuid, coalesce(i ->> 'size', ''), (i ->> 'qty')::integer, 'void', s.code);
  end loop;

  update public.pos_sales
    set voided_at = now(),
        voided_by = (select email from public.staff where user_id = auth.uid()),
        void_reason = p_reason
    where id = p_sale;
end;
$$;

-- ---------- 8. website orders: verify takes stock out -------------------

create or replace function public.verify_order(p_order uuid, p_force boolean default false)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  o       public.orders%rowtype;
  i       jsonb;
  v_took  boolean := false;
begin
  if not public.can_work() then raise exception 'Not allowed'; end if;

  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'No such order'; end if;
  if o.status = 'cancelled' then raise exception 'This order is cancelled'; end if;
  if o.verified_at is not null then return; end if;

  for i in select * from jsonb_array_elements(o.items) loop
    if i ->> 'id' is not null then
      if public._take_stock((i ->> 'id')::uuid, coalesce(i ->> 'size', ''), (i ->> 'qty')::integer,
                            'sale_web', o.code, p_force) then
        v_took := true;
      end if;
    end if;
  end loop;

  update public.orders
    set verified_at = now(),
        verified_by = (select email from public.staff where user_id = auth.uid()),
        stock_deducted = v_took
    where id = p_order;
end;
$$;

-- "Undo" on a verified order: puts the stock back too.
create or replace function public.unverify_order(p_order uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  o public.orders%rowtype;
  i jsonb;
begin
  if not public.can_work() then raise exception 'Not allowed'; end if;
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'No such order'; end if;
  if o.verified_at is null then return; end if;

  if o.stock_deducted then
    for i in select * from jsonb_array_elements(o.items) loop
      if i ->> 'id' is not null then
        perform public._return_stock((i ->> 'id')::uuid, coalesce(i ->> 'size', ''), (i ->> 'qty')::integer,
                                     'cancelled_order', o.code);
      end if;
    end loop;
  end if;

  update public.orders
    set verified_at = null, verified_by = null, stock_deducted = false
    where id = p_order;
end;
$$;

-- Cancelling a verified order (status change) returns its stock automatically.
create or replace function public._orders_restock_on_cancel()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare i jsonb;
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' and old.stock_deducted then
    for i in select * from jsonb_array_elements(old.items) loop
      if i ->> 'id' is not null then
        perform public._return_stock((i ->> 'id')::uuid, coalesce(i ->> 'size', ''), (i ->> 'qty')::integer,
                                     'cancelled_order', old.code);
      end if;
    end loop;
    new.stock_deducted := false;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_restock_on_cancel on public.orders;
create trigger orders_restock_on_cancel
  before update on public.orders
  for each row execute function public._orders_restock_on_cancel();

-- ---------- 9. who may call what ----------------------------------------

revoke all on function public.adjust_stock(uuid, text, integer, text, text)             from public, anon;
revoke all on function public.set_stock(uuid, text, integer, text)                      from public, anon;
revoke all on function public.record_pos_sale(jsonb, text, text, text, text)            from public, anon;
revoke all on function public.void_pos_sale(uuid, text)                                 from public, anon;
revoke all on function public.verify_order(uuid, boolean)                               from public, anon;
revoke all on function public.unverify_order(uuid)                                      from public, anon;

grant execute on function public.adjust_stock(uuid, text, integer, text, text)          to authenticated;
grant execute on function public.set_stock(uuid, text, integer, text)                   to authenticated;
grant execute on function public.record_pos_sale(jsonb, text, text, text, text)         to authenticated;
grant execute on function public.void_pos_sale(uuid, text)                              to authenticated;
grant execute on function public.verify_order(uuid, boolean)                            to authenticated;
grant execute on function public.unverify_order(uuid)                                   to authenticated;
-- each function checks can_work() / is_manager() itself.

-- ---------- 10. "sold out" for the shop window ---------------------------
-- The storefront may only learn whether a size is available, never how
-- many are left. A product with no stock rows is not counted and is
-- never shown as sold out.

create or replace view public.product_availability as
  select ps.product_id, ps.size, (ps.qty > 0) as in_stock
  from public.product_stock ps
  join public.products p on p.id = ps.product_id
  where p.active = true;

grant select on public.product_availability to anon, authenticated;
