/* ===========================================================
   MAGGIE'S COLLECTION — js/config.js
   The only file you edit when the shop's details change.
   Loaded before faq.js and script.js on every page.
   =========================================================== */

const SUPABASE_URL = "https://einuzgxchmxwxisrrkyn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbnV6Z3hjaG14d3hpc3Jya3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTE1NDAsImV4cCI6MjEwNTQ4NzU0MH0.MvG8G4sXd8809J2rGA-d1RZghewEDC7pFdNlo_Rj3Rg";

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
     from whichever set actually matches how it's cut and sold:
       - clothing:     dresses, tops, skirts, ankara, most menswear
       - mensTrousers: numeric waist, for men's trousers specifically
       - bags:         Small / Medium / Large, plus Suitcase for luggage
     Nothing here is split by gender — a piece carries the sizes it
     actually comes in and the shopper picks. */
  sizeSets: {
    clothing: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "One size"],
    mensTrousers: ["28", "30", "32", "34", "36", "38", "40", "42", "44", "46"],
    bags: ["Small", "Medium", "Large", "Suitcase"]
  },
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
