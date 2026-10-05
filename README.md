# Maggie's Collection + David's Boutique

One storefront, two boutiques, one shared catalogue, one WhatsApp line.
Each boutique has its own staff desk; the owner sees both.
Built by Flynn Technologies.

## What changed in this update

| Area | Before | Now |
|---|---|---|
| Catalogue | one shop | shared rail; every card has a **Maggie's / David's badge**, filter by boutique, **On offer** filter |
| Prices | one price | selling price + optional **marked price**: struck through, `-20%` badge, "Save KSh N" |
| Cart | one list | grouped by boutique; delivery charged once |
| WhatsApp | one message | one boutique = one simple table; both = one message with a labelled table per boutique |
| Orders | one table | saved per boutique (`MC-…` / `DB-…`), so each desk sees only its own |
| Verification | none | manual **Verify order** button; sales count once verified |
| Social | none | WhatsApp, Facebook, Instagram buttons (header + footer) |

## Copy and product page update

- Wording is now family-first (men, women, kids and teens) and enquiry-based: **Saved Items**, **Your Selected Pieces**,
  **Estimated Total**, **Send Selection via WhatsApp**. No cart / checkout / buy language is shown to customers.
  Internal IDs (`cartDrawer`, `.js-cart-open`, `?s=`, `?c=`) are unchanged.
- **Product page:** every card opens `product.html?id=...` with a photo gallery, AVAILABLE / NEW / BEST DEAL badges,
  struck-through price with `-10% OFF`, description, specifications, size buttons,
  **Chat to Reserve on WhatsApp** and **Save to Rail List**.
- **NEW** shows for 14 days after a product is added; **BEST DEAL** at 20% off or more. Staff can override per product.
- New **Kids & teens** category and an age-based kids size table.
- Staff product form: material, dimensions, care, badge choice and extra gallery photos.
- Run `docs/supabase-product-details.sql` once before using the new staff fields.

## Departments and types

Products are filed in two levels, set by staff in the desk:
**Department** (Women, Men, Kids & teens, Shoes, Bags, Accessories) and **Type** inside it
(Dresses, Tops & shirts, Trousers & jeans, Skirts, Jackets & coats, Sweatshirts & hoodies,
Suits & formalwear, Activewear, Sleepwear & underwear, African wear; Sandals, Heels, Flats,
Sneakers, Formal shoes; Handbags, Backpacks, Travel; Jewellery, Belts, Scarves, Caps, Watches, Sunglasses).
The catalogue's top row is the departments plus **New arrivals** (added in the last 14 days) and **On offer**.
Old links keep working: `?c=menswear` opens Men, `?c=kids` opens Kids, `?c=ankara` opens Women > African wear.
The lists live in `SHOP.departments` in `js/config.js`; the admin repository has its own copy, so change both.
Run `docs/supabase-departments.sql` once; it moves existing products into departments.

## Staff desks live in their own repository

The sign in and the three dashboards (Maggie, David, owner) are in **MAGGIES-ADMIN**, not here.
This site no longer has an `admin/` folder or a "Staff sign in" link. Both repositories use the same
Supabase project. If you rename a boutique or change the categories in `js/config.js`, change them in the
admin repository's `js/config.js` too.

## Who can do what

| | read | add / edit products, verify orders |
|---|---|---|
| Store admin (Maggie / David) | own store | own store |
| Owner | both stores | **no, view only** |

Each sign in opens its own desk only. Run `docs/supabase-owner-readonly.sql` once so the database enforces this too.
Orders cannot be deleted through the app; cancel them instead.

## Files

```
index.html catalogue.html delivery.html size-guide.html 404.html   generated
css/styles.css          unchanged
css/stores.css          NEW  store colours, badges, sale prices, filters, social
js/config.js            stores, social links, WhatsApp number
js/orders.js            NEW  discount, grouping, WhatsApp message (unit-tested)
js/script.js            storefront logic
docs/supabase-rls.sql          original schema (already run)
docs/supabase-two-stores.sql   run once after the original
docs/supabase-product-details.sql   NEW  product page fields; run once after that
product.html            NEW  generated product page
tests/orders.test.js    NEW    node tests/orders.test.js
build_pages.py          regenerates every HTML page
```
All files are included in this package except your photos: keep your own `images/hero.jpg`.

## Setup (in this order)

1. **Database.** Supabase SQL editor: paste `docs/supabase-two-stores.sql`, run.
   Existing products and orders become Maggie's. Your existing staff login becomes the **owner**.
2. **Staff logins.** Authentication > Users > Add user for Maggie and for David,
   then run the two inserts at the bottom of the SQL file (one `store_admin` per boutique).
3. **Upload the files** over the old ones. Keep your existing `images/hero.jpg`.
   Optional photos for the home page boutique cards: `images/maggies.jpg`, `images/davids.jpg`
   (cards fall back to a solid colour if missing).
4. **Social links.** `js/config.js` > `SHOP.social`. Empty = button shows "coming soon".
5. Rebuild pages only if you edit `build_pages.py`: `python3 build_pages.py`.

## How the security works

- A store admin can only read/write rows where `store` = their store. Enforced by the database, not the page.
- Customers no longer insert orders directly. `place_checkout()` reads every price from the products table,
  so nobody can post a fake price. It writes one order per boutique.
- Only the owner can delete orders.

## Numbers on the dashboards

- **Sale** = verified, not cancelled. **Sales value** = item subtotal (delivery fees excluded).
- **Discount given** = (marked price - selling price) x qty, stamped on the order when placed.
- Dashboards load the latest 1000 orders. Past that, add a server-side summary.

## Tests

```
node tests/orders.test.js     27 checks: discounts, grouping, codes, WhatsApp text
node tests/faq.test.js        concierge (unchanged)
```
