/* ===========================================================
   MAGGIE'S COLLECTION — js/orders.js
   Pure order logic shared by the storefront and the staff desks.
   No DOM, no network. Runs in the browser (window.MC_ORDERS)
   and in node (tests/orders.test.js).

     discountPct / saving   marked price vs selling price
     groupByStore           split a cart into one group per boutique
     makeCode               MC-260929-4412 style order codes
     buildMessage           the WhatsApp text (one table, or one per store)
     waPhone                a Kenyan phone number as wa.me digits
   =========================================================== */

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.MC_ORDERS = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {

  /* Whole-number percent off. 0 when there is no real discount. */
  function discountPct(price, compare) {
    const p = Number(price);
    const c = Number(compare);
    if (!(c > p) || !(p >= 0)) return 0;
    return Math.round(((c - p) / c) * 100);
  }

  /* KSh saved per item. 0 when there is no real discount. */
  function saving(price, compare) {
    const p = Number(price);
    const c = Number(compare);
    return c > p ? c - p : 0;
  }

  /* lines: [{ store, price, qty, ... }]   stores: SHOP.stores
     Returns [{ store, lines, subtotal }] in store order, only for
     stores that actually have lines. A line with no store belongs
     to the first boutique (carts saved before the two-store update). */
  function groupByStore(lines, stores) {
    const first = stores[0].slug;
    const buckets = new Map();
    lines.forEach(function (line) {
      const slug = line.store || first;
      if (!buckets.has(slug)) buckets.set(slug, []);
      buckets.get(slug).push(line);
    });
    return stores
      .filter(function (s) { return buckets.has(s.slug); })
      .map(function (s) {
        const own = buckets.get(s.slug);
        return {
          store: s,
          lines: own,
          subtotal: own.reduce(function (sum, l) { return sum + Number(l.price) * Number(l.qty); }, 0)
        };
      });
  }

  /* MC-260929-4412. `date` and `rand` are injectable for tests. */
  function makeCode(prefix, date, rand) {
    const d = date || new Date();
    const stamp = d.toISOString().slice(2, 10).replace(/-/g, "");
    const tail = Math.floor(1000 + (rand === undefined ? Math.random() : rand) * 9000);
    return prefix + "-" + stamp + "-" + tail;
  }

  function lineText(line, fmt) {
    return "• " + line.qty + " × " + line.name +
      (line.size ? " (" + line.size + ")" : "") +
      " — " + fmt(Number(line.price) * Number(line.qty));
  }

  /* groups: [{ store, code, lines, subtotal }]
     details: { name, phone, location, notes, zone, fee, total }
     fmt: money formatter.
     One boutique  -> one simple table.
     Both boutiques -> one message, a labelled table per boutique. */
  function buildMessage(groups, details, fmt) {
    const who = [
      "Name: " + details.name,
      "Phone: " + details.phone,
      "Deliver to: " + details.location,
      details.notes ? "Notes: " + details.notes : ""
    ].filter(Boolean);

    const delivery = "Delivery (" + details.zone + "): " + (details.fee ? fmt(details.fee) : "free");
    const items = groups.reduce(function (sum, g) { return sum + g.subtotal; }, 0);

    if (groups.length === 1) {
      const g = groups[0];
      return [
        "Order " + g.code + " · " + g.store.name,
        "",
        g.lines.map(function (l) { return lineText(l, fmt); }).join("\n"),
        "",
        "Items: " + fmt(items),
        delivery,
        "Total: " + fmt(details.total),
        ""
      ].concat(who).join("\n");
    }

    const parts = [
      "NEW ORDER · " + groups.length + " boutiques",
      "Refs: " + groups.map(function (g) { return g.code; }).join(" + "),
      ""
    ];
    groups.forEach(function (g) {
      parts.push("*" + g.store.name.toUpperCase() + "*");
      parts.push("Order " + g.code);
      parts.push(g.lines.map(function (l) { return lineText(l, fmt); }).join("\n"));
      parts.push("Subtotal: " + fmt(g.subtotal));
      parts.push("");
    });
    parts.push("Items: " + fmt(items));
    parts.push(delivery);
    parts.push("*TOTAL: " + fmt(details.total) + "*");
    parts.push("");
    return parts.concat(who).join("\n");
  }

  /* 0712 345 678 / +254 712 345 678 / 712345678  ->  254712345678 */
  function waPhone(phone) {
    let d = String(phone || "").replace(/\D/g, "");
    if (d.indexOf("254") === 0) return d;
    if (d.charAt(0) === "0") return "254" + d.slice(1);
    if (d.length === 9 && /^[71]/.test(d)) return "254" + d;
    return d;
  }

  return {
    discountPct: discountPct,
    saving: saving,
    groupByStore: groupByStore,
    makeCode: makeCode,
    buildMessage: buildMessage,
    waPhone: waPhone
  };
});
