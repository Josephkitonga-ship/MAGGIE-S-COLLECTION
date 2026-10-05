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

/* One list of clothing types, used by Women, Men and Kids & teens. */
const CLOTHING_TYPES = [
  { slug: "dresses", name: "Dresses" },
  { slug: "tops", name: "Tops & shirts" },
  { slug: "trousers", name: "Trousers & jeans" },
  { slug: "skirts", name: "Skirts" },
  { slug: "jackets", name: "Jackets & coats" },
  { slug: "sweatshirts", name: "Sweatshirts & hoodies" },
  { slug: "suits", name: "Suits & formalwear" },
  { slug: "activewear", name: "Activewear" },
  { slug: "sleepwear", name: "Sleepwear & underwear" },
  { slug: "african", name: "African wear" }
];

const SHOP = {
  name: "Maggie's Collection",
  tagline: "Quality fashion for the whole family in Kimana",
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
                                                                     */
  stores: [
    { slug: "maggies", name: "Maggie's Collection", short: "Maggie's", prefix: "MC" },
    { slug: "davids",  name: "David's Boutique",    short: "David's",  prefix: "DB" }
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
  /* ---- how products are grouped ---------------------------------
     department: who or what it is for (stored on each product)
     types:      what the piece is, inside that department
     Never rename a slug once products use it. Add new types freely.   */
  departments: [
    { slug: "women", name: "Women", types: CLOTHING_TYPES },
    { slug: "men", name: "Men", types: CLOTHING_TYPES },
    { slug: "kids", name: "Kids & teens", types: CLOTHING_TYPES },
    { slug: "shoes", name: "Shoes", types: [
      { slug: "sandals", name: "Sandals" }, { slug: "heels", name: "Heels" },
      { slug: "flats", name: "Flats" }, { slug: "sneakers", name: "Sneakers" },
      { slug: "formal-shoes", name: "Formal shoes" }
    ] },
    { slug: "bags", name: "Bags", types: [
      { slug: "handbags", name: "Handbags" }, { slug: "backpacks", name: "Backpacks" },
      { slug: "travel", name: "Travel & suitcases" }
    ] },
    { slug: "accessories", name: "Accessories", types: [
      { slug: "jewellery", name: "Jewellery" }, { slug: "belts", name: "Belts" },
      { slug: "scarves", name: "Scarves" }, { slug: "caps", name: "Caps & hats" },
      { slug: "watches", name: "Watches" }, { slug: "sunglasses", name: "Sunglasses" }
    ] }
  ],
  /* Sizing is not one-size-fits-all-categories. Each product picks
     from whichever set actually matches how it's cut and sold. */
  sizeSets: {
    clothing: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "One size"],
    mensTrousers: ["28", "30", "32", "34", "36", "38", "40", "42", "44", "46"],
    bags: ["Small", "Medium", "Large", "Suitcase"],
    kids: ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y", "14-15Y"]
  },
  cartKey: "maggies_cart",
  /* Only read by the concierge ("your order number starts with ..").
     Real codes use each store's own prefix above. */
  orderPrefix: "MC or DB"
};

/* Used by script.js. Kept on window so plain
   <script> tags (no modules) can reach them from any page. */
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.WHATSAPP_NUMBER = WHATSAPP_NUMBER;
window.WHATSAPP_PLACEHOLDER = WHATSAPP_PLACEHOLDER;
window.SHOP = SHOP;
