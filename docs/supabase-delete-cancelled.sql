-- ===========================================================
-- MAGGIE'S COLLECTION — docs/supabase-delete-cancelled.sql
-- Run ONCE in the Supabase SQL editor. Safe to run again.
--
-- Lets a store admin delete a CANCELLED order from their own store.
-- Anything not cancelled (a real sale, a pending order) cannot be
-- deleted by anyone through the app. The owner desk stays view only.
-- ===========================================================

drop policy if exists "store admin delete cancelled orders" on public.orders;
create policy "store admin delete cancelled orders"
  on public.orders for delete to authenticated
  using (public.can_write(store) and status = 'cancelled');
