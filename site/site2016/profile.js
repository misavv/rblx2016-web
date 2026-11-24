/* Profile: the 2016 profile page for you. Header with headshot and counts,
 * About (your blurb, editable), Currently Wearing with the avatar picture,
 * Favorite games, your Studio games, and Statistics. */
(function () {
  "use strict";
  const S = window.Site2016, el = S.el;
  S.page("profile", "Profile");
  const root = document.getElementById("profile-root");
  const name = S.userName();
  document.title = name + " - BLOXRO";
  const JOIN = "rblx2016.site.joined";
  let joined = Number(S.json(JOIN, 0));
  if (!joined) { joined = Date.now(); S.setJson(JOIN, joined); }

  // header
  const head = el("div", "profile-header");
  const pic = el("a", "avatar avatar-headshot-lg"); pic.href = "character.html";
  pic.appendChild(S.avatarImg());
  const t = el("div", "header-title");
  const h2 = el("h2", "", name);
  const tier = S.bcTier();
  if (tier) { const i = el("img"); i.src = S.BC_ICONS[tier]; i.alt = ""; i.width = 16; i.height = 16; h2.appendChild(i); }
  const cap = el("div", "header-caption", "@" + name.replace(/\s+/g, ""));
  const det = el("div", "header-details");
  t.append(h2, cap, det);
  const btns = el("div", "header-btns");
  const edit = el("a", "btn-secondary-sm", "Edit Avatar"); edit.href = "character.html";
  const set = el("a", "btn-control-sm", "Settings"); set.href = "settings.html";
  btns.append(edit, set);
  head.append(pic, t, btns);
  root.appendChild(head);
  const detail = (label, value) => { const d = el("div"); d.append(el("span", "text-label", label), el("span", "text-lead", value)); det.appendChild(d); };

  // About
  const BLURB = "rblx2016.site.blurb";
  const about = el("div", "section");
  const ah = S.sectionHeader("About");
  const editBlurb = el("a", "btn-control-xs", "Edit");
  ah.appendChild(editBlurb);
  about.appendChild(ah);
  const abox = el("div", "section-content");
  const blurb = el("p", "profile-about");
  const paintBlurb = () => {
    const v = S.json(BLURB, "");
    blurb.textContent = typeof v === "string" && v ? v : "Hi! I play BLOXRO in my browser.";
  };
  paintBlurb();
  abox.appendChild(blurb);
  about.appendChild(abox);
  editBlurb.addEventListener("click", () => {
    const wrap = el("div", "profile-about-edit");
    const ta = el("textarea"); ta.maxLength = 1000;
    const v = S.json(BLURB, ""); ta.value = typeof v === "string" ? v : "";
    const r = el("div", "inline-row"); r.style.marginTop = "8px";
    const save = el("a", "btn-secondary-sm", "Save"), cancel = el("a", "btn-control-sm", "Cancel");
    r.append(save, cancel);
    wrap.append(ta, r);
    blurb.replaceWith(wrap);
    ta.focus();
    const close = () => { wrap.replaceWith(blurb); paintBlurb(); };
    save.addEventListener("click", () => { S.setJson(BLURB, ta.value.slice(0, 1000)); close(); });
    cancel.addEventListener("click", close);
  });
  root.appendChild(about);

  // Currently Wearing
  const wear = el("div", "section");
  const wh = S.sectionHeader("Currently Wearing");
  wear.appendChild(wh);
  const wbox = el("div", "section-content profile-avatar");
  const big = el("div", "pic"); big.appendChild(S.avatarImg());
  const wl = el("div", "wearing");
  const ul = el("ul");
  wl.appendChild(ul);
  wbox.append(big, wl);
  wear.appendChild(wbox);
  root.appendChild(wear);

  const favSec = el("div");
  root.appendChild(favSec);

  // Statistics
  const stats = el("div", "section");
  stats.appendChild(S.sectionHeader("Statistics"));
  const sbox = el("div", "section-content profile-stats");
  stats.appendChild(sbox);
  root.appendChild(stats);
  const statBox = (label, value) => { const d = el("div"); d.append(el("span", "text-label", label), el("span", "text-lead", value)); sbox.appendChild(d); };

  Promise.all([S.loadItems().catch(() => []), S.loadGames()]).then(([items, games]) => {
    const av = S.avatar;
    const worn = av.accessories.map((id) => S.byId(id)).filter(Boolean);
    for (const k of ["head", "face", "tshirt", "shirt", "pants"]) { const it = S.byId(av[k]); if (it) worn.push(it); }
    if (!worn.length) ul.appendChild(el("li", "local-empty", "Nothing yet."));
    for (const it of worn) {
      const li = el("li", "item-tile");
      const a = el("a", "thumb"); a.href = "catalog.html#item=" + it.id; a.title = it.name;
      const im = el("img"); im.alt = it.name; im.loading = "lazy"; im.src = S.thumb(it);
      a.appendChild(im);
      li.append(a, el("span", "nm", it.name));
      ul.appendChild(li);
    }
    const visits = games.reduce((n, g) => n + S.visits(g), 0);
    const mine = games.filter((g) => g.kind === "mine");
    detail("Items", String(S.inventory.size));
    detail("Games", String(mine.length));
    detail("Place Visits", String(visits));
    statBox("Join Date", new Date(joined).toLocaleDateString());
    statBox("Place Visits", String(visits));
    statBox("Items Owned", String(S.inventory.size));
    statBox("Games Created", String(mine.length));
    statBox("Favorite Games", String(S.favoriteKeys().length));
    statBox("Membership", ["None", "Builders Club", "Turbo Builders Club", "Outrageous Builders Club"][tier]);

    const favs = S.favoriteKeys().map((k) => games.find((g) => g.key === k)).filter(Boolean).slice(0, 6);
    for (const [title, list, more] of [["Favorite Games", favs, "games.html?sort=favorites"], ["Creations", mine.slice(0, 6), "develop.html"]]) {
      if (!list.length) continue;
      const sec = el("div", "section");
      sec.appendChild(S.sectionHeader(title, more));
      const gl = el("ul", "hlist game-cards grid");
      for (const g of list) gl.appendChild(S.gameCard(g));
      sec.appendChild(gl);
      favSec.appendChild(sec);
    }
  });
})();
