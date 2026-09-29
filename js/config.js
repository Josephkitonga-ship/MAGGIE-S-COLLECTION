/* ===========================================================
   MAGGIE'S COLLECTION — js/config.js
   The only file you edit when the shop's details change.
   Loaded before orders.js, faq.js and script.js on every page.
   =========================================================== */

const SUPABASE_URL = "https://einuzgxchmxwxisrrkyn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbnV6Z3hjaG14d3hpc3Jya3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTE1NDAsImV4cCI6MjEwNTQ4NzU0MH0.MvG8G4sXd8809J2rGA-d1RZghewEDC7pFdNlo_Rj3Rg";

/* ---- WhatsApp -------------------------------------------------
   One line for BOTH boutiques. Orders are told apart by the store
   heading inside the message, and by store in the database.
   Full international form, digits only, no "+", no spaces.
---------------------------------------------------------------- */
const WHATSAPP_NUMBER = "254708155891";
const WHATSAPP_PLACEHOLDER = "254700000000";

const SHOP = {
  name: "Maggie's Collection",
  tagline: "Dressing all of Kimana — every size, every body",
  owner: "The Fashion Team",
  address: "Kimana Town, Kajiado South",
  landmark: "Alongside Zawadi Hotel",
  town: "Kimana Town",
  email: "hello@maggiescollection.co.ke",

  /* ---- the two boutiques ----------------------------------------
     slug    stored on every product and order; never rename it later
     name    full name, shown in headings and WhatsApp
     short   shown on the small badge on each product card
     prefix  order codes: MC-260929-4412, DB-260929-1187
     admin   this boutique's staff desk                              */
  stores: [
    { slug: "maggies", name: "Maggie's Collection", short: "Maggie's", prefix: "MC", admin: "admin/maggie.html" },
    { slug: "davids",  name: "David's Boutique",    short: "David's",  prefix: "DB", admin: "admin/david.html" }
  ],

  /* ---- social buttons --------------------------------------------
     Paste the full page addresses when the accounts exist.
     Empty = the button shows as "coming soon" and does nothing.
     WhatsApp is built from WHATSAPP_NUMBER above.                   */
  social: {
    facebook: "",   // e.g. "https://www.facebook.com/yourpage"
    instagram: ""   // e.g. "https://www.instagram.com/yourhandle"
  },

  hours: [
    { days: "Monday to Friday", open: "8:30 am", close: "7:00 pm" },
    { days: "Saturday", open: "8:30 am", close: "8:00 pm" },
    { days: "Sunday", open: "11:00 am", close: "5:00 pm" }
  ],
  currency: "KSh",
  mpesa: {
    type: "Till",
    number: "Ask on WhatsApp before sending",
    name: "Maggie's Collection"
  },
  delivery: [
    { zone: "Kimana Town centre", fee: 0, eta: "Same day, hand delivered" },
    { zone: "Isinet, Kilimanjaro Farm, Namelok", fee: 150, eta: "Same day if ordered before 3:00 pm" },
    { zone: "Oloitokitok, Illasit, Entarara", fee: 250, eta: "Next day by boda" },
    { zone: "Emali, Loitokitok road towns", fee: 350, eta: "1–2 days by matatu parcel" },
    { zone: "Nairobi and the rest of Kenya", fee: 400, eta: "2–3 days by courier" }
  ],
  returnWindowDays: 3,
  categories: [
    { slug: "dresses", name: "Dresses", blurb: "Church, office and occasion" },
    { slug: "tops", name: "Tops & shirts", blurb: "Everyday layers for anyone" },
    { slug: "bottoms", name: "Trousers & skirts", blurb: "Cuts that hold their shape" },
    { slug: "menswear", name: "Menswear", blurb: "Shirts, trousers, jackets" },
    { slug: "ankara", name: "Ankara & prints", blurb: "Tailored in Kimana, any body" },
    { slug: "bags", name: "Bags", blurb: "Carry-everything to going-out" },
    { slug: "shoes", name: "Shoes", blurb: "Flats, heels, sandals, boots" },
    { slug: "accessories", name: "Accessories", blurb: "Jewellery, scarves, belts, caps" }
  ],
  /* Sizing is not one-size-fits-all-categories. Each product picks
     from whichever set actually matches how it's cut and sold. */
  sizeSets: {
    clothing: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "One size"],
    mensTrousers: ["28", "30", "32", "34", "36", "38", "40", "42", "44", "46"],
    bags: ["Small", "Medium", "Large", "Suitcase"]
  },
  cartKey: "maggies_cart",
  /* Only read by the concierge ("your order number starts with ..").
     Real codes use each store's own prefix above. */
  orderPrefix: "MC or DB"
};

/* Used by script.js and admin.js. Kept on window so plain
   <script> tags (no modules) can reach them from any page. */
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.WHATSAPP_NUMBER = WHATSAPP_NUMBER;
window.WHATSAPP_PLACEHOLDER = WHATSAPP_PLACEHOLDER;
window.SHOP = SHOP;
