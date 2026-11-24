/* Shared glue for the ported 2016 site pages (catalog.html, character.html).
 * Uses the same localStorage keys as the game menu (js/app.js), so whatever you
 * get or wear here is what your character spawns with. Talks to the menu
 * through postMessage when the page runs inside the menu's overlay. */
(function () {
  "use strict";
  const AVATAR_KEY = "rblx2016.avatar", INV_KEY = "rblx2016.inventory", BC_KEY = "rblx2016.bc";
  const ACCESSORY_TYPES = ["hat", "hair", "shoulder", "back"];
  const SLOTS = ["head", "shirt", "pants", "tshirt", "face"];
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (_) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };

  function loadAvatar() {
    let s = {};
    try { s = JSON.parse(get(AVATAR_KEY, "{}")) || {}; } catch (_) {}
    const noob = [24, 24, 24, 23, 37, 37];
    const body = Array.isArray(s.body) && s.body.length === 6 ? s.body.map((n) => Number(n) || 24) : noob.slice();
    const acc = Array.isArray(s.accessories) ? s.accessories : (Array.isArray(s.hats) ? s.hats : []);
    return {
      shirt: Number(s.shirt) || 0, pants: Number(s.pants) || 0, tshirt: Number(s.tshirt) || 0,
      face: Number(s.face) || 0, head: Number(s.head) || 0,
      accessories: acc.map(Number).filter(Boolean), body,
    };
  }
  const avatar = loadAvatar();
  function loadInventory() {
    let ids = null;
    try { ids = JSON.parse(get(INV_KEY, "null")); } catch (_) {}
    if (!Array.isArray(ids)) ids = SLOTS.map((k) => avatar[k]).filter(Boolean).concat(avatar.accessories);
    return new Set(ids.map(Number).filter(Boolean));
  }
  const inventory = loadInventory();
  // When each item was got (ms), for the wardrobe's "Recently Acquired" order.
  // Items from "Get Everything" have no time and sort by catalog date instead.
  const ACQ_KEY = "rblx2016.acquired";
  let acquired = {};
  try { acquired = JSON.parse(get(ACQ_KEY, "{}")) || {}; } catch (_) {}

  function notify(what) {
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({ rblx2016: what }, location.origin); } catch (_) {}
    }
  }
  function saveAvatar() { set(AVATAR_KEY, JSON.stringify(avatar)); notify("avatar"); }
  function saveInventory() { set(INV_KEY, JSON.stringify([...inventory])); notify("avatar"); }

  const S = {
    avatar, inventory, ACCESSORY_TYPES,
    owns: (id) => inventory.has(Number(id)),
    give(id) {
      id = Number(id);
      if (id && !inventory.has(id)) {
        inventory.add(id);
        acquired[id] = Date.now();
        set(ACQ_KEY, JSON.stringify(acquired));
        saveInventory();
      }
    },
    acquiredAt: (id) => Number(acquired[id]) || 0,
    // Put every catalog item in the inventory at once. Returns how many were new.
    async giveAll() {
      const items = await S.loadItems();
      let added = 0;
      for (const it of items) if (!inventory.has(it.id)) { inventory.add(it.id); added++; }
      if (added) saveInventory();
      return added;
    },
    isWorn(item) {
      return ACCESSORY_TYPES.includes(item.type) ? avatar.accessories.includes(item.id) : avatar[item.type] === item.id;
    },
    toggleWear(item) {
      S.give(item.id);
      if (ACCESSORY_TYPES.includes(item.type)) {
        avatar.accessories = S.isWorn(item)
          ? avatar.accessories.filter((x) => x !== item.id) : avatar.accessories.concat(item.id);
      } else if (item.type in avatar) {
        avatar[item.type] = S.isWorn(item) ? 0 : item.id;
      }
      saveAvatar();
    },
    setBodyColor(slot, n) { avatar.body[slot] = n; saveAvatar(); },
    bcTier: () => Math.max(0, Math.min(3, Number(get(BC_KEY, "0")) || 0)),
    setBcTier(n) { set(BC_KEY, String(n)); notify("avatar"); },
    userName: () => (get("rblx2016.name", "") || "").trim() || "Player1",
    thumb: (item) => "../catalog/" + (item.thumb || item.file),
    async loadItems() {
      if (S._items) return S._items;
      const r = await fetch("../catalog/manifest.json", { cache: "no-store" });
      const m = await r.json();
      S._items = (m.items || []).filter((it) => it && it.id && it.file);
      S._byId = new Map(S._items.map((it) => [it.id, it]));
      return S._items;
    },
    byId: (id) => (S._byId ? S._byId.get(Number(id)) || null : null),
    BC_ICONS: ["", "../content/textures/ui/icon_BC-16.png", "../content/textures/ui/icon_TBC-16.png",
      "../content/textures/ui/icon_OBC-16.png"],
    goMenu() {
      if (window.parent && window.parent !== window) notify("close");
      else location.href = "../index.html";
    },
  };

  // Turn the archived 2016 header/footer into local navigation.
  S.wireChrome = function (current) {
    const header = document.getElementById("header");
    if (header) {
      for (const a of header.querySelectorAll("a")) {
        const href = a.getAttribute("href") || "";
        const text = a.textContent.trim();
        if (a.classList.contains("navbar-brand") || text === "Games") {
          a.href = "#"; a.addEventListener("click", (e) => { e.preventDefault(); S.goMenu(); });
          if (text === "Games") a.textContent = "Play";
        } else if (text === "Catalog") {
          a.href = "catalog.html";
        } else if (text === "Develop") {
          a.textContent = "Avatar"; a.href = "character.html";
        } else if (a.classList.contains("buy-robux")) {
          a.parentElement && (a.parentElement.style.display = "none");
        } else if (/^https?:/.test(href)) {
          a.removeAttribute("href");
        }
        if ((current === "catalog" && text === "Catalog") || (current === "character" && a.textContent === "Avatar")) {
          a.classList.add("local-active");
        }
      }
      // Log In / Sign Up -> your name (+ BC badge).
      const right = header.querySelector(".rbx-navbar-right-nav");
      if (right) {
        right.innerHTML = "";
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "rbx-navbar-login local-user";
        a.href = "character.html";
        const tier = S.bcTier();
        if (tier) { const i = document.createElement("img"); i.src = S.BC_ICONS[tier]; i.alt = ""; a.appendChild(i); }
        a.appendChild(document.createTextNode(S.userName()));
        li.appendChild(a);
        right.appendChild(li);
      }
      const search = document.getElementById("navbar-search-input");
      const go = () => { location.href = "catalog.html#search=" + encodeURIComponent(search.value.trim()); if (current === "catalog") location.reload(); };
      if (search) {
        search.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } });
        const btn = document.getElementById("navbar-search-btn");
        if (btn) btn.addEventListener("click", (e) => { e.preventDefault(); go(); });
      }
    }
    for (const a of document.querySelectorAll("footer a")) { a.removeAttribute("href"); a.removeAttribute("target"); }
  };

  window.Site2016 = S;
})();
