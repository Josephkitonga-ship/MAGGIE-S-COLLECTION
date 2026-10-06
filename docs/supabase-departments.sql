-- ===========================================================
-- MAGGIE'S COLLECTION — docs/supabase-departments.sql
-- Run ONCE in the Supabase SQL editor, after the earlier files.
-- Safe to run again.
--
-- Products are now filed in two levels:
--   department  women | men | kids | unisex | shoes | bags | accessories | home
--   category    the type: dresses, tops, trousers, sandals, handbags ...
--
-- Products you already have are moved over like this (staff can
-- correct any of them afterwards in the desk):
--   dresses     -> women / dresses
--   tops        -> women / tops
--   bottoms     -> women / trousers
--   menswear    -> men   / tops
--   kids        -> kids  / tops
--   ankara      -> women / african
--   bags        -> bags  / handbags
--   shoes       -> shoes / sandals
--   accessories -> accessories / jewellery
-- ===========================================================

alter table public.products add column if not exists department text;

update public.products
set
  department = case category
    when 'dresses'     then 'women'
    when 'tops'        then 'women'
    when 'bottoms'     then 'women'
    when 'menswear'    then 'men'
    when 'kids'        then 'kids'
    when 'ankara'      then 'women'
    when 'bags'        then 'bags'
    when 'shoes'       then 'shoes'
    when 'accessories' then 'accessories'
    else 'women'
  end,
  category = case category
    when 'bottoms'     then 'trousers'
    when 'menswear'    then 'tops'
    when 'kids'        then 'tops'
    when 'ankara'      then 'african'
    when 'bags'        then 'handbags'
    when 'shoes'       then 'sandals'
    when 'accessories' then 'jewellery'
    else category
  end
where department is null;

alter table public.products alter column department set default 'women';
alter table public.products alter column department set not null;

alter table public.products drop constraint if exists products_department_check;
alter table public.products add constraint products_department_check
  check (department in ('women', 'men', 'kids', 'unisex', 'shoes', 'bags', 'accessories', 'home'));

create index if not exists products_department_idx on public.products (department);
