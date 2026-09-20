-- ===========================================================
-- MAGGIE'S COLLECTION — docs/supabase-rls.sql
-- Run this once, whole, in the Supabase SQL editor.
-- Safe to run again: everything is guarded by IF NOT EXISTS
-- or dropped first.
--
-- Shape of the shop:
--   products  visible to the world when active = true
--   orders    anyone may place one, only staff may read them
-- Staff are simply the users you create in Authentication,
-- listed in the staff table below.
-- ===========================================================

create extension if not exists "pgcrypto";

-- ---------- staff -------------------------------------------------

create table if not exists public.staff (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  added_at   timestamptz not null default now()
);

comment on table public.staff is
  'Anyone listed here can manage products and orders. Add a row after creating the user in Authentication.';

-- Helper used by every staff-only policy below. SECURITY INVOKER is
-- enough here: the "staff see themselves" policy already lets a
-- signed-in user read their own row, so this needs no elevated rights.
create or replace function public.is_staff()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.staff s where s.user_id = auth.uid()
  );
$$;

-- ---------- products ----------------------------------------------

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  price       numeric(10, 2) not null check (price >= 0),
  category    text not null default 'tops',
  description text,
  image_url   text,
  sizes       text[] not null default '{}',
  sort        integer not null default 0,
  active      boolean not null default true
);

create index if not exists products_active_idx   on public.products (active);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_sort_idx     on public.products (sort);

-- ---------- orders -------------------------------------------------

create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  code              text unique,
  customer_name     text not null,
  customer_phone    text not null,
  customer_location text not null,
  notes             text,
  zone              text,
  items             jsonb not null default '[]'::jsonb,
  subtotal          numeric(10, 2) not null default 0,
  delivery_fee      numeric(10, 2) not null default 0,
  total             numeric(10, 2) not null default 0,
  status            text not null default 'new'
                    check (status in ('new', 'confirmed', 'packed',
                                      'out for delivery', 'delivered', 'cancelled'))
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx  on public.orders (status);

-- ---------- row level security --------------------------------------

alter table public.products enable row level security;
alter table public.orders   enable row level security;
alter table public.staff    enable row level security;

-- products: the world reads what is on the rail, staff do the rest.

drop policy if exists "products readable when active" on public.products;
create policy "products readable when active"
  on public.products for select
  using (active = true or public.is_staff());

drop policy if exists "staff insert products" on public.products;
create policy "staff insert products"
  on public.products for insert to authenticated
  with check (public.is_staff());

drop policy if exists "staff update products" on public.products;
create policy "staff update products"
  on public.products for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff delete products" on public.products;
create policy "staff delete products"
  on public.products for delete to authenticated
  using (public.is_staff());

-- orders: a shopper may drop one in the box and never look inside.

drop policy if exists "anyone may place an order" on public.orders;
create policy "anyone may place an order"
  on public.orders for insert to anon, authenticated
  with check (
    char_length(customer_name) between 2 and 120
    and char_length(customer_phone) between 7 and 20
    and char_length(customer_location) between 2 and 240
    and jsonb_typeof(items) = 'array'
    and total >= 0
  );

drop policy if exists "staff read orders" on public.orders;
create policy "staff read orders"
  on public.orders for select to authenticated
  using (public.is_staff());

drop policy if exists "staff update orders" on public.orders;
create policy "staff update orders"
  on public.orders for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff delete orders" on public.orders;
create policy "staff delete orders"
  on public.orders for delete to authenticated
  using (public.is_staff());

-- staff: a signed-in user may see their own row, nothing else.

drop policy if exists "staff see themselves" on public.staff;
create policy "staff see themselves"
  on public.staff for select to authenticated
  using (user_id = auth.uid());

-- ---------- adding the first staff member ----------------------------
-- 1. Authentication > Users > Add user, with an email and password.
-- 2. Copy that user's UID.
-- 3. Run, with the UID and email swapped in:
--
--    insert into public.staff (user_id, email)
--    values ('paste-the-uid-here', 'maggie@example.com');
--
-- 4. Sign in at admin/admin.html with the same email and password.

-- ---------- a few rows to start with ---------------------------------

insert into public.products (name, price, category, description, sizes, sort, active)
values
  ('Amboseli wrap dress', 3200, 'dresses', 'Cotton wrap with a tie waist.', '{S,M,L}', 1, true),
  ('Sunday pleat midi', 3800, 'dresses', 'Lined pleats that hold a press.', '{M,L,XL}', 2, true),
  ('Linen shell top', 1450, 'tops', 'Breathes through a Kimana afternoon.', '{S,M,L,XL}', 3, true),
  ('Kitenge circle skirt', 2400, 'ankara', 'Cut and sewn by our tailor.', '{"One size"}', 4, true),
  ('Oxford shirt', 2200, 'menswear', 'Cotton, holds a collar all day.', '{M,L,XL,XXL,3XL}', 5, true),
  ('Chino trouser', 2800, 'menswear', 'Men''s straight leg, numbered waist.', '{30,32,34,36,38,40}', 6, true),
  ('Everyday tote', 1950, 'bags', 'Fits a laptop and a market run.', '{Small,Medium,Large}', 7, true),
  ('Hardshell travel case', 6500, 'bags', 'Cabin-friendly, four spinner wheels.', '{Suitcase}', 8, true)
on conflict do nothing;
