/* Run from the project root:   node tests/orders.test.js */

const O = require("../js/orders.js");

let passed = 0;
const failures = [];
function ok(label, condition) {
  if (condition) passed += 1; else failures.push(label);
}

const stores = [
  { slug: "maggies", name: "Maggie's Collection", prefix: "MC" }
];
const fmt = (n) => "KSh " + Number(n).toLocaleString("en-KE");

/* --- discounts -------------------------------------------------- */
ok("20% off", O.discountPct(800, 1000) === 20);
ok("rounds", O.discountPct(2, 3) === 33);
ok("no compare price", O.discountPct(800, 0) === 0);
ok("compare below price is ignored", O.discountPct(800, 500) === 0);
ok("compare equal is ignored", O.discountPct(800, 800) === 0);
ok("saving", O.saving(800, 1000) === 200 && O.saving(800, null) === 0);

/* --- grouping: one store ------------------------------------------------ */
const cart = [
  { store: "maggies", name: "Camo sweatshirt", price: 2500, qty: 1, size: "L" },
  { store: "maggies", name: "Wrap dress", price: 3200, qty: 2, size: "M" },
  { name: "Old cart line with no store", price: 1000, qty: 1, size: "" },
  { store: "retired-store", name: "Line from a store that no longer exists", price: 500, qty: 1, size: "" }
];
const groups = O.groupByStore(cart, stores);
ok("everything lands in one group", groups.length === 1 && groups[0].store.slug === "maggies");
ok("no line is dropped (missing or retired store joins the store)", groups[0].lines.length === 4);
ok("subtotal", groups[0].subtotal === 2500 + 3200 * 2 + 1000 + 500);
ok("single line still makes one group", O.groupByStore([cart[1]], stores).length === 1);
ok("empty cart makes no groups", O.groupByStore([], stores).length === 0);

/* --- codes ----------------------------------------------------------- */
const code = O.makeCode("MC", new Date(2026, 8, 29, 10, 0, 0), 0.5);
ok("code shape", /^MC-[0-9]{6}-[0-9]{4}$/.test(code) && code.indexOf("MC-260929-") === 0);
ok("random codes match the database regex", /^MC-[0-9]{6}-[0-9]{4}$/.test(O.makeCode("MC")));

/* --- message ---------------------------------------------------------------- */
const details = { name: "Wanjiru", phone: "0712345678", location: "Zawadi Hotel stage", notes: "", zone: "Kimana Town centre", fee: 0 };
const one = [{ store: stores[0], code: "MC-260929-4412", lines: groups[0].lines.slice(0, 2), subtotal: 6400 }];
const m1 = O.buildMessage(one, Object.assign({ total: 6400 }, details), fmt);
ok("opens as an enquiry", m1.indexOf("Hello! I would like to check availability and reserve these items from my saved list:") === 0);
ok("ref + store at the end for the shop", m1.indexOf("Ref: MC-260929-4412 \u00b7 Maggie's Collection") !== -1);
ok("no section headings", m1.indexOf("*") === -1);
ok("never mentions another store", !/david|DB-/i.test(m1));
ok("estimated total, not 'total to pay'", m1.indexOf("Estimated total: KSh 6,400") !== -1 && m1.indexOf("to pay") === -1);
ok("free delivery worded", m1.indexOf("Delivery (Kimana Town centre): free") !== -1);
ok("customer details", m1.indexOf("Name: Wanjiru") !== -1 && m1.indexOf("Deliver / collect: Zawadi Hotel stage") !== -1);

/* --- one item from its own page ------------------------------------------------ */
const item = O.buildItemMessage({ name: "Pull neck", price: 2650 }, "L", fmt, "https://x.test/product.html?id=1");
ok("item: enquiry opening", item.indexOf("Hello! I would like to check availability and reserve this item:") === 0);
ok("item: name, size, price", item.indexOf("• Pull neck (L) — KSh 2,650") !== -1);
ok("item: carries the page link", item.indexOf("https://x.test/product.html?id=1") !== -1);

/* --- badges ---------------------------------------------------------------------- */
const now = new Date("2026-10-10T00:00:00Z");
ok("fresh item is NEW", O.highlights({ price: 100, created_at: "2026-10-05T00:00:00Z" }, now).join() === "NEW");
ok("old item has no badge", O.highlights({ price: 100, created_at: "2026-08-01T00:00:00Z" }, now).length === 0);
ok("20% off is BEST DEAL", O.highlights({ price: 800, compare_price: 1000, created_at: "2026-01-01T00:00:00Z" }, now).join() === "BEST DEAL");
ok("10% off is not", O.highlights({ price: 2650, compare_price: 2950, created_at: "2026-01-01T00:00:00Z" }, now).length === 0);
ok("staff choice wins: best_deal", O.highlights({ price: 100, highlight: "best_deal", created_at: "2020-01-01T00:00:00Z" }, now).join() === "BEST DEAL");
ok("staff choice wins: none hides NEW", O.highlights({ price: 100, highlight: "none", created_at: "2026-10-09T00:00:00Z" }, now).length === 0);

/* --- departments ------------------------------------------------------------ */
const depts = [
  { slug: "women", types: [{ slug: "dresses" }, { slug: "tops" }] },
  { slug: "men", types: [{ slug: "tops" }] },
  { slug: "kids", types: [{ slug: "tops" }] }
];
const pp = (p) => JSON.stringify(O.placeProduct(p, depts));
ok("product with a department keeps it", pp({ department: "men", category: "tops" }) === '{"department":"men","type":"tops"}');
ok("old menswear row becomes men / tops", pp({ category: "menswear" }) === '{"department":"men","type":"tops"}');
ok("old ankara row becomes women / african", pp({ category: "ankara" }) === '{"department":"women","type":"african"}');
ok("old bottoms row becomes women / trousers", pp({ category: "bottoms" }) === '{"department":"women","type":"trousers"}');
ok("old kids row becomes kids / tops", pp({ category: "kids" }) === '{"department":"kids","type":"tops"}');
ok("unknown department falls back to the first", pp({ department: "nope", category: "mystery" }) === '{"department":"women","type":"mystery"}');
const fnow = new Date("2026-10-10T00:00:00Z");
ok("added 3 days ago is fresh", O.isFresh({ created_at: "2026-10-07T00:00:00Z" }, fnow));
ok("added 30 days ago is not fresh", !O.isFresh({ created_at: "2026-09-10T00:00:00Z" }, fnow));
ok("no date is not fresh", !O.isFresh({}, fnow));

/* --- phones ---------------------------------------------------------------------- */
ok("07 form", O.waPhone("0712 345 678") === "254712345678");
ok("+254 form", O.waPhone("+254 712 345 678") === "254712345678");
ok("bare 9 digits", O.waPhone("712345678") === "254712345678");
ok("01 form", O.waPhone("0112345678") === "254112345678");

console.log("passed: " + passed);
if (failures.length) {
  console.log("failed: " + failures.length);
  failures.forEach((f) => console.log("  - " + f));
  process.exit(1);
}
console.log("all order rules behave.");
