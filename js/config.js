/* ===========================================================
   MAGGIE'S COLLECTION — js/config.js
   The only file you edit when the shop's details change.
   Loaded before faq.js and script.js on every page.
   =========================================================== */

const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";

/* ---- WhatsApp -------------------------------------------------
   DEAD END until the client hands over her line.
   Put her number here in full international form, digits only:
   country code + number, no "+", no spaces.  Kenya example:
   254712345678
   While this is left as the placeholder below, checkout still
   saves the order to Supabase and the storefront tells the
   shopper the line is not live yet instead of opening a broken
   chat window.
---------------------------------------------------------------- */
const WHATSAPP_NUMBER = "254700000000";
const WHATSAPP_PLACEHOLDER = "254700000000";

const SHOP = {
  name: "Maggie's Collection",
  tagline: "Dressing Kimana with pieces worth keeping",
  owner: "Maggie",
  address: "Kimana Town, along the Emali–Oloitokitok road, Kajiado County",
  landmark: "First floor, above the chemist opposite the matatu stage",
  town: "Kimana Town",
  email: "hello@maggiescollection.co.ke",
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
  freeDeliveryFrom: 5000,
  returnWindowDays: 3,
  categories: [
    { slug: "dresses", name: "Dresses", blurb: "Church, office and occasion" },
    { slug: "tops", name: "Tops & blouses", blurb: "Everyday layers" },
    { slug: "bottoms", name: "Skirts & trousers", blurb: "Cuts that hold their shape" },
    { slug: "ankara", name: "Ankara & prints", blurb: "Tailored in Kimana" },
    { slug: "bags", name: "Bags", blurb: "Carry-everything to going-out" },
    { slug: "shoes", name: "Shoes", blurb: "Flats, heels, sandals" },
    { slug: "accessories", name: "Accessories", blurb: "Jewellery, scarves, belts" }
  ],
  sizes: ["XS", "S", "M", "L", "XL", "XXL", "One size"],
  cartKey: "maggies_cart",
  orderPrefix: "MC"
};

/* Used by script.js and admin.js. Kept on window so plain
   <script> tags (no modules) can reach them from any page. */
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.WHATSAPP_NUMBER = WHATSAPP_NUMBER;
window.WHATSAPP_PLACEHOLDER = WHATSAPP_PLACEHOLDER;
window.SHOP = SHOP;
