/* Inventory: the 2016 inventory page. Everything you've got from the
 * Catalog, by category, with Wear / Take Off right on each item. */
(function () {
  "use strict";
  const S = window.Site2016, el = S.el;
  S.page("inventory", "Inventory");
  const root = document.getElementById("inventory-root");
  const q = new URLSearchParams(location.search);
  let keyword = (q.get("keyword") || "").trim().toLowerCase().slice(0, 120);
  const CATS = [
    ["hat", "Hats"], ["hair", "Hair"], ["face", "Faces"], ["shoulder", "Shoulder"], ["back", "Back"],
    ["gear", "Gear"], ["tshirt", "T-Shirts"], ["shirt", "Shirts"], ["pants", "Pants"], ["head", "Heads"], ["package", "Packages"],
  ];
  const WEARABLE = new Set(["hat", "hair", "face", "shoulder", "back", "tshirt", "shirt", "pants", "head"]);
  let cat = q.get("category") || "hat", page = 0;
  const PER = 24;

  root.appendChild(el("h1", "", S.userName() + "'s Inventory"));
  const cols = el("div", "inv-cols");
  const side = el("div", "inv-cats");
  const main = el("div", "inv-main");
  cols.append(side, main);
  root.appendChild(cols);
  const tools = el("div", "inline-row");
  tools.style.marginBottom = "10px";
  const search = el("input", "form-control");
  search.type = "search"; search.placeholder = "Search your inventory"; search.value = keyword; search.style.maxWidth = "280px"; search.style.height = "36px";
  search.addEventListener("input", () => { keyword = search.value.trim().toLowerCase(); page = 0; render(); });
  const count = el("span", "text-secondary small");
  const shop = el("a", "", "Get more in the Catalog");
  shop.href = "catalog.html"; shop.style.marginLeft = "auto";
  tools.append(search, count, shop);
  main.appendChild(tools);
  const grid = el("ul", "inv-grid");
  const pager = el("div", "inv-pager");
  main.append(grid, pager);

  function owned() { return (S._items || []).filter((it) => S.owns(it.id)); }
  function render() {
    const mine = owned();
    side.textContent = "";
    for (const [id, label] of CATS) {
      const n = mine.filter((it) => it.type === id).length;
      if (!n && id !== cat) continue;
      const a = el("a", id === cat ? "active" : "", label);
      a.appendChild(el("span", "", String(n)));
      a.addEventListener("click", () => { cat = id; page = 0; render(); });
      side.appendChild(a);
    }
    const list = mine.filter((it) => it.type === cat && (!keyword || String(it.name).toLowerCase().includes(keyword)))
      .sort((a, b) => (S.acquiredAt(b.id) - S.acquiredAt(a.id)) || String(b.created || "").localeCompare(String(a.created || "")));
    count.textContent = list.length + (list.length === 1 ? " item" : " items");
    const pages = Math.max(1, Math.ceil(list.length / PER));
    page = Math.min(page, pages - 1);
    grid.textContent = "";
    if (!list.length) {
      const li = el("li", "local-empty", keyword ? "Nothing matches that search." : "You don't have any of these yet. ");
      if (!keyword) { const a = el("a", "", "Browse the Catalog"); a.href = "catalog.html"; li.appendChild(a); }
      li.style.gridColumn = "1/-1";
      grid.appendChild(li);
    }
    for (const it of list.slice(page * PER, page * PER + PER)) {
      const worn = S.isWorn(it);
      const li = el("li", "item-tile" + (worn ? " worn" : ""));
      const a = el("a", "thumb"); a.href = "catalog.html#item=" + Number(it.id); a.title = it.name;
      const im = el("img"); im.alt = it.name; im.loading = "lazy"; im.src = S.thumb(it);
      a.appendChild(im);
      li.append(a, el("span", "nm", it.name));
      if (WEARABLE.has(it.type)) {
        const w = el("a", "act", worn ? "Take Off" : "Wear");
        w.addEventListener("click", () => { S.toggleWear(it); render(); });
        li.appendChild(w);
      } else if (it.type === "gear") li.appendChild(el("span", "act text-secondary", "In your backpack in games that allow gear"));
      grid.appendChild(li);
    }
    pager.textContent = "";
    if (pages > 1) {
      const mk = (t, p, off) => { const b = el("a", "btn-control-xs" + (off ? " btn-disabled" : ""), t); if (!off) b.addEventListener("click", () => { page = p; render(); scrollTo(0, 0); }); return b; };
      pager.append(mk("« Previous", page - 1, page === 0), el("span", "small", "Page " + (page + 1) + " of " + pages), mk("Next »", page + 1, page >= pages - 1));
    }
  }
  S.loadItems().then(render, () => { grid.appendChild(el("li", "local-empty", "Couldn't load the catalog.")); });
})();
