/* Run from the project root:   node tests/orders.test.js */

const O = require("../js/orders.js");

let passed = 0;
const failures = [];
function ok(label, condition) {
  if (condition) passed += 1; else failures.push(label);
}

const stores = [
  { slug: "maggies", name: "Maggie's Collection", prefix: "MC" },
  { slug: "davids", name: "David's Boutique", prefix: "DB" }
];
const fmt = (n) => "KSh " + Number(n).toLocaleString("en-KE");

/* --- discounts -------------------------------------------------- */
ok("20% off", O.discountPct(800, 1000) === 20);
ok("rounds", O.discountPct(2, 3) === 33);
ok("no compare price", O.discountPct(800, 0) === 0);
ok("compare below price is ignored", O.discountPct(800, 500) === 0);
ok("compare equal is ignored", O.discountPct(800, 800) === 0);
ok("saving", O.saving(800, 1000) === 200 && O.saving(800, null) === 0);

/* --- grouping ---------------------------------------------------- */
const cart = [
  { store: "davids", name: "Camo sweatshirt", price: 2500, qty: 1, size: "L" },
  { store: "maggies", name: "Wrap dress", price: 3200, qty: 2, size: "M" },
  { name: "Old cart line with no store", price: 1000, qty: 1, size: "" }
];
const groups = O.groupByStore(cart, stores);
ok("two groups", groups.length === 2);
ok("store order follows config, not cart order", groups[0].store.slug === "maggies");
ok("legacy line joins first boutique", groups[0].lines.length === 2);
ok("subtotal", groups[0].subtotal === 3200 * 2 + 1000 && groups[1].subtotal === 2500);
ok("single-store cart makes one group", O.groupByStore([cart[1]], stores).length === 1);

/* --- codes ----------------------------------------------------------- */
const code = O.makeCode("DB", new Date(2026, 8, 29, 10, 0, 0), 0.5);
ok("code shape", /^DB-[0-9]{6}-[0-9]{4}$/.test(code) && code.indexOf("DB-260929-") === 0);
ok("random codes match the database regex", /^MC-[0-9]{6}-[0-9]{4}$/.test(O.makeCode("MC")));

/* --- message: one group ------------------------------------------------- */
const details = { name: "Wanjiru", phone: "0712345678", location: "Zawadi Hotel stage", notes: "", zone: "Kimana Town centre", fee: 0 };
const one = [{ store: stores[0], code: "MC-260929-4412", lines: groups[0].lines.slice(0, 1), subtotal: 6400 }];
const m1 = O.buildMessage(one, Object.assign({ total: 6400 }, details), fmt);
ok("single: opens as an enquiry", m1.indexOf("Hello! I would like to check availability and reserve these items from my saved list:") === 0);
ok("single: ref + store at the end for the shop", m1.indexOf("Ref: MC-260929-4412 · Maggie's Collection") !== -1);
ok("single: no second section", m1.indexOf("David") === -1 && m1.indexOf("*") === -1);
ok("single: estimated total, not 'total to pay'", m1.indexOf("Estimated total: KSh 6,400") !== -1 && m1.indexOf("to pay") === -1);
ok("single: free delivery worded", m1.indexOf("Delivery (Kimana Town centre): free") !== -1);
ok("single: customer details", m1.indexOf("Name: Wanjiru") !== -1 && m1.indexOf("Deliver / collect: Zawadi Hotel stage") !== -1);

/* --- message: two groups ------------------------------------------------------ */
const two = [
  { store: stores[0], code: "MC-260929-4412", lines: groups[0].lines, subtotal: groups[0].subtotal },
  { store: stores[1], code: "DB-260929-1187", lines: groups[1].lines, subtotal: groups[1].subtotal }
];
const m2 = O.buildMessage(two, Object.assign({}, details, { zone: "Oloitokitok, Illasit, Entarara", fee: 250, total: 6400 + 1000 + 2500 + 250 }), fmt);
ok("mixed: same enquiry opening", m2.indexOf("Hello! I would like to check availability") === 0);
ok("mixed: a labelled section per group", m2.indexOf("*MAGGIE'S COLLECTION*") !== -1 && m2.indexOf("*DAVID'S BOUTIQUE*") !== -1);
ok("mixed: David's item sits under David's heading", m2.indexOf("*DAVID'S BOUTIQUE*") < m2.indexOf("Camo sweatshirt"));
ok("mixed: Maggie's item sits above David's heading", m2.indexOf("Wrap dress") < m2.indexOf("*DAVID'S BOUTIQUE*"));
ok("mixed: each section carries its ref", m2.indexOf("Ref: MC-260929-4412") !== -1 && m2.indexOf("Ref: DB-260929-1187") !== -1);
ok("mixed: delivery shown once", m2.split("Delivery (").length === 2);
ok("mixed: estimated grand total", m2.indexOf("*Estimated total: " + fmt(10150) + "*") !== -1);

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
