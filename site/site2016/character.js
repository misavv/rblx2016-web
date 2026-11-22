/* Avatar (Character) page for the ported 2016 site: wardrobe, currently
 * wearing, body colours, Builders Club, and a 3D/2D avatar view. Same saved
 * avatar as the game menu (common.js), so changes apply on the next Play. */
(function () {
  "use strict";
  const S = window.Site2016;
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const av = S.avatar;

  // 2016 wardrobe categories (hair and other accessories lived under Hats).
  const TABS = [
    { id: "hats", label: "Hats", types: ["hat", "hair", "shoulder", "back"] },
    { id: "face", label: "Faces", types: ["face"] },
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

  function worn() {
    const out = [];
    for (const k of ["head", "shirt", "pants", "tshirt", "face"]) { const it = S.byId(av[k]); if (it) out.push(it); }
    for (const id of av.accessories) { const it = S.byId(id); if (it) out.push(it); }
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

  // ---------------------------------------------------------------- 3D / 2D
  let mode = (() => { try { return localStorage.getItem("rblx2016.czMode") || "3d"; } catch (_) { return "3d"; } })();
  let viewer = null, viewerFailed = false, timer = 0;
  function renderMode() {
    if (mode === "3d" && !viewer && !viewerFailed && window.Avatar3D) {
      viewer = window.Avatar3D.create($("cz3d"));
      if (!viewer) viewerFailed = true;
    }
    const three = mode === "3d" && viewer;
    $("cz3d").hidden = !three;
    $("czPreview").hidden = !!three;
    $("czHint").textContent = three ? "Drag to rotate · scroll to zoom" : (viewerFailed ? "3D needs WebGL; showing the flat view." : "Flat front view.");
    for (const a of document.querySelectorAll(".local-mode a")) a.classList.toggle("on", a.dataset.mode === (three ? "3d" : "2d"));
    if (three) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const item = (id) => (id ? "../catalog/item/" + id : null);
        viewer.setAvatar({
          body: av.body.map(hexOf),
          shirt: item(av.shirt), pants: item(av.pants), tshirt: item(av.tshirt),
          face: av.face ? item(av.face) : "../content/textures/face.png",
          accessories: av.accessories.map((id) => S.byId(id)).filter(Boolean).map((it) => "../catalog/" + it.file),
          brickHex: hexOf,
        });
      }, 30);
    } else {
      draw2d();
    }
  }
  const imgs = new Map();
  function img(src) {
    if (!src) return null;
    let i = imgs.get(src);
    if (!i) { i = new Image(); i.onload = () => draw2d(); i.src = src; imgs.set(src, i); }
    return i.complete && i.naturalWidth ? i : null;
  }
  function draw2d() {
    const cv = $("czPreview");
    if (cv.hidden) return;
    const g = cv.getContext("2d");
    g.clearRect(0, 0, cv.width, cv.height);
    const s = 44, hs = 51, ox = (cv.width - 4 * s) / 2, oy = (cv.height - (hs + 2 + 4 * s)) / 2, ty = oy + hs + 2;
    const R = { torso: [ox + s, ty, 2 * s, 2 * s], rArm: [ox, ty, s, 2 * s], lArm: [ox + 3 * s, ty, s, 2 * s],
      rLeg: [ox + s, ty + 2 * s, s, 2 * s], lLeg: [ox + 2 * s, ty + 2 * s, s, 2 * s] };
    const head = [ox + 2 * s - hs / 2, oy, hs, hs];
    const fill = (r, c) => { g.fillStyle = c; g.fillRect(r[0], r[1], r[2], r[3]); };
    fill(R.rArm, hexOf(av.body[2])); fill(R.lArm, hexOf(av.body[1])); fill(R.torso, hexOf(av.body[3]));
    fill(R.rLeg, hexOf(av.body[5])); fill(R.lLeg, hexOf(av.body[4])); fill(head, hexOf(av.body[0]));
    const blit = (im, sx, sy, sw, sh, r) => { const kx = im.naturalWidth / 585, ky = im.naturalHeight / 559; g.drawImage(im, sx * kx, sy * ky, sw * kx, sh * ky, r[0], r[1], r[2], r[3]); };
    const pants = av.pants && img("../catalog/item/" + av.pants);
    if (pants) { blit(pants, 231, 74, 128, 128, R.torso); blit(pants, 217, 355, 64, 128, R.rLeg); blit(pants, 308, 355, 64, 128, R.lLeg); }
    const shirt = av.shirt && img("../catalog/item/" + av.shirt);
    if (shirt) { blit(shirt, 231, 74, 128, 128, R.torso); blit(shirt, 217, 355, 64, 128, R.rArm); blit(shirt, 308, 355, 64, 128, R.lArm); }
    const tee = av.tshirt && img("../catalog/item/" + av.tshirt);
    if (tee) g.drawImage(tee, R.torso[0] + 10, R.torso[1] + 10, R.torso[2] - 20, R.torso[3] - 20);
    const face = img(av.face ? "../catalog/item/" + av.face : "../content/textures/face.png");
    if (face) g.drawImage(face, head[0], head[1], head[2], head[3]);
  }

  // ---------------------------------------------------------------- wardrobe
  function render() {
    const tabs = $("czTabs");
    if (!tabs.childElementCount) {
      TABS.forEach((t, i) => {
        if (i) tabs.appendChild(document.createTextNode(" | "));
        const a = document.createElement("a");
        a.textContent = t.label;
        a.dataset.id = t.id;
        a.addEventListener("click", () => { tab = t.id; page = 0; render(); });
        tabs.appendChild(a);
      });
    }
    for (const a of tabs.querySelectorAll("a")) a.classList.toggle("on", a.dataset.id === tab);

    const t = TABS.find((x) => x.id === tab);
    const q = ($("czSearch") && $("czSearch").value.trim().toLowerCase()) || "";
    const mine = (S._items || []).filter((it) => t.types.includes(it.type) && S.owns(it.id) &&
      (!q || String(it.name || "").toLowerCase().includes(q)));
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
    renderMode();
  }

  async function boot() {
    S.wireChrome("character");
    for (const a of document.querySelectorAll(".local-mode a")) {
      a.addEventListener("click", () => {
        mode = a.dataset.mode;
        try { localStorage.setItem("rblx2016.czMode", mode); } catch (_) {}
        renderMode();
      });
    }
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
