/* Game details: the 2016 game page. Big picture, name and creator, the green
 * Play button, thumbs up/down, favorite, visit stats; About and Servers tabs.
 * Servers is real multiplayer: a server is a room on the relay, and whoever
 * joins a room first hosts the game for everyone else in it. */
(function () {
  "use strict";
  const S = window.Site2016, el = S.el;
  S.page("games", "Game");
  const root = document.getElementById("game-root");
  const q = new URLSearchParams(location.search);
  const id = q.get("id") || "";
  const ROOM_OK = /^[A-Za-z0-9 _-]{1,32}$/;
  const cleanRoom = (s) => String(s || "").replace(/[^A-Za-z0-9 _-]/g, "").trim().slice(0, 32);

  root.appendChild(el("p", "text-secondary", "Loading…"));
  S.loadGames().then((games) => {
    root.textContent = "";
    const g = S.gameById(id);
    if (!g) {
      const c = el("div", "info-card");
      c.append(el("h2", "", "Game not found"), el("p", "", "This game isn't in this copy of BLOXRO. Files you open from your computer are forgotten when the page reloads."));
      const a = el("a", "btn-secondary-md", "Browse Games");
      a.href = "games.html";
      c.appendChild(a);
      root.appendChild(c);
      return;
    }
    document.title = g.title + " - BLOXRO";
    render(g, games);
  });

  function stat(label, value) {
    const d = el("div", "game-stat");
    d.append(el("span", "text-label", label), el("span", "text-lead", value));
    return d;
  }

  function render(g, games) {
    const eng = S.engine();
    // ---- top card
    const main = el("div", "game-main");
    const left = el("div", "game-thumb-big");
    const frame = el("div", "frame");
    const img = el("img");
    img.alt = g.title;
    img.src = g.thumb || S.GAME_THUMB_NONE;
    img.onerror = () => { img.onerror = null; img.src = S.GAME_THUMB_NONE; };
    if (!g.thumb) img.style.objectFit = "contain";
    frame.appendChild(img);
    left.appendChild(frame);

    // votes + favorite under the picture
    const votes = el("div", "game-votes");
    const up = el("a", "vote-up"); up.title = "I like this"; up.appendChild(el("span", "icon-like"));
    const down = el("a", "vote-down"); down.title = "I don't like this"; down.appendChild(el("span", "icon-dislike"));
    const vbar = el("span", "vote-bar"); const vfill = el("i"); vbar.appendChild(vfill);
    const fav = el("a", "game-fav"); fav.appendChild(el("span", "icon-favorite")); const favT = el("span"); fav.appendChild(favT);
    const paintVotes = () => {
      const v = S.vote(g);
      up.classList.toggle("on", v > 0); down.classList.toggle("on", v < 0);
      up.querySelector("span").className = v > 0 ? "icon-like-selected icon-like" : "icon-like";
      down.querySelector("span").className = v < 0 ? "icon-dislike-selected icon-dislike" : "icon-dislike";
      vfill.style.width = (v > 0 ? 100 : v < 0 ? 0 : 50) + "%";
      const on = S.isFavorite(g);
      fav.classList.toggle("on", on);
      favT.textContent = on ? "Favorited" : "Favorite";
    };
    up.addEventListener("click", () => { S.setVote(g, S.vote(g) > 0 ? 0 : 1); paintVotes(); });
    down.addEventListener("click", () => { S.setVote(g, S.vote(g) < 0 ? 0 : -1); paintVotes(); });
    fav.addEventListener("click", () => { S.toggleFavorite(g); paintVotes(); });
    votes.append(up, vbar, down, fav);
    left.appendChild(votes);

    const right = el("div", "game-calls");
    right.appendChild(el("h1", "game-name", g.title));
    const by = el("div", "game-creator", "By ");
    const bya = el("a", "", g.creator);
    bya.href = g.kind === "mine" || g.kind === "local" ? "profile.html" : "games.html";
    by.appendChild(bya);
    right.appendChild(by);
    right.appendChild(el("div", "rbx-divider"));
    const playBtn = el("a", "btn-common-play-game-lg");
    playBtn.title = "Play " + g.title;
    playBtn.appendChild(el("span", "icon-play"));
    playBtn.appendChild(document.createTextNode("Play"));
    playBtn.addEventListener("click", () => S.play(g));
    right.appendChild(playBtn);
    const note = el("p", "game-play-note");
    const mpOn = S.json("rblx2016.mp", 0) === 1;
    note.textContent = mpOn ? "Joins your multiplayer server (Settings). Pick another under Servers." : "Plays on your own. To play with friends, use Servers.";
    right.appendChild(note);
    if (eng && !eng.canPlay()) { playBtn.classList.add("btn-disabled"); note.textContent = "WebGL 2 is off in this browser, so games can't be drawn."; }
    if (g.kind === "mine") {
      const r = el("div", "inline-row");
      r.style.marginTop = "10px";
      const ed = el("a", "btn-control-sm", "Edit in Studio");
      ed.href = "../index.html?studio=" + encodeURIComponent(g.mineId);
      ed.target = "_top";
      const dl = el("a", "btn-control-sm", "Download .rbxl");
      dl.addEventListener("click", () => downloadMine(g));
      r.append(ed, dl);
      right.appendChild(r);
    }
    const stats = el("div", "game-stat-row");
    const v = S.visits(g);
    stats.append(stat("Your visits", String(v)), stat("Created", g.year || (g.kind === "mine" ? "Studio" : "—")),
      stat("Genre", g.genre), stat("Size", g.size ? (g.size >= 1048576 ? (g.size / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(g.size / 1024)) + " KB") : "—"));
    right.appendChild(stats);
    main.append(left, right);
    root.appendChild(main);
    paintVotes();

    // ---- tabs
    const tabs = el("ul", "rbx-tabs-horizontal");
    const panes = {};
    const TABS = [["about", "About"], ["servers", "Servers"]];
    const show = (t) => {
      for (const li of tabs.children) li.classList.toggle("active", li.dataset.t === t);
      for (const k in panes) panes[k].hidden = k !== t;
    };
    for (const [t, label] of TABS) {
      const li = el("li"); li.dataset.t = t;
      const a = el("a", "", label);
      a.addEventListener("click", () => show(t));
      li.appendChild(a); tabs.appendChild(li);
      panes[t] = el("div", "tab-pane");
    }
    root.appendChild(tabs);
    for (const k in panes) root.appendChild(panes[k]);

    // About
    const about = panes.about;
    const ab = el("div", "section-content game-about");
    ab.appendChild(el("h3", "", "Description"));
    const desc = g.kind === "mine" ? "A game you made in BLOXRO Studio. It's saved in this browser."
      : g.kind === "local" ? "A place file you opened from your computer. It stays here until the page reloads."
      : g.title + (g.year ? " (" + g.year + ")" : "") + ". " + (g.genre === "Classic" ? "A classic place from the archive. " : g.genre === "Test map" ? "A 2016 engine test map. " : g.genre === "Popular" ? "One of the popular games of its time. " : "") +
        "Runs offline in your browser on the 2016 engine.";
    ab.appendChild(el("p", "game-description", desc));
    const tbl = el("table", "game-stats-table");
    const rows = [["Creator", g.creator], ["Genre", g.genre], ["Year", g.year || "—"], ["Your visits", String(v)],
      ["Favorited", S.isFavorite(g) ? "Yes" : "No"], ["Allowed gear", "All genres"]];
    for (const [k, val] of rows) { const tr = el("tr"); tr.append(el("td", "", k), el("td", "", val)); tbl.appendChild(tr); }
    ab.appendChild(tbl);
    about.appendChild(ab);
    const rec = games.filter((x) => x.id !== g.id && x.genre === g.genre).slice(0, 6);
    if (rec.length) {
      const sec = el("div", "section");
      sec.style.marginTop = "18px";
      sec.appendChild(S.sectionHeader("Recommended Games", "games.html?sort=" + ({ Popular: "popular", Classic: "classic", "Test map": "test", Game: "games", "My Game": "mine", "Your file": "local" }[g.genre] || "")));
      const ul = el("ul", "hlist game-cards grid");
      for (const x of rec) ul.appendChild(S.gameCard(x));
      sec.appendChild(ul);
      about.appendChild(sec);
    }

    // Servers
    const sv = panes.servers;
    const pub = "g-" + hash(g.key);
    const savedRoom = cleanRoom(S.json("rblx2016.mpRoom", "") || (() => { try { return localStorage.getItem("rblx2016.mpRoom") || ""; } catch (_) { return ""; } })());
    sv.appendChild(el("p", "text-secondary", "Real 2016 servers. The first person in a server hosts this game for everyone who joins it. Servers close when the host leaves."));
    const serverRow = (title, sub, room, extra) => {
      const it = el("div", "server-item");
      const info = el("div", "server-info");
      info.append(el("div", "server-title", title), el("div", "text-secondary small", sub));
      it.appendChild(info);
      if (extra) it.appendChild(extra);
      const j = el("a", "btn-primary-sm", "Join");
      j.addEventListener("click", () => {
        const r = typeof room === "function" ? room() : room;
        if (!ROOM_OK.test(r)) { S.alert("Server name", "Use 1-32 letters, numbers, spaces, - or _."); return; }
        S.play(g, { server: { room: r } });
      });
      it.appendChild(j);
      return it;
    };
    sv.appendChild(serverRow("Public server", "Everyone who joins this game's public server plays together.", pub));
    const nameIn = el("input", "form-control");
    nameIn.maxLength = 32; nameIn.placeholder = "Server name (share it with friends)";
    nameIn.value = cleanRoom(q.get("server")) || savedRoom;
    sv.appendChild(serverRow("Join or start a server by name", "Same name = same server. Tell your friends the name.", () => cleanRoom(nameIn.value), nameIn));
    const priv = "vip-" + Math.random().toString(36).slice(2, 8);
    const link = el("a", "btn-control-xs", "Copy invite link");
    link.addEventListener("click", async () => {
      const url = new URL("../index.html#/game.html?id=" + encodeURIComponent(g.id) + "&server=" + priv, location.href).href;
      try { await navigator.clipboard.writeText(url); link.textContent = "Link copied"; }
      catch (_) { S.alert("Invite link", url); }
    });
    sv.appendChild(serverRow("Private server", "A new server with a random name (" + priv + "). Copy the link and send it to friends.", priv, link));
    sv.appendChild(el("p", "text-secondary small", "Solo play is the green Play button. " +
      (g.kind === "local" ? "Your file stays on your computer; people who join get the game streamed from you." : "")));
    show(q.get("server") ? "servers" : "about");
  }

  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }
  async function downloadMine(g) {
    try {
      const games = window.parent && window.parent.BloxroGames;
      const rec = games ? await games.get(g.mineId) : null;
      if (!rec || !rec.bytes) throw new Error("not found");
      S.download(rec.bytes, (g.title.replace(/[\\/:*?"<>|]+/g, "_") || "game") + ".rbxl");
    } catch (_) { S.alert("Download", "Couldn't read that game. Open it in Studio and save it first."); }
  }
})();
