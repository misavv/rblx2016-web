/* Web port of the ROBLOX Xbox One app shell (2015-2017, PlatformContent/durango).
 *
 * Screens follow the Lua modules: EngagementScreen -> AppHub with the TabDock
 * (Home, Avatar, Games, Friends, Catalog), GameDetail, SettingsScreen. One
 * focus system drives everything; mouse, keyboard and gamepad all move it:
 *   mouse     hover = focus, click = A, wheel scrolls
 *   keyboard  arrows/WASD move, Enter/Space = A, Esc/Backspace = B, X = Settings,
 *             Q/E (or PageUp/PageDown) = previous/next tab
 *   gamepad   d-pad/left stick move, A, B, X, LB/RB switch tabs (standard mapping)
 * Data is the site's own: places from places/, the free catalog, and the saved
 * avatar/inventory the main page uses (localStorage). */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const stage = $("stage");

  // ------------------------------------------------------------ storage
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
    raw(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    setRaw(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
  };
  const settings = Object.assign({ music: false, sfx: true, overscan: 100 }, store.get("rblx2016.xbox.settings", {}));
  const saveSettings = () => store.set("rblx2016.xbox.settings", settings);

  // ------------------------------------------------------------ stage scaling (OverscanScreen)
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080) * (settings.overscan / 100);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
    stage.style.transformOrigin = "50% 50%";
    stage.style.left = "50%"; stage.style.top = "50%";
    stage.style.marginLeft = "0"; stage.style.marginTop = "0";
  }
  addEventListener("resize", fit);
  fit();

  // ------------------------------------------------------------ sound (SoundManager)
  const sfx = {};
  for (const n of ["MoveSelection", "ButtonPress", "ScreenChange", "OverlayOpen", "PopUp", "PurchaseSuccess", "Error", "SideMenuSlideIn"]) {
    const a = new Audio("sounds/" + n + ".mp3");
    a.preload = "auto"; a.volume = 0.5;
    sfx[n] = a;
  }
  function play(n) {
    if (!settings.sfx || !sfx[n]) return;
    try { const a = sfx[n].cloneNode(); a.volume = 0.5; a.play().catch(() => {}); } catch (_) {}
  }
  const music = new Audio("sounds/RobloxMusic.ogg");
  music.loop = true; music.volume = 0.35;
  function syncMusic() { if (settings.music && started) music.play().catch(() => {}); else music.pause(); }

  // ------------------------------------------------------------ data
  const PLACE_CATS = [
    { id: "popular", title: "Popular", test: (n) => /popular\)/i.test(n) },
    { id: "games", title: "Featured", test: (n) => !/classic\)|test map\)|popular\)/i.test(n) },
    { id: "classic", title: "Classics", test: (n) => /classic\)/i.test(n) },
    { id: "test", title: "Test Maps", test: (n) => /test map\)/i.test(n) },
  ];
  let places = [];
  let catalog = [];
  const catalogById = new Map();

  async function loadPlaces() {
    for (const url of ["../places", "../places/manifest.json"]) {
      try {
        const r = await fetch(url, { cache: "no-cache" });
        if (!r.ok) continue;
        const list = await r.json();
        if (Array.isArray(list)) { places = list.filter((p) => p && p.file); return; }
      } catch (_) {}
    }
  }
  async function loadCatalog() {
    try {
      const j = await (await fetch("../catalog/manifest.json")).json();
      catalog = (j.items || []).filter((it) => it && it.id);
      for (const it of catalog) catalogById.set(Number(it.id), it);
    } catch (_) {}
  }
  function splitName(name) {
    const m = /^(.*?)\s*\((\d{4})\s*([^)]*)\)\s*$/.exec(name);
    return m ? { title: m[1], year: m[2], kind: m[3] } : { title: name, year: "", kind: "" };
  }
  const favs = new Set(store.get("rblx2016.xbox.favorites", []));
  const recent = store.get("rblx2016.xbox.recent", []);

  // avatar / inventory: same format as the main page (js/app.js)
  const ACCESSORY_TYPES = ["hat", "hair", "shoulder", "back"];
  const BRICK = { 24: "#f5cd30", 1: "#f2f3f3", 194: "#a3a2a5", 199: "#635f62", 21: "#c4281c", 23: "#0d69ac", 28: "#287f47",
    37: "#4b974b", 106: "#da8541", 5: "#d7c59a", 192: "#694028", 217: "#7c5c46", 18: "#cc8e69", 102: "#6e99ca",
    119: "#a4bd47", 101: "#da867a", 9: "#e8bac8", 107: "#008f9c", 2: "#a1a5a2", 226: "#fdea8d" };
  function loadAvatar() {
    const s = store.get("rblx2016.avatar", {}) || {};
    let body = Array.isArray(s.body) && s.body.length === 6 ? s.body.map((n) => Number(n) || 24) : [24, 24, 24, 23, 37, 37];
    if (body.join(",") === "24,24,24,24,24,24") body = [24, 24, 24, 23, 37, 37];
    const acc = Array.isArray(s.accessories) ? s.accessories : (Array.isArray(s.hats) ? s.hats : []);
    return { shirt: +s.shirt || 0, pants: +s.pants || 0, tshirt: +s.tshirt || 0, face: +s.face || 0, head: +s.head || 0,
      accessories: acc.map(Number).filter(Boolean), body };
  }
  let avatar = loadAvatar();
  const inventory = new Set((store.get("rblx2016.inventory", null) ||
    ["head", "shirt", "pants", "tshirt", "face"].map((k) => avatar[k]).filter(Boolean).concat(avatar.accessories)).map(Number));
  const saveAvatar = () => store.set("rblx2016.avatar", avatar);
  const saveInventory = () => store.set("rblx2016.inventory", [...inventory]);
  const isWorn = (it) => ACCESSORY_TYPES.includes(it.type) ? avatar.accessories.includes(it.id) : avatar[it.type] === it.id;
  function toggleWear(it) {
    inventory.add(it.id); saveInventory();
    if (ACCESSORY_TYPES.includes(it.type)) {
      avatar.accessories = isWorn(it) ? avatar.accessories.filter((x) => x !== it.id) : avatar.accessories.concat(it.id);
    } else {
      avatar[it.type] = isWorn(it) ? 0 : it.id;
    }
    saveAvatar();
    refreshAvatars();
  }

  // ------------------------------------------------------------ 3D avatars (js/avatar3d.js)
  const viewers = [];
  function makeViewer(canvas) {
    if (!window.Avatar3D) return;
    const v = window.Avatar3D.create(canvas);
    if (v) { viewers.push(v); drawViewer(v); }
  }
  function drawViewer(v) {
    const hex = (n) => BRICK[n] || "#a3a2a5";
    const item = (id) => (id ? "../catalog/item/" + id : null);
    v.setAvatar({
      body: avatar.body.map(hex),
      shirt: item(avatar.shirt), pants: item(avatar.pants), tshirt: item(avatar.tshirt),
      face: avatar.face ? item(avatar.face) : "../content/textures/face.png",
      accessories: avatar.accessories.map((id) => catalogById.get(id)).filter(Boolean).map((it) => "../catalog/" + it.file),
      brickHex: hex,
    });
  }
  function refreshAvatars() { for (const v of viewers) drawViewer(v); }

  // ------------------------------------------------------------ element helpers
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function navBtn(cls, text, onA) {
    const b = el("button", "nav " + cls, text);
    b.type = "button";
    b.tabIndex = -1;
    b._onA = onA;
    return b;
  }
  function hashHue(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) % 360; }

  function gameTile(p, size) {
    const n = splitName(p.name);
    const t = navBtn("tile", null, () => openDetail(p));
    t.style.width = t.style.height = size + "px";
    const hue = hashHue(n.title);
    t.style.background = `linear-gradient(135deg, hsl(${hue} 45% 34%), hsl(${(hue + 40) % 360} 50% 16%))`;
    const art = el("div", "art");
    const img = el("img", "noimg"); img.src = "shell/Icons/NoGameImageIcon.png"; img.alt = "";
    art.append(img);
    const label = el("div", "label", n.title);
    label.style.fontSize = (size > 250 ? 26 : 20) + "px";
    t.append(art, label);
    if (favs.has(p.file)) {
      const star = el("img", "badge"); star.src = "shell/Icons/FavoriteStar@1080.png"; star.alt = "Favorite";
      t.append(star);
    }
    t._game = p;
    return t;
  }
  function itemTile(it, onA) {
    const t = navBtn("tile", null, onA);
    t.style.width = t.style.height = "200px";
    t.style.background = "rgba(255,255,255,0.08)";
    const art = el("div", "art");
    const img = el("img", "thumb"); img.loading = "lazy"; img.alt = ""; img.src = "../catalog/" + it.thumb;
    art.append(img);
    t.append(art, el("div", "label", it.name));
    if (isWorn(it)) { const b = el("img", "badge"); b.src = "shell/Icons/EquippedOverlay.png"; b.alt = "Wearing"; t.append(b); }
    t._item = it;
    return t;
  }

  // ------------------------------------------------------------ focus engine
  let layers = [];          // stack of layer elements; the top one owns focus
  let focused = null;
  const layerFocus = new WeakMap();

  function topLayer() { return layers[layers.length - 1]; }
  function navigables(root) {
    return [...(root || topLayer()).querySelectorAll(".nav")].filter((e) => e.offsetParent !== null && !e.closest("[hidden]"));
  }
  function setFocus(e, quiet) {
    if (!e || e === focused) return;
    if (focused) focused.classList.remove("focus");
    focused = e;
    e.classList.add("focus");
    layerFocus.set(topLayer(), e);
    // keep the focused item in view inside whatever scrolls it
    e.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    if (!quiet) play("MoveSelection");
    if (e._onFocus) e._onFocus();
  }
  function rectOf(e) { return e.getBoundingClientRect(); }
  function move(dir) {
    let list = navigables();
    if (!list.length) return;
    if (!focused || !list.includes(focused)) { setFocus(list[0]); return; }
    const onTab = focused.classList.contains("tab");
    // TabDock: left/right walk the tabs only.
    if (onTab && (dir === "left" || dir === "right")) list = list.filter((e) => e.classList.contains("tab"));
    const a = rectOf(focused);
    const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    const slack = 6;
    // gap between two ranges on the cross axis (0 when they overlap)
    const gap = (lo1, hi1, lo2, hi2) => Math.max(0, lo2 - hi1, lo1 - hi2);
    let best = null, bestScore = Infinity;
    for (const c of list) {
      if (c === focused) continue;
      const b = rectOf(c);
      const bx = b.left + b.width / 2, by = b.top + b.height / 2;
      let primary, cross, center;
      if (dir === "left") { if (b.right > a.left + slack) continue; primary = a.left - b.right; cross = gap(a.top, a.bottom, b.top, b.bottom); center = Math.abs(by - ay); }
      else if (dir === "right") { if (b.left < a.right - slack) continue; primary = b.left - a.right; cross = gap(a.top, a.bottom, b.top, b.bottom); center = Math.abs(by - ay); }
      else if (dir === "up") { if (b.bottom > a.top + slack) continue; primary = a.top - b.bottom; cross = gap(a.left, a.right, b.left, b.right); center = Math.abs(bx - ax); }
      else { if (b.top < a.bottom - slack) continue; primary = b.top - a.bottom; cross = gap(a.left, a.right, b.left, b.right); center = Math.abs(bx - ax); }
      // Prefer things in line with the current item, then the nearest one.
      const score = Math.max(0, primary) + cross * 4 + center * 0.15;
      if (score < bestScore) { bestScore = score; best = c; }
    }
    // Leaving a pane upwards lands on that pane's tab, not whichever is nearest.
    if (best && !onTab && best.classList.contains("tab")) best = tabs[currentTab].btn;
    if (best) setFocus(best);
  }
  function pressA() {
    if (!focused) return;
    play("ButtonPress");
    if (focused._onA) focused._onA(focused);
  }
  function pushLayer(layer, first) {
    // Full screens (detail, settings) replace what's under them; modals don't.
    const under = topLayer();
    if (under && layer.classList.contains("screen")) { under.style.visibility = "hidden"; layer._under = under; }
    layers.push(layer);
    layer.hidden = false;
    if (focused) focused.classList.remove("focus");
    focused = null;
    setFocus(first || navigables(layer)[0], true);
  }
  function popLayer() {
    const l = layers.pop();
    if (l && l._under) l._under.style.visibility = "";
    if (l && l._remove) l.remove(); else if (l) l.hidden = true;
    if (focused) focused.classList.remove("focus");
    focused = null;
    const top = topLayer();
    if (top) setFocus(layerFocus.get(top) && layerFocus.get(top).isConnected ? layerFocus.get(top) : navigables(top)[0], true);
    play("ScreenChange");
  }
  function pressB() {
    const top = topLayer();
    if (!top) return;
    if (top.id === "hub") {
      // B in a pane goes back up to its tab (AppHub behaviour)
      const tab = tabs[currentTab].btn;
      if (focused !== tab) { setFocus(tab); play("ButtonPress"); }
      return;
    }
    if (top.id === "engage") return;
    popLayer();
  }

  // ------------------------------------------------------------ hub & tabs (AppHub / TabDock)
  const tabs = [
    { id: "home", title: "HOME", render: renderHome },
    { id: "avatar", title: "AVATAR", render: renderAvatar },
    { id: "games", title: "GAMES", render: renderGames },
    { id: "friends", title: "FRIENDS", render: renderFriends },
    { id: "robux", title: "ROBUX", render: renderRobux },
  ];
  let currentTab = 0;
  function buildDock() {
    const dock = $("dock");
    tabs.forEach((t, i) => {
      t.btn = navBtn("tab", t.title, () => { const f = navigables($(t.id))[0]; if (f) setFocus(f); });
      t.btn._onFocus = () => selectTab(i);
      dock.append(t.btn);
    });
  }
  function selectTab(i, focusTab) {
    if (i !== currentTab) play("ScreenChange");
    currentTab = i;
    tabs.forEach((t, j) => {
      t.btn.classList.toggle("active", j === i);
      $(t.id).hidden = j !== i;
    });
    const t = tabs[i];
    if (!t.rendered) { t.render($(t.id)); t.rendered = true; }
    if (focusTab) setFocus(t.btn, true);
  }
  function cycleTab(d) { selectTab((currentTab + d + tabs.length) % tabs.length, true); }

  // ------------------------------------------------------------ panes
  function gridSort(title, list, width, tile, cols) {
    const box = el("div", "grid-sort");
    box.style.width = width + "px";
    box.append(el("h2", "section-title", title));
    const g = el("div", "grid");
    g.style.gridTemplateColumns = `repeat(${cols}, ${tile}px)`;
    for (const p of list) g.append(gameTile(p, tile));
    if (!list.length) { const m = el("p", "muted", "Nothing here yet."); m.style.fontSize = "24px"; g.append(m); }
    box.append(g);
    return box;
  }
  const byFile = (f) => places.find((p) => p.file === f);
  function renderHome(pane) {
    pane.textContent = "";
    const prof = el("div", "profile");
    const box = el("div", "profile-box");
    const cv = el("canvas"); cv.width = 520; cv.height = 440;
    box.append(cv);
    const edit = navBtn("edit-avatar", null, () => selectTab(1, false) || focusFirst("avatar"));
    const ic = el("img"); ic.src = "shell/Icons/CustomizeIcon@1080.png"; ic.alt = "";
    edit.append(ic, document.createTextNode("Edit Avatar"));
    box.append(edit);
    const fr = el("div", "friends-box");
    fr.append(el("h2", "section-title", "Friend Activity"), el("p", null, "Your friends are not online"));
    prof.append(box, fr);
    const sorts = el("div", "home-sorts");
    const favList = [...favs].map(byFile).filter(Boolean).slice(0, 4);
    const recList = recent.map(byFile).filter(Boolean).slice(0, 4);
    sorts.append(gridSort("Favorites", favList, 378, 184, 2), gridSort("Recently Played", recList, 378, 184, 2));
    const featured = places.filter((p) => /popular\)/i.test(p.name)).slice(0, 6);
    sorts.append(gridSort("Featured", featured, 858, 276, 3));
    pane.append(prof, sorts);
    makeViewer(cv);
  }
  function focusFirst(id) { const f = navigables($(id))[0]; if (f) setFocus(f); }

  function renderGames(pane) {
    pane.textContent = "";
    const rows = el("div", "rows");
    for (const cat of PLACE_CATS) {
      const list = places.filter((p) => cat.test(p.name));
      if (!list.length) continue;
      const row = el("div", "row");
      const h = el("h2", "section-title", cat.title);
      h.append(el("span", "count", list.length + " games"));
      const strip = el("div", "strip");
      for (const p of list) strip.append(gameTile(p, 276));
      row.append(h, strip);
      rows.append(row);
    }
    pane.append(rows);
  }

  const CAT_TYPES = [
    { id: "hat", label: "Hats" }, { id: "hair", label: "Hair" }, { id: "face", label: "Faces" },
    { id: "shirt", label: "Shirts" }, { id: "pants", label: "Pants" }, { id: "tshirt", label: "T-Shirts" },
    { id: "head", label: "Heads" }, { id: "back", label: "Back" }, { id: "shoulder", label: "Shoulder" },
  ];
  function pagedItemGrid(container, items, makeTile, pageSize) {
    let shown = 0;
    const g = el("div", "grid");
    container.textContent = "";
    container.append(g);
    let more = null;
    function next() {
      if (more) more.remove();
      const slice = items.slice(shown, shown + pageSize);
      for (const it of slice) g.append(makeTile(it));
      shown += slice.length;
      if (shown < items.length) {
        more = navBtn("tile", null, () => { const at = shown; next(); if (g.children[at]) setFocus(g.children[at], true); });
        more.style.width = more.style.height = "200px";
        const art = el("div", "art"); const i = el("img", "noimg"); i.src = "shell/Buttons/MoreButton@1080.png"; i.style.width = "60%"; i.style.opacity = "1";
        art.append(i);
        more.append(art, el("div", "label", `More (${items.length - shown})`));
        g.append(more);
      } else more = null;
      if (!items.length) { const m = el("p", "muted", "Nothing here yet."); m.style.fontSize = "28px"; g.append(m); }
    }
    next();
  }

  let avatarSection = "collection";   // AvatarOutfitsTitle / AvatarCatalogTitle
  let avatarFilter = "all";
  let catalogType = "hat";
  function renderAvatar(pane) {
    pane.textContent = "";
    const st = el("div", "avatar-stage");
    const cv = el("canvas"); cv.width = 560; cv.height = 700;
    const glow = el("img", "glow"); glow.src = "shell/Images/CharacterGlow/CharacterGlowBase.png"; glow.alt = "";
    st.append(glow, cv);
    const col = el("div", "collection");
    const sections = el("div", "chips sections");
    const chips = el("div", "chips");
    const items = el("div", "items");
    const owned = () => [...inventory].map((id) => catalogById.get(id)).filter(Boolean);
    function wearTile(it) {
      return itemTile(it, (t) => {
        toggleWear(it);
        const fresh = wearTile(it);
        t.replaceWith(fresh); setFocus(fresh, true);
        toast(isWorn(it) ? "Wearing " + it.name : "Took off " + it.name);
      });
    }
    function drawItems() {
      if (avatarSection === "collection") {
        let list = owned();
        if (avatarFilter === "wearing") list = list.filter(isWorn);
        else if (avatarFilter !== "all") list = list.filter((it) => it.type === avatarFilter);
        pagedItemGrid(items, list, wearTile, 40);
      } else {
        pagedItemGrid(items, catalog.filter((it) => it.type === catalogType), (it) => {
          const t = itemTile(it, () => openTake(it, t));
          t.append(el("div", "price", inventory.has(it.id) ? "Owned" : "Free"));
          return t;
        }, 40);
      }
    }
    function drawChips() {
      chips.textContent = "";
      const list = avatarSection === "collection"
        ? [{ id: "all", label: "All" }, { id: "wearing", label: "Wearing" }].concat(CAT_TYPES.filter((f) => owned().some((it) => it.type === f.id)))
        : CAT_TYPES.filter((f) => catalog.some((it) => it.type === f.id));
      const cur = () => (avatarSection === "collection" ? avatarFilter : catalogType);
      for (const f of list) {
        const c = navBtn("chip" + (f.id === cur() ? " on" : ""), f.label, () => {
          if (avatarSection === "collection") avatarFilter = f.id; else catalogType = f.id;
          chips.querySelectorAll(".chip").forEach((x) => x.classList.toggle("on", x === c));
          drawItems();
        });
        chips.append(c);
      }
    }
    for (const s of [{ id: "collection", label: "My Collection" }, { id: "catalog", label: "Catalog" }]) {
      const b = navBtn("chip section" + (s.id === avatarSection ? " on" : ""), s.label, () => {
        avatarSection = s.id;
        sections.querySelectorAll(".chip").forEach((x) => x.classList.toggle("on", x === b));
        drawChips(); drawItems();
      });
      sections.append(b);
    }
    col.append(sections, chips, items);
    pane.append(st, col);
    drawChips(); drawItems();
    makeViewer(cv);
  }

  function renderFriends(pane) {
    pane.textContent = "";
    pane.append(el("h2", "section-title", "Online Friends"),
      el("p", "empty", "Your friends are not online. Play some games and make new friends!"));
    const mpOn = () => store.raw("rblx2016.mp") === "1";
    const room = () => (store.raw("rblx2016.mpRoom") || "lobby").trim() || "lobby";
    const b = navBtn("btn", null, () => {
      store.setRaw("rblx2016.mp", mpOn() ? "0" : "1");
      b.textContent = label();
      toast(mpOn() ? `Games will join room "${room()}" with your friends` : "Multiplayer off");
    });
    const label = () => (mpOn() ? `Play with friends: ON (room "${room()}")` : "Play with friends: OFF");
    b.textContent = label();
    b.style.alignSelf = "flex-start";
    const note = el("p", "empty", "Turn this on, then everyone who picks the same game joins the same room. The room name is set on the main page.");
    note.style.fontSize = "26px";
    pane.append(b, note);
  }

  function renderRobux(pane) {
    pane.textContent = "";
    const col = el("div", "collection");
    col.append(el("h2", "section-title", "My Balance"));
    const bal = el("div", "balance big");
    const rb = el("img"); rb.src = "shell/Icons/ROBUXIcon@1080.png"; rb.alt = "";
    bal.append(rb, document.createTextNode("0"));
    const desc = el("p", "empty", "Get ROBUX to buy great new looks for your Avatar, plus perks and abilities in games.");
    const none = el("p", "empty", "There are no items for purchase right now, please try again later");
    none.classList.add("muted");
    const strip = el("div", "strip robux-strip");
    for (let i = 1; i <= 6; i++) {
      const t = navBtn("tile robux-tile", null, () => { play("Error"); toast("Everything in the Catalog is free here; nothing to buy"); });
      t.style.width = "250px"; t.style.height = "300px";
      const img = el("img"); img.src = `shell/Images/Robux/Robux0${i}.png`; img.alt = "";
      t.append(img, el("div", "label", "Not for sale"));
      strip.append(t);
    }
    const go = navBtn("btn", "Go To Avatar Catalog", () => { avatarSection = "catalog"; tabs[1].rendered = false; selectTab(1); focusFirst("avatar"); });
    col.append(bal, desc, strip, none, go);
    pane.append(col);
  }

  // ------------------------------------------------------------ overlays
  function screenLayer(cls) {
    const l = el("section", "layer " + cls);
    l._remove = true;
    stage.append(l);
    return l;
  }
  function backButton() {
    const b = navBtn("back", null, () => popLayer());
    const i = el("img"); i.src = "shell/Icons/BackIcon@1080.png"; i.alt = "";
    b.append(i, document.createTextNode("BACK"));
    return b;
  }

  // GameDetail.lua
  function openDetail(p) {
    play("OverlayOpen");
    const n = splitName(p.name);
    const l = screenLayer("screen");
    l.append(backButton(), el("h1", null, n.title));
    const body = el("div", "detail-body");
    const th = el("div", "detail-thumb");
    const big = gameTile(p, 566); big.classList.remove("nav"); big._onA = null; th.append(big);
    const col = el("div", "detail-col");
    col.append(el("h2", "section-title", "Rating and Description"), el("div", "linebreak"));
    const kind = n.kind ? n.kind.replace(/^./, (c) => c.toUpperCase()) : "Game";
    const desc = el("div", "desc",
      `${n.title} as it was in ${n.year || "its day"}. ` +
      (/popular/i.test(n.kind) ? "One of the most played games of its time, saved from the original place file." :
        /classic/i.test(n.kind) ? "A classic ROBLOX map from the early years." :
        /test map/i.test(n.kind) ? "One of ROBLOX's own engine test places." : "A ROBLOX game place.") +
      " It runs entirely in your browser on the 2016 engine; anything that needed ROBLOX's servers will not work.");
    col.append(desc);
    const facts = el("div", "detail-col facts");
    const fact = (k, v) => { const d = el("div"); d.append(el("b", null, k), document.createTextNode(v)); return d; };
    facts.append(el("h2", "section-title", "More Details"), el("div", "linebreak"),
      fact("Year", n.year || "—"), fact("Category", kind), fact("Place File", p.file),
      fact("Size", p.bytes ? (p.bytes / 1048576).toFixed(1) + " MB" : "—"));
    body.append(th, col, el("div", "divider"), facts);
    const btns = el("div", "detail-buttons");
    const playBtn = navBtn("btn green", "PLAY", () => launch(p));
    const favBtn = navBtn("btn", null, () => {
      if (favs.has(p.file)) favs.delete(p.file); else favs.add(p.file);
      store.set("rblx2016.xbox.favorites", [...favs]);
      drawFav();
      tabs[0].rendered = false;
      toast(favs.has(p.file) ? "Added to Favorites" : "Removed from Favorites");
    });
    function drawFav() {
      favBtn.textContent = "";
      const s = el("img"); s.src = "shell/Icons/FavoriteStar@1080.png"; s.alt = "";
      favBtn.append(s, document.createTextNode(favs.has(p.file) ? "FAVORITED" : "FAVORITE"));
    }
    drawFav();
    btns.append(playBtn, favBtn);
    l.append(body, btns);
    pushLayer(l, playBtn);
  }

  function launch(p) {
    const r = recent.filter((f) => f !== p.file); r.unshift(p.file);
    store.set("rblx2016.xbox.recent", r.slice(0, 12));
    play("ScreenChange");
    music.pause();
    setTimeout(() => { location.href = "../?play=" + encodeURIComponent(p.file) + "&from=xbox"; }, 250);
  }

  // PurchasePackagePrompt.lua, with "Take" since everything is free
  function openTake(it, tile) {
    play("PopUp");
    const l = screenLayer("modal");
    const box = el("div", "modal-box");
    const th = el("div", "thumb"); const img = el("img"); img.src = "../catalog/" + it.thumb; img.alt = ""; th.append(img);
    const right = el("div");
    const owned = inventory.has(it.id);
    right.append(el("h2", null, owned ? it.name : "Take Item"),
      el("p", null, owned ? "You already own this" : `Are you sure you want to take "${it.name}"?`));
    const btns = el("div", "row-btns");
    const yes = navBtn("btn green", owned ? (isWorn(it) ? "TAKE OFF" : "WEAR") : "TAKE", () => {
      if (!owned) { inventory.add(it.id); saveInventory(); play("PurchaseSuccess"); }
      toggleWear(it);
      tabs[1].rendered = false;
      const pr = tile.querySelector(".price"); if (pr) pr.textContent = "Owned";
      popLayer();
      toast(isWorn(it) ? "Wearing " + it.name : "Took off " + it.name);
    });
    const no = navBtn("btn", owned ? "CLOSE" : "DECLINE", () => popLayer());
    btns.append(yes, no);
    right.append(btns);
    box.append(th, right);
    l.append(box);
    pushLayer(l, yes);
  }

  // SettingsScreen.lua (+ the site's own options)
  function openSettings() {
    if (topLayer() && topLayer()._settings) return;
    play("SideMenuSlideIn");
    const l = screenLayer("screen");
    l._settings = true;
    l.append(backButton(), el("h1", null, "Settings"));
    const list = el("div", "settings-list");
    const row = (label, value, onA) => {
      const b = navBtn("setting", null, () => { onA(); draw(); });
      const v = el("span", "val");
      b.append(el("span", null, label), v);
      const draw = () => { v.textContent = value(); };
      draw();
      return b;
    };
    const flag = (k) => store.raw(k) === "1";
    const flip = (k) => store.setRaw(k, flag(k) ? "0" : "1");
    list.append(
      row("Menu Music", () => (settings.music ? "On" : "Off"), () => { settings.music = !settings.music; saveSettings(); syncMusic(); }),
      row("Sound Effects", () => (settings.sfx ? "On" : "Off"), () => { settings.sfx = !settings.sfx; saveSettings(); }),
      row("Adjust Screen", () => settings.overscan + "%", () => { settings.overscan = settings.overscan <= 80 ? 100 : settings.overscan - 5; saveSettings(); fit(); }),
      row("2017 Client UI In Games", () => (flag("rblx2016.ui2017") ? "On" : "Off"), () => flip("rblx2016.ui2017")),
      row("Unlock FPS In Games", () => (flag("rblx2016.unlockFps") ? "On" : "Off"), () => flip("rblx2016.unlockFps")),
      row("Back To The Website", () => "", () => { location.href = "../"; }),
    );
    const note = el("div", "settings-note",
      "Controls: arrow keys or WASD to move, Enter to select, Esc to go back, X for Settings, Q / E to switch tabs. " +
      "A controller works too: d-pad or left stick, A, B, X, and LB / RB for tabs. The mouse works everywhere.");
    l.append(list, note);
    pushLayer(l);
  }

  let toastTimer = 0;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  // ------------------------------------------------------------ input
  let started = false;
  function start() {
    if (started) return;
    started = true;
    play("ScreenChange");
    $("engage").hidden = true;
    layers = [];
    $("hub").hidden = false;
    pushLayer($("hub"), tabs[0].btn);
    selectTab(0, true);
    syncMusic();
  }
  function action(a) {
    if (!started) { start(); return; }
    if (a === "up" || a === "down" || a === "left" || a === "right") move(a);
    else if (a === "a") pressA();
    else if (a === "b") pressB();
    else if (a === "x") openSettings();
    else if ((a === "lb" || a === "rb") && topLayer() && topLayer().id === "hub") cycleTab(a === "lb" ? -1 : 1);
  }
  const KEYS = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right",
    Enter: "a", " ": "a", Escape: "b", Backspace: "b", x: "x", X: "x",
    q: "lb", Q: "lb", e: "rb", E: "rb", PageUp: "lb", PageDown: "rb",
  };
  addEventListener("keydown", (e) => {
    const a = KEYS[e.key];
    if (!a && started) return;
    e.preventDefault();
    hideMouse();
    action(a || "a");
  });

  // mouse: hover focuses, click presses A
  let mouseTimer = 0;
  function hideMouse() { document.body.classList.add("mouse-hidden"); }
  addEventListener("mousemove", () => {
    document.body.classList.remove("mouse-hidden");
    clearTimeout(mouseTimer); mouseTimer = setTimeout(hideMouse, 4000);
  });
  stage.addEventListener("mouseover", (e) => {
    const n = e.target.closest(".nav");
    if (n && topLayer() && topLayer().contains(n) && !document.body.classList.contains("mouse-hidden")) setFocus(n);
  });
  stage.addEventListener("click", (e) => {
    if (!started) { start(); return; }
    const n = e.target.closest(".nav");
    if (n && topLayer() && topLayer().contains(n)) { setFocus(n, true); pressA(); }
  });
  addEventListener("contextmenu", (e) => { e.preventDefault(); action("b"); });

  // gamepad (standard mapping), with key-repeat on held directions
  const BTN = { 0: "a", 1: "b", 2: "x", 4: "lb", 5: "rb", 12: "up", 13: "down", 14: "left", 15: "right" };
  const held = {};
  let padName = "";
  function pollPads() {
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
    const now = performance.now();
    const want = {};
    for (const p of pads) {
      for (const [i, a] of Object.entries(BTN)) if (p.buttons[i] && p.buttons[i].pressed) want[a] = true;
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      if (ax < -0.5) want.left = true; if (ax > 0.5) want.right = true;
      if (ay < -0.5) want.up = true; if (ay > 0.5) want.down = true;
      // Any button wakes the engagement screen.
      if (!started && p.buttons.some((b) => b.pressed)) want.a = true;
    }
    for (const a of ["a", "b", "x", "lb", "rb", "up", "down", "left", "right"]) {
      if (want[a]) {
        const h = held[a];
        const repeats = a === "up" || a === "down" || a === "left" || a === "right";
        if (!h) { held[a] = { next: now + 420 }; hideMouse(); action(a); }
        else if (repeats && now >= h.next) { h.next = now + 110; action(a); }
      } else delete held[a];
    }
    const name = pads[0] ? "Controller connected" : "";
    if (name !== padName) {
      padName = name;
      const ps = $("padState");
      ps.textContent = "";
      if (name) { const i = el("img"); i.src = "shell/Icons/OnlineDot@1080.png"; i.alt = ""; ps.append(i, document.createTextNode(name)); }
    }
  }

  // ------------------------------------------------------------ boot
  layers = [$("engage")];
  buildDock();
  Promise.all([loadPlaces(), loadCatalog()]).then(() => {
    tabs.forEach((t) => { t.rendered = false; });
    if (started) selectTab(currentTab);
    refreshAvatars();
  });
  // Fixed-rate polling: rAF can run slowly (hidden or throttled tabs) and miss quick taps.
  setInterval(pollPads, 16);
})();
