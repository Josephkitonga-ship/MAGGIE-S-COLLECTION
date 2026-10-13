-- ===========================================================
-- MAGGIE'S COLLECTION — docs/supabase-single-store-cleanup.sql
-- PHASE 4. Run only AFTER the new admin AND the Maggie's-only
-- storefront have both been live and working for a few days.
--
-- 1. Renames the old roles:  store_admin -> counter,  owner -> manager
-- 2. Removes the old per-store permission helpers and the old
--    assign_staff() that picked a store.
--
-- It deliberately KEEPS the stores table and the store columns on
-- products and orders. They are harmless with one store, they keep
-- the history of old David's orders, and place_checkout() still
-- reads them. Dropping them would mean rewriting place_checkout()
-- for no visible gain.
-- ===========================================================

update public.staff set role = 'counter', store = null where role = 'store_admin';
update public.staff set role = 'manager', store = null where role = 'owner';

alter table public.staff drop constraint if exists staff_role_check;
alter table public.staff add  constraint staff_role_check check (role in ('counter', 'manager'));

-- helpers now unused by any policy
drop function if exists public.can_read(text);
drop function if exists public.can_write(text);
drop function if exists public.can_manage(text);
drop function if exists public.is_store_admin();
drop function if exists public.assign_staff(uuid, text);

-- can_work() and is_manager() only need the new names now
create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.staff s where s.user_id = auth.uid() and s.role = 'manager'); $$;

create or replace function public.can_work()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.staff s where s.user_id = auth.uid() and s.role in ('counter', 'manager')); $$;

-- check: should list only counter / manager
select role, count(*) from public.staff group by role;
