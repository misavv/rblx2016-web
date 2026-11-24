/* Avatar (Character) page for the ported 2016 site: wardrobe, currently
 * wearing, body colours, Builders Club, and the avatar picture, drawn by the
 * engine's own thumbnail renderer like the 2016 site's thumbnail servers did. Same saved
 * avatar as the game menu (common.js), so changes apply on the next Play. */
(function () {
  "use strict";
  const S = window.Site2016;
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const av = S.avatar;

  // 2016 wardrobe categories, one per catalog type.
  const TABS = [
    { id: "hats", label: "Hats", types: ["hat"] },
    { id: "hair", label: "Hair", types: ["hair"] },
    { id: "face", label: "Faces", types: ["face"] },
    { id: "shoulder", label: "Shoulder", types: ["shoulder"] },
    { id: "back", label: "Back", types: ["back"] },
    { id: "tshirt", label: "T-Shirts", types: ["tshirt"] },
    { id: "shirt", label: "Shirts", types: ["shirt"] },
    { id: "pants", label: "Pants", types: ["pants"] },
  ];
  const BODY_SLOTS = ["Head", "Left Arm", "Right Arm", "Torso", "Left Leg", "Right Leg"];
  const BRICK_COLORS = [
    [24, "#f5cd30", "Bright yellow"], [1, "#f2f3f3", "White"], [194, "#a3a2a5", "Medium stone grey"],
    [199, "#635f62", "Dark stone grey"], [26, "#1b2a35", "Black"], [21, "#c4281c", "Bright red"],
    [23, "#0d69ac", "Bright blue"], [102, "#6e99ca", "Medium blue"], [107, "#008f9c", "Bright bluish green"],
    [28, "#287f47", "Dark green"], [37, "#4b974b", "Bright green"], [119, "#a4bd47", "Br. yellowish green"],
    [226, "#fdea8d", "Cool yellow"], [106, "#da8541", "Bright orange"], [5, "#d7c59a", "Brick yellow"],
    [18, "#cc8e69", "Nougat"], [101, "#da867a", "Medium red"], [9, "#e8bac8", "Light reddish violet"],
    [192, "#694028", "Reddish brown"], [217, "#7c5c46", "Brown"], [2, "#a1a5a2", "Grey"],
    [45, "#b4d2e4", "Light blue"], [153, "#957977", "Sand red"], [1003, "#111111", "Really black"],
  ].map(([n, hex, name]) => ({ n, hex, name }));
  const hexOf = (n) => (BRICK_COLORS.find((c) => c.n === n) || { hex: "#a3a2a5" }).hex;
  const PAGE = 12;
  let tab = "hats", page = 0, bodyPart = 3;
  let sort = (() => { try { return localStorage.getItem("rblx2016.wardrobeSort") || "recent"; } catch (_) { return "recent"; } })();

  const created = (it) => String(it.created || "");
  const SORTS = {
    // Newest first among items got one at a time, then everything else by date.
    recent: (a, b) => (S.acquiredAt(b.id) - S.acquiredAt(a.id)) || created(b).localeCompare(created(a)) || b.id - a.id,
    newest: (a, b) => created(b).localeCompare(created(a)) || b.id - a.id,
    oldest: (a, b) => created(a).localeCompare(created(b)) || a.id - b.id,
    name: (a, b) => String(a.name).localeCompare(String(b.name), undefined, { sensitivity: "base" }) || a.id - b.id,
  };

  // Currently Wearing in the 2016 order: accessories, then head, face, clothes.
  const ACC_ORDER = ["hat", "hair", "shoulder", "back"];
  function worn() {
    const out = av.accessories.map((id) => S.byId(id)).filter(Boolean)
      .sort((a, b) => ACC_ORDER.indexOf(a.type) - ACC_ORDER.indexOf(b.type));
    for (const k of ["head", "face", "tshirt", "shirt", "pants"]) { const it = S.byId(av[k]); if (it) out.push(it); }
    return out;
  }

  function tile(item, isWorn, label) {
    const d = document.createElement("div");
    d.className = "local-wi" + (isWorn ? " worn" : "");
    d.innerHTML = '<div class="local-thumb"><img loading="lazy" alt="" src="' + esc(S.thumb(item)) + '"></div>' +
      '<div class="local-nm notranslate" title="' + esc(item.name) + '"><a href="catalog.html#item=' + item.id + '">' + esc(item.name) + '</a></div>' +
      '<a class="local-act">[ ' + label + ' ]</a>';
    d.querySelector(".local-act").addEventListener("click", () => { S.toggleWear(item); render(); });
    return d;
  }

  // ---------------------------------------------------------------- body diagram
  const LAYOUT = [[0, 62, 0, 44, 44], [2, 4, 48, 38, 80], [3, 44, 48, 80, 80], [1, 126, 48, 38, 80], [5, 44, 130, 39, 62], [4, 85, 130, 39, 62]];
  function renderBody() {
    const body = $("czBody"), pal = $("czPalette");
    if (!body.childElementCount) {
      for (const [slot, x, y, w, h] of LAYOUT) {
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.slot = slot;
        b.title = BODY_SLOTS[slot];
        b.setAttribute("aria-label", BODY_SLOTS[slot]);
        b.style.cssText = "left:" + x + "px;top:" + y + "px;width:" + w + "px;height:" + h + "px";
        b.addEventListener("click", () => { bodyPart = slot; renderBody(); });
        body.appendChild(b);
      }
      for (const c of BRICK_COLORS) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "radio");
        b.dataset.n = c.n;
        b.title = c.name;
        b.setAttribute("aria-label", c.name);
        b.style.background = c.hex;
        b.addEventListener("click", () => { S.setBodyColor(bodyPart, c.n); render(); });
        pal.appendChild(b);
      }
    }
    for (const b of body.children) {
      const slot = Number(b.dataset.slot);
      b.style.background = hexOf(av.body[slot]);
      b.setAttribute("aria-pressed", slot === bodyPart ? "true" : "false");
    }
    for (const b of pal.children) b.setAttribute("aria-checked", Number(b.dataset.n) === av.body[bodyPart] ? "true" : "false");
  }

  // ---------------------------------------------------------------- BC
  const BC = [["None", 0], ["Builders Club", 1], ["Turbo Builders Club", 2], ["Outrageous Builders Club", 3]];
  function renderBc() {
    const box = $("czBc");
    if (!box.childElementCount) {
      for (const [label, n] of BC) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "radio");
        b.dataset.n = n;
        if (n) { const i = document.createElement("img"); i.src = S.BC_ICONS[n]; i.alt = ""; b.appendChild(i); }
        b.appendChild(document.createTextNode(label));
        b.addEventListener("click", () => { S.setBcTier(n); render(); S.wireChrome("character"); });
        box.appendChild(b);
      }
    }
    const t = S.bcTier();
    for (const b of box.children) b.setAttribute("aria-checked", Number(b.dataset.n) === t ? "true" : "false");
    const icon = $("czBcIcon");
    if (t) { icon.src = S.BC_ICONS[t]; icon.hidden = false; } else icon.hidden = true;
    $("czNameText").textContent = S.userName();
  }

  // ---------------------------------------------------------------- avatar picture
  // The 2016 Avatar page showed a 352x352 picture from the thumbnail servers
  // (RCC's ThumbnailGenerator), redrawn after every change. Here the same
  // render job runs in a hidden frame (index.html?render=avatar&embed=1) and
  // leaves a transparent PNG at thumbs/__avatar.png.
  const PIC = "../thumbs/__avatar.png";
  const PIC_KEY = "rblx2016.site.avatarPic";
  let renderFrame = null, renderAgain = false, renderTimer = 0;
  const sig = () => JSON.stringify([av.body, av.head, av.face, av.tshirt, av.shirt, av.pants, av.accessories]);
  function lastPic() {
    try { return JSON.parse(localStorage.getItem(PIC_KEY) || "null"); } catch (_) { return null; }
  }
  function showPic(v) {
    const i = $("czPic");
    i.onload = () => { i.hidden = false; };
    i.onerror = () => { i.hidden = true; };
    i.src = PIC + "?v=" + encodeURIComponent(v);
  }
  function setBusy(on, text) {
    $("czStage").classList.toggle("busy", on);
    $("czRendering").hidden = !on;
    if (text) $("czRendering").querySelector("span").textContent = text;
  }
  function renderPreview(force) {
    const have = lastPic();
    if (have && !$("czPic").src) showPic(have.v);
    if (!force && have && have.sig === sig()) { if (!renderFrame) setBusy(false); return; }
    setBusy(true, "Drawing your avatar…");
    clearTimeout(renderTimer);
    renderTimer = setTimeout(startRender, force ? 0 : 900);
  }
  function startRender() {
    if (renderFrame) { renderAgain = true; return; }
    const want = sig();
    const f = document.createElement("iframe");
    renderFrame = f;
    // Kept on screen (a hidden page gets no frames to render with), invisible.
    f.style.cssText = "position:fixed;left:0;top:0;width:640px;height:480px;border:0;opacity:0;pointer-events:none;z-index:-1";
    f.setAttribute("aria-hidden", "true");
    f.tabIndex = -1;
    let timer = 0;
    const done = (ok) => {
      window.removeEventListener("message", onMsg);
      clearTimeout(timer);
      f.remove();
      renderFrame = null;
      if (ok) {
        const v = Date.now().toString(36);
        try { localStorage.setItem(PIC_KEY, JSON.stringify({ sig: want, v })); } catch (_) {}
        showPic(v);
      }
      if (renderAgain || want !== sig()) { renderAgain = false; startRender(); return; }
      if (ok) setBusy(false);
      else setBusy(true, "Couldn't draw your avatar. Try re-drawing it.");
    };
    const onMsg = (e) => {
      if (e.source === f.contentWindow && e.data && e.data.rblxAvatarRendered) done(e.data.rblxAvatarRendered !== "failed");
    };
    window.addEventListener("message", onMsg);
    timer = setTimeout(() => done(false), 120000);
    f.src = "../index.html?render=avatar&embed=1&test=none&mute=1&k=" + Date.now().toString(36);
    document.body.appendChild(f);
  }

  // ---------------------------------------------------------------- wardrobe
  function render() {
    const tabs = $("czTabs");
    if (!tabs.childElementCount) {
      TABS.forEach((t, i) => {
        if (i) tabs.appendChild(document.createTextNode(" | "));
        const a = document.createElement("a");
        a.textContent = t.label;
        a.title = t.label;
        a.dataset.id = t.id;
        a.addEventListener("click", () => { tab = t.id; page = 0; render(); });
        tabs.appendChild(a);
      });
    }
    for (const a of tabs.querySelectorAll("a")) {
      const tt = TABS.find((x) => x.id === a.dataset.id);
      const n = (S._items || []).filter((it) => tt.types.includes(it.type) && S.owns(it.id)).length;
      a.textContent = tt.label + (n ? " (" + n.toLocaleString() + ")" : "");
      a.classList.toggle("on", a.dataset.id === tab);
    }

    const t = TABS.find((x) => x.id === tab);
    const q = ($("czSearch") && $("czSearch").value.trim().toLowerCase()) || "";
    const mine = (S._items || []).filter((it) => t.types.includes(it.type) && S.owns(it.id) &&
      (!q || String(it.name || "").toLowerCase().includes(q))).sort(SORTS[sort] || SORTS.recent);
    $("czCount").textContent = mine.length ? mine.length.toLocaleString() + (mine.length === 1 ? " item" : " items") : "";
    const grid = $("czGrid"), note = $("czNote"), pager = $("czPager");
    grid.innerHTML = ""; pager.innerHTML = "";
    if (!mine.length) {
      note.hidden = false;
      note.innerHTML = q
        ? "No " + t.label.toLowerCase() + " match that search."
        : "You don't have any " + t.label.toLowerCase() + ' yet. <a href="catalog.html">Get some free in the Catalog</a>, or press <b>Get Everything</b>.';
    } else {
      note.hidden = true;
      const pages = Math.ceil(mine.length / PAGE);
      page = Math.max(0, Math.min(page, pages - 1));
      for (const it of mine.slice(page * PAGE, page * PAGE + PAGE)) {
        const on = S.isWorn(it);
        grid.appendChild(tile(it, on, on ? "remove" : "wear"));
      }
      if (pages > 1) {
        const mk = (label, p, off) => {
          const a = document.createElement("a");
          a.className = "btn-control btn-control-medium" + (off ? " disabled" : "");
          a.textContent = label;
          if (!off) a.addEventListener("click", () => { page = p; render(); });
          return a;
        };
        const lab = document.createElement("span");
        lab.className = "local-page-label";
        lab.textContent = "Page " + (page + 1) + " of " + pages;
        pager.append(mk("« Previous", page - 1, page === 0), lab, mk("Next »", page + 1, page >= pages - 1));
      }
    }
    const wearing = $("czWearing");
    wearing.innerHTML = "";
    const w = worn();
    if (!w.length) wearing.innerHTML = '<p class="local-note">You aren\'t wearing anything.</p>';
    for (const it of w) wearing.appendChild(tile(it, true, "remove"));

    renderBody();
    renderBc();
    renderPreview(false);
  }

  async function boot() {
    S.wireChrome("character");
    $("czSort").value = sort;
    $("czSort").addEventListener("change", () => {
      sort = $("czSort").value;
      try { localStorage.setItem("rblx2016.wardrobeSort", sort); } catch (_) {}
      page = 0; render();
    });
    $("czRedraw").addEventListener("click", () => renderPreview(true));
    $("czGetAll").addEventListener("click", async () => {
      const btn = $("czGetAll");
      btn.textContent = "Getting…";
      const added = await S.giveAll();
      btn.textContent = added ? "Got " + added.toLocaleString() + " items!" : "You own everything";
      setTimeout(() => { btn.textContent = "Get Everything"; }, 2500);
      page = 0; render();
    });
    $("czSearch").addEventListener("input", () => { page = 0; render(); });
    $("czGrid").innerHTML = '<p class="local-note">Loading your wardrobe…</p>';
    try { await S.loadItems(); } catch (_) { $("czGrid").innerHTML = '<p class="local-note">Couldn\'t load the catalog.</p>'; return; }
    render();
  }
  boot();
})();
