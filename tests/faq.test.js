/* ===========================================================
   MAGGIE'S COLLECTION — tests/faq.test.js
   Run from the project root:   node tests/faq.test.js
   No dependencies, no test runner. Exit code 1 on failure so
   it can sit in a git hook later.
   =========================================================== */

const FAQ = require("../js/faq.js");

let passed = 0;
const failures = [];

function routes(question, expectedId) {
  const hit = FAQ.match(question);
  if (hit.id === expectedId) {
    passed += 1;
  } else {
    failures.push(
      '"' + question + '" routed to ' + hit.id + " (score " + hit.score + "), expected " + expectedId
    );
  }
}

function ok(label, condition) {
  if (condition) {
    passed += 1;
  } else {
    failures.push(label);
  }
}

/* --- routing ------------------------------------------------- */

routes("how much is delivery to oloitokitok", "delivery");
routes("do you deliver to namelok", "delivery");
routes("can a boda bring it today", "delivery");
routes("is there free delivery", "free_delivery");

routes("how do i pay", "payment");
routes("can i pay with mpesa", "payment");

routes("can i exchange it if it doesnt fit", "returns");
routes("i want a refund the zip is broken", "returns");

routes("what size should i take", "sizing");
routes("do you have a size chart", "sizing");
routes("is it true to size", "sizing");

routes("is the green dress still in stock", "stock");
routes("do you have other colours", "stock");

routes("what time do you close on sunday", "hours");
routes("are you open now", "hours");

routes("where is the shop", "location");
routes("can i come and try it on", "location");

routes("where is my order MC-260920-4412", "order_status");

routes("can you hold it for me until tomorrow", "reserve");

routes("i need six matching dresses for a wedding", "bulk");

routes("can you take in the waist", "tailoring");
routes("do you do made to measure ankara", "tailoring");

routes("how do i wash it without it fading", "care");

routes("can i talk to a real person", "contact");

/* --- fallback ------------------------------------------------- */

const vague = FAQ.match("hello");
ok("bare greeting falls back", vague.id === "fallback" && vague.matched === false);

const nonsense = FAQ.match("qwerty zxcvb");
ok("nonsense falls back", nonsense.matched === false);

/* --- helpers --------------------------------------------------- */

ok("clean strips punctuation", FAQ.clean("Delivery?? To Kimana!") === "delivery to kimana");
ok("stop words are dropped", FAQ.tokenize("how do i pay for the dress").indexOf("the") === -1);
ok("stemmer folds plurals", FAQ.stem("deliveries") === "deliver" || FAQ.stem("deliveries") === "delivery");
ok("quick replies all route somewhere", FAQ.quick.every((q) => FAQ.match(q.question).matched));

/* --- token rendering -------------------------------------------- */

const shop = {
  town: "Kimana Town",
  owner: "Maggie",
  currency: "KSh",
  address: "Kimana Town, Kajiado",
  landmark: "Above the chemist",
  email: "hello@example.com",
  orderPrefix: "MC",
  returnWindowDays: 3,
  freeDeliveryFrom: 5000,
  mpesa: { type: "Till" }
};

const rendered = FAQ.render(FAQ.match("how much is delivery").answer, shop);
ok("tokens are all filled", rendered.indexOf("{{") === -1);
ok("free delivery threshold formats", rendered.indexOf("5,000") !== -1);

const everyAnswer = FAQ.entries.concat([FAQ.fallback]);
ok(
  "every answer renders clean",
  everyAnswer.every((entry) => FAQ.render(entry.answer, shop).indexOf("{{") === -1)
);

/* --- no duplicate ids -------------------------------------------- */

const ids = FAQ.entries.map((e) => e.id);
ok("ids are unique", new Set(ids).size === ids.length);

/* --- report ------------------------------------------------------- */

console.log("passed: " + passed);
if (failures.length) {
  console.log("failed: " + failures.length);
  failures.forEach((line) => console.log("  - " + line));
  process.exit(1);
}
console.log("all concierge routes behave.");
