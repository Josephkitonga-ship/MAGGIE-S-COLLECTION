-- ===========================================================
-- MAGGIE'S COLLECTION — docs/supabase-owner-readonly.sql
-- Run ONCE in the Supabase SQL editor, after the earlier files.
-- Safe to run again.
--
-- Who can do what after this:
--
--                     read own store   read both   add / edit / verify
--   store_admin            yes             no            own store only
--   owner                  yes (both)      yes           NO  (view only)
--
-- Nobody can delete an order through the app: cancel it instead,
-- so the sales record stays complete. Photo uploads are for store
-- admins only.
-- ===========================================================

-- Helpers run with their own access (security definer) so the
-- security rules that call them can never loop on the staff table.

create or replace function public.can_read(target_store text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.staff s
    where s.user_id = auth.uid()
      and (s.role = 'owner' or s.store = target_store)
  );
$$;

create or replace function public.can_write(target_store text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.staff s
    where s.user_id = auth.uid()
      and s.role = 'store_admin'
      and s.store = target_store
  );
$$;

create or replace function public.is_store_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.staff s
    where s.user_id = auth.uid() and s.role = 'store_admin'
  );
$$;

-- ---------- products -------------------------------------------------

drop policy if exists "products readable when active" on public.products;
create policy "products readable when active"
  on public.products for select
  using (active = true or public.can_read(store));

drop policy if exists "staff insert products" on public.products;
create policy "staff insert products"
  on public.products for insert to authenticated
  with check (public.can_write(store));

drop policy if exists "staff update products" on public.products;
create policy "staff update products"
  on public.products for update to authenticated
  using (public.can_write(store)) with check (public.can_write(store));

drop policy if exists "staff delete products" on public.products;
create policy "staff delete products"
  on public.products for delete to authenticated
  using (public.can_write(store));

-- ---------- orders ---------------------------------------------------

drop policy if exists "staff read orders" on public.orders;
create policy "staff read orders"
  on public.orders for select to authenticated
  using (public.can_read(store));

drop policy if exists "staff update orders" on public.orders;
create policy "staff update orders"
  on public.orders for update to authenticated
  using (public.can_write(store)) with check (public.can_write(store));

-- no deleting orders through the app, by anyone
drop policy if exists "staff delete orders" on public.orders;
drop policy if exists "owner delete orders" on public.orders;

-- ---------- product photos ---------------------------------------------

drop policy if exists "staff can upload product images" on storage.objects;
create policy "staff can upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_store_admin());

drop policy if exists "staff can replace product images" on storage.objects;
create policy "staff can replace product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_store_admin())
  with check (bucket_id = 'product-images' and public.is_store_admin());

drop policy if exists "staff can delete product images" on storage.objects;
create policy "staff can delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_store_admin());
