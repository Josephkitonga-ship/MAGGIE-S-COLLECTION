-- ===========================================================
-- MAGGIE'S COLLECTION — docs/supabase-more-departments.sql
-- Run ONCE in the Supabase SQL editor, after supabase-departments.sql.
-- Safe to run again.
--
-- Adds two departments, Unisex and Home & Living, to the list the
-- database accepts. Without this, saving a product in either one
-- is refused. New types (boots, shorts, and so on) need no SQL.
-- ===========================================================

alter table public.products drop constraint if exists products_department_check;
alter table public.products add constraint products_department_check
  check (department in ('women', 'men', 'kids', 'unisex', 'shoes', 'bags', 'accessories', 'home'));
