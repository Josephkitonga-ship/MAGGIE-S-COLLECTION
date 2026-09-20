# Maggie's Collection

Women's fashion storefront for Kimana Town: hand-picked rail, WhatsApp
checkout, Supabase behind it, staff desk for the shop.

Same filing and same flow as Rotex Emporium. What changed is the name,
the palette and the copy.

Built by Flynn Technologies.

---

## Structure

```
maggies/
├── index.html            ─┐
├── catalogue.html         │  STOREFRONT PAGES  (generated — see "Editing pages")
├── delivery.html          │
├── size-guide.html        │
├── 404.html              ─┘
├── css/
│   └── styles.css        Shared design tokens + all storefront styles
├── js/
│   ├── config.js         Supabase keys, WhatsApp number AND the SHOP block
│   ├── faq.js            Concierge brain: scored FAQ matching
│   └── script.js         Storefront logic: menu, cart, checkout, concierge, catalogue
├── admin/
│   ├── admin.html        Staff dashboard page
│   ├── admin.css         Admin-only styles (extends ../css/styles.css)
│   └── admin.js          Auth, product CRUD, order management
├── tests/
│   └── faq.test.js       Concierge routing tests:  node tests/faq.test.js
├── docs/
│   └── supabase-rls.sql  Database schema + security policies  ← RUN THIS
├── build_pages.py        Generates the 5 storefront pages + admin.html
└── README.md
```

## Palette: Rosewater Atelier

Cream base, pink accent, plum for contrast. Every value is a CSS custom
property at the top of `css/styles.css`. No hex sits outside that block.

| Token | Hex | Job |
|---|---|---|
| `--porcelain` | `#FDF8F3` | page base cream |
| `--shell` | `#F7EAE3` | raised cream surface |
| `--blush` | `#F2CAD3` | soft pink fields and tags |
| `--rose` | `#C96C86` | primary pink accent, buttons |
| `--plum` | `#5E2438` | headings, footer, deep contrast |
| `--ink` | `#3B2A2F` | body text |

Type is Fraunces for display and Karla for body, both from Google Fonts,
with local fallbacks so the page still reads offline.

---

## Setup

### 1. Database

Open the Supabase SQL editor, paste `docs/supabase-rls.sql` whole, run it.
It creates `products`, `orders` and `staff`, switches on row level
security, and seeds four sample products.

### 2. Staff account

In Supabase: Authentication → Users → Add user. Copy the UID, then run:

```sql
insert into public.staff (user_id, email)
values ('paste-the-uid-here', 'maggie@example.com');
```

Sign in at `admin/admin.html` with that email and password.

### 3. Keys

In `js/config.js`, replace:

```js
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
```

Until those are set, the storefront runs on a small built-in sample rail
so the site can be walked through on a phone, and the staff desk says so
instead of failing silently.

### 4. WhatsApp — the one open end

`js/config.js` holds:

```js
const WHATSAPP_NUMBER = "254700000000";
```

That is a dead end on purpose until the client hands over her line. Put
her number in full international form, digits only, no `+` and no spaces:
`254712345678`.

While the placeholder is still in place the site does **not** open a
broken chat window. Orders still save to Supabase, the shopper is told
the line is not live yet, the footer button points at the delivery page
instead, and the concierge sends people to the shop. Change the one line
and every WhatsApp path switches on at once.

### 5. Shop details

Everything else the shop says about itself — address, landmark, hours,
delivery zones and fees, free-delivery threshold, M-Pesa line, return
window, categories, sizes — lives in the `SHOP` block in `js/config.js`.
The delivery page, the checkout fee calculator and the concierge all read
from it, so a fee changed there is changed everywhere at once.

---

## Editing pages

The five storefront pages and `admin/admin.html` are **generated**.
Header, footer, cart drawer and concierge live once in `build_pages.py`.
Edit that file, then:

```
python3 build_pages.py
```

Editing `index.html` directly works until the next rebuild wipes it.

---

## Flow

```
 CUSTOMER                                            STAFF
 ────────                                            ─────
 index.html ──► catalogue.html                       admin/admin.html
                    │                                     │  email + password
                    │ js/script.js                        ▼
                    ▼                               Supabase Auth
        Supabase  products  (active = true)               │
                    │                                     ▼
                    ▼                          ┌── Products tab ──┐
           tracks by category                  │ add/edit/delete/ │──► products table
                    │                          │ show-hide        │
        Add to Cart │ (name+price taken        └──────────────────┘
                    │  from DB, not the page)  ┌── Orders tab ────┐
                    ▼                          │ view + set status│◄── orders table
        cart (localStorage, re-priced          └──────────────────┘
              against live data on load)
                    │
        Checkout form (name, location, phone)
                    │
        ┌───────────┴────────────┐
        ▼                        ▼
 opens WhatsApp tab       inserts row into `orders`
 (immediately, inside     (background — a failure never
  the click)               blocks the WhatsApp message)
```

Cart key in localStorage is `maggies_cart`. Order codes look like
`MC-260920-4412`.

Deep links work: `catalogue.html?c=ankara` opens straight on that rail,
and the sticky chips follow you down the page.

---

## Tests

```
node tests/faq.test.js
```

Thirty-odd assertions over the concierge: that "can a boda bring it
today" reaches delivery, that "can you take in the waist" reaches
tailoring, that nonsense falls back to a human, and that no answer ships
with an unfilled `{{token}}`. Exit code 1 on any failure.

Add a new FAQ entry in `js/faq.js`, add a routing line in the test, run
it again.

---

## Running it locally

From the project root in Termux:

```
python3 -m http.server 8080
```

Then open `http://localhost:8080` in the browser. Opening the files
straight off the filesystem also works, but Supabase auth wants a real
origin, so use the server when testing the staff desk.
