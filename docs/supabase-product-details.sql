-- ===========================================================
-- MAGGIE'S COLLECTION — docs/supabase-product-details.sql
-- Run ONCE in the Supabase SQL editor, after the two earlier files.
-- Safe to run again.
--
-- Adds what the product page needs:
--   gallery     extra photos
--   material    e.g. "Cotton blend"
--   dimensions  e.g. "Length 68 cm"
--   care        e.g. "Cold hand wash, dry in shade"
--   highlight   badge choice: null = automatic, 'new', 'best_deal', 'none'
-- Also lets the old boutique_id column stay empty, which was
-- stopping new products from saving.
-- ===========================================================

alter table public.products add column if not exists gallery    text[] not null default '{}';
alter table public.products add column if not exists material   text;
alter table public.products add column if not exists dimensions text;
alter table public.products add column if not exists care       text;
alter table public.products add column if not exists highlight  text;

alter table public.products drop constraint if exists products_highlight_check;
alter table public.products add  constraint products_highlight_check
  check (highlight is null or highlight in ('new', 'best_deal', 'none'));

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'boutique_id'
  ) then
    alter table public.products alter column boutique_id drop not null;
  end if;
end
$$;
