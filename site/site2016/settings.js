/* Settings: the 2016 "My Settings" page. Account Info (your name), Game
 * (2017 UI, FPS), Multiplayer, Graphics and Asset downloads. Each control
 * drives the matching control of the engine page (js/app.js), so the game
 * reads them exactly as it always has. */
(function () {
  "use strict";
  const S = window.Site2016, el = S.el;
  S.page("settings", "Settings");
  const root = document.getElementById("settings-root");
  const eng = S.engine();
  const ctl = (id) => (eng ? eng.control(id) : null);

  root.appendChild(el("h1", "", "My Settings"));
  if (!eng) {
    const c = el("div", "info-card");
    c.append(el("h2", "", "Open BLOXRO first"), el("p", "", "Settings are kept by the game page. Open BLOXRO from its main page to change them."));
    const a = el("a", "btn-secondary-md", "Go to BLOXRO"); a.href = "../index.html#/settings.html"; a.target = "_top";
    c.appendChild(a);
    root.appendChild(c);
    return;
  }
  const cols = el("div", "settings-cols");
  const tabs = el("ul", "settings-tabs");
  const main = el("div", "settings-main");
  cols.append(tabs, main);
  root.appendChild(cols);
  const sections = {};
  const TABS = [["account", "Account Info"], ["game", "Game"], ["multiplayer", "Multiplayer"], ["graphics", "Graphics"], ["assets", "Asset Downloads"]];
  function show(t) {
    for (const li of tabs.children) li.classList.toggle("active", li.dataset.t === t);
    for (const k in sections) sections[k].hidden = k !== t;
    try { history.replaceState(null, "", "settings.html?tab=" + t); } catch (_) {}
  }
  for (const [t, label] of TABS) {
    const li = el("li"); li.dataset.t = t;
    const a = el("a", "", label); a.addEventListener("click", () => show(t));
    li.appendChild(a); tabs.appendChild(li);
    const sec = el("div", "settings-section");
    sec.appendChild(el("h3", "", label));
    sections[t] = sec;
    main.appendChild(sec);
  }
  const saved = (host) => { const s = el("span", "saved-note", "Saved"); host.appendChild(s); setTimeout(() => s.remove(), 1500); };
  function checkbox(sec, id, title, help) {
    const c = ctl(id);
    if (!c) return;
    const lab = el("label", "check-row");
    const box = el("input"); box.type = "checkbox"; box.checked = c.checked;
    const txt = el("div"); txt.appendChild(el("b", "", title)); if (help) txt.appendChild(el("span", "", help));
    box.addEventListener("change", () => { c.checked = box.checked; c.dispatchEvent(new Event("change")); saved(txt.firstChild); });
    lab.append(box, txt);
    sec.appendChild(lab);
  }
  function textField(sec, id, label, help, opts) {
    const c = ctl(id);
    if (!c) return null;
    const g = el("div", "form-group");
    const lab = el("label", "", label);
    const inp = el("input", "form-control");
    inp.type = (opts && opts.type) || "text";
    inp.value = c.value; inp.placeholder = c.placeholder || "";
    if (c.maxLength > 0) inp.maxLength = c.maxLength;
    inp.spellcheck = false; inp.autocomplete = "off";
    inp.addEventListener("input", () => { c.value = inp.value; c.dispatchEvent(new Event("input")); });
    inp.addEventListener("change", () => { c.dispatchEvent(new Event("blur")); if (opts && opts.after) opts.after(inp, c); saved(lab); });
    g.append(lab, inp);
    if (help) g.appendChild(el("p", "form-help", help));
    sec.appendChild(g);
    return inp;
  }

  // Account Info
  const acc = sections.account;
  textField(acc, "userName", "Username", "Your name in games and on the site. Letters, numbers, spaces and _ (up to 20).", {
    after(inp, c) {
      inp.value = c.value;
      const nm = document.querySelector(".local-left-name");
      if (nm) { nm.lastChild.textContent = c.value; }
    },
  });
  const bc = el("div", "form-group");
  bc.appendChild(el("span", "form-label", "Membership"));
  const tier = S.bcTier();
  bc.appendChild(el("p", "", ["No Builders Club", "Builders Club", "Turbo Builders Club", "Outrageous Builders Club"][tier] + " "));
  const bca = el("a", "", tier ? "Change" : "Upgrade (free)"); bca.href = "info.html?p=bc";
  bc.lastChild.appendChild(bca);
  acc.appendChild(bc);

  // Game
  const game = sections.game;
  checkbox(game, "ui2017", "2017 client UI", "The 2017 chat, top bar, menu and player list in games.");
  checkbox(game, "unlockFps", "Unlock FPS", "Turn off the engine's 30 FPS cap.");
  const sm = ctl("serverMode");
  if (sm) {
    const g = el("div", "form-group");
    const lab = el("label", "", "Game server");
    const sg = el("div", "rbx-select-group"); sg.style.maxWidth = "320px";
    const sel = el("select", "rbx-select");
    for (const o of sm.options) { const n = el("option", "", o.textContent); n.value = o.value; sel.appendChild(n); }
    sel.value = sm.value;
    sel.addEventListener("change", () => { sm.value = sel.value; sm.dispatchEvent(new Event("change")); saved(lab); });
    sg.appendChild(sel);
    g.append(lab, sg, el("p", "form-help", "Games built for Roblox's servers (RemoteEvents, FilteringEnabled) run on a private 2016 game server inside this page. Automatic does that only for games that need it; it uses more memory."));
    game.appendChild(g);
  }
  game.appendChild(el("p", "form-help", "Changes apply the next time you press Play."));

  // Multiplayer
  const mp = sections.multiplayer;
  checkbox(mp, "mpEnable", "Play Button joins a server", "When on, the green Play button joins the server below instead of playing alone.");
  textField(mp, "mpRoom", "Server name", "Everyone who uses the same server name plays together. The first one in hosts the game they picked.");
  textField(mp, "mpRelay", "Relay URL", "Leave blank to use this site's relay (" + eng.relay() + ").");

  // Graphics
  const gr = sections.graphics;
  const lg = ctl("lightGrid");
  if (lg) {
    const g = el("div", "form-group");
    const lab = el("label", "", "Lighting");
    const sg = el("div", "rbx-select-group"); sg.style.maxWidth = "280px";
    const sel = el("select", "rbx-select");
    for (const o of lg.options) { const n = el("option", "", o.textContent); n.value = o.value; sel.appendChild(n); }
    sel.value = lg.value;
    sel.addEventListener("change", () => { lg.value = sel.value; lg.dispatchEvent(new Event("change")); saved(lab); });
    sg.appendChild(sel);
    g.append(lab, sg, el("p", "form-help", "Renderer compatibility. Automatic is right for almost everyone."));
    gr.appendChild(g);
  }
  checkbox(gr, "gles2Shaders", "GLES2 shader pack", "Simpler shaders, for graphics cards that draw games black or broken.");
  checkbox(gr, "showDiag", "Renderer diagnostics", "Show frame and draw statistics over the game.");

  // Asset downloads (only means something with the local server)
  const as = sections.assets;
  const note = ctl("cookieNote"), state = ctl("cookieState");
  as.appendChild(el("p", "form-help", note ? note.textContent.replace(/\s+/g, " ").trim() : ""));
  const st = el("p", "", "Status: ");
  const stv = el("b", "", state ? state.textContent : "unknown");
  st.appendChild(stv);
  as.appendChild(st);
  const ci = ctl("cookieInput"), cs = ctl("cookieSave"), cc = ctl("cookieClear");
  if (ci && cs && cc) {
    const row = el("div", "inline-row");
    const inp = el("input", "form-control"); inp.type = "password"; inp.autocomplete = "off"; inp.placeholder = ci.placeholder; inp.style.maxWidth = "320px"; inp.style.height = "36px";
    const save = el("a", "btn-secondary-sm", "Save"), clr = el("a", "btn-control-sm", "Remove");
    save.addEventListener("click", () => { ci.value = inp.value; inp.value = ""; cs.click(); setTimeout(() => { stv.textContent = state.textContent; }, 800); });
    clr.addEventListener("click", () => { cc.click(); setTimeout(() => { stv.textContent = state.textContent; }, 800); });
    row.append(inp, save, clr);
    as.appendChild(row);
    as.appendChild(el("p", "form-help", "Only used by the local server (webserve.py) on your own computer, never stored in this page. The public site doesn't use it."));
  }

  const want = new URLSearchParams(location.search).get("tab");
  show(TABS.some((t) => t[0] === want) ? want : "account");
})();
