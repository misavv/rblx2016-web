/* Home: the 2016 logged-in home page. Hello header with your avatar,
 * Friends, Recently Played, Favorites, your Studio games, My Feed and Blog
 * News. Recently played and favorites are the same lists the Xbox menu uses. */
(function () {
  "use strict";
  const S = window.Site2016, el = S.el;
  S.page("home", "Home");
  const root = document.getElementById("home-root");

  // Hello, name!
  const head = el("div", "home-header");
  const pic = el("a", "avatar avatar-headshot-lg");
  pic.href = "profile.html";
  pic.appendChild(S.avatarImg("avatar-card-image"));
  const hello = el("div", "home-header-content");
  const h1 = el("h1");
  const ha = el("a", "", "Hello, " + S.userName() + "!");
  ha.href = "profile.html";
  h1.appendChild(ha);
  const tier = S.bcTier();
  if (tier) { const i = el("img", "local-bc"); i.src = S.BC_ICONS[tier]; i.alt = ["", "Builders Club", "Turbo Builders Club", "Outrageous Builders Club"][tier]; i.title = i.alt; h1.appendChild(i); }
  hello.appendChild(h1);
  head.append(pic, hello);
  root.appendChild(head);

  // Friends
  const friends = el("div", "section home-friends");
  friends.appendChild(S.sectionHeader("Friends (0)"));
  const fc = el("div", "section-content friends-empty");
  fc.appendChild(el("span", "icon-nav-friends"));
  const ft = el("div");
  ft.appendChild(document.createTextNode("Play with your friends: open a game, go to its "));
  ft.appendChild(el("b", "", "Servers"));
  ft.appendChild(document.createTextNode(" tab and join the same server name. Whoever gets there first hosts it."));
  fc.appendChild(ft);
  friends.appendChild(fc);
  root.appendChild(friends);

  const rows = el("div");
  root.appendChild(rows);

  // My Feed / Blog News
  const cols = el("div", "home-cols");
  const feed = el("div", "section home-feed");
  feed.appendChild(S.sectionHeader("My Feed"));
  const fbox = el("div", "section-content");
  const form = el("div", "feed-input");
  const input = el("input", "form-control");
  input.type = "text"; input.maxLength = 254; input.placeholder = "What are you up to?";
  const post = el("a", "btn-secondary-sm", "Share");
  form.append(input, post);
  const list = el("ul", "feed-list");
  fbox.append(form, list);
  feed.appendChild(fbox);
  const FEED = "rblx2016.site.feed";
  function renderFeed() {
    list.textContent = "";
    const items = S.json(FEED, []);
    const arr = Array.isArray(items) ? items.filter((x) => x && typeof x.t === "string") : [];
    if (!arr.length) { list.appendChild(el("li", "local-empty", "Your status updates show up here.")); return; }
    arr.forEach((it, idx) => {
      const li = el("li");
      const p = el("div", "feed-pic");
      p.appendChild(S.avatarImg());
      const b = el("div", "feed-body");
      const del = el("a", "feed-del", "Delete");
      del.addEventListener("click", () => { arr.splice(idx, 1); S.setJson(FEED, arr); renderFeed(); });
      b.append(del, el("div", "feed-name", S.userName()), el("div", "feed-text", it.t),
        el("div", "feed-when", new Date(Number(it.at) || Date.now()).toLocaleString()));
      li.append(p, b);
      list.appendChild(li);
    });
  }
  function share() {
    const t = input.value.trim().slice(0, 254);
    if (!t) return;
    const items = S.json(FEED, []);
    const arr = Array.isArray(items) ? items : [];
    arr.unshift({ t, at: Date.now() });
    S.setJson(FEED, arr.slice(0, 50));
    input.value = "";
    renderFeed();
  }
  post.addEventListener("click", share);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") share(); });
  renderFeed();

  const blog = el("div", "section blog-news");
  blog.appendChild(S.sectionHeader("Blog News"));
  const bbox = el("div", "section-content");
  const bl = el("ul", "blog-list");
  for (const [t, d, href] of [
    ["The website is back, 2016 style", "Games, Catalog, Develop, your Character and Profile, all in the 2016 layout.", "games.html"],
    ["BLOXRO Studio is here", "Build a place from a baseplate, save it as .rbxl and play it. Find it under Develop.", "develop.html"],
    ["Draw your avatar", "The Character page draws your avatar with the game engine, like the 2016 thumbnail servers.", "character.html"],
    ["Everything in the Catalog is free", "Get any hat, gear or package and wear it in every game.", "catalog.html"],
    ["Play with friends", "Real 2016 multiplayer: pick a server on a game's Servers tab.", "games.html"],
    ["BLOXRO on Xbox One", "The 2016 Xbox One app, in your browser. Works with a controller.", "../xbox/"],
  ]) {
    const li = el("li");
    const a = el("a");
    a.href = href;
    if (href.startsWith("..")) a.target = "_top";
    a.appendChild(el("b", "", t));
    li.append(a, el("span", "", d));
    bl.appendChild(li);
  }
  bbox.appendChild(bl);
  blog.appendChild(bbox);
  cols.append(feed, blog);
  root.appendChild(cols);

  // Game rows once the place list is in.
  function row(title, games, more) {
    const sec = el("div", "section");
    sec.appendChild(S.sectionHeader(title, more));
    const ul = el("ul", "hlist game-cards grid");
    for (const g of games) ul.appendChild(S.gameCard(g));
    sec.appendChild(ul);
    return sec;
  }
  S.loadGames().then((games) => {
    const byKey = (k) => games.find((g) => g.key === k);
    const recent = S.recentKeys().map(byKey).filter(Boolean).slice(0, 6);
    const favs = S.favoriteKeys().map(byKey).filter(Boolean).slice(0, 6);
    const mine = games.filter((g) => g.kind === "mine").slice(0, 6);
    if (recent.length) rows.appendChild(row("Recently Played", recent, "games.html?sort=recent"));
    else {
      const sec = el("div", "section");
      sec.appendChild(S.sectionHeader("Recently Played", "games.html"));
      const c = el("div", "section-content empty", "You haven't played any games yet. ");
      const a = el("a", "", "Find a game to play");
      a.href = "games.html";
      c.appendChild(a);
      sec.appendChild(c);
      rows.appendChild(sec);
      const pop = games.filter((g) => g.genre === "Popular").slice(0, 6);
      if (pop.length) rows.appendChild(row("Popular", pop, "games.html?sort=popular"));
    }
    if (favs.length) rows.appendChild(row("My Favorites", favs, "games.html?sort=favorites"));
    if (mine.length) rows.appendChild(row("My Games", mine, "develop.html"));
  });
})();
