/* ===========================================================
   MAGGIE'S COLLECTION — js/faq.js
   The concierge brain.  Pure logic, no DOM, no network.
   Runs in the browser (window.MC_FAQ) and in node
   (module.exports) so tests/faq.test.js can score it.

   Answers carry {{tokens}} that script.js swaps for live
   SHOP values, so nothing here goes stale when config changes.
   =========================================================== */

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.MC_FAQ = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {

  /* Words too common to carry meaning. Dropped before scoring. */
  const STOP = new Set([
    "a", "an", "the", "is", "are", "am", "do", "does", "did", "can", "could",
    "i", "you", "we", "my", "me", "your", "it", "of", "to", "for", "on", "in",
    "and", "or", "but", "if", "how", "what", "when", "where", "which", "who",
    "there", "here", "please", "hi", "hey", "hello", "thanks", "thank", "ok",
    "okay", "want", "need", "get", "got", "have", "has", "be", "will", "would",
    "about", "with", "from", "any", "some", "so", "that", "this", "at"
  ]);

  /* Each entry: id, title, keywords (1 point each), phrases (3 points
     each, matched against the whole cleaned question), answer.        */
  const ENTRIES = [
    {
      id: "delivery",
      title: "Delivery",
      keywords: ["delivery", "deliver", "shipping", "ship", "boda", "courier",
        "send", "sent", "bring", "rider", "transport", "parcel", "matatu"],
      phrases: ["how long", "how much is delivery", "do you deliver", "reach me"],
      answer:
        "We deliver from {{town}}. Kimana town centre is free, Isinet, Kilimanjaro Farm and Namelok are {{currency}} 150 same day if you order before 3:00 pm, Oloitokitok and Illasit are {{currency}} 250 next day, and Nairobi is {{currency}} 400 in two to three days. Orders over {{currency}} {{freeFrom}} ship free anywhere. Full list is on the delivery page."
    },
    {
      id: "free_delivery",
      title: "Free delivery",
      keywords: ["free", "waive", "waived", "discount"],
      phrases: ["free delivery", "free shipping", "no delivery fee"],
      answer:
        "Delivery is on us for any order over {{currency}} {{freeFrom}}, and inside Kimana town centre it is always free."
    },
    {
      id: "payment",
      title: "Payment",
      keywords: ["pay", "payment", "mpesa", "m-pesa", "till", "paybill", "cash",
        "card", "deposit", "money", "send"],
      phrases: ["how do i pay", "do you accept", "pay on delivery"],
      answer:
        "M-Pesa is the main option. Confirm the {{mpesaType}} number with us on WhatsApp before you send anything, then share the confirmation message. Cash works for hand deliveries inside {{town}}. Out-of-town orders are paid before the parcel leaves the shop."
    },
    {
      id: "returns",
      title: "Returns and exchanges",
      keywords: ["return", "returns", "refund", "exchange", "swap", "change",
        "wrong", "faulty", "damaged", "torn", "defect", "broken", "zip",
        "zipper", "tear", "replace"],
      phrases: ["can i exchange", "can i return", "doesn't fit", "doesnt fit",
        "does not fit", "don't fit",
        "dont fit", "send it back", "money back", "too small", "too big"],
      answer:
        "You have {{returnDays}} days to exchange anything that does not fit, as long as the tags are still on and it has not been worn or washed. Faulty pieces are replaced or refunded in full. Earrings and other pierced jewellery cannot be returned for hygiene reasons."
    },
    {
      id: "sizing",
      title: "Sizing",
      keywords: ["size", "sizes", "sizing", "fit", "fits", "measurement",
        "measurements", "bust", "waist", "hips", "length", "small", "large",
        "medium", "xl", "plus"],
      phrases: ["what size", "true to size", "size chart", "size guide"],
      answer:
        "Our pieces run true to standard Kenyan retail sizing, XS through XXL. The size guide page has bust, waist and hip measurements in centimetres plus a shoe conversion table. Tell me your usual size and what you are looking at and I will say whether to size up."
    },
    {
      id: "stock",
      title: "Stock and availability",
      keywords: ["stock", "available", "availability", "restock", "sold",
        "remaining", "left", "colour", "color", "another"],
      phrases: ["in stock", "sold out", "do you have", "other colours"],
      answer:
        "The catalogue only shows what is physically on the rail today, so if you can see it we have it. Sold-out pieces come off the site the same hour. Ask about a colour or size that is missing and we will tell you if it is coming back."
    },
    {
      id: "hours",
      title: "Opening hours",
      keywords: ["open", "opening", "hours", "closed", "closing", "time",
        "today", "sunday", "saturday", "weekend", "late"],
      phrases: ["what time", "are you open", "still open"],
      answer:
        "Monday to Friday 8:30 am to 7:00 pm, Saturday 8:30 am to 8:00 pm, Sunday 11:00 am to 5:00 pm. Messages sent after hours are answered first thing the next morning."
    },
    {
      id: "location",
      title: "Where to find us",
      keywords: ["where", "location", "shop", "store", "address", "directions",
        "find", "located", "visit", "come", "physical", "stage"],
      phrases: ["where are you", "where is the", "where are the", "your shop",
        "can i come", "come and see"],
      answer:
        "{{address}}. {{landmark}}. Walk-ins are welcome during opening hours and you can try pieces on before you buy."
    },
    {
      id: "order_status",
      title: "Order status",
      keywords: ["order", "status", "tracking", "track", "where", "confirm",
        "confirmation", "receipt", "arrived", "dispatch", "dispatched"],
      phrases: ["my order", "order number", "has it shipped", "where is my"],
      answer:
        "Send your order number, it starts with {{prefix}}, and we will check it against today's dispatch list and tell you exactly where the parcel is."
    },
    {
      id: "reserve",
      title: "Holding a piece",
      keywords: ["reserve", "hold", "book", "keep", "layby", "lay-by",
        "deposit", "tomorrow"],
      phrases: ["hold it for me", "keep it for me", "put aside"],
      answer:
        "We hold a piece for 24 hours with no deposit, and up to five days with half paid. Message us the item name and your pickup day."
    },
    {
      id: "bulk",
      title: "Bulk and group orders",
      keywords: ["bulk", "wholesale", "bridal", "bridesmaid", "group",
        "matching", "team", "quantity", "many", "event", "wedding"],
      phrases: ["for a wedding", "bulk price", "several pieces"],
      answer:
        "Bridal parties, church groups and matching sets are welcome. From six pieces up we work out a group price and a fitting date. Send the headcount and the date you need them by."
    },
    {
      id: "tailoring",
      title: "Alterations and tailoring",
      keywords: ["tailor", "tailoring", "alter", "alteration", "hem", "take",
        "adjust", "custom", "sew", "fitting", "ankara"],
      phrases: ["take it in", "take in the", "made to measure", "shorten the",
        "let it out"],
      answer:
        "Our tailor sits in the shop. Simple hems and taking in a waist are free on anything bought here and usually done within a day. Made-to-measure Ankara starts from your own measurements, give us five to seven days."
    },
    {
      id: "care",
      title: "Caring for your pieces",
      keywords: ["wash", "washing", "care", "iron", "clean", "shrink", "fade",
        "dry", "bleach", "machine"],
      phrases: ["how do i wash", "can i machine wash"],
      answer:
        "Cold hand wash and dry in the shade keeps colour in almost everything we stock. Turn prints inside out, skip the bleach, and iron on medium. Anything needing dry cleaning says so on its tag."
    },
    {
      id: "contact",
      title: "Talking to a person",
      keywords: ["human", "person", "talk", "speak", "call", "phone", "whatsapp",
        "chat", "maggie", "someone", "agent"],
      phrases: ["talk to someone", "real person", "call you"],
      answer:
        "{{owner}} answers WhatsApp herself between opening and closing. Tap the WhatsApp button below and your question comes through with whatever is in your cart already attached."
    }
  ];

  const FALLBACK = {
    id: "fallback",
    title: "Handing you over",
    answer:
      "I did not catch that one. {{owner}} can answer it properly on WhatsApp, usually within a few minutes during opening hours."
  };

  /* --- scoring ------------------------------------------------- */

  function clean(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    return clean(text)
      .split(" ")
      .filter(function (word) { return word.length > 1 && !STOP.has(word); });
  }

  /* Light stemmer: "deliveries" and "delivering" both reach "deliver". */
  function stem(word) {
    return word
      .replace(/ies$/, "y")
      .replace(/(ing|ed|es|s)$/, "");
  }

  function scoreEntry(entry, cleaned, tokens) {
    let score = 0;
    const seen = new Set();

    (entry.phrases || []).forEach(function (phrase) {
      if (cleaned.indexOf(clean(phrase)) !== -1) score += 3;
    });

    const stems = entry.keywords.map(stem);
    tokens.forEach(function (token) {
      const tokenStem = stem(token);
      const hit = stems.indexOf(tokenStem);
      if (hit !== -1 && !seen.has(hit)) {
        seen.add(hit);
        score += 1;
      }
    });

    return score;
  }

  function rank(question) {
    const cleaned = clean(question);
    const tokens = tokenize(question);
    return ENTRIES
      .map(function (entry) {
        return { entry: entry, score: scoreEntry(entry, cleaned, tokens) };
      })
      .sort(function (a, b) { return b.score - a.score; });
  }

  /* Returns { id, title, answer, score, matched } every time.
     matched is false when nothing cleared the threshold.       */
  function match(question) {
    const ranked = rank(question);
    const best = ranked[0];
    if (!best || best.score < 2) {
      return { id: FALLBACK.id, title: FALLBACK.title, answer: FALLBACK.answer, score: best ? best.score : 0, matched: false };
    }
    return { id: best.entry.id, title: best.entry.title, answer: best.entry.answer, score: best.score, matched: true };
  }

  /* Fills {{tokens}} from a SHOP object. Unknown tokens are left
     visible rather than silently blanked, so gaps are obvious.  */
  function render(answer, shop) {
    if (!shop) return answer;
    const map = {
      town: shop.town,
      owner: shop.owner,
      currency: shop.currency,
      address: shop.address,
      landmark: shop.landmark,
      email: shop.email,
      prefix: shop.orderPrefix,
      returnDays: shop.returnWindowDays,
      freeFrom: Number(shop.freeDeliveryFrom || 0).toLocaleString("en-KE"),
      mpesaType: shop.mpesa ? shop.mpesa.type : "M-Pesa"
    };
    return String(answer).replace(/\{\{(\w+)\}\}/g, function (whole, key) {
      return map[key] === undefined || map[key] === null ? whole : String(map[key]);
    });
  }

  const QUICK = [
    { label: "Delivery", question: "how much is delivery" },
    { label: "Sizing", question: "what size should i take" },
    { label: "Payment", question: "how do i pay" },
    { label: "Returns", question: "can i exchange it" },
    { label: "Opening hours", question: "what time do you open" },
    { label: "Where you are", question: "where is the shop" }
  ];

  return {
    entries: ENTRIES,
    fallback: FALLBACK,
    quick: QUICK,
    clean: clean,
    tokenize: tokenize,
    stem: stem,
    rank: rank,
    match: match,
    render: render
  };
});
