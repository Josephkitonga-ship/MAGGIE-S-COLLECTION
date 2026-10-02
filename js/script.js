/* ===========================================================
   MAGGIE'S COLLECTION — js/script.js
   One file, every storefront page. Loaded after config.js,
   orders.js and faq.js. Nothing here assumes a page's markup
   exists; each block bails quietly if its hooks are missing.

   Two boutiques share one catalogue. Every product carries a
   `store` and an optional `compare_price` (the marked price).
   =========================================================== */

(function () {
  "use strict";

  const SHOP = window.SHOP;
  const FAQ = window.MC_FAQ;
  const ORD = window.MC_ORDERS;
  const STORES = SHOP.stores;
  const CART_KEY = SHOP.cartKey;

  /* --- supabase ------------------------------------------------ */

  const KEYS_READY =
    window.SUPABASE_URL.indexOf("YOUR-PROJECT-REF") === -1 &&
    window.SUPABASE_ANON_KEY.indexOf("YOUR-ANON") === -1;

  const sb = (KEYS_READY && window.supabase)
    ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
    : null;

  /* Real keys but no library: the CDN script was blocked or offline.
     Showing demo pieces here would let people "order" things that
     never reach the database, so show nothing and say so instead. */
  const LIB_MISSING = KEYS_READY && !window.supabase;
  if (LIB_MISSING) console.error("Supabase library did not load, so the shop cannot reach its database.");

  /* Add ?debug=1 to any page address to see the real database error
     in the checkout message while testing. */
  const DEBUG = new URLSearchParams(location.search).get("debug") === "1";

  /* Shown only while Supabase keys are still the placeholders. */
  const DEMO_PRODUCTS = [
    { id: "d1", store: "maggies", name: "Amboseli wrap dress", price: 3200, compare_price: 4000, category: "dresses", description: "Cotton wrap with a tie waist.", image_url: "", sizes: ["S", "M", "L"], active: true, sort: 1 },
    { id: "d2", store: "maggies", name: "Sunday pleat midi", price: 3800, category: "dresses", description: "Lined pleats, holds a press.", image_url: "", sizes: ["M", "L", "XL"], active: true, sort: 2 },
    { id: "d3", store: "maggies", name: "Linen shell top", price: 1450, category: "tops", description: "Breathes through a Kimana afternoon.", image_url: "", sizes: ["S", "M", "L", "XL", "XXL", "3XL"], active: true, sort: 3 },
    { id: "d6", store: "maggies", name: "Kitenge circle skirt", price: 2400, category: "ankara", description: "Cut and sewn by our tailor.", image_url: "", sizes: ["One size"], active: true, sort: 6 },
    { id: "d7", store: "maggies", name: "Everyday tote", price: 1950, category: "bags", description: "Fits a laptop and a market run.", image_url: "", sizes: ["Small", "Medium", "Large"], active: true, sort: 7 },
    { id: "d9", store: "davids", name: "Oxford shirt", price: 2200, compare_price: 2750, category: "menswear", description: "Cotton, holds a collar all day.", image_url: "", sizes: ["M", "L", "XL", "XXL", "3XL"], active: true, sort: 9 },
    { id: "d10", store: "davids", name: "Chino trouser", price: 2800, category: "menswear", description: "Men's straight leg, numbered waist.", image_url: "", sizes: ["30", "32", "34", "36", "38", "40"], active: true, sort: 10 },
    { id: "d12", store: "davids", name: "Camo crew sweatshirt", price: 2600, compare_price: 3200, category: "tops", description: "Heavy fleece, embroidered chest.", image_url: "", sizes: ["M", "L", "XL", "XXL"], active: true, sort: 12 },
    { id: "d8", store: "davids", name: "Block heel sandal", price: 2900, category: "shoes", description: "Steady on a murram road.", image_url: "", sizes: ["36", "37", "38", "39", "40"], active: true, sort: 8 }
  ];

  let PRODUCTS = [];

  /* Older rows, or a database that has not had the two-store
     migration yet, have no store: they belong to the first boutique. */
  function normalise(p) {
    p.store = STORES.some((s) => s.slug === p.store) ? p.store : STORES[0].slug;
    p.price = Number(p.price);
    p.compare_price = Number(p.compare_price) > p.price ? Number(p.compare_price) : 0;
    return p;
  }

  async function loadProducts() {
    if (!sb) return LIB_MISSING ? [] : DEMO_PRODUCTS.map((p) => normalise(Object.assign({}, p)));
    const { data, error } = await sb
      .from("products")
      .select("*")
      .eq("active", true)
      .order("sort", { ascending: true });
    if (error) {
      console.error("products load failed:", error.message);
      return [];
    }
    return (data || []).map(normalise);
  }

  /* --- small helpers ------------------------------------------- */

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function money(value) {
    return SHOP.currency + " " + Number(value || 0).toLocaleString("en-KE");
  }

  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function categoryName(slug) {
    const found = SHOP.categories.find((c) => c.slug === slug);
    return found ? found.name : (slug || "Other");
  }

  function storeOf(slug) {
    return STORES.find((s) => s.slug === slug) || STORES[0];
  }

  const waLive = window.WHATSAPP_NUMBER !== window.WHATSAPP_PLACEHOLDER;

  function buildWALink(message) {
    return "https://wa.me/" + window.WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
  }

  /* --- cart ----------------------------------------------------- */

  function readCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (err) {
      return [];
    }
  }

  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    paintCount();
  }

  let cart = readCart();

  /* Prices in localStorage are never trusted. On every load the cart
     is rebuilt against the live product rows; anything withdrawn from
     sale drops out and the shopper is told. */
  function reconcileCart() {
    if (!PRODUCTS.length) return;
    const byId = new Map(PRODUCTS.map((p) => [String(p.id), p]));
    let dropped = 0;
    cart = cart.filter((line) => {
      const live = byId.get(String(line.id));
      if (!live) { dropped += 1; return false; }
      line.name = live.name;
      line.price = Number(live.price);
      line.compare = live.compare_price || 0;
      line.store = live.store;
      line.image = live.image_url || "";
      return true;
    });
    writeCart(cart);
    if (dropped && $("#cartNote")) {
      $("#cartNote").textContent = dropped === 1
        ? "One piece left your list because it is no longer on the rail."
        : dropped + " pieces left your list because they are no longer on the rail.";
    }
  }

  function cartTotal() {
    return cart.reduce((sum, line) => sum + Number(line.price) * Number(line.qty), 0);
  }

  function cartCount() {
    return cart.reduce((sum, line) => sum + Number(line.qty), 0);
  }

  function paintCount() {
    $$(".cart-count").forEach((el) => { el.textContent = cartCount(); });
  }

  function addToCart(productId, size) {
    const live = PRODUCTS.find((p) => String(p.id) === String(productId));
    if (!live) return;
    const key = String(live.id) + "::" + (size || "");
    const existing = cart.find((line) => line.key === key);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        key: key,
        id: String(live.id),
        store: live.store,
        name: live.name,
        price: Number(live.price),
        compare: live.compare_price || 0,
        image: live.image_url || "",
        size: size || "",
        qty: 1
      });
    }
    writeCart(cart);
    paintCart();
    openDrawer();
  }

  function changeQty(key, delta) {
    const line = cart.find((item) => item.key === key);
    if (!line) return;
    line.qty += delta;
    if (line.qty < 1) cart = cart.filter((item) => item.key !== key);
    writeCart(cart);
    paintCart();
  }

  /* --- drawer --------------------------------------------------- */

  const drawer = $("#cartDrawer");
  const scrim = $("#scrim");

  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add("is-open");
    scrim.classList.add("is-open");
    document.body.classList.add("is-locked");
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    scrim.classList.remove("is-open");
    document.body.classList.remove("is-locked");
  }

  function lineHTML(line) {
    return `
      <div class="line">
        ${line.image
          ? `<img class="line__thumb" src="${esc(line.image)}" alt="${esc(line.name)}">`
          : '<div class="line__thumb"></div>'}
        <div>
          <div class="line__name">${esc(line.name)}</div>
          <div class="line__meta">${line.size ? esc(line.size) + " · " : ""}${money(line.price)}${line.compare ? ` <span class="line__was">${money(line.compare)}</span>` : ""}</div>
        </div>
        <div class="qty">
          <button type="button" data-qty="-1" data-key="${esc(line.key)}" aria-label="Remove one">−</button>
          <span>${line.qty}</span>
          <button type="button" data-qty="1" data-key="${esc(line.key)}" aria-label="Add one">+</button>
        </div>
      </div>`;
  }

  function paintCart() {
    const body = $("#cartLines");
    if (!body) return;
    const groups = ORD.groupByStore(cart, STORES);

    if (!cart.length) {
      body.innerHTML = '<div class="state">Your selection is empty. Tap any piece on the rail to save it here.</div>';
    } else {
      body.innerHTML = groups.map((g) => `
        <div class="cart-store">
          <b>${esc(g.store.name)}</b><span>${money(g.subtotal)}</span>
        </div>
        ${g.lines.map(lineHTML).join("")}`).join("");
    }

    const split = $("#cartSplit");
    if (split) {
      split.textContent = groups.length > 1
        ? "Your selection covers more than one rail. One WhatsApp message covers all of it."
        : "";
    }

    const goBtn = $("#toCheckout");
    if (goBtn) goBtn.disabled = cart.length === 0;
    paintCount();
    updateGrand();
  }

  /* --- product cards -------------------------------------------- */

  function priceHTML(product) {
    const pct = ORD.discountPct(product.price, product.compare_price);
    if (!pct) return `<span class="card__price"><span class="price-now">${money(product.price)}</span></span>`;
    return `<span class="card__price is-sale">
      <span class="price-now">${money(product.price)}</span>
      <s class="price-was">${money(product.compare_price)}</s>
      <span class="price-save">Save ${money(ORD.saving(product.price, product.compare_price))}</span>
    </span>`;
  }

  function productUrl(id) {
    return "product.html?id=" + encodeURIComponent(id);
  }

  function cardHTML(product) {
    const store = storeOf(product.store);
    const pct = ORD.discountPct(product.price, product.compare_price);
    const marks = ORD.highlights(product);
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    const link = productUrl(product.id);
    const picker = sizes.length
      ? `<select class="js-size" aria-label="Size for ${esc(product.name)}">
           ${sizes.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join("")}
         </select>`
      : "";
    return `
      <article class="card" data-store="${esc(store.slug)}">
        <a class="card__media" href="${link}" aria-label="View ${esc(product.name)}">
          ${product.image_url ? `<img src="${esc(product.image_url)}" alt="${esc(product.name)}" loading="lazy">` : ""}
          ${pct ? `<span class="badge badge--off">−${pct}%</span>` : ""}
          ${marks.length ? `<span class="badge badge--hot">${esc(marks[0])}</span>` : ""}
        </a>
        <div class="card__body">
          <p class="card__cat">${esc(categoryName(product.category))}</p>
          <h3 class="card__name"><a href="${link}">${esc(product.name)}</a></h3>
          ${product.description ? `<p class="card__desc">${esc(product.description)}</p>` : ""}
          ${picker ? `<label class="field" style="margin:0.4rem 0 0"><span>Size</span>${picker}</label>` : ""}
          <div class="card__foot">
            ${priceHTML(product)}
            <button class="btn btn--rose js-add" type="button" data-id="${esc(product.id)}">Save to Rail List</button>
          </div>
        </div>
      </article>`;
  }

  function paintRail() {
    const rail = $("#newRail");
    if (!rail) return;
    const picks = PRODUCTS.slice(0, 8);
    rail.innerHTML = picks.length
      ? picks.map(cardHTML).join("")
      : '<div class="state">New pieces are being photographed. Check back shortly.</div>';
  }

  function paintBoutiqueCounts() {
    $$("[data-store-count]").forEach((el) => {
      const n = PRODUCTS.filter((p) => p.store === el.dataset.storeCount).length;
      el.textContent = n + (n === 1 ? " piece" : " pieces") + " on the rail";
    });
  }

  /* --- catalogue ------------------------------------------------ */

  /* cat: category slug | "all"   store: store slug | "all"   offers: bool */
  const view = { cat: "all", store: "all", offers: false };

  function visibleProducts() {
    return PRODUCTS.filter((p) =>
      (view.store === "all" || p.store === view.store) &&
      (!view.offers || ORD.discountPct(p.price, p.compare_price) > 0));
  }

  function syncUrl() {
    const q = new URLSearchParams();
    if (view.cat !== "all") q.set("c", view.cat);
    if (view.store !== "all") q.set("s", view.store);
    if (view.offers) q.set("offers", "1");
    const text = q.toString();
    history.replaceState(null, "", location.pathname + (text ? "?" + text : ""));
  }

  function paintSwitch() {
    const box = $("#storeSwitch");
    if (!box) return;
    const btn = (attrs, active, label, dot) =>
      `<button class="switch__btn${active ? " is-active" : ""}" type="button" ${attrs}>${dot ? '<span class="switch__dot"></span>' : ""}${esc(label)}</button>`;
    box.innerHTML =
      btn('data-store="all"', view.store === "all", "All pieces", false) +
      STORES.map((s) => btn('data-store="' + esc(s.slug) + '"', view.store === s.slug, s.name, true)).join("") +
      btn("data-offers", view.offers, "On offer", false);
  }

  function paintCatalogue() {
    const wrap = $("#catalogue");
    if (!wrap) return;

    paintSwitch();
    const items = visibleProducts();
    const used = SHOP.categories.filter((cat) => items.some((p) => p.category === cat.slug));
    if (view.cat !== "all" && !used.some((c) => c.slug === view.cat)) view.cat = "all";

    const chips = $("#chips");
    if (chips) {
      chips.innerHTML = [{ slug: "all", name: "Everything" }].concat(used).map((cat) =>
        `<button class="chip${cat.slug === view.cat ? " is-active" : ""}" type="button" data-slug="${esc(cat.slug)}">${esc(cat.name)}</button>`
      ).join("");
    }

    if (!PRODUCTS.length) {
      wrap.innerHTML = LIB_MISSING
        ? '<div class="state">We could not load the rail just now. Check your connection and refresh the page.</div>'
        : '<div class="state">The rail is empty right now. New stock is added most weeks.</div>';
      return;
    }
    if (!items.length) {
      wrap.innerHTML = view.offers
        ? '<div class="state">No offers here today. Tap On offer again to see everything.</div>'
        : '<div class="state">Nothing here today. Tap All pieces to see the full rail.</div>';
      return;
    }

    const shown = view.cat === "all" ? used : used.filter((c) => c.slug === view.cat);
    wrap.innerHTML = shown.map((cat) => {
      const list = items.filter((p) => p.category === cat.slug);
      return `
        <section class="cat-block" id="cat-${esc(cat.slug)}">
          <div class="cat-block__head">
            <h2>${esc(cat.name)}</h2>
            <span class="cat-block__count">${list.length} ${list.length === 1 ? "piece" : "pieces"}</span>
          </div>
          <div class="grid">${list.map(cardHTML).join("")}</div>
        </section>`;
    }).join("");

    spyCategories();
  }

  let spy = null;
  /* Scroll-spy keeps the sticky chip in step with the rail you are in. */
  function spyCategories() {
    const blocks = $$(".cat-block");
    if (spy) spy.disconnect();
    if (!blocks.length || !window.IntersectionObserver) return;
    spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const slug = entry.target.id.replace("cat-", "");
        $$(".chip").forEach((chip) => {
          chip.classList.toggle("is-active", chip.dataset.slug === slug);
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    blocks.forEach((block) => spy.observe(block));
  }

  /* --- checkout -------------------------------------------------- */

  function deliveryFee(zoneName) {
    const zone = SHOP.delivery.find((z) => z.zone === zoneName);
    return zone ? Number(zone.fee) : 0;
  }

  function paintCheckout() {
    const select = $("#zone");
    if (!select) return;
    select.innerHTML = SHOP.delivery.map((z) =>
      `<option value="${esc(z.zone)}">${esc(z.zone)} — ${z.fee ? money(z.fee) : "free"} · ${esc(z.eta)}</option>`
    ).join("");
    updateGrand();
    select.addEventListener("change", updateGrand);
  }

  function updateGrand() {
    const grand = $("#grandTotal");
    if (!grand) return;
    const fee = deliveryFee($("#zone").value);
    grand.textContent = money(cartTotal() + fee);
    const feeNote = $("#feeNote");
    if (feeNote) {
      feeNote.textContent = fee === 0
        ? "Delivery is free on this order."
        : "Delivery " + money(fee) + " on top of " + money(cartTotal()) + (ORD.groupByStore(cart, STORES).length > 1 ? ", charged once for everything in your selection." : ".");
    }
  }

  async function submitOrder(event) {
    event.preventDefault();
    const msg = $("#checkoutMsg");
    if (!cart.length) {
      msg.className = "form-msg is-bad";
      msg.textContent = "Save a piece to your list first.";
      return;
    }

    const details = {
      name: $("#custName").value.trim(),
      phone: $("#custPhone").value.trim(),
      location: $("#custLocation").value.trim(),
      notes: $("#custNotes").value.trim(),
      zone: $("#zone").value
    };
    details.fee = deliveryFee(details.zone);
    details.total = cartTotal() + details.fee;

    if (!details.name || !details.phone || !details.location) {
      msg.className = "form-msg is-bad";
      msg.textContent = "Name, phone and delivery point are all needed before we can send this.";
      return;
    }

    /* One group, and one order code, per boutique. */
    const groups = ORD.groupByStore(cart, STORES).map((g) =>
      Object.assign({}, g, { code: ORD.makeCode(g.store.prefix) }));
    const codes = groups.map((g) => g.code);

    /* The WhatsApp tab is opened inside the click itself, before any
       await, or the browser treats it as a blocked pop-up. Saving to
       Supabase happens after and never blocks the message. */
    if (waLive) {
      window.open(buildWALink(ORD.buildMessage(groups, details, money)), "_blank");
    }

    const label = codes.length > 1 ? "Your requests " + codes.join(" and ") : "Your request " + codes[0];
    msg.className = "form-msg is-good";
    msg.textContent = waLive
      ? label + (codes.length > 1 ? " are" : " is") + " on the way to WhatsApp. Keep " + (codes.length > 1 ? "these numbers" : "this number") + " safe."
      : label + (codes.length > 1 ? " are" : " is") + " saved. The WhatsApp line is not live yet — call in at the shop or check back shortly.";

    /* The database prices every line itself (place_checkout in
       docs/supabase-two-stores.sql). We only send ids, sizes and quantities. */
    if (!sb) {
      console.error("order not saved: no database connection");
      if (LIB_MISSING) {
        msg.className = "form-msg is-bad";
        msg.textContent = label + " went to WhatsApp, but our desk could not be reached. Please keep your WhatsApp message as your record.";
      }
    } else {
      const { error } = await sb.rpc("place_checkout", {
        p_name: details.name,
        p_phone: details.phone,
        p_location: details.location,
        p_notes: details.notes,
        p_zone: details.zone,
        p_delivery_fee: details.fee,
        p_group_code: groups.length > 1 ? codes[0] : "",
        p_orders: groups.map((g) => ({
          store: g.store.slug,
          code: g.code,
          lines: g.lines.map((l) => ({ id: l.id, size: l.size, qty: l.qty }))
        }))
      });
      if (error) {
        console.error("order save failed:", error.message);
        msg.className = "form-msg is-bad";
        msg.textContent = label + " went to WhatsApp, but it was not saved on our desk. Please keep your WhatsApp message as your record." +
          (DEBUG ? " [debug: " + error.message + "]" : "");
      }
    }

    cart = [];
    writeCart(cart);
    paintCart();
    $("#checkoutForm").reset();
    paintCheckout();
  }

  /* --- product page ---------------------------------------------- */

  /* "Chat to Reserve on WhatsApp" is also written to the desk, so the
     shop sees every reserve request, not only the ones sent from the
     saved list. The shopper's name and number are not asked for here,
     so the record is marked as an enquiry; staff confirm them on WhatsApp. */
  async function recordEnquiry(product, size) {
    if (!sb) return;
    const store = storeOf(product.store);
    const { error } = await sb.rpc("place_checkout", {
      p_name: "WhatsApp enquiry",
      p_phone: "not given",
      p_location: "Reserve request from product page",
      p_notes: "Reserve request. Confirm the customer's name and number on WhatsApp.",
      p_zone: "To be arranged",
      p_delivery_fee: 0,
      p_group_code: "",
      p_orders: [{
        store: store.slug,
        code: ORD.makeCode(store.prefix),
        lines: [{ id: product.id, size: size || "", qty: 1 }]
      }]
    });
    if (error) console.error("enquiry not saved:", error.message);
  }

  /* product.html?id=...  One piece in full: photos, badges, price,
     description, specifications, size buttons and the two actions. */
  function paintProduct() {
    const root = $("#productView");
    if (!root) return;

    const id = new URLSearchParams(location.search).get("id");
    const p = PRODUCTS.find((x) => String(x.id) === String(id));
    if (!p) {
      root.innerHTML = '<div class="state">This piece is no longer on the rail. <a href="catalogue.html">See what is in today</a>.</div>';
      document.title = "Piece not found — " + SHOP.name;
      return;
    }
    document.title = p.name + " — " + SHOP.name;

    const pct = ORD.discountPct(p.price, p.compare_price);
    const marks = ORD.highlights(p);
    const sizes = Array.isArray(p.sizes) ? p.sizes : [];
    const images = [p.image_url].concat(Array.isArray(p.gallery) ? p.gallery : []).filter(Boolean);
    const cat = SHOP.categories.find((c) => c.slug === p.category);
    const specs = [
      ["Material", p.material],
      ["Dimensions", p.dimensions],
      ["Care / fabric", p.care],
      ["Category", categoryName(p.category)],
      ["Sizes", sizes.join(", ")]
    ].filter((row) => row[1]);
    const hasDetail = !!(p.material || p.dimensions || p.care);
    const related = PRODUCTS.filter((x) => x.category === p.category && String(x.id) !== String(p.id)).slice(0, 4);
    let chosen = sizes.length === 1 ? sizes[0] : "";

    root.innerHTML = `
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="catalogue.html">Catalogue</a><span aria-hidden="true">/</span>
        <a href="catalogue.html?c=${esc(p.category)}">${esc(categoryName(p.category))}</a><span aria-hidden="true">/</span>
        <span>${esc(p.name)}</span>
      </nav>
      <div class="pdp">
        <div class="pdp__gallery">
          <div class="pdp__stage">
            ${images.length
              ? `<img id="pdpMain" src="${esc(images[0])}" alt="${esc(p.name)}">`
              : `<div class="pdp__blank" aria-hidden="true">${esc(p.name.charAt(0))}</div>`}
          </div>
          ${images.length > 1 ? `<div class="pdp__thumbs">${images.map((src, i) =>
            `<button type="button" class="pdp__thumb${i === 0 ? " is-active" : ""}" data-src="${esc(src)}" aria-label="Show photo ${i + 1} of ${images.length}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}
        </div>

        <div class="pdp__info">
          <div class="pdp__badges">
            <span class="badge badge--ok">AVAILABLE</span>
            ${marks.map((m) => `<span class="badge badge--hot-solid">${esc(m)}</span>`).join("")}
          </div>
          <h1 class="pdp__title">${esc(p.name)}</h1>
          <div class="pdp__price">
            <span class="pdp__now${pct ? " is-sale" : ""}">${money(p.price)}</span>
            ${pct ? `<s class="pdp__was">${money(p.compare_price)}</s><span class="badge badge--off">-${pct}% OFF</span>` : ""}
          </div>
          ${p.description ? `<p class="pdp__desc">${esc(p.description)}</p>` : ""}

          ${sizes.length ? `
          <fieldset class="pdp__sizes">
            <legend>Choose a size</legend>
            <div class="pdp__sizerow" id="pdpSizes">
              ${sizes.map((s) => `<button type="button" class="size-btn${s === chosen ? " is-active" : ""}" data-size="${esc(s)}" aria-pressed="${s === chosen}">${esc(s)}</button>`).join("")}
            </div>
          </fieldset>` : ""}

          <p class="form-msg" id="pdpMsg" role="status"></p>
          <div class="pdp__actions">
            <button class="btn btn--wa" id="pdpReserve" type="button">Chat to Reserve on WhatsApp</button>
            <button class="btn btn--ghost" id="pdpSave" type="button">Save to Rail List</button>
          </div>

          <h2 class="pdp__h2">Item specifications</h2>
          <table class="table pdp__specs"><tbody>
            ${specs.map((row) => `<tr><th scope="row">${esc(row[0])}</th><td>${esc(row[1])}</td></tr>`).join("")}
          </tbody></table>
          ${hasDetail ? "" : '<p class="pdp__note">Want the fabric or exact measurements? Ask us on WhatsApp and we will check the piece for you.</p>'}
        </div>
      </div>
      ${related.length ? `
      <section class="pdp__related">
        <h2>More from ${esc(cat ? cat.name : "this rail")}</h2>
        <div class="grid">${related.map(cardHTML).join("")}</div>
      </section>` : ""}`;

    const note = (text, good) => {
      const el = $("#pdpMsg");
      el.className = "form-msg " + (good ? "is-good" : "is-bad");
      el.textContent = text;
    };

    root.addEventListener("click", (event) => {
      const thumb = event.target.closest(".pdp__thumb");
      if (thumb) {
        $("#pdpMain").src = thumb.dataset.src;
        $$(".pdp__thumb", root).forEach((t) => t.classList.toggle("is-active", t === thumb));
        return;
      }
      const sizeBtn = event.target.closest(".size-btn");
      if (sizeBtn) {
        chosen = sizeBtn.dataset.size;
        $$(".size-btn", root).forEach((b) => {
          const on = b === sizeBtn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-pressed", String(on));
        });
        note("", true);
        return;
      }
      if (event.target.closest("#pdpSave")) {
        if (sizes.length && !chosen) { note("Pick a size first.", false); return; }
        addToCart(p.id, chosen);
        note("Saved to your list.", true);
        return;
      }
      if (event.target.closest("#pdpReserve")) {
        if (sizes.length && !chosen) { note("Pick a size first.", false); return; }
        if (waLive) {
          /* opened inside the click, so the browser does not block it */
          window.open(buildWALink(ORD.buildItemMessage(p, chosen, money, location.href)), "_blank");
          note("Opening WhatsApp so we can check this piece for you.", true);
          recordEnquiry(p, chosen);
        } else {
          addToCart(p.id, chosen);
          note("The WhatsApp line is not live yet, so we saved it to your list instead.", true);
        }
      }
    });
  }

  /* --- shop facts on the page ------------------------------------- */

  function paintShopInfo() {
    const zones = $("#zoneTable");
    if (zones) {
      zones.innerHTML = `
        <table class="table">
          <thead><tr><th>Where</th><th>Fee</th><th>When it arrives</th></tr></thead>
          <tbody>
            ${SHOP.delivery.map((z) => `
              <tr>
                <td>${esc(z.zone)}</td>
                <td>${z.fee ? money(z.fee) : "Free"}</td>
                <td>${esc(z.eta)}</td>
              </tr>`).join("")}
          </tbody>
        </table>`;
    }

    const hours = $("#hoursList");
    if (hours) {
      hours.innerHTML = SHOP.hours.map((h) =>
        `<li><b>${esc(h.days)}</b><br>${esc(h.open)} to ${esc(h.close)}</li>`).join("");
    }

    const where = $("#shopAddress");
    if (where) where.textContent = SHOP.address + ". " + SHOP.landmark + ".";

    const till = $("#mpesaLine");
    if (till) till.textContent = SHOP.mpesa.type + " · " + SHOP.mpesa.number + " · " + SHOP.mpesa.name;

    const days = $("#returnDays");
    if (days) days.textContent = SHOP.returnWindowDays;

    $$(".js-year").forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  /* --- social buttons ---------------------------------------------- */

  function paintSocial() {
    const urls = {
      whatsapp: waLive ? buildWALink("Hi " + SHOP.name + ", I am on your website and have a question.") : "",
      facebook: SHOP.social.facebook,
      instagram: SHOP.social.instagram
    };
    $$("[data-social]").forEach((el) => {
      const url = urls[el.dataset.social];
      if (url) {
        el.href = url;
        el.target = "_blank";
        el.rel = "noopener";
        el.classList.remove("is-pending");
        el.removeAttribute("aria-disabled");
        el.removeAttribute("title");
      } else {
        el.href = "#";
        el.classList.add("is-pending");
        el.setAttribute("aria-disabled", "true");
        el.title = "Coming soon";
        el.addEventListener("click", (event) => event.preventDefault());
      }
    });
  }

  /* --- concierge -------------------------------------------------- */

  function say(text, who) {
    const log = $("#chatLog");
    if (!log) return;
    const bubble = document.createElement("div");
    bubble.className = "bubble bubble--" + who;
    bubble.innerHTML = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  function answer(question) {
    say(esc(question), "me");
    const hit = FAQ.match(question);
    const body = esc(FAQ.render(hit.answer, SHOP));
    if (hit.matched) {
      say(body, "bot");
    } else if (waLive) {
      const link = buildWALink("Hi " + SHOP.name + ", a question from the website: " + question);
      say(body + '<br><a href="' + link + '" target="_blank" rel="noopener">Ask on WhatsApp</a>', "bot");
    } else {
      say(body + "<br>You can also come by the shop: " + esc(SHOP.landmark) + ".", "bot");
    }
  }

  function wireConcierge() {
    const panel = $("#concierge");
    if (!panel) return;
    const quick = $("#chatQuick");
    if (quick) {
      quick.innerHTML = FAQ.quick.map((q) =>
        `<button type="button" data-q="${esc(q.question)}">${esc(q.label)}</button>`).join("");
      quick.addEventListener("click", (event) => {
        const btn = event.target.closest("button");
        if (btn) answer(btn.dataset.q);
      });
    }
    $("#chatOpen").addEventListener("click", () => {
      panel.classList.add("is-open");
      $("#chatOpen").style.display = "none";
      if (!$("#chatLog").children.length) {
        say("Hello, I am the " + esc(SHOP.name) + " concierge. Ask me about delivery, sizing, payment or what is on the rail.", "bot");
      }
      $("#chatInput").focus();
    });
    $("#chatClose").addEventListener("click", () => {
      panel.classList.remove("is-open");
      $("#chatOpen").style.display = "";
    });
    $("#chatForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const input = $("#chatInput");
      const question = input.value.trim();
      if (!question) return;
      input.value = "";
      answer(question);
    });
  }

  /* --- reveal ------------------------------------------------------ */

  function wireReveal() {
    const targets = $$(".reveal");
    if (!targets.length || !window.IntersectionObserver) {
      targets.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    targets.forEach((el) => io.observe(el));
  }

  /* --- boot --------------------------------------------------------- */

  async function boot() {
    const burger = $("#burger");
    if (burger) {
      burger.addEventListener("click", () => {
        const nav = $("#nav");
        const open = nav.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", String(open));
      });
    }

    $$(".js-cart-open").forEach((btn) => btn.addEventListener("click", openDrawer));
    $$("[data-open-saved]").forEach((link) => link.addEventListener("click", (event) => {
      event.preventDefault();
      const nav = $("#nav");
      if (nav) nav.classList.remove("is-open");
      openDrawer();
    }));
    if ($("#cartClose")) $("#cartClose").addEventListener("click", closeDrawer);
    if (scrim) scrim.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeDrawer();
    });

    /* One delegated listener covers every card on every page,
       including the ones drawn after this point. */
    document.addEventListener("click", (event) => {
      const add = event.target.closest(".js-add");
      if (add) {
        const card = add.closest(".card");
        const picker = card ? card.querySelector(".js-size") : null;
        addToCart(add.dataset.id, picker ? picker.value : "");
        return;
      }
      const qty = event.target.closest("[data-qty]");
      if (qty) changeQty(qty.dataset.key, Number(qty.dataset.qty));
    });

    const chips = $("#chips");
    if (chips) {
      chips.addEventListener("click", (event) => {
        const chip = event.target.closest(".chip");
        if (!chip) return;
        view.cat = chip.dataset.slug;
        syncUrl();
        paintCatalogue();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    const sw = $("#storeSwitch");
    if (sw) {
      sw.addEventListener("click", (event) => {
        const btn = event.target.closest(".switch__btn");
        if (!btn) return;
        if (btn.hasAttribute("data-offers")) {
          view.offers = !view.offers;
        } else {
          view.store = btn.dataset.store;
        }
        syncUrl();
        paintCatalogue();
      });
    }

    const form = $("#checkoutForm");
    if (form) form.addEventListener("submit", submitOrder);

    const waBtn = $("#waDirect");
    if (waBtn) {
      if (waLive) {
        waBtn.href = buildWALink("Hi " + SHOP.name + ", I am on your website and have a question.");
      } else {
        waBtn.href = "delivery.html";
        waBtn.textContent = "Visit the shop";
      }
    }

    paintShopInfo();
    paintSocial();
    wireConcierge();
    wireReveal();
    paintCart();

    PRODUCTS = await loadProducts();
    reconcileCart();
    paintRail();
    paintBoutiqueCounts();
    paintProduct();
    paintCart();
    paintCheckout();

    if ($("#catalogue")) {
      const q = new URLSearchParams(location.search);
      const c = q.get("c") || "all";
      const s = q.get("s") || "all";
      view.cat = c === "all" || SHOP.categories.some((x) => x.slug === c) ? c : "all";
      view.store = s === "all" || STORES.some((x) => x.slug === s) ? s : "all";
      view.offers = q.get("offers") === "1";
      paintCatalogue();
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
