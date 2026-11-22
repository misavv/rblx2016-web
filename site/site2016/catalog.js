/* Drives the ported 2016 catalog page with the local, all-free catalog.
 * Items are rendered in the original 2016 card markup so the original CSS
 * styles them; the original sidebar, search box and header are wired up. */
(function () {
  "use strict";
  const S = window.Site2016;
  const PER_PAGE = 36;
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // 2016 sidebar asset-type ids -> local item types.
  const TYPE_MAP = {
    9: ["hat", "hair", "shoulder", "back"], 10: ["face"], 12: ["shirt"], 13: ["tshirt"], 14: ["pants"],
    15: ["head"], 3: ["shirt", "tshirt", "pants"], 4: ["head", "face"], 11: [], 5: [],
  };
  const TITLE = { 9: "Hats", 10: "Faces", 12: "Shirts", 13: "T-Shirts", 14: "Pants", 15: "Heads",
    3: "Clothing", 4: "Body Parts", 11: "Packages", 5: "Gear" };
  const state = { types: null, title: "Featured Items on ROBLOX", keyword: "", page: 0 };

  function card(item) {
    const owned = S.owns(item.id);
    const created = item.created ? item.created : "";
    return '<div class="CatalogItemOuter SmallOuter">' +
      '<div class="SmallCatalogItemView SmallView">' +
      '<div class="CatalogItemInner SmallInner">' +
      '<div class="roblox-item-image image-small" data-item-id="' + item.id + '" data-image-size="small">' +
      '<div class="item-image-wrapper"><a href="#item=' + item.id + '" data-item="' + item.id + '">' +
      '<img title="' + esc(item.name) + '" alt="' + esc(item.name) + '" class="original-image " loading="lazy" src="' + esc(S.thumb(item)) + '"/>' +
      '</a></div></div>' +
      '<div id="textDisplay">' +
      '<div class="CatalogItemName notranslate"><a class="name notranslate" href="#item=' + item.id + '" data-item="' + item.id +
      '" title="' + esc(item.name) + '">' + esc(item.name) + '</a></div>' +
      '<div class="robux-price"><span class="NotAPrice">' + (owned ? "Owned" : "Free") + '</span></div>' +
      '</div>' +
      '<div class="CatalogHoverContent">' +
      '<div><span class="CatalogItemInfoLabel">Creator:</span> <span class="HoverInfo notranslate"><a>' + esc(item.creator || "ROBLOX") + '</a></span></div>' +
      (created ? '<div><span class="CatalogItemInfoLabel">Updated:</span> <span class="HoverInfo">' + esc(created) + '</span></div>' : "") +
      '<div><span class="CatalogItemInfoLabel">Price:</span> <span class="HoverInfo">Free</span></div>' +
      '</div>' +
      '</div></div></div>';
  }

  function filtered(items) {
    const kw = state.keyword.toLowerCase();
    return items.filter((it) => (!state.types || state.types.includes(it.type)) &&
      (!kw || it.name.toLowerCase().includes(kw)));
  }

  function render() {
    const items = S._items || [];
    const list = filtered(items);
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    state.page = Math.max(0, Math.min(state.page, pages - 1));
    $("local-title").textContent = state.keyword ? 'Search results for "' + state.keyword + '"' : state.title;
    $("local-status").textContent = list.length
      ? list.length.toLocaleString() + " items · everything is free"
      : (state.types && !state.types.length
        ? "There are no items of this type in the offline catalog."
        : "No items found.");
    const slice = list.slice(state.page * PER_PAGE, state.page * PER_PAGE + PER_PAGE);
    $("local-items").innerHTML = slice.map(card).join("");
    const pager = $("local-pager");
    pager.innerHTML = "";
    if (pages > 1) {
      const mk = (label, page, disabled) => {
        const a = document.createElement("a");
        a.className = "btn-control btn-control-medium" + (disabled ? " disabled" : "");
        a.textContent = label;
        if (!disabled) a.addEventListener("click", () => { state.page = page; render(); window.scrollTo(0, 0); });
        return a;
      };
      const label = document.createElement("span");
      label.className = "local-page-label";
      label.textContent = "Page " + (state.page + 1) + " of " + pages;
      pager.append(mk("« Previous", state.page - 1, state.page === 0), label,
        mk("Next »", state.page + 1, state.page >= pages - 1));
    }
  }

  // ------------------------------------------------------------- item popup
  function openItem(id) {
    const item = S.byId(id);
    if (!item) return;
    const back = $("local-modal-backdrop");
    back.hidden = false;
    back.innerHTML =
      '<div class="local-modal simplemodal-wrap" role="dialog" aria-modal="true" aria-label="' + esc(item.name) + '">' +
      '<a class="local-modal-close icon-close" title="Close">×</a>' +
      '<div class="local-item">' +
      '<div class="local-item-thumb"><img alt="" src="' + esc(S.thumb(item)) + '"></div>' +
      '<div class="local-item-info">' +
      '<h2 class="notranslate">' + esc(item.name) + '</h2>' +
      '<div class="local-item-by">By <a>' + esc(item.creator || "ROBLOX") + '</a></div>' +
      '<table class="local-item-meta"><tr><td>Price:</td><td class="local-free">Free</td></tr>' +
      '<tr><td>Type:</td><td>' + esc(item.type.replace("tshirt", "t-shirt")) + '</td></tr>' +
      (item.created ? '<tr><td>Created:</td><td>' + esc(item.created) + '</td></tr>' : "") + '</table>' +
      '<div class="local-item-btns">' +
      '<a class="btn-primary btn-medium" data-act="get"></a> ' +
      '<a class="btn-control btn-control-medium" data-act="wear"></a>' +
      '</div>' +
      '<p class="local-item-note"></p>' +
      '</div></div></div>';
    const sync = () => {
      const get = back.querySelector('[data-act="get"]');
      get.textContent = S.owns(item.id) ? "Owned" : "Get (Free)";
      get.classList.toggle("disabled", S.owns(item.id));
      back.querySelector('[data-act="wear"]').textContent = S.isWorn(item) ? "Take Off" : "Wear";
      back.querySelector(".local-item-note").textContent = S.isWorn(item)
        ? "You're wearing this." : (S.owns(item.id) ? "It's in your inventory — wear it from Avatar." : "");
    };
    sync();
    back.querySelector('[data-act="get"]').addEventListener("click", () => { S.give(item.id); sync(); render(); });
    back.querySelector('[data-act="wear"]').addEventListener("click", () => { S.toggleWear(item); sync(); render(); });
    const close = () => { back.hidden = true; back.innerHTML = ""; if (location.hash.startsWith("#item=")) history.replaceState(null, "", location.pathname); };
    back.querySelector(".local-modal-close").addEventListener("click", close);
    back.addEventListener("click", (e) => { if (e.target === back) close(); });
    document.addEventListener("keydown", function onKey(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", onKey); } });
  }

  // ------------------------------------------------------------- wiring
  function wireSidebar() {
    // The 2016 "hierarchical dropdown": show a category's slide-out on hover.
    for (const li of document.querySelectorAll("#dropdownUl > li.subcategories")) {
      const sub = li.querySelector("ul.slideOut");
      if (!sub) continue;
      li.addEventListener("mouseenter", () => { sub.style.display = "block"; });
      li.addEventListener("mouseleave", () => { sub.style.display = "none"; });
      sub.addEventListener("click", () => { sub.style.display = "none"; });
    }
    for (const a of document.querySelectorAll(".assetTypeFilter")) {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const t = a.getAttribute("data-types");
        const cat = a.getAttribute("data-category");
        state.keyword = "";
        state.page = 0;
        if (t !== null && TYPE_MAP[t] !== undefined && !(cat === "5" && t !== "5")) {
          state.types = TYPE_MAP[t];
          state.title = (cat === "0" ? "Featured " : "") + (TITLE[t] || a.textContent.trim());
        } else if (cat === "5") {
          state.types = []; state.title = "Gear";
        } else if (cat === "3") {
          state.types = TYPE_MAP[3]; state.title = "Clothing";
        } else if (cat === "4") {
          state.types = TYPE_MAP[4]; state.title = "Body Parts";
        } else {
          state.types = null; state.title = a.textContent.trim() === "All Categories" ? "All Categories" : "Featured Items on ROBLOX";
        }
        render();
      });
    }
    const kw = $("keywordTextbox");
    const doSearch = (e) => { if (e) e.preventDefault(); state.keyword = (kw.value || "").trim(); state.page = 0; render(); };
    if (kw) kw.addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(e); });
    const btn = $("submitSearchButton");
    if (btn) btn.addEventListener("click", doSearch);
    $("local-items").addEventListener("click", (e) => {
      const a = e.target.closest("[data-item]");
      if (!a) return;
      e.preventDefault();
      openItem(Number(a.getAttribute("data-item")));
    });
  }

  async function boot() {
    S.wireChrome("catalog");
    wireSidebar();
    $("local-status").textContent = "Loading the catalog…";
    try { await S.loadItems(); } catch (_) { $("local-status").textContent = "Couldn't load catalog/manifest.json."; return; }
    const m = /#search=([^&]*)/.exec(location.hash);
    if (m) { state.keyword = decodeURIComponent(m[1]); const kw = $("keywordTextbox"); if (kw) kw.value = state.keyword; }
    render();
    $("local-getall").addEventListener("click", async () => {
      const btn = $("local-getall");
      const added = await S.giveAll();
      btn.textContent = added ? "Got " + added.toLocaleString() + " items! Wear them under Avatar" : "You own everything";
      setTimeout(() => { btn.textContent = "Get Everything"; }, 3000);
      render();
    });
    const item = /#item=(\d+)/.exec(location.hash);
    if (item) openItem(Number(item[1]));
  }
  boot();
})();
