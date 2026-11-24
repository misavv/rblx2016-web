/* Info pages: ROBUX, Builders Club (a free, working membership picker) and
 * the 2016 features this offline archive has no server for (Messages,
 * Friends, Trade, Groups, Forum, Blog). */
(function () {
  "use strict";
  const S = window.Site2016, el = S.el;
  const p = new URLSearchParams(location.search).get("p") || "";
  const PAGES = {
    robux: ["robux", "ROBUX", "icon-robux", "Everything on BLOXRO is free.",
      "There's nothing to buy. Every hat, gear and package in the Catalog is free, and so is every Builders Club membership.", [["Browse the Catalog", "catalog.html"]]],
    bc: ["bc", "Builders Club", "icon-bc", "Pick your membership. It's free.",
      "Your Builders Club badge shows next to your name on the site and in the in-game player list.", []],
    messages: ["messages", "Messages", "icon-nav-message", "No messages here.",
      "BLOXRO runs entirely in your browser, so there's no message server. Chat with people in games instead.", [["Find a game", "games.html"]]],
    friends: ["friends", "Friends", "icon-nav-friends", "Play with your friends.",
      "There are no friend lists in this archive. Open a game, go to Servers and join the same server name as your friends.", [["Find a game", "games.html"]]],
    trade: ["trade", "Trade", "icon-nav-trade", "No need to trade.",
      "Everything in the Catalog is free, so you can just get the item you want.", [["Browse the Catalog", "catalog.html"]]],
    groups: ["groups", "Groups", "icon-nav-group", "Groups aren't in this archive.",
      "Groups needed the 2016 servers. Make a game in BLOXRO Studio and invite your friends to a server instead.", [["Develop", "develop.html"]]],
    forum: ["forum", "Forum", "icon-nav-forum", "The Forum isn't in this archive.",
      "The 2016 forums lived on the website's servers and weren't saved.", [["Back to Home", "home.html"]]],
    blog: ["blog", "Blog", "icon-nav-blog", "What's new on BLOXRO",
      "News about this archive is on your Home page under Blog News.", [["Go to Home", "home.html"]]],
  };
  const d = PAGES[p] || PAGES.robux;
  S.page(d[0], d[1]);
  const root = document.getElementById("info-root");
  root.appendChild(el("h1", "", d[1]));
  const card = el("div", "info-card");
  const ic = el("span", "icon-big " + d[2]);
  card.append(ic, el("h2", "", d[3]), el("p", "", d[4]));
  if (p === "bc") {
    const tiers = el("div", "bc-tiers");
    tiers.setAttribute("role", "radiogroup");
    const NAMES = [["None", "No membership"], ["Builders Club", "The classic"], ["Turbo Builders Club", "Faster, shinier"], ["Outrageous Builders Club", "The works"]];
    const paint = () => {
      const t = S.bcTier();
      for (const b of tiers.children) b.setAttribute("aria-checked", String(Number(b.dataset.t) === t));
    };
    NAMES.forEach(([n, sub], i) => {
      const b = el("button", "bc-tier");
      b.type = "button"; b.dataset.t = i; b.setAttribute("role", "radio");
      if (i) { const im = el("img"); im.src = S.BC_ICONS[i]; im.alt = ""; b.appendChild(im); }
      else b.appendChild(el("span", "icon-nav-profile"));
      b.append(el("b", "", n), el("span", "", sub));
      b.addEventListener("click", () => { S.setBcTier(i); paint(); S.wireChrome("bc"); });
      tiers.appendChild(b);
    });
    card.appendChild(tiers);
    paint();
  }
  for (const [t, h] of d[5]) { const a = el("a", "btn-secondary-md", t); a.href = h; card.appendChild(a); }
  root.appendChild(card);
})();
