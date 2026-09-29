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
const code = O.makeCode("DB", new Date("2026-09-29T10:00:00Z"), 0.5);
ok("code shape", /^DB-[0-9]{6}-[0-9]{4}$/.test(code) && code.indexOf("DB-260929-") === 0);
ok("random codes match the database regex", /^MC-[0-9]{6}-[0-9]{4}$/.test(O.makeCode("MC")));

/* --- message: one boutique ---------------------------------------------- */
const details = { name: "Wanjiru", phone: "0712345678", location: "Zawadi Hotel stage", notes: "", zone: "Kimana Town centre", fee: 0 };
const one = [{ store: stores[0], code: "MC-260929-4412", lines: groups[0].lines.slice(0, 1), subtotal: 6400 }];
const m1 = O.buildMessage(one, Object.assign({ total: 6400 }, details), fmt);
ok("single: store in heading", m1.indexOf("Order MC-260929-4412 · Maggie's Collection") === 0);
ok("single: no second-boutique section", m1.indexOf("NEW ORDER") === -1 && m1.indexOf("David") === -1);
ok("single: free delivery worded", m1.indexOf("Delivery (Kimana Town centre): free") !== -1);
ok("single: customer details", m1.indexOf("Name: Wanjiru") !== -1 && m1.indexOf("Deliver to: Zawadi Hotel stage") !== -1);

/* --- message: both boutiques ------------------------------------------------ */
const two = [
  { store: stores[0], code: "MC-260929-4412", lines: groups[0].lines, subtotal: groups[0].subtotal },
  { store: stores[1], code: "DB-260929-1187", lines: groups[1].lines, subtotal: groups[1].subtotal }
];
const m2 = O.buildMessage(two, Object.assign({}, details, { zone: "Oloitokitok, Illasit, Entarara", fee: 250, total: 6400 + 1000 + 2500 + 250 }), fmt);
ok("mixed: header names both refs", m2.indexOf("Refs: MC-260929-4412 + DB-260929-1187") !== -1);
ok("mixed: a labelled section per boutique", m2.indexOf("*MAGGIE'S COLLECTION*") !== -1 && m2.indexOf("*DAVID'S BOUTIQUE*") !== -1);
ok("mixed: David's item sits under David's heading", m2.indexOf("*DAVID'S BOUTIQUE*") < m2.indexOf("Camo sweatshirt"));
ok("mixed: Maggie's item sits above David's heading", m2.indexOf("Wrap dress") < m2.indexOf("*DAVID'S BOUTIQUE*"));
ok("mixed: delivery charged once", m2.split("Delivery (").length === 2);
ok("mixed: grand total", m2.indexOf("*TOTAL: " + fmt(10150) + "*") !== -1);

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
