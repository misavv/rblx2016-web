/* Games: the 2016 games page. Sort rows (Popular, Classics, ...) that scroll
 * sideways with "See All", a sort/genre filter, keyword search, and a button
 * to play a .rbxl from your own computer. */
(function () {
  "use strict";
  const S = window.Site2016, el = S.el;
  S.page("games", "Games");
  const root = document.getElementById("games-root");
  const q = new URLSearchParams(location.search);
  const keyword = (q.get("keyword") || "").trim().slice(0, 120);
  const sort = q.get("sort") || "";

  const SORTS = [
    { id: "", label: "Default" },
    { id: "recent", label: "Recently Played", pick: (gs) => S.recentKeys().map((k) => gs.find((g) => g.key === k)).filter(Boolean) },
    { id: "favorites", label: "My Favorites", pick: (gs) => S.favoriteKeys().map((k) => gs.find((g) => g.key === k)).filter(Boolean) },
    { id: "popular", label: "Popular", test: (g) => g.genre === "Popular" },
    { id: "games", label: "Featured Games", test: (g) => g.genre === "Game" },
    { id: "classic", label: "Classics", test: (g) => g.genre === "Classic" },
    { id: "test", label: "Test Maps", test: (g) => g.genre === "Test map" },
    { id: "mine", label: "My Games", test: (g) => g.kind === "mine" },
    { id: "local", label: "Your Files", test: (g) => g.kind === "local" },
    { id: "newest", label: "Newest (by year)", all: (gs) => gs.filter((g) => g.year).slice().sort((a, b) => b.year - a.year || a.title.localeCompare(b.title)) },
    { id: "oldest", label: "Oldest (by year)", all: (gs) => gs.filter((g) => g.year).slice().sort((a, b) => a.year - b.year || a.title.localeCompare(b.title)) },
    { id: "az", label: "A-Z", all: (gs) => gs.slice().sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" })) },
  ];
  const pickOf = (s, gs) => s.pick ? s.pick(gs) : s.all ? s.all(gs) : s.test ? gs.filter(s.test) : gs;

  // Filter bar
  const bar = el("div", "games-filter");
  const sg = el("div", "rbx-select-group");
  const sel = el("select", "rbx-select");
  sel.setAttribute("aria-label", "Sort");
  for (const s of SORTS) { const o = el("option", "", s.label); o.value = s.id; sel.appendChild(o); }
  sel.value = SORTS.some((s) => s.id === sort) ? sort : "";
  sel.addEventListener("change", () => { location.href = "games.html" + (sel.value ? "?sort=" + sel.value : ""); });
  sg.appendChild(sel);
  const kw = el("input", "form-control");
  kw.type = "search"; kw.placeholder = "Search games"; kw.value = keyword; kw.maxLength = 120;
  kw.addEventListener("keydown", (e) => { if (e.key === "Enter") location.href = "games.html?keyword=" + encodeURIComponent(kw.value.trim()); });
  const fileBtn = el("a", "btn-control-sm local-file-btn", "Play a place file…");
  fileBtn.title = "Open a .rbxl / .rbxlx from your computer";
  const fileIn = el("input");
  fileIn.type = "file"; fileIn.accept = ".rbxl,.rbxlx"; fileIn.hidden = true; fileIn.style.display = "none";
  fileBtn.addEventListener("click", () => fileIn.click());
  fileIn.addEventListener("change", async () => {
    const f = fileIn.files[0];
    fileIn.value = "";
    if (!f) return;
    const eng = S.engine();
    if (!eng) { S.alert("Open the full site", "Open BLOXRO from its main page to play your own files."); return; }
    try {
      const id = await eng.openFile(f);
      location.href = "game.html?id=" + encodeURIComponent(id);
    } catch (e) { S.alert("Couldn't open that file", String(e && e.message || e)); }
  });
  bar.append(sg, kw, fileBtn, fileIn);
  root.appendChild(el("h1", "", keyword ? "Search results" : (SORTS.find((s) => s.id === sort && s.id) || { label: "Games" }).label));
  root.appendChild(bar);
  root.addEventListener("dragover", (e) => e.preventDefault());
  root.addEventListener("drop", (e) => {
    e.preventDefault();
    const f = e.dataTransfer && e.dataTransfer.files[0];
    if (f && /\.rbxlx?$/i.test(f.name)) {
      const dt = new DataTransfer(); dt.items.add(f); fileIn.files = dt.files;
      fileIn.dispatchEvent(new Event("change"));
    }
  });
  const body = el("div");
  root.appendChild(body);
  body.appendChild(el("p", "text-secondary", "Loading games…"));

  function carousel(title, games, more) {
    const sec = el("div", "section");
    sec.appendChild(S.sectionHeader(title + " (" + games.length + ")", more));
    const wrap = el("div", "games-row");
    const ul = el("ul", "hlist game-cards");
    for (const g of games) ul.appendChild(S.gameCard(g));
    const prev = el("a", "scroller prev"); prev.appendChild(el("span", "icon-games-carousel-left")); prev.title = "Previous";
    const next = el("a", "scroller next"); next.appendChild(el("span", "icon-games-carousel-right")); next.title = "Next";
    const step = () => Math.max(162, Math.floor(ul.clientWidth / 162) * 162);
    prev.addEventListener("click", () => { ul.scrollLeft -= step(); });
    next.addEventListener("click", () => { ul.scrollLeft += step(); });
    const upd = () => {
      prev.hidden = ul.scrollLeft <= 2;
      next.hidden = ul.scrollLeft + ul.clientWidth >= ul.scrollWidth - 2;
    };
    ul.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
    wrap.append(prev, ul, next);
    sec.appendChild(wrap);
    setTimeout(upd, 0);
    return sec;
  }
  function grid(games) {
    const ul = el("ul", "hlist game-cards grid");
    for (const g of games) ul.appendChild(S.gameCard(g));
    return ul;
  }

  S.loadGames().then((games) => {
    body.textContent = "";
    if (!games.length) { body.appendChild(el("div", "section-content empty", "No games found. Try reloading the page.")); return; }
    if (keyword) {
      const words = keyword.toLowerCase().split(/\s+/).filter(Boolean);
      const hits = games.filter((g) => { const hay = (g.title + " " + g.year + " " + g.genre).toLowerCase(); return words.every((w) => hay.includes(w)); });
      body.appendChild(el("p", "text-secondary", hits.length + " game" + (hits.length === 1 ? "" : "s") + " for “" + keyword + "”"));
      if (hits.length) body.appendChild(grid(hits));
      return;
    }
    const s = SORTS.find((x) => x.id === sort && x.id);
    if (s) {
      const list = pickOf(s, games);
      if (!list.length) {
        const c = el("div", "section-content empty", s.id === "mine" ? "You haven't made any games yet. " : "Nothing here yet. ");
        if (s.id === "mine") { const a = el("a", "", "Create one in BLOXRO Studio"); a.href = "develop.html"; c.appendChild(a); }
        body.appendChild(c);
      } else body.appendChild(grid(list));
      return;
    }
    for (const id of ["recent", "mine", "local", "favorites", "popular", "games", "classic", "test"]) {
      const so = SORTS.find((x) => x.id === id);
      const list = pickOf(so, games);
      if (list.length) body.appendChild(carousel(so.label, list, "games.html?sort=" + id));
    }
  });
})();
