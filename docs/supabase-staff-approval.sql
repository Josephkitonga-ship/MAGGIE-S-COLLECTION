-- ===========================================================
-- MAGGIE'S COLLECTION — docs/supabase-staff-approval.sql
-- Run ONCE in the Supabase SQL editor. Safe to run again.
--
-- Staff access, owner approved:
--   1. Someone asks for access on the admin site (request.html).
--      That makes a login but gives them NO access: they are not on
--      the staff list, so the database lets them read and change nothing.
--   2. The owner opens the Staff tab, sees who is waiting, and approves
--      them for Maggie's Collection or David's Boutique.
--   3. The owner can also move someone to the other store, remove their
--      access, or send them a password reset link.
--
-- Rules enforced here, in the database:
--   - only an owner account can list, approve, move or remove staff
--   - only a person whose email is confirmed can be approved
--   - the owner cannot change or remove their own access
--   - owner accounts are not changed by this tool (SQL only)
--   - this tool only ever creates store admins
-- ===========================================================

-- Runs with its own access, so it can never loop on the staff table.
create or replace function public.is_owner()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.staff s where s.user_id = auth.uid() and s.role = 'owner'
  );
$$;

-- Everyone who has a login, with their desk if they have one.
-- People still waiting for approval come first.
create or replace function public.list_staff_accounts()
returns table (
  account_id    uuid,
  account_email text,
  created_at    timestamptz,
  confirmed_at  timestamptz,
  last_sign_in  timestamptz,
  staff_role    text,
  staff_store   text
)
language plpgsql security definer set search_path = public, auth
as $$
begin
  if not public.is_owner() then
    raise exception 'Only the owner can do this';
  end if;
  return query
    select u.id, u.email::text, u.created_at, u.email_confirmed_at, u.last_sign_in_at, s.role, s.store
    from auth.users u
    left join public.staff s on s.user_id = u.id
    order by (s.user_id is null) desc, u.created_at desc;
end;
$$;

-- Approve someone for a store, or move them to another store.
create or replace function public.assign_staff(p_user uuid, p_store text)
returns void
language plpgsql security definer set search_path = public, auth
as $$
declare
  v_email     text;
  v_confirmed timestamptz;
  v_role      text;
begin
  if not public.is_owner() then raise exception 'Only the owner can do this'; end if;
  if p_user = auth.uid() then raise exception 'You cannot change your own access'; end if;
  if not exists (select 1 from public.stores where slug = p_store) then raise exception 'Unknown store'; end if;

  select email, email_confirmed_at into v_email, v_confirmed from auth.users where id = p_user;
  if v_email is null then raise exception 'No such account'; end if;
  if v_confirmed is null then raise exception 'This person has not confirmed their email yet'; end if;

  select role into v_role from public.staff where user_id = p_user;
  if v_role = 'owner' then raise exception 'Owner accounts are changed in SQL only'; end if;

  insert into public.staff (user_id, email, role, store)
  values (p_user, v_email, 'store_admin', p_store)
  on conflict (user_id) do update
    set role = 'store_admin', store = excluded.store, email = excluded.email;
end;
$$;

-- Take a person's desk access away. Their login stays, but opens nothing.
create or replace function public.remove_staff(p_user uuid)
returns void
language plpgsql security definer set search_path = public, auth
as $$
declare
  v_role text;
begin
  if not public.is_owner() then raise exception 'Only the owner can do this'; end if;
  if p_user = auth.uid() then raise exception 'You cannot remove your own access'; end if;

  select role into v_role from public.staff where user_id = p_user;
  if v_role = 'owner' then raise exception 'Owner accounts are changed in SQL only'; end if;

  delete from public.staff where user_id = p_user;
end;
$$;

-- Signed-in users only (each function also checks for the owner itself).
revoke all on function public.list_staff_accounts() from public, anon;
revoke all on function public.assign_staff(uuid, text) from public, anon;
revoke all on function public.remove_staff(uuid) from public, anon;
grant execute on function public.list_staff_accounts() to authenticated;
grant execute on function public.assign_staff(uuid, text) to authenticated;
grant execute on function public.remove_staff(uuid) to authenticated;
