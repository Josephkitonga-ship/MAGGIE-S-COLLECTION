-- ===========================================================
-- MAGGIE'S COLLECTION — docs/supabase-merge-stores.sql
-- PHASE 3 step 1. Run this in the Supabase SQL editor RIGHT BEFORE
-- you deploy the Maggie's-only storefront. Safe to run again.
--
-- Moves every product onto the one store, 'maggies', so the new
-- storefront and place_checkout() find them. Old orders are left
-- exactly as they were (DB-... orders stay as history).
--
-- Order of events:
--   1. run docs/supabase-counter-manager.sql          (Phase 1)
--   2. deploy the admin  (/counter and /manager)       (Phase 2)
--   3. run THIS file, then deploy the storefront       (Phase 3)
--   4. later, docs/supabase-single-store-cleanup.sql   (Phase 4)
-- ===========================================================

update public.products set store = 'maggies' where store is distinct from 'maggies';

-- anything added from now on belongs to the one store
alter table public.products alter column store set default 'maggies';

-- check: this should return one row, maggies, and your product count
select store, count(*) as products from public.products group by store;
