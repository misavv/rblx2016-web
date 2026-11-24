/* Develop: the 2016 "My Creations" page for BLOXRO Studio games. Create a
 * new game from the baseplate, import a .rbxl, and per game: Edit (opens
 * Studio), Play, Download .rbxl, Rename, Delete. Games live in this
 * browser's IndexedDB (window.BloxroGames, js/studio.js). */
(function () {
  "use strict";
  const S = window.Site2016, el = S.el;
  S.page("develop", "Develop");
  const root = document.getElementById("develop-root");
  const P = (() => { try { return window.parent !== window && window.parent.BloxroGames ? window.parent : null; } catch (_) { return null; } })();
  const Games = P && P.BloxroGames;
  const core = P && P.RBLX2016_CORE;
  const toTop = (url) => { top.location.href = new URL(url, location.href).href; };

  root.appendChild(el("h1", "", "Develop"));
  const tabs = el("ul", "develop-tabs");
  for (const [t, on] of [["My Creations", true], ["Library", false]]) {
    const li = el("li", on ? "active" : "");
    const a = el("a", "", t);
    if (on) a.href = "develop.html";
    else { a.href = "catalog.html"; a.title = "Everything in the Catalog is free"; }
    li.appendChild(a);
    tabs.appendChild(li);
  }
  root.appendChild(tabs);
  const cols = el("div", "develop-cols");
  const side = el("div", "develop-side");
  for (const [t, on] of [["Games", true], ["Models", false], ["Decals", false], ["Audio", false], ["Meshes", false], ["Shirts", false], ["Pants", false], ["Plugins", false]]) {
    const a = el("a", on ? "active" : "off", t);
    if (!on) a.title = "Not in this archive";
    side.appendChild(a);
  }
  const main = el("div", "develop-main");
  cols.append(side, main);
  root.appendChild(cols);

  const acts = el("div", "develop-actions");
  const create = el("a", "btn-secondary-md", "Create New Game");
  const imp = el("a", "btn-control-md", "Import .rbxl…");
  const studio = el("a", "btn-control-md", "Open BLOXRO Studio");
  studio.href = "../index.html?studio"; studio.target = "_top";
  const fileIn = el("input"); fileIn.type = "file"; fileIn.accept = ".rbxl,.rbxlx"; fileIn.hidden = true; fileIn.style.display = "none";
  acts.append(create, imp, studio, fileIn);
  main.appendChild(acts);
  const list = el("div");
  main.appendChild(list);

  if (!Games) {
    list.appendChild(el("div", "section-content empty", "Open BLOXRO from its main page to manage your Studio games."));
    create.classList.add("btn-disabled"); imp.classList.add("btn-disabled");
    return;
  }

  create.addEventListener("click", async () => {
    if (create.classList.contains("btn-disabled")) return;
    create.classList.add("btn-disabled");
    try {
      const places = await core.fetchPlaceList();
      const p = places.find((x) => x && /^Baseplate/i.test(String(x.name)));
      if (!p) throw new Error("No baseplate template in this copy.");
      const bytes = await core.readFileBytes({ src: "places/" + encodeURIComponent(p.file) + (p.gz ? ".gz" : "") });
      const g = { id: Games.newId(), name: "My Game", bytes };
      await Games.put(g);
      toTop("../index.html?studio=" + encodeURIComponent(g.id));
    } catch (e) {
      create.classList.remove("btn-disabled");
      S.alert("Couldn't create a game", String(e && e.message || e));
    }
  });
  imp.addEventListener("click", () => fileIn.click());
  fileIn.addEventListener("change", async () => {
    const f = fileIn.files[0];
    fileIn.value = "";
    if (!f) return;
    if (f.size > 32 * 1024 * 1024) { S.alert("Too big", "Place files can be up to 32 MB."); return; }
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      const name = f.name.replace(/\.(rbxlx?)$/i, "").slice(0, 50) || "Imported Game";
      await Games.put({ id: Games.newId(), name, bytes });
      await refresh();
    } catch (e) { S.alert("Couldn't import", String(e && e.message || e)); }
  });

  async function refresh() {
    list.textContent = "";
    const games = await Games.list();
    // keep the engine page's place list (and so Games / Home) in step
    try { S.engine() && (await S.engine().refresh()); } catch (_) {}
    if (!games.length) {
      const c = el("div", "section-content empty", "You haven't created any games yet. Click ");
      c.appendChild(el("b", "", "Create New Game"));
      c.appendChild(document.createTextNode(" to start from a baseplate in BLOXRO Studio."));
      list.appendChild(c);
      return;
    }
    for (const g of games) list.appendChild(item(g));
  }

  function item(g) {
    const it = el("div", "creation-item");
    const img = el("img"); img.alt = ""; img.src = S.GAME_THUMB_NONE;
    const info = el("div", "creation-info");
    const nm = el("a", "creation-name", g.name);
    nm.href = "game.html?id=" + encodeURIComponent("mine:" + g.id);
    const meta = el("div", "creation-meta", "Updated " + new Date(g.updated).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) +
      " · " + Math.max(1, Math.round((g.size || 0) / 1024)) + " KB");
    info.append(nm, meta);
    const btns = el("div", "creation-btns");
    const b = (label, cls, fn) => { const a = el("a", cls, label); a.addEventListener("click", fn); btns.appendChild(a); return a; };
    b("Edit", "btn-secondary-sm", () => toTop("../index.html?studio=" + encodeURIComponent(g.id)));
    b("Play", "btn-primary-sm", async () => {
      const games = await S.loadGames(true);
      const gg = games.find((x) => x.id === "mine:" + g.id);
      if (gg) S.play(gg); else S.alert("Play", "Couldn't find that game. Reload the page and try again.");
    });
    b("Download", "btn-control-xs", async () => {
      try {
        const rec = await Games.get(g.id);
        S.download(rec.bytes, (g.name.replace(/[\\/:*?"<>|]+/g, "_") || "game") + ".rbxl");
      } catch (_) { S.alert("Download", "Couldn't read that game."); }
    });
    b("Rename", "btn-control-xs", () => {
      const input = el("input", "form-control creation-rename");
      input.value = g.name; input.maxLength = 50;
      nm.replaceWith(input);
      input.focus(); input.select();
      let done = false;
      const finish = async (save) => {
        if (done) return; done = true;
        const name = input.value.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 50);
        if (save && name && name !== g.name) {
          const rec = await Games.get(g.id);
          if (rec) { rec.name = name; await Games.put(rec); }
        }
        refresh();
      };
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") finish(true); else if (e.key === "Escape") finish(false); });
      input.addEventListener("blur", () => finish(true));
    });
    b("Delete", "btn-control-xs", () => {
      S.confirm("Delete game", "Delete “" + g.name + "”? It's only saved in this browser, so this can't be undone. Download it first if you want to keep a copy.", "Delete", async () => {
        await Games.del(g.id);
        refresh();
      });
    });
    it.append(img, info, btns);
    return it;
  }
  refresh();
})();
