/* ===========================================================
   MAGGIE'S COLLECTION — js/script.js
   One file, every storefront page. Loaded after config.js
   and faq.js. Nothing here assumes a page's markup exists;
   each block bails quietly if its hooks are missing.
   =========================================================== */

(function () {
  "use strict";

  const SHOP = window.SHOP;
  const FAQ = window.MC_FAQ;
  const CART_KEY = SHOP.cartKey;

  /* --- supabase ------------------------------------------------ */

  const KEYS_READY =
    window.SUPABASE_URL.indexOf("YOUR-PROJECT-REF") === -1 &&
    window.SUPABASE_ANON_KEY.indexOf("YOUR-ANON") === -1;

  const sb = (KEYS_READY && window.supabase)
    ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
    : null;

  /* Shown only while Supabase keys are still the placeholders, so the
     shop can be walked through on a phone before the backend exists.
     The moment real keys land in config.js this list is never read. */
  const DEMO_PRODUCTS = [
    { id: "d1", name: "Amboseli wrap dress", price: 3200, category: "dresses", description: "Cotton wrap with a tie waist.", image_url: "", sizes: ["S", "M", "L"], active: true, sort: 1 },
    { id: "d2", name: "Sunday pleat midi", price: 3800, category: "dresses", description: "Lined pleats, holds a press.", image_url: "", sizes: ["M", "L", "XL"], active: true, sort: 2 },
    { id: "d3", name: "Linen shell top", price: 1450, category: "tops", description: "Breathes through a Kimana afternoon.", image_url: "", sizes: ["S", "M", "L", "XL", "XXL", "3XL"], active: true, sort: 3 },
    { id: "d4", name: "Puff sleeve blouse", price: 1800, category: "tops", description: "Office by day, dinner by night.", image_url: "", sizes: ["S", "M", "L"], active: true, sort: 4 },
    { id: "d5", name: "High waist tailored trouser", price: 2600, category: "bottoms", description: "Women's cut, stretch weave, letter sizes.", image_url: "", sizes: ["S", "M", "L", "XL", "XXL"], active: true, sort: 5 },
    { id: "d9", name: "Oxford shirt", price: 2200, category: "menswear", description: "Cotton, holds a collar all day.", image_url: "", sizes: ["M", "L", "XL", "XXL", "3XL"], active: true, sort: 9 },
    { id: "d10", name: "Chino trouser", price: 2800, category: "menswear", description: "Men's straight leg, numbered waist.", image_url: "", sizes: ["30", "32", "34", "36", "38", "40"], active: true, sort: 10 },
    { id: "d6", name: "Kitenge circle skirt", price: 2400, category: "ankara", description: "Cut and sewn by our tailor.", image_url: "", sizes: ["One size"], active: true, sort: 6 },
    { id: "d7", name: "Everyday tote", price: 1950, category: "bags", description: "Fits a laptop and a market run.", image_url: "", sizes: ["Small", "Medium", "Large"], active: true, sort: 7 },
    { id: "d11", name: "Hardshell travel case", price: 6500, category: "bags", description: "Cabin-friendly, four spinner wheels.", image_url: "", sizes: ["Suitcase"], active: true, sort: 11 },
    { id: "d8", name: "Block heel sandal", price: 2900, category: "shoes", description: "Steady on a murram road.", image_url: "", sizes: ["36", "37", "38", "39", "40"], active: true, sort: 8 }
  ];

  let PRODUCTS = [];

  async function loadProducts() {
    if (!sb) return DEMO_PRODUCTS.slice();
    const { data, error } = await sb
      .from("products")
      .select("*")
      .eq("active", true)
      .order("sort", { ascending: true });
    if (error) {
      console.error("products load failed:", error.message);
      return [];
    }
    return data || [];
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

  function orderCode() {
    const now = new Date();
    const stamp = now.toISOString().slice(2, 10).replace(/-/g, "");
    const tail = Math.floor(1000 + Math.random() * 9000);
    return SHOP.orderPrefix + "-" + stamp + "-" + tail;
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
      line.image = live.image_url || "";
      return true;
    });
    writeCart(cart);
    if (dropped && $("#cartNote")) {
      $("#cartNote").textContent = dropped === 1
        ? "One piece left your cart because it sold out."
        : dropped + " pieces left your cart because they sold out.";
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
        name: live.name,
        price: Number(live.price),
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

  function paintCart() {
    const body = $("#cartLines");
    if (!body) return;
    if (!cart.length) {
      body.innerHTML = '<div class="state">Your cart is empty. Browse the catalogue and add a piece to start.</div>';
    } else {
      body.innerHTML = cart.map((line) => `
        <div class="line">
          ${line.image
            ? `<img class="line__thumb" src="${esc(line.image)}" alt="${esc(line.name)}">`
            : '<div class="line__thumb"></div>'}
          <div>
            <div class="line__name">${esc(line.name)}</div>
            <div class="line__meta">${line.size ? esc(line.size) + " · " : ""}${money(line.price)}</div>
          </div>
          <div class="qty">
            <button type="button" data-qty="-1" data-key="${esc(line.key)}" aria-label="Remove one">−</button>
            <span>${line.qty}</span>
            <button type="button" data-qty="1" data-key="${esc(line.key)}" aria-label="Add one">+</button>
          </div>
        </div>`).join("");
    }
    const totalEl = $("#cartTotal");
    if (totalEl) totalEl.textContent = money(cartTotal());
    const goBtn = $("#toCheckout");
    if (goBtn) goBtn.disabled = cart.length === 0;
    paintCount();
  }

  /* --- product cards -------------------------------------------- */

  function cardHTML(product) {
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    const picker = sizes.length
      ? `<select class="js-size" aria-label="Size for ${esc(product.name)}">
           ${sizes.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join("")}
         </select>`
      : "";
    return `
      <article class="card">
        <div class="card__media">
          ${product.image_url ? `<img src="${esc(product.image_url)}" alt="${esc(product.name)}" loading="lazy">` : ""}
          <span class="card__tag">${esc(categoryName(product.category))}</span>
        </div>
        <div class="card__body">
          <h3 class="card__name">${esc(product.name)}</h3>
          ${product.description ? `<p class="card__desc">${esc(product.description)}</p>` : ""}
          ${picker ? `<label class="field" style="margin:0.4rem 0 0"><span>Size</span>${picker}</label>` : ""}
          <div class="card__foot">
            <span class="card__price">${money(product.price)}</span>
            <button class="btn btn--rose js-add" type="button" data-id="${esc(product.id)}">Add to cart</button>
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

  /* --- catalogue ------------------------------------------------ */

  function paintCatalogue(activeSlug) {
    const wrap = $("#catalogue");
    if (!wrap) return;

    const used = SHOP.categories.filter((cat) =>
      PRODUCTS.some((p) => p.category === cat.slug));

    const chips = $("#chips");
    if (chips) {
      chips.innerHTML = [{ slug: "all", name: "Everything" }].concat(used).map((cat) =>
        `<button class="chip${cat.slug === activeSlug ? " is-active" : ""}" type="button" data-slug="${esc(cat.slug)}">${esc(cat.name)}</button>`
      ).join("");
    }

    const shown = activeSlug === "all" ? used : used.filter((c) => c.slug === activeSlug);

    if (!PRODUCTS.length) {
      wrap.innerHTML = '<div class="state">The rail is empty right now. New stock is added most weeks.</div>';
      return;
    }
    if (!shown.length) {
      wrap.innerHTML = '<div class="state">Nothing in that category today. Tap Everything to see the full rail.</div>';
      return;
    }

    wrap.innerHTML = shown.map((cat) => {
      const items = PRODUCTS.filter((p) => p.category === cat.slug);
      return `
        <section class="cat-block" id="cat-${esc(cat.slug)}">
          <div class="cat-block__head">
            <h2>${esc(cat.name)}</h2>
            <span class="cat-block__count">${items.length} ${items.length === 1 ? "piece" : "pieces"}</span>
          </div>
          <div class="grid">${items.map(cardHTML).join("")}</div>
        </section>`;
    }).join("");

    spyCategories();
  }

  /* Scroll-spy keeps the sticky chip in step with the rail you are in. */
  function spyCategories() {
    const blocks = $$(".cat-block");
    if (!blocks.length || !window.IntersectionObserver) return;
    const spy = new IntersectionObserver((entries) => {
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
    const base = zone ? Number(zone.fee) : 0;
    return cartTotal() >= SHOP.freeDeliveryFrom ? 0 : base;
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
        : "Delivery " + money(fee) + " on top of " + money(cartTotal()) + ".";
    }
  }

  function orderMessage(details) {
    const lines = cart.map((line) =>
      "• " + line.qty + " × " + line.name + (line.size ? " (" + line.size + ")" : "") +
      " — " + money(line.price * line.qty));
    return [
      "Order " + details.code + " · " + SHOP.name,
      "",
      lines.join("\n"),
      "",
      "Items: " + money(cartTotal()),
      "Delivery (" + details.zone + "): " + (details.fee ? money(details.fee) : "free"),
      "Total: " + money(details.total),
      "",
      "Name: " + details.name,
      "Phone: " + details.phone,
      "Deliver to: " + details.location,
      details.notes ? "Notes: " + details.notes : ""
    ].filter(Boolean).join("\n");
  }

  async function submitOrder(event) {
    event.preventDefault();
    const msg = $("#checkoutMsg");
    if (!cart.length) {
      msg.className = "form-msg is-bad";
      msg.textContent = "Add a piece to your cart first.";
      return;
    }

    const details = {
      code: orderCode(),
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

    /* The WhatsApp tab is opened inside the click itself, before any
       await, or the browser treats it as a blocked pop-up. Saving to
       Supabase happens after and never blocks the message. */
    if (waLive) {
      window.open(buildWALink(orderMessage(details)), "_blank");
    }

    msg.className = "form-msg is-good";
    msg.textContent = waLive
      ? "Order " + details.code + " is on its way to WhatsApp. Keep this number safe."
      : "Order " + details.code + " is saved. The WhatsApp line is not live yet — call in at the shop or check back shortly.";

    const payload = {
      code: details.code,
      customer_name: details.name,
      customer_phone: details.phone,
      customer_location: details.location,
      notes: details.notes,
      zone: details.zone,
      items: cart,
      subtotal: cartTotal(),
      delivery_fee: details.fee,
      total: details.total,
      status: "new"
    };

    if (sb) {
      const { error } = await sb.from("orders").insert(payload);
      if (error) console.error("order save failed:", error.message);
    }

    cart = [];
    writeCart(cart);
    paintCart();
    $("#checkoutForm").reset();
    paintCheckout();
  }

  /* --- shop facts on the page ------------------------------------- */

  /* The delivery and contact pages read straight from SHOP so the
     fees quoted to a shopper can never drift from the ones charged
     at checkout. */
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

    const free = $("#freeFrom");
    if (free) free.textContent = money(SHOP.freeDeliveryFrom);

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
        const slug = chip.dataset.slug;
        history.replaceState(null, "", slug === "all" ? location.pathname : "?c=" + slug);
        paintCatalogue(slug);
        window.scrollTo({ top: 0, behavior: "smooth" });
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
    wireConcierge();
    wireReveal();
    paintCart();

    PRODUCTS = await loadProducts();
    reconcileCart();
    paintRail();
    paintCart();
    paintCheckout();

    if ($("#catalogue")) {
      const wanted = new URLSearchParams(location.search).get("c") || "all";
      const known = wanted === "all" || SHOP.categories.some((c) => c.slug === wanted);
      paintCatalogue(known ? wanted : "all");
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
