/* ===========================================================
   MAGGIE'S COLLECTION — admin/admin.js
   Staff desk: sign in, manage products, work through orders.
   Loaded after ../js/config.js. Every write below is checked
   again by row level security in docs/supabase-rls.sql, so a
   stolen anon key still cannot touch the shop.
   =========================================================== */

(function () {
  "use strict";

  const SHOP = window.SHOP;
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const KEYS_READY =
    window.SUPABASE_URL.indexOf("YOUR-PROJECT-REF") === -1 &&
    window.SUPABASE_ANON_KEY.indexOf("YOUR-ANON") === -1;

  const sb = (KEYS_READY && window.supabase)
    ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
    : null;

  const STATUSES = ["new", "confirmed", "packed", "out for delivery", "delivered", "cancelled"];

  let editingId = null;

  function money(value) {
    return SHOP.currency + " " + Number(value || 0).toLocaleString("en-KE");
  }

  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function note(target, text, good) {
    const el = $(target);
    if (!el) return;
    el.className = "admin-msg " + (good ? "is-good" : "is-bad");
    el.textContent = text;
  }

  function when(stamp) {
    if (!stamp) return "";
    const d = new Date(stamp);
    return d.toLocaleDateString("en-KE", { day: "numeric", month: "short" }) +
      " " + d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
  }

  /* --- gate ------------------------------------------------------ */

  function showDesk(email) {
    $("#gate").hidden = true;
    $("#desk").hidden = false;
    $("#who").textContent = email;
    loadProducts();
    loadOrders();
  }

  function showGate(message) {
    $("#gate").hidden = false;
    $("#desk").hidden = true;
    if (message) note("#gateMsg", message, false);
  }

  async function signIn(event) {
    event.preventDefault();
    if (!sb) {
      note("#gateMsg", "Add your Supabase URL and anon key to js/config.js before signing in.", false);
      return;
    }
    const email = $("#email").value.trim();
    const password = $("#password").value;
    note("#gateMsg", "Checking those details…", true);
    const { data, error } = await sb.auth.signInWithPassword({ email: email, password: password });
    if (error) {
      note("#gateMsg", "That email and password did not match. Try again.", false);
      return;
    }
    showDesk(data.user.email);
  }

  async function signOut() {
    if (sb) await sb.auth.signOut();
    showGate("Signed out.");
  }

  /* --- products -------------------------------------------------- */

  async function loadProducts() {
    if (!sb) return;
    const { data, error } = await sb.from("products").select("*").order("sort", { ascending: true });
    if (error) {
      note("#productMsg", "Could not load products: " + error.message, false);
      return;
    }
    paintProducts(data || []);
  }

  function paintProducts(rows) {
    const list = $("#productList");
    if (!rows.length) {
      list.innerHTML = '<p class="row__meta">No products yet. Add the first one using the form above.</p>';
      return;
    }
    list.innerHTML = rows.map((p) => `
      <div class="row">
        <div>
          <div class="row__title">${esc(p.name)}</div>
          <div class="row__meta">
            ${money(p.price)} · ${esc(p.category)} ·
            ${Array.isArray(p.sizes) && p.sizes.length ? esc(p.sizes.join(", ")) : "no sizes"} ·
            <span class="pill${p.active ? " pill--new" : ""}">${p.active ? "on the rail" : "hidden"}</span>
          </div>
        </div>
        <div class="row__acts">
          <button class="mini" type="button" data-edit="${esc(p.id)}">Edit</button>
          <button class="mini${p.active ? " mini--on" : ""}" type="button" data-toggle="${esc(p.id)}" data-active="${p.active}">${p.active ? "Hide" : "Show"}</button>
          <button class="mini mini--danger" type="button" data-delete="${esc(p.id)}">Delete</button>
        </div>
      </div>`).join("");

    window.__adminProducts = rows;
  }

  function fillForm(product) {
    editingId = product ? product.id : null;
    $("#pName").value = product ? product.name : "";
    $("#pPrice").value = product ? product.price : "";
    $("#pCategory").value = product ? product.category : SHOP.categories[0].slug;
    $("#pDescription").value = product ? (product.description || "") : "";
    $("#pImage").value = product ? (product.image_url || "") : "";
    $("#pSizes").value = product && Array.isArray(product.sizes) ? product.sizes.join(", ") : "";
    $("#pSort").value = product ? (product.sort || 0) : 0;
    $("#pActive").checked = product ? !!product.active : true;
    $("#saveProduct").textContent = product ? "Save changes" : "Add product";
    $("#cancelEdit").hidden = !product;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (!sb) {
      note("#productMsg", "Add your Supabase keys to js/config.js first.", false);
      return;
    }
    const payload = {
      name: $("#pName").value.trim(),
      price: Number($("#pPrice").value),
      category: $("#pCategory").value,
      description: $("#pDescription").value.trim(),
      image_url: $("#pImage").value.trim(),
      sizes: $("#pSizes").value.split(",").map((s) => s.trim()).filter(Boolean),
      sort: Number($("#pSort").value) || 0,
      active: $("#pActive").checked
    };
    if (!payload.name || !payload.price) {
      note("#productMsg", "A product needs a name and a price.", false);
      return;
    }

    const result = editingId
      ? await sb.from("products").update(payload).eq("id", editingId)
      : await sb.from("products").insert(payload);

    if (result.error) {
      note("#productMsg", "Save failed: " + result.error.message, false);
      return;
    }
    note("#productMsg", editingId ? "Changes saved." : payload.name + " is on the rail.", true);
    fillForm(null);
    loadProducts();
  }

  async function toggleProduct(id, isActive) {
    if (!sb) return;
    const { error } = await sb.from("products").update({ active: !isActive }).eq("id", id);
    if (error) { note("#productMsg", "Could not change that: " + error.message, false); return; }
    loadProducts();
  }

  async function deleteProduct(id) {
    if (!sb) return;
    const row = (window.__adminProducts || []).find((p) => String(p.id) === String(id));
    const name = row ? row.name : "this product";
    if (!window.confirm("Delete " + name + " for good? Hiding it keeps the record instead.")) return;
    const { error } = await sb.from("products").delete().eq("id", id);
    if (error) { note("#productMsg", "Delete failed: " + error.message, false); return; }
    note("#productMsg", name + " deleted.", true);
    loadProducts();
  }

  /* --- orders ----------------------------------------------------- */

  async function loadOrders() {
    if (!sb) return;
    const { data, error } = await sb
      .from("orders").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) {
      note("#orderMsg", "Could not load orders: " + error.message, false);
      return;
    }
    paintOrders(data || []);
  }

  function paintOrders(rows) {
    const filter = $("#orderFilter").value;
    const shown = filter === "all" ? rows : rows.filter((o) => o.status === filter);
    const list = $("#orderList");
    if (!shown.length) {
      list.innerHTML = '<p class="row__meta">Nothing here yet.</p>';
      return;
    }
    list.innerHTML = shown.map((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      return `
        <div class="row">
          <div>
            <div class="row__title">${esc(o.code || o.id)} · ${esc(o.customer_name)}</div>
            <div class="row__meta">
              ${when(o.created_at)} · ${esc(o.customer_phone)} · ${esc(o.customer_location)} ·
              ${money(o.total)} ·
              <span class="pill${o.status === "new" ? " pill--new" : ""}${o.status === "delivered" ? " pill--done" : ""}">${esc(o.status)}</span>
            </div>
            <ul class="order-items">
              ${items.map((i) => `<li>${i.qty} × ${esc(i.name)}${i.size ? " (" + esc(i.size) + ")" : ""}</li>`).join("")}
            </ul>
            ${o.notes ? `<div class="row__meta">Notes: ${esc(o.notes)}</div>` : ""}
          </div>
          <div class="row__acts">
            <select class="mini" data-status="${esc(o.id)}">
              ${STATUSES.map((s) => `<option value="${s}"${s === o.status ? " selected" : ""}>${s}</option>`).join("")}
            </select>
          </div>
        </div>`;
    }).join("");

    window.__adminOrders = rows;
  }

  async function setStatus(id, status) {
    if (!sb) return;
    const { error } = await sb.from("orders").update({ status: status }).eq("id", id);
    if (error) { note("#orderMsg", "Could not update: " + error.message, false); return; }
    note("#orderMsg", "Order moved to " + status + ".", true);
    loadOrders();
  }

  /* --- wiring ------------------------------------------------------ */

  function wireTabs() {
    $$(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        $$(".tab").forEach((t) => t.classList.toggle("is-active", t === tab));
        $$(".pane").forEach((pane) => {
          pane.classList.toggle("is-active", pane.id === "pane-" + tab.dataset.pane);
        });
      });
    });
  }

  function fillSelects() {
    $("#pCategory").innerHTML = SHOP.categories
      .map((c) => `<option value="${c.slug}">${c.name}</option>`).join("");
    $("#orderFilter").innerHTML = ['<option value="all">every order</option>']
      .concat(STATUSES.map((s) => `<option value="${s}">${s}</option>`)).join("");
  }

  async function boot() {
    fillSelects();
    wireTabs();

    $("#gateForm").addEventListener("submit", signIn);
    $("#signOut").addEventListener("click", signOut);
    $("#productForm").addEventListener("submit", saveProduct);
    $("#cancelEdit").addEventListener("click", () => fillForm(null));
    $("#refreshOrders").addEventListener("click", loadOrders);
    $("#orderFilter").addEventListener("change", () => paintOrders(window.__adminOrders || []));

    $("#productList").addEventListener("click", (event) => {
      const edit = event.target.closest("[data-edit]");
      if (edit) {
        const row = (window.__adminProducts || []).find((p) => String(p.id) === edit.dataset.edit);
        if (row) fillForm(row);
        return;
      }
      const toggle = event.target.closest("[data-toggle]");
      if (toggle) {
        toggleProduct(toggle.dataset.toggle, toggle.dataset.active === "true");
        return;
      }
      const del = event.target.closest("[data-delete]");
      if (del) deleteProduct(del.dataset.delete);
    });

    $("#orderList").addEventListener("change", (event) => {
      const picker = event.target.closest("[data-status]");
      if (picker) setStatus(picker.dataset.status, picker.value);
    });

    if (!sb) {
      showGate("Supabase is not configured yet. Add your project URL and anon key to js/config.js.");
      return;
    }

    const { data } = await sb.auth.getSession();
    if (data && data.session) {
      showDesk(data.session.user.email);
    } else {
      showGate("");
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
