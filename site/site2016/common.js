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
      // Our own manifest, but still: numeric ids and paths inside catalog/ only.
      const safe = (f) => typeof f === "string" && !f.includes("..") && !/^[a-z]+:/i.test(f) && !f.startsWith("/");
      S._items = (m.items || []).filter((it) => it && Number(it.id) > 0 && safe(it.file) && (!it.thumb || safe(it.thumb)))
        .map((it) => Object.assign({}, it, { id: Number(it.id), name: String(it.name || ""), type: String(it.type || "") }));
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

  // ------------------------------------------------------------ the engine page
  // Inside index.html the engine page is our parent and answers through
  // window.RBLX2016_SITE (js/app.js). Opened on its own, pages fall back to
  // links into index.html.
  S.engine = () => {
    try {
      const p = window.parent;
      if (p && p !== window && p.location.origin === location.origin && p.RBLX2016_SITE) return p.RBLX2016_SITE;
    } catch (_) {}
    return null;
  };
  S.esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const json = (k, d) => { try { const v = JSON.parse(get(k, "null")); return v == null ? d : v; } catch (_) { return d; } };
  S.json = json;
  S.setJson = (k, v) => set(k, JSON.stringify(v));

  // ------------------------------------------------------------ places (games)
  // Bundled places are named "Title (2014 popular).rbxl"; split that up the way
  // the 2016 games pages showed title, genre and year.
  S.brand = (t) => String(t).replace(/(?<![A-Za-z0-9_.\/:@#<-])(ROBLOX|Roblox|roblox)(IANS|IAN|IA|ians|ian|ia)?(?![A-Za-z0-9_\-\/@]|\.[A-Za-z])/g,
    (m, w, suf) => ({ ROBLOX: "BLOXRO", Roblox: "Bloxro", roblox: "bloxro" })[w] + (suf || ""));
  function gameOf(p, pics) {
    const m = /^(.*?)\s*\((\d{4})\s*([^)]*)\)\s*$/.exec(p.name);
    const title = m ? m[1] : p.name, year = m ? m[2] : "", tag = m ? m[3].trim() : "";
    const genre = p.kind === "mine" ? "My Game" : p.kind === "local" ? "Your file"
      : /popular/i.test(tag) ? "Popular" : /classic/i.test(tag) ? "Classic" : /test map/i.test(tag) ? "Test map" : "Game";
    const pic = p.file && typeof pics[p.file] === "string" ? pics[p.file] : "";
    // Only our own thumbs/ folder; the index is data, never a URL to follow elsewhere.
    const thumb = /^thumbs\/[^:?#]+$/.test(pic) && !pic.includes("..") ? "../" + pic.split("/").map(encodeURIComponent).join("/") : "";
    return {
      id: p.id, name: p.name, title, year, genre, kind: p.kind, size: p.size, file: p.file, mineId: p.mineId,
      thumb, creator: p.kind === "mine" || p.kind === "local" ? S.userName() : "BLOXRO",
      // Xbox menu keys: bundled places by file name, others by id.
      key: p.file || p.id,
    };
  }
  S.loadGames = async function (fresh) {
    if (S._games && !fresh) return S._games;
    let pics = {};
    try { pics = await (await fetch("../thumbs/index.json", { cache: "no-cache" })).json(); } catch (_) {}
    if (!pics || typeof pics !== "object") pics = {};
    const eng = S.engine();
    let list = [];
    if (eng) {
      try { await (fresh ? eng.refresh() : eng.ready()); } catch (_) {}
      list = eng.places();
    } else {
      // Standalone: read the same lists the engine page reads.
      for (const url of ["../places", "../places/manifest.json"]) {
        try {
          const r = await fetch(url, { cache: "no-store" });
          if (!r.ok) continue;
          const j = await r.json();
          if (Array.isArray(j)) {
            list = j.filter((x) => x && typeof x.file === "string")
              .map((x) => ({ id: "place:" + x.file, name: S.brand(x.name || x.file), kind: "bundled", size: x.bytes, file: x.file }));
            break;
          }
        } catch (_) {}
      }
    }
    S._games = list.map((p) => gameOf(p, pics));
    return S._games;
  };
  S.gameById = (id) => (S._games || []).find((g) => g.id === id) || null;
  S.gameByKey = (k) => (S._games || []).find((g) => g.key === k) || null;
  S.gameUrl = (g) => "game.html?id=" + encodeURIComponent(g.id);
  S.GAME_THUMB_NONE = "assets/2016/game-default.svg";

  // Recently played and favorites are shared with the Xbox menu.
  const RECENT = "rblx2016.xbox.recent", FAVS = "rblx2016.xbox.favorites";
  const arr = (k) => { const v = json(k, []); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; };
  const obj = (k) => { const v = json(k, {}); return v && typeof v === "object" && !Array.isArray(v) ? v : {}; };
  S.recentKeys = () => arr(RECENT);
  S.favoriteKeys = () => arr(FAVS);
  S.isFavorite = (g) => arr(FAVS).includes(g.key);
  S.toggleFavorite = (g) => {
    const f = new Set(arr(FAVS));
    if (f.has(g.key)) f.delete(g.key); else f.add(g.key);
    S.setJson(FAVS, [...f]);
    return f.has(g.key);
  };
  S.visits = (g) => Number(obj("rblx2016.site.visits")[g.key]) || 0;
  S.vote = (g) => Number(obj("rblx2016.site.votes")[g.key]) || 0;
  S.setVote = (g, v) => {
    const all = obj("rblx2016.site.votes");
    if (v) all[g.key] = v > 0 ? 1 : -1; else delete all[g.key];
    S.setJson("rblx2016.site.votes", all);
  };
  function notePlayed(g) {
    const r = S.recentKeys().filter((k) => k !== g.key);
    r.unshift(g.key);
    S.setJson(RECENT, r.slice(0, 12));
    const v = obj("rblx2016.site.visits");
    v[g.key] = (Number(v[g.key]) || 0) + 1;
    S.setJson("rblx2016.site.visits", v);
  }

  // ------------------------------------------------------------ Play
  // The 2016 "now loading. Get ready to play!" box, then the game.
  S.play = function (g, opts) {
    opts = opts || {};
    const eng = S.engine();
    if (!eng) {
      top.location.href = new URL("../index.html?play=" + encodeURIComponent(g.id), location.href).href;
      return;
    }
    if (!eng.canPlay()) {
      S.alert("Can't play", "This browser has WebGL 2 turned off, so the 3D client can't draw. Turn on hardware acceleration in your browser settings, then reload.");
      return;
    }
    if (eng.busy()) return;
    const box = S.modal(
      '<div class="local-launch"><span class="local-launch-logo"></span>' +
      '<p class="local-launch-title">BLOXRO is now loading. Get ready to play!</p>' +
      '<p class="local-launch-status">Starting&hellip;</p>' +
      '<img class="local-launch-spinner" src="assets/www.roblox.com/images/spinners/loading_bluesquares.gif" alt=""></div>',
      { closable: false });
    const st = box.querySelector(".local-launch-status");
    notePlayed(g);
    const ok = eng.play(g.id, {
      server: opts.server || null, solo: !!opts.solo,
      onStatus(text, isError) {
        if (text) st.textContent = text;
        if (isError) {
          box.querySelector(".local-launch-spinner").hidden = true;
          st.classList.add("local-error");
          S.modalClosable(box);
        }
      },
    });
    if (!ok) { S.closeModal(box); S.alert("Can't play", "That game isn't available right now. Try reloading the page."); }
  };

  // ------------------------------------------------------------ modals
  S.modal = function (html, o) {
    o = o || {};
    const back = document.createElement("div");
    back.className = "local-modal-backdrop";
    back.innerHTML = '<div class="local-modal" role="dialog" aria-modal="true">' + html + "</div>";
    document.body.appendChild(back);
    if (o.closable !== false) S.modalClosable(back);
    return back;
  };
  S.modalClosable = function (back) {
    if (back.querySelector(".local-modal-close")) return;
    const x = document.createElement("a");
    x.className = "local-modal-close"; x.textContent = "×"; x.title = "Close";
    x.addEventListener("click", () => S.closeModal(back));
    back.querySelector(".local-modal").appendChild(x);
    back.addEventListener("click", (e) => { if (e.target === back) S.closeModal(back); });
  };
  S.closeModal = (back) => { if (back) back.remove(); };
  S.alert = function (title, text) {
    const b = S.modal('<h2 class="local-modal-title"></h2><p class="local-modal-text"></p>' +
      '<div class="local-modal-btns"><a class="btn-secondary-md">OK</a></div>');
    b.querySelector("h2").textContent = title;
    b.querySelector("p").textContent = text;
    b.querySelector(".btn-secondary-md").addEventListener("click", () => S.closeModal(b));
  };
  S.confirm = function (title, text, yes, onYes) {
    const b = S.modal('<h2 class="local-modal-title"></h2><p class="local-modal-text"></p>' +
      '<div class="local-modal-btns"><a class="btn-primary-md local-yes"></a> <a class="btn-control-md local-no">Cancel</a></div>');
    b.querySelector("h2").textContent = title;
    b.querySelector("p").textContent = text;
    b.querySelector(".local-yes").textContent = yes;
    b.querySelector(".local-yes").addEventListener("click", () => { S.closeModal(b); onYes(); });
    b.querySelector(".local-no").addEventListener("click", () => S.closeModal(b));
  };
  S.download = function (bytes, filename) {
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  // ------------------------------------------------------------ avatar picture
  // Drawn by the engine on the Character page (thumbs/__avatar.png).
  const PIC_KEY = "rblx2016.site.avatarPic";
  S.avatarPic = () => {
    const p = json(PIC_KEY, null);
    return p && p.v ? "../thumbs/__avatar.png?v=" + encodeURIComponent(p.v) : "";
  };
  S.avatarImg = function (cls) {
    const img = document.createElement("img");
    img.className = (cls ? cls + " " : "") + "local-avatar-pic";
    img.alt = S.userName();
    const fallback = "assets/2016/avatar-background.svg";
    const src = S.avatarPic();
    if (src) {
      img.src = src;
      img.onerror = () => { img.onerror = null; img.src = fallback; };
    } else {
      // Never drawn: draw it now, the way 2016 thumbnails appeared after a moment.
      img.src = "assets/www.roblox.com/images/spinners/loading_bluesquares.gif";
      img.classList.add("local-pic-pending");
      S.drawAvatar();
    }
    return img;
  };
  // Runs the engine's avatar render job in an invisible frame
  // (index.html?render=avatar&embed=1), which leaves thumbs/__avatar.png.
  let drawing = null;
  S.drawAvatar = function () {
    if (drawing) return drawing;
    const av = S.avatar;
    const want = JSON.stringify([av.body, av.head, av.face, av.tshirt, av.shirt, av.pants, av.accessories]);
    drawing = new Promise((resolve) => {
      const f = document.createElement("iframe");
      f.style.cssText = "position:fixed;left:0;top:0;width:640px;height:480px;border:0;opacity:0;pointer-events:none;z-index:-1";
      f.setAttribute("aria-hidden", "true");
      f.tabIndex = -1;
      let timer = 0;
      const done = (ok) => {
        window.removeEventListener("message", onMsg);
        clearTimeout(timer);
        f.remove();
        if (ok) {
          const v = Date.now().toString(36);
          S.setJson(PIC_KEY, { sig: want, v });
        }
        const src = S.avatarPic();
        for (const img of document.querySelectorAll("img.local-pic-pending")) {
          img.classList.remove("local-pic-pending");
          img.src = src || "assets/2016/avatar-background.svg";
        }
        resolve(ok);
      };
      const onMsg = (e) => {
        if (e.source === f.contentWindow && e.data && e.data.rblxAvatarRendered) done(e.data.rblxAvatarRendered !== "failed");
      };
      window.addEventListener("message", onMsg);
      timer = setTimeout(() => done(false), 120000);
      f.src = "../index.html?render=avatar&embed=1&test=none&mute=1&k=" + Date.now().toString(36);
      document.body.appendChild(f);
    });
    return drawing;
  };

  // ------------------------------------------------------------ header, left nav, footer
  // The logged-in 2016 chrome: blue bar (Games, Catalog, Develop, ROBUX,
  // search, settings) and the left column (Home ... Blog, Upgrade Now).
  const NAV = [
    ["home", "Home", "home.html", "icon-nav-home"],
    ["profile", "Profile", "profile.html", "icon-nav-profile"],
    ["messages", "Messages", "info.html?p=messages", "icon-nav-message"],
    ["friends", "Friends", "info.html?p=friends", "icon-nav-friends"],
    ["character", "Character", "character.html", "icon-nav-charactercustomizer"],
    ["inventory", "Inventory", "inventory.html", "icon-nav-inventory"],
    ["trade", "Trade", "info.html?p=trade", "icon-nav-trade"],
    ["groups", "Groups", "info.html?p=groups", "icon-nav-group"],
    ["forum", "Forum", "info.html?p=forum", "icon-nav-forum"],
    ["blog", "Blog", "info.html?p=blog", "icon-nav-blog"],
  ];
  S.wireChrome = function (current) {
    if (!document.querySelector('link[href="icons2016.css"]')) {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "icons2016.css"; document.head.appendChild(l);
    }
    const tier = S.bcTier();
    const name = S.esc(S.userName());
    const top = (cur) => [["games", "Games", "games.html"], ["catalog", "Catalog", "catalog.html"],
      ["develop", "Develop", "develop.html"], ["robux", "ROBUX", "info.html?p=robux"]].map(([id, t, h]) =>
      '<li><a href="' + h + '"' + (id === "robux" ? ' class="buy-robux"' : "") + (cur === id ? ' class="local-active"' : "") + ">" + t + "</a></li>").join("");
    const headerHtml =
      '<div class="container-fluid">' +
        '<div class="rbx-navbar-header">' +
          '<div class="rbx-nav-collapse" id="local-nav-toggle" title="Menu"><span class="icon-nav-menu"></span></div>' +
          '<div class="navbar-header"><a class="navbar-brand" href="home.html" title="Home"><span class="logo logo-transitional"></span></a></div>' +
        "</div>" +
        '<ul class="nav rbx-navbar hidden-xs hidden-sm col-md-4 col-lg-3">' + top(current) + "</ul>" +
        '<div id="navbar-universal-search" class="navbar-left rbx-navbar-search col-xs-5 col-sm-6 col-md-3" role="search">' +
          '<div class="input-group rbx-input-group">' +
            '<input id="navbar-search-input" class="form-control input-field" type="text" placeholder="Search" maxlength="120" autocomplete="off">' +
            '<div class="input-group-btn rbx-input-group-btn"><button id="navbar-search-btn" class="rbx-input-addon-btn" type="button" title="Search"><span class="icon-nav-search"></span></button></div>' +
          "</div>" +
          '<ul class="rbx-dropdown-menu local-search-menu" role="menu" hidden>' +
            '<li class="rbx-navbar-search-option" data-where="games"><span class="rbx-navbar-search-text">Search <span class="rbx-navbar-search-string"></span> in Games</span></li>' +
            '<li class="rbx-navbar-search-option" data-where="catalog"><span class="rbx-navbar-search-text">Search <span class="rbx-navbar-search-string"></span> in Catalog</span></li>' +
            '<li class="rbx-navbar-search-option" data-where="inventory"><span class="rbx-navbar-search-text">Search <span class="rbx-navbar-search-string"></span> in Inventory</span></li>' +
          "</ul>" +
        "</div>" +
        '<div class="navbar-right rbx-navbar-right col-xs-4 col-sm-3">' +
          '<ul class="nav navbar-right rbx-navbar-icon-group">' +
            '<li id="navbar-setting" class="navbar-icon-item"><a class="rbx-menu-item" id="local-settings-btn" title="Settings"><span class="icon-nav-settings" id="nav-settings"></span></a>' +
              '<ul class="rbx-dropdown-menu local-settings-menu" role="menu" hidden>' +
                '<li><a class="rbx-menu-item" href="settings.html">Settings</a></li>' +
                '<li><a class="rbx-menu-item" href="develop.html">BLOXRO Studio</a></li>' +
                '<li><a class="rbx-menu-item" href="../xbox/" target="_top">Xbox One</a></li>' +
              "</ul></li>" +
            '<li id="navbar-robux" class="navbar-icon-item"><a class="rbx-menu-item" href="info.html?p=robux" title="Everything is free"><span class="icon-nav-robux" id="nav-robux"></span><span class="rbx-text-navbar-right" id="nav-robux-amount">FREE</span></a></li>' +
            '<li class="rbx-navbar-right-search" id="local-search-toggle"><a class="rbx-menu-icon rbx-menu-item"><span class="icon-nav-search-white"></span></a></li>' +
          "</ul>" +
        "</div>" +
        '<ul class="nav rbx-navbar hidden-md hidden-lg col-xs-12">' + top(current) + "</ul>" +
      "</div>";
    let header = document.getElementById("header");
    if (!header) { header = document.createElement("div"); document.body.prepend(header); }
    header.id = "header";
    header.className = "navbar-fixed-top rbx-header";
    header.setAttribute("role", "navigation");
    header.innerHTML = headerHtml;

    // Left column
    let left = document.getElementById("navigation");
    if (!left) { left = document.createElement("div"); header.after(left); }
    left.id = "navigation";
    left.className = "rbx-left-col";
    left.innerHTML =
      '<ul><li class="text-lead"><a class="text-overflow local-left-name" href="profile.html">' +
        (tier ? '<img src="' + S.BC_ICONS[tier] + '" alt=""> ' : "") + name + "</a></li>" +
      '<li class="rbx-divider"></li></ul>' +
      '<div class="rbx-scrollbar"><ul>' +
        NAV.map(([id, t, h, icon]) => '<li><a href="' + h + '" id="nav-' + id + '"' + (current === id ? ' class="local-on"' : "") +
          '><span class="' + icon + '"></span><span>' + t + "</span></a></li>").join("") +
        '<li class="rbx-upgrade-now"><a href="info.html?p=bc" class="btn-secondary-md" id="upgrade-now-button">' + (tier ? "Builders Club" : "Upgrade Now") + "</a></li>" +
        '<li class="font-bold small local-events">Events</li>' +
        '<li><a href="../xbox/" target="_top" class="local-event local-event-xbox"><b>BLOXRO</b> on Xbox One</a></li>' +
        '<li><a href="develop.html" class="local-event local-event-studio">Build your own game in <b>BLOXRO Studio</b></a></li>' +
      "</ul></div>";

    // Narrow windows: the menu button slides the left column in.
    document.getElementById("local-nav-toggle").addEventListener("click", (e) => {
      e.stopPropagation();
      left.classList.toggle("nav-show");
    });
    document.addEventListener("click", (e) => { if (!left.contains(e.target)) left.classList.remove("nav-show"); });

    // Settings gear menu
    const gear = document.getElementById("local-settings-btn"), gmenu = header.querySelector(".local-settings-menu");
    gear.addEventListener("click", (e) => { e.stopPropagation(); gmenu.hidden = !gmenu.hidden; });
    document.addEventListener("click", () => { gmenu.hidden = true; });

    // Universal search: Games / Catalog / Inventory, like 2016's dropdown.
    const search = document.getElementById("navbar-search-input"), smenu = header.querySelector(".local-search-menu");
    let pick = current === "catalog" ? "catalog" : current === "inventory" ? "inventory" : "games";
    const showMenu = () => {
      const q = search.value.trim();
      smenu.hidden = !q;
      for (const s of smenu.querySelectorAll(".rbx-navbar-search-string")) s.textContent = '"' + q + '"';
      for (const li of smenu.children) li.classList.toggle("selected", li.dataset.where === pick);
    };
    const go = (where) => {
      const enc = encodeURIComponent(search.value.trim());
      if (where === "catalog") { location.href = "catalog.html#search=" + enc; if (current === "catalog") location.reload(); }
      else if (where === "inventory") location.href = "inventory.html?keyword=" + enc;
      else location.href = "games.html?keyword=" + enc;
    };
    search.addEventListener("input", showMenu);
    search.addEventListener("keydown", (e) => {
      const opts = [...smenu.children].map((li) => li.dataset.where);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        pick = opts[(opts.indexOf(pick) + (e.key === "ArrowDown" ? 1 : opts.length - 1)) % opts.length];
        showMenu();
      } else if (e.key === "Enter") { e.preventDefault(); go(pick); }
      else if (e.key === "Escape") smenu.hidden = true;
    });
    for (const li of smenu.children) li.addEventListener("mousedown", (e) => { e.preventDefault(); go(li.dataset.where); });
    search.addEventListener("blur", () => setTimeout(() => { smenu.hidden = true; }, 150));
    document.getElementById("navbar-search-btn").addEventListener("click", () => go(pick));
    document.getElementById("local-search-toggle").addEventListener("click", () => {
      document.getElementById("navbar-universal-search").classList.toggle("local-search-open");
      search.focus();
    });

    // Footer: the 2016 links, pointed at things that exist here.
    const foot = document.querySelector("footer.container-footer");
    const footHtml = '<div class="footer"><ul class="row footer-links">' +
      [["Games", "games.html"], ["Catalog", "catalog.html"], ["Develop", "develop.html"], ["Character", "character.html"],
        ["Settings", "settings.html"], ["Xbox One", "../xbox/"]].map(([t, h]) =>
        '<li class="col-4 col-xs-2 footer-link"><a href="' + h + '" class="text-footer-nav"' + (h.startsWith("..") ? ' target="_top"' : "") + ">" + t + "</a></li>").join("") +
      '</ul><p class="text-footer footer-note">BLOXRO is an unofficial, non-commercial fan archive of the 2016 client and website. ' +
      "It is not affiliated with, sponsored or endorsed by any company. Everything runs in your browser.</p></div>";
    if (foot) foot.innerHTML = footHtml;
    else { const f = document.createElement("footer"); f.className = "container-footer"; f.innerHTML = footHtml; document.body.appendChild(f); }
  };

  // Page helper: the 2016 page frame (header, left column, content, footer).
  S.page = function (current, title) {
    if (title) document.title = title + " - BLOXRO";
    S.wireChrome(current);
  };

  // ------------------------------------------------------------ DOM helpers
  // Text always goes in through textContent: place and file names come from
  // files people drop in, so none of it is ever parsed as HTML.
  S.el = function (tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  // The 2016 game card: thumbnail, name, a grey line, the vote bar, and the
  // creator shown on hover.
  S.gameCard = function (g) {
    const li = S.el("li", "list-item game-card");
    const box = S.el("div", "game-card-container");
    const a = S.el("a", "game-card-link");
    a.href = S.gameUrl(g);
    a.title = g.title;
    const tc = S.el("div", "game-card-thumb-container");
    const img = S.el("img", "game-card-thumb");
    img.alt = g.title;
    img.loading = "lazy";
    img.src = g.thumb || S.GAME_THUMB_NONE;
    img.onerror = () => { img.onerror = null; img.src = S.GAME_THUMB_NONE; };
    tc.appendChild(img);
    a.append(tc, S.el("div", "text-overflow game-card-name", g.title),
      S.el("div", "game-card-name-secondary", [g.year, g.genre].filter(Boolean).join(" \u00b7 ")));
    const vote = S.el("div", "game-card-vote");
    const my = S.vote(g), likes = my > 0 ? 5 : my < 0 ? 1 : 4;
    vote.appendChild(S.el("span", "icon-thumbs-up"));
    const bar = S.el("span", "vote-bar");
    for (let i = 0; i < 5; i++) bar.appendChild(S.el("i", i < likes ? "on" : "off"));
    vote.appendChild(bar);
    a.appendChild(vote);
    box.appendChild(a);
    if (g.kind === "mine") box.appendChild(S.el("span", "local-ribbon", "Mine"));
    const cr = S.el("div", "game-card-creator", "By ");
    const ca = S.el("a", "", g.creator);
    ca.href = g.kind === "mine" || g.kind === "local" ? "profile.html" : "games.html";
    cr.appendChild(ca);
    box.appendChild(cr);
    li.appendChild(box);
    return li;
  };
  S.sectionHeader = function (title, moreHref) {
    const h = S.el("div", "container-header");
    h.appendChild(S.el("h3", "", title));
    if (moreHref) {
      const m = S.el("a", "btn-secondary-xs btn-more see-all-link-icon", "See All");
      m.href = moreHref;
      h.appendChild(m);
    }
    return h;
  };

  window.Site2016 = S;
})();
