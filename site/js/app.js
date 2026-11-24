/* Browser shell for the 2016 Bloxro engine port.
 * The menu is intentionally small; the engine owns the game itself. */
(function () {
  "use strict";

  const MAX_PLACE_BYTES = 32 * 1024 * 1024;

  // Place names come from file names ("ROBLOX Racing (2014 game)"): show the
  // brand as Bloxro (same rule as tools/brand/retext.py).
  function brandName(s) {
    return String(s).replace(/(?<![A-Za-z0-9_.\/\:@#<-])(ROBLOX|Roblox|roblox)(IANS|IAN|IA|ians|ian|ia)?(?![A-Za-z0-9_\-\/\@]|\.[A-Za-z])/g,
      (m, w, suf) => ({ ROBLOX: "BLOXRO", Roblox: "Bloxro", roblox: "bloxro" })[w] + (suf || ""));
  }
  const $ = (id) => document.getElementById(id);

  // ?mute=1: silence all game/menu sound for the rest of this tab (testing).
  try {
    if (new URLSearchParams(location.search).get("mute") === "1") sessionStorage.setItem("rblx2016.mute", "1");
    if (sessionStorage.getItem("rblx2016.mute") === "1") {
      const media = HTMLMediaElement.prototype, play = media.play;
      media.play = function () { this.muted = true; return play.apply(this, arguments); };
    }
  } catch (_) {}

  // Phones/tablets use the stock 2016 touch controls; a touchscreen laptop
  // with a fine pointer stays on keyboard + mouse.
  const touchDevice =
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "") ||
    (navigator.maxTouchPoints > 0 &&
      ((window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
       /Macintosh/i.test(navigator.userAgent || "")));

  let places = [];
  let selected = null;
  let engine = null;
  let playing = false;
  let modulePromise = null;
  let rafId = 0;
  let screenshotPending = false;
  // Game pictures for the Xbox menu tiles: window.rblxCaptureThumb() resolves
  // with a JPEG of the next drawn frame (used by the dev harness).
  let thumbPending = null;
  window.rblxCaptureThumb = () => new Promise((resolve) => { thumbPending = resolve; });
  let mediaRecorder = null;
  let recordChunks = [];
  let recordStream = null;
  const canvas = $("gameCanvas");
  function resizeCanvas() {
    if (!engine || !playing) return;
    let w = canvas.clientWidth, h = canvas.clientHeight;
    // The Xbox menu is laid out in 1920x1080 TV pixels: render at (at least)
    // that size with the window's shape and let the browser scale it, so it
    // looks the same in any window. Mouse input already maps CSS -> canvas pixels.
    if (SHELL_MODE && w > 0 && h > 0) {
      const s = Math.max(1920 / w, 1080 / h);
      w = Math.round(w * s); h = Math.round(h * s);
    }
    if (w > 0 && h > 0) {
      try { engine.ccall("rblx_resize", null, ["number", "number"], [w, h]); } catch (_) {}
    }
  }

  const login = $("login");
  const placeList = $("placeList");  const status = $("status");
  const playBtn = $("playBtn");
  const openFile = $("openFile");
  const userName = $("userName");
  const unlockFps = $("unlockFps");
  const ui2017 = $("ui2017");

  // Controllers: poll the browser Gamepad API and feed the engine the same
  // per-button/per-stick events the native SDL controller code produced.
  // Standard-mapping index -> engine KeyCode (SDLK_GAMEPAD_*).
  const PAD_BUTTONS = { 0: 1002, 1: 1003, 2: 1000, 3: 1001, 4: 1005, 5: 1004, 8: 1011, 9: 1010,
    10: 1009, 11: 1008, 12: 1014, 13: 1015, 14: 1012, 15: 1013 };
  let gamepadTimer = 0;
  function startGamepadBridge(mod) {
    if (gamepadTimer || typeof mod._rblx_gamepad_button !== "function" || !navigator.getGamepads) return;
    const seen = {};      // pad index -> { buttons: {}, axes: {} }
    const dz = (v) => (Math.abs(v) < 0.15 ? 0 : v);
    gamepadTimer = setInterval(() => {
      const pads = navigator.getGamepads();
      for (let i = 0; i < 4; i++) {
        const p = pads[i];
        const s = seen[i];
        if (!p || !p.connected) {
          if (s) { delete seen[i]; mod.ccall("rblx_gamepad_connect", null, ["number", "number"], [i, 0]); }
          continue;
        }
        if (!s) { seen[i] = { b: {}, a: {} }; mod.ccall("rblx_gamepad_connect", null, ["number", "number"], [i, 1]); continue; }
        for (const [idx, code] of Object.entries(PAD_BUTTONS)) {
          const down = !!(p.buttons[idx] && p.buttons[idx].pressed);
          if (down !== !!s.b[idx]) {
            s.b[idx] = down;
            mod.ccall("rblx_gamepad_button", null, ["number", "number", "number"], [i, code, down ? 1 : 0]);
          }
        }
        // Sticks (engine y is up-positive) and triggers (pull in z).
        const sticks = [[1016, dz(p.axes[0] || 0), -dz(p.axes[1] || 0), 0], [1017, dz(p.axes[2] || 0), -dz(p.axes[3] || 0), 0],
          [1007, 0, 0, p.buttons[6] ? p.buttons[6].value : 0], [1006, 0, 0, p.buttons[7] ? p.buttons[7].value : 0]];
        for (const [code, x, y, z] of sticks) {
          const key = x.toFixed(2) + "," + y.toFixed(2) + "," + z.toFixed(2);
          if (s.a[code] !== key) {
            s.a[code] = key;
            mod.ccall("rblx_gamepad_axis", null, ["number", "number", "number", "number", "number"], [i, code, x, y, z]);
          }
        }
      }
    }, 16);
  }

  // ---------------------------------------------------------- Xbox app shell
  // ?shell=xbox runs the real Xbox One app shell (PlatformContent/durango
  // scripts/ui, web/xboxshell) in the engine, like the console client did:
  // its own Lua draws every screen. The page supplies what the console's
  // services and web API did (see Modules/PlatformService.lua and Http.lua).
  const SHELL_MODE = new URLSearchParams(location.search).get("shell") === "xbox";
  const SHELL_SORTS = [
    { id: 1, name: "Popular", test: (n) => /popular\)/i.test(n) },
    { id: 2, name: "Featured", test: (n) => !/classic\)|test map\)|popular\)/i.test(n) },
    { id: 3, name: "Classics", test: (n) => /classic\)/i.test(n) },
    { id: 4, name: "Test Maps", test: (n) => /test map\)/i.test(n) },
  ];
  function shellPlaces() {
    // Stable ids: bundled places in file-name order.
    const list = places.filter((p) => p.kind === "bundled").map((p) => p.id.slice(6)).sort();
    return list.map((file, i) => {
      const name = brandName(file.replace(/\.rbxlx?$/i, ""));
      const m = /^(.*?)\s*\((\d{4})\s*([^)]*)\)\s*$/.exec(name);
      const sort = (SHELL_SORTS.find((s) => s.test(name)) || SHELL_SORTS[1]).id;
      return { id: 1000 + i, file, title: m ? m[1] : name, year: m ? m[2] : "", sort,
        creator: "BLOXRO", description: (m ? m[1] + " (" + m[2] + ")" : name) + ". Runs offline in your browser on the 2016 engine." };
    });
  }
  // Avatar packages: Bloxro's own classic packages (catalog/packages.json,
  // downloaded from Bloxro): body parts (CharacterMesh models) plus the
  // package's accessories, stored in catalog/item like every other item.
  let bundleList = null;
  async function loadBundles() {
    if (bundleList) return bundleList;
    try { bundleList = (await (await fetchRetry("catalog/packages.json", { cache: "no-cache" }, 2)).json()).packages || []; }
    catch (_) { bundleList = []; }
    return bundleList;
  }
  const BUNDLES_KEY = "rblx2016.xbox.packages";
  // Bloxro's free packages, which every account owned.
  const FREE_PACKAGES = [900000311, 900000238, 900000239, 900000109, 900000108];
  function ownedBundles() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(BUNDLES_KEY) || "null"); } catch (_) {}
    return new Set((Array.isArray(saved) ? saved : FREE_PACKAGES).map(Number));
  }
  function ownBundle(id) {
    const s = ownedBundles();
    s.add(Number(id));
    try { localStorage.setItem(BUNDLES_KEY, JSON.stringify([...s])); } catch (_) {}
  }
  function bundleById(id) { return (bundleList || []).find((b) => b.id === Number(id)) || null; }
  // Wearing a package: its body parts, and its accessories in place of yours
  // (when it has any). Clothes, face and body colors stay.
  function wearBundle(b) {
    ownBundle(b.id);
    avatar.package = b.id;
    avatar.packageParts = b.parts.slice();
    if (b.accessories.length) avatar.accessories = b.accessories.slice();
    saveAvatar();
  }
  // A package's picture: the package on a plain grey avatar, like Bloxro's
  // package thumbnails.
  function bundleSpec(b) {
    return b.parts.concat(b.accessories).map((id) => "acc:" + id).concat(["body:194,194,194,194,194,194"]).join(";");
  }

  // "A Bridge too far (2010 classic)" -> "A Bridge too far", as the menu shows it.
  // "&game=<menu id>" while coming back from a game (kept across the avatar
  // render detour), so the menu can reopen that game's page.
  function returnGameParam() {
    const g = Number(new URLSearchParams(location.search).get("game")) || 0;
    return g ? "&game=" + g : "";
  }
  function placeTitle(name) {
    name = brandName(name || "");
    const m = /^(.*?)\s*\((\d{4})[^)]*\)\s*$/.exec(name || "");
    return m ? m[1] : (name || "");
  }
  function setPlaceInfo(mod, name, creator) {
    if (typeof mod._rblx_set_place_info !== "function") return;
    try { mod.ccall("rblx_set_place_info", null, ["string", "string"], [placeTitle(name), creator || "BLOXRO"]); } catch (_) {}
  }
  async function loadShellPack(mod) {
    if (mod.__xboxshell) return true;
    try {
      const files = await (await fetch("xboxshell/index.json", { cache: "no-cache" })).json();
      const blobs = await Promise.all(files.map(async ([src]) => {
        const r = await fetchRetry("xboxshell/" + src.split("/").map(encodeURIComponent).join("/"), { cache: "no-cache" });
        if (!r.ok) throw new Error(src + ": HTTP " + r.status);
        return new Uint8Array(await r.arrayBuffer());
      }));
      const write = (dst, bytes) => {
        const at = dst.lastIndexOf("/");
        try { mod.FS_createPath("/", dst.slice(1, at), true, true); } catch (_) {}
        // (Never touch mod.FS: it isn't exported and reading it aborts the runtime.)
        // Files already in the engine package (e.g. content/sounds/ui/Shell) exist; keep them.
        try { mod.FS_createDataFile(dst.slice(0, at), dst.slice(at + 1), bytes, true, false, false); }
        catch (e) { if (!/exist/i.test(String(e && (e.message || e.code || e))) && !(e && e.errno === 20)) console.warn("[rbx2016] shell file", dst, e); }
      };
      files.forEach(([, dst], i) => write(dst, blobs[i]));
      // The data the shell's Http.lua serves: places, favorites, recents, items.
      let catalog = [];
      try { catalog = (await (await fetch("catalog/manifest.json")).json()).items || []; } catch (_) {}
      const byId = new Map(catalog.map((it) => [Number(it.id), it]));
      const ps = shellPlaces();
      const idOf = (file) => (ps.find((p) => p.file === file) || {}).id;
      const ls = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (_) { return d; } };
      const thumbs = {};
      for (const it of catalog) thumbs[it.id] = "catalog/" + it.thumb;
      // Game pictures captured from each game (thumbs/index.json: file -> path).
      let pics = {};
      try {
        pics = await (await fetchRetry("thumbs/index.json", { cache: "no-cache" }, 2)).json();
        for (const p of ps) if (pics[p.file]) p.thumb = pics[p.file];
      } catch (_) {}
      // The console's Avatar screen dealt in packages: My Collection = the
      // packages you own, Catalog = the rest. Each package's picture is an
      // engine thumbnail of the package worn (?render=bundles saves them).
      const bundles = await loadBundles();
      const owned = ownedBundles();
      for (const b of bundles) thumbs[b.id] = pics["bundle_" + b.id] || "";
      const inv = bundles.filter((b) => owned.has(b.id)).map((b) => ({ id: b.id, name: b.name, creator: b.creator, thumb: thumbs[b.id] }));
      const wearingBundle = bundles.find((b) => avatar.package === b.id);
      const data = {
        baseUrl: new URL(".", location.href).href,
        sorts: SHELL_SORTS.map(({ id, name }) => ({ id, name })),
        places: ps,
        favorites: ls("rblx2016.xbox.favorites", []).map(idOf).filter(Boolean),
        recent: ls("rblx2016.xbox.recent", []).map(idOf).filter(Boolean),
        inventory: inv,
        catalog: bundles.filter((b) => !owned.has(b.id)).map((b) => ({ id: b.id, name: b.name, creator: b.creator })),
        wearing: wearingBundle ? wearingBundle.id : null,
        // Coming back from a game: the menu reopens that game's page.
        returnTo: Number(new URLSearchParams(location.search).get("game")) || 0,
        thumbs,
      };
      // The shell shows the avatar as a server-rendered thumbnail; ours is
      // rendered by the engine itself (?render=avatar) and saved by the server.
      try {
        const pics = await (await fetchRetry("thumbs/index.json", { cache: "no-cache" }, 2)).json();
        if (pics.__avatar) data.avatarImage = new URL(pics.__avatar, location.href).href + "?v=" + avatarRenderKey();
      } catch (_) {}
      const json = JSON.stringify(data);
      write("/content/xboxshell/Modules/WebData.lua", new TextEncoder().encode("return [==[" + json + "]==]\n"));
      mod.__xboxshell = true;
      mod.__shellPlaces = ps;
      return true;
    } catch (e) {
      console.warn("[rbx2016] Xbox shell files unavailable:", e);
      return false;
    }
  }
  // ---------------------------------------------------------- avatar render job
  // ?render=avatar: what Bloxro's thumbnail server did for the Xbox app
  // (RCC + ThumbnailGenerator): load the avatar into an empty scene, point a
  // thumbnail camera at it with the GUI off, render, save. Here the 2016
  // engine renders it and webserve.py saves thumbs/__avatar.jpg; the Xbox menu
  // runs this whenever the outfit changed since the last render.
  const RENDER_KIND = new URLSearchParams(location.search).get("render");
  const RENDER_MODE = RENDER_KIND === "avatar" || RENDER_KIND === "bundles";
  // embed=1: the job runs in a hidden frame of the Xbox menu (after a wear)
  // and reports back to it instead of going to the menu.
  const RENDER_EMBED = RENDER_KIND === "avatar" && new URLSearchParams(location.search).get("embed") === "1" && window.parent !== window;
  function avatarRenderKey() {
    const s = avatarSpec();
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(36) + "p4";   // suffix = render style version (bump to re-render)
  }
  // ThumbnailGenerator:Click("PNG", w, h, hideSky=true, crop=true), done by the engine
  // (rblx_request_thumbnail runs RCC's renderThumb sequence and returns RGBA).
  async function engineShot(mod, w, h) {
    if (typeof mod._rblx_request_thumbnail !== "function") return null;
    mod.ccall("rblx_request_thumbnail", null, ["number", "number"], [w, h]);
    const t1 = Date.now();
    let st = 0;
    while ((st = mod.ccall("rblx_thumbnail_ready", "number", [], [])) === 0 && Date.now() - t1 < 10000)
      await new Promise((r) => setTimeout(r, 50));
    if (st !== 1) return null;
    const ptr = mod.ccall("rblx_thumbnail_data", "number", [], []);
    if (!ptr) return null;
    const src = mod.HEAPU8.subarray(ptr, ptr + w * h * 4);
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const g = cv.getContext("2d");
    const img = g.createImageData(w, h);
    img.data.set(src);   // the renderer's download is already top row first
    g.putImageData(img, 0, 0);
    // An all-transparent result means nothing was drawn: report failure.
    let any = false;
    for (let i = 3; i < img.data.length && !any; i += 16) any = img.data[i] > 0;
    return any ? cv : null;
  }
  // ?render=bundles: a picture for every avatar package that has none yet.
  async function runBundleRender(mod) {
    const finish = () => location.replace("?shell=xbox&norender=1" + returnGameParam());
    try {
      const bundles = await loadBundles();
      let pics = {};
      try { pics = await (await fetch("thumbs/index.json", { cache: "no-cache" })).json(); } catch (_) {}
      const todo = bundles.filter((b) => !pics["bundle_" + b.id]);
      const t0 = Date.now();
      while (Date.now() - t0 < 45000 && !avatarAppliedCount) await new Promise((r) => setTimeout(r, 250));
      mod.ccall("rblx_run_script", null, ["string"], [`
        pcall(function() game:GetService("StarterGui"):SetCoreGuiEnabled(Enum.CoreGuiType.All, false) end)
        pcall(function() game:GetService("StarterGui"):SetCore("TopbarEnabled", false) end)`]);
      let shotsThisSession = 0;
      for (const b of todo) {
        // A long run of respawns in one engine session eventually traps;
        // a fresh page every few packages carries on with the rest.
        if (shotsThisSession >= 8) { location.replace(location.pathname + "?render=bundles&test=none&t=" + Date.now()); return; }
        shotsThisSession++;
        const before = avatarAppliedCount;
        mod.ccall("rblx_set_avatar", null, ["string"], [bundleSpec(b)]);
        mod.ccall("rblx_run_script", null, ["string"], [`
          local lp = game.Players.LocalPlayer
          for _, o in pairs(game.Lighting:GetChildren()) do if o.Name == "__RenderFloor" then o.Name = "Floor" o.Parent = workspace end end
          lp:LoadCharacter()`]);
        const t1 = Date.now();
        while (Date.now() - t1 < 20000 && avatarAppliedCount <= before) await new Promise((r) => setTimeout(r, 200));
        await new Promise((r) => setTimeout(r, 1500));   // clothing textures composite
        // Only the character in the workspace for the image-server camera.
        mod.ccall("rblx_run_script", null, ["string"], [`
          local c = game.Players.LocalPlayer.Character
          if c then
            for _, o in pairs(c:GetChildren()) do
              if o:IsA("ForceField") then o:Destroy() elseif o:IsA("BasePart") then o.Anchored = true end
            end
            for _, o in pairs(workspace:GetChildren()) do
              if o ~= c and o:IsA("BasePart") and not o:IsA("Terrain") then o.Name = "__RenderFloor" o.Parent = game.Lighting end
            end
          end`]);
        await new Promise((r) => setTimeout(r, 700));
        const shot = await engineShot(mod, 420, 420);
        if (shot) {
          const png = await new Promise((r) => shot.toBlob(r, "image/png"));
          if (png) await fetch("__thumb?file=bundle_" + b.id, { method: "POST", body: png });
        }
      }
    } catch (e) {
      console.warn("[rbx2016] bundle render failed:", e);
    }
    finish();
  }

  async function runAvatarRender(mod) {
    const done = () => {
      try { localStorage.setItem("rblx2016.xbox.avatarRendered", avatarRenderKey()); } catch (_) {}
      if (RENDER_EMBED) {
        window.parent.postMessage({ rblxAvatarRendered: avatarRenderKey() }, location.origin);
        return;
      }
      location.replace("?shell=xbox");
    };
    try {
      // Wait for the character with the outfit on ("avatar applied" in the engine log).
      const t0 = Date.now();
      while (Date.now() - t0 < 45000 && !recentLog.some((l) => /avatar applied/.test(l)))
        await new Promise((r) => setTimeout(r, 250));
      await new Promise((r) => setTimeout(r, 2500));   // meshes/textures settle
      // The thumbnail server's scene: only the character in the workspace
      // (Workspace:setImageServerView aims the camera at the workspace's
      // model), no force field, nothing moving.
      mod.ccall("rblx_run_script", null, ["string"], [`
        pcall(function() game:GetService("StarterGui"):SetCoreGuiEnabled(Enum.CoreGuiType.All, false) end)
        -- RCC had no player GUI at all: the topbar (menu button strip) goes too.
        pcall(function() game:GetService("StarterGui"):SetCore("TopbarEnabled", false) end)
        local c = game.Players.LocalPlayer.Character
        if c then
          for _, o in pairs(c:GetChildren()) do
            if o:IsA("ForceField") then o:Destroy() elseif o:IsA("BasePart") then o.Anchored = true end
          end
          for _, o in pairs(workspace:GetChildren()) do
            if o ~= c and (o:IsA("BasePart") or o:IsA("Model")) and not o:IsA("Terrain") then o:Destroy() end
          end
        end`]);
      await new Promise((r) => setTimeout(r, 1500));
      // One engine render per size the shell asks Thumbs/Avatar.ashx for:
      // ThumbnailLoader.Sizes.Large (576x324, the Avatar screen), Medium
      // (250x250, the Home tile), and the classic 420x420.
      const shots = [["__avatar_l", 576, 324], ["__avatar_m", 250, 250], ["__avatar", 420, 420]];
      const made = [];
      for (const [name, w, h] of shots) {
        const cv = await engineShot(mod, w, h);
        if (!cv) break;
        made.push([name, await new Promise((r) => cv.toBlob(r, "image/png"))]);
      }
      if (made.length === shots.length && made.every(([, b]) => b)) {
        for (const [name, blob] of made) await fetch("__thumb?file=" + name, { method: "POST", body: blob });
        return done();
      }
      console.warn("[rbx2016] engine thumbnail failed; using the screen capture");
      await new Promise((r) => setTimeout(r, 500));
      // A hidden/backgrounded page can hand back an empty (all-black) frame:
      // retry a few times and never save a blank picture.
      let blob = null;
      for (let tries = 0; tries < 6 && !blob; tries++) {
        const b = await window.rblxCaptureThumb();
        if (!b) break;
        const probe = await createImageBitmap(b);
        const pc = document.createElement("canvas");
        pc.width = 32; pc.height = 32;
        const pg = pc.getContext("2d", { willReadFrequently: true });
        pg.drawImage(probe, 0, 0, 32, 32);
        const pd = pg.getImageData(0, 0, 32, 32).data;
        let lit = 0;
        for (let i = 0; i < pd.length; i += 4) if (pd[i] + pd[i + 1] + pd[i + 2] > 30) lit++;
        if (lit > 64) blob = b;
        else await new Promise((r) => setTimeout(r, 1000));
      }
      if (!blob) {
        // Leave the old picture and try again next time the menu opens.
        try { localStorage.removeItem("rblx2016.xbox.avatarRendered"); } catch (_) {}
        if (RENDER_EMBED) { window.parent.postMessage({ rblxAvatarRendered: "failed" }, location.origin); return; }
        location.replace("?shell=xbox&norender=1" + returnGameParam());
        return;
      }
      // Square, centred crop at the size the shell asks for: ThumbnailLoader.Sizes.Medium (250x250).
      const bmp = await createImageBitmap(blob);
      // Skip the top bar strip (36 px) the engine still reserves at the top.
      const top = Math.min(36, Math.floor(bmp.height / 10));
      const side = Math.min(bmp.width, bmp.height - top);
      const cv = document.createElement("canvas");
      cv.width = cv.height = 420;   // ThumbnailLoader.Sizes.Large; the menu scales it down where it wants Medium
      const g = cv.getContext("2d", { willReadFrequently: true });
      g.imageSmoothingQuality = "high";
      g.drawImage(bmp, (bmp.width - side) / 2, top + (bmp.height - top - side) / 2, side, side, 0, 0, 420, 420);
      // Avatar thumbnails were transparent PNGs (the menu draws its glow and
      // backdrop behind them). The scene's sky is pure magenta: key it out and
      // un-mix the anti-aliased edges so no pink fringe is left.
      const img = g.getImageData(0, 0, 420, 420), d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], gr = d[i + 1], b = d[i + 2];
        const m = Math.min(r, b) - gr;          // how magenta the pixel is
        let a = 1 - (m - 40) / 190;              // m<=40: solid, m>=230: background
        if (a >= 1) continue;
        if (a <= 0) { d[i + 3] = 0; continue; }
        const k = 1 - a;                         // pixel = a*fg + k*magenta
        d[i] = Math.max(0, Math.min(255, (r - k * 255) / a));
        d[i + 1] = Math.max(0, Math.min(255, gr / a));
        d[i + 2] = Math.max(0, Math.min(255, (b - k * 255) / a));
        d[i + 3] = Math.round(a * 255);
      }
      g.putImageData(img, 0, 0);
      const png = await new Promise((r) => cv.toBlob(r, "image/png"));
      // Medium (250x250) too: the Home tile crops it in 250-pixel image units.
      const med = document.createElement("canvas");
      med.width = med.height = 250;
      med.getContext("2d").imageSmoothingQuality = "high";
      med.getContext("2d").drawImage(cv, 0, 0, 250, 250);
      const pngM = await new Promise((r) => med.toBlob(r, "image/png"));
      if (pngM) await fetch("__thumb?file=__avatar_m", { method: "POST", body: pngM });
      if (png) await fetch("__thumb?file=__avatar", { method: "POST", body: png });
    } catch (e) {
      console.warn("[rbx2016] avatar render failed:", e);
    }
    done();
  }

  // Commands from the shell (PlatformService/Http stand-ins) via workspace.MP_OUT.
  let shellSeq = 0;
  function pollShell(mod) {
    setInterval(() => {
      let c = null;
      try { c = JSON.parse(mod.ccall("rblx_mp_out", "string", [], []) || "null"); } catch (_) {}
      if (!c || !c.seq || c.seq === shellSeq) return;
      shellSeq = c.seq;
      const ps = mod.__shellPlaces || [];
      const ls = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (_) { return d; } };
      if (c.cmd === "play") {
        const p = ps.find((x) => x.id === Number(c.placeId));
        if (!p) return;
        const recent = ls("rblx2016.xbox.recent", []).filter((f) => f !== p.file);
        recent.unshift(p.file);
        try { localStorage.setItem("rblx2016.xbox.recent", JSON.stringify(recent.slice(0, 12))); } catch (_) {}
        // Console join: the game page goes straight to the dark join screen,
        // and the next page starts on that same screen.
        const join = document.createElement("div");
        join.style.cssText = "position:fixed;inset:0;z-index:2147483646;background:#222 url(content/textures/loading/darkLoadingTexture.png) 0 0 / 512px 512px repeat";
        document.body.appendChild(join);
        for (const c of Object.values((mod.__rbxAudio || { channels: {} }).channels)) { try { c.audio.pause(); } catch (_) {} }
        // &game=<menu id>: leaving the game returns to this game's page.
        setTimeout(() => { location.href = "?play=" + encodeURIComponent(p.file) + "&from=xbox&game=" + p.id; }, 50);
      } else if (c.cmd === "favorite") {
        const p = ps.find((x) => x.id === Number(c.placeId));
        if (!p) return;
        const favs = new Set(ls("rblx2016.xbox.favorites", []));
        if (c.on) favs.add(p.file); else favs.delete(p.file);
        try { localStorage.setItem("rblx2016.xbox.favorites", JSON.stringify([...favs])); } catch (_) {}
      } else if (c.cmd === "wear") {
        const b = bundleById(c.assetId);
        if (b) wearBundle(b);
        else { const it = itemById(Number(c.assetId)); if (it) wear(it); }
        renderShellAvatar(mod);
      } else if (c.cmd === "own") {
        if (bundleById(c.assetId)) ownBundle(c.assetId);
        else addToInventory(Number(c.assetId));
      }
    }, 250);
  }
  // Re-render the avatar picture after a wear, the way the console asked the
  // thumbnail servers: the same engine render job, in a hidden frame, then the
  // new picture's URL goes to the menu (Http.lua reads it from workspace.MP_IN).
  let avatarFrame = null;
  function renderShellAvatar(mod) {
    if (avatarFrame) { avatarFrame.remove(); avatarFrame = null; }
    const key = avatarRenderKey();
    const frame = document.createElement("iframe");
    avatarFrame = frame;
    // Under the menu's canvas: hidden, but still a visible page so it renders.
    frame.style.cssText = "position:fixed;left:0;top:0;width:640px;height:480px;border:0;z-index:-1;pointer-events:none";
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    const finish = () => {
      window.removeEventListener("message", onMsg);
      clearTimeout(timer);
      if (avatarFrame === frame) { frame.remove(); avatarFrame = null; }
      const url = new URL("thumbs/__avatar.png", location.href).href + "?v=" + key + "-" + Date.now().toString(36);
      try { mod.ccall("rblx_mp_in", null, ["string"], [JSON.stringify({ avatar: url })]); } catch (_) {}
    };
    const onMsg = (e) => {
      if (e.source === frame.contentWindow && e.data && e.data.rblxAvatarRendered) finish();
    };
    const timer = setTimeout(finish, 100000);
    window.addEventListener("message", onMsg);
    frame.src = "?render=avatar&embed=1&test=none&k=" + key;
    document.body.appendChild(frame);
  }
  // Multiplayer panel for the Xbox shell (toggle with "\"): the same settings as
  // the website's "Play with friends" box (rblx2016.mp / mpRoom / mpRelay),
  // which every game launched from the menu reads when it starts.
  let mpPanel = null;
  function toggleShellMultiplayer() {
    if (mpPanel) { mpPanel.remove(); mpPanel = null; window.__rblxMenuOpen = false; return; }
    const get = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch (_) { return d; } };
    const set = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
    window.__rblxMenuOpen = true;
    mpPanel = document.createElement("div");
    mpPanel.style.cssText = "position:fixed;inset:0;z-index:2147483645;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;" +
      "font-family:'Source Sans Pro','Segoe UI',sans-serif;color:#fff";
    const row = "display:flex;align-items:center;justify-content:space-between;gap:20px;margin:0 0 14px;font-size:22px";
    const input = "width:300px;font:inherit;font-size:20px;padding:8px 12px;border:0;background:rgba(255,255,255,.12);color:#fff;outline:none";
    mpPanel.innerHTML =
      '<div style="background:rgb(26,57,76);width:min(640px,92vw);padding:34px 40px;box-shadow:0 10px 40px rgba(0,0,0,.5)">' +
      '<div style="font-size:36px;font-weight:300;margin:0 0 6px">Multiplayer</div>' +
      '<div style="font-size:18px;color:#b8b8b8;margin:0 0 24px">Everyone in the same room joins the same game together.</div>' +
      '<div style="' + row + '"><span>Play with friends</span><button type="button" data-mp="toggle" style="font:inherit;font-size:20px;min-width:120px;padding:8px 18px;border:0;cursor:pointer"></button></div>' +
      '<div style="' + row + '"><span>Room name</span><input data-mp="room" maxlength="32" spellcheck="false" placeholder="lobby" style="' + input + '"></div>' +
      '<div style="' + row + '"><span>Relay</span><input data-mp="relay" spellcheck="false" placeholder="blank = this site" style="' + input + '"></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:26px;font-size:18px;color:#b8b8b8">' +
      '<span>Takes effect when you start a game. Press \\ or Esc to close.</span>' +
      '<button type="button" data-mp="close" style="font:inherit;font-size:20px;padding:8px 22px;border:0;cursor:pointer;background:rgb(50,181,255);color:#131313">Done</button></div></div>';
    document.body.appendChild(mpPanel);
    const toggle = mpPanel.querySelector('[data-mp="toggle"]');
    const room = mpPanel.querySelector('[data-mp="room"]');
    const relay = mpPanel.querySelector('[data-mp="relay"]');
    const drawToggle = () => {
      const on = get("rblx2016.mp", "0") === "1";
      toggle.textContent = on ? "ON" : "OFF";
      toggle.style.background = on ? "rgb(2,163,77)" : "rgb(78,84,96)";
      toggle.style.color = "#fff";
    };
    drawToggle();
    room.value = get("rblx2016.mpRoom", "");
    relay.value = get("rblx2016.mpRelay", "");
    toggle.addEventListener("click", () => { set("rblx2016.mp", get("rblx2016.mp", "0") === "1" ? "0" : "1"); drawToggle(); });
    room.addEventListener("input", () => set("rblx2016.mpRoom", room.value.trim()));
    relay.addEventListener("input", () => set("rblx2016.mpRelay", relay.value.trim()));
    mpPanel.querySelector('[data-mp="close"]').addEventListener("click", toggleShellMultiplayer);
    mpPanel.addEventListener("click", (e) => { if (e.target === mpPanel) toggleShellMultiplayer(); });
    toggle.focus();
  }

  // Keyboard on the shell: the console UI is driven by a controller, so keys
  // become controller buttons (arrows = d-pad, Enter = A, Esc = B, X, Y, Q/E = LB/RB).
  const SHELL_KEYS = { ArrowUp: 1014, ArrowDown: 1015, ArrowLeft: 1012, ArrowRight: 1013,
    Enter: 1002, " ": 1002, Escape: 1003, Backspace: 1003, x: 1000, X: 1000, y: 1001, Y: 1001,
    q: 1005, Q: 1005, e: 1004, E: 1004, Tab: 1010 };
  function installShellKeys(mod) {
    const down = new Set();
    const send = (e, isDown) => {
      // "\" opens/closes the multiplayer panel; while it's open, keys are its own.
      if (e.key === "\\") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (isDown && !e.repeat) toggleShellMultiplayer();
        return;
      }
      if (window.__rblxMenuOpen) {
        if (isDown && e.key === "Escape") { e.preventDefault(); toggleShellMultiplayer(); }
        e.stopImmediatePropagation();  // keep the engine from seeing it; the panel's inputs still do
        return;
      }
      const code = SHELL_KEYS[e.key];
      if (!code) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (isDown === down.has(code)) return;
      if (isDown) down.add(code); else down.delete(code);
      mod.ccall("rblx_gamepad_button", null, ["number", "number", "number"], [0, code, isDown ? 1 : 0]);
    };
    window.addEventListener("keydown", (e) => send(e, true), true);
    window.addEventListener("keyup", (e) => send(e, false), true);
  }

  // Small files fetched in bulk (UI script packs): retry dropped requests.
  async function fetchRetry(url, opts, tries) {
    tries = tries || 4;
    for (let i = 1; ; i++) {
      try {
        const r = await fetch(url, opts);
        if (r.ok || i >= tries) return r;
      } catch (e) {
        if (i >= tries) throw e;
      }
      await new Promise((res) => setTimeout(res, 150 * i));
    }
  }

  // The 2017 client's core GUI scripts (scripts2017/, from the 2017 RCCService
  // content) are copied into the engine's file system on first use, so the
  // 2016 package stays as it was. Returns false if they couldn't be loaded.
  async function load2017Scripts(mod) {
    if (mod.__scripts2017) return true;
    try {
      const files = await (await fetch("scripts2017/index.json", { cache: "no-cache" })).json();
      const blobs = await Promise.all(files.map(async (f) => {
        const r = await fetchRetry("scripts2017/" + f.split("/").map(encodeURIComponent).join("/"), { cache: "no-cache" });
        if (!r.ok) throw new Error(f + ": HTTP " + r.status);
        return new Uint8Array(await r.arrayBuffer());
      }));
      files.forEach((f, i) => {
        const at = f.lastIndexOf("/");
        const dir = "/content/scripts2017" + (at >= 0 ? "/" + f.slice(0, at) : "");
        mod.FS_createPath("/", dir.slice(1), true, true);
        mod.FS_createDataFile(dir, f.slice(at + 1), blobs[i], true, false, false);
      });
      mod.__scripts2017 = true;
      return true;
    } catch (e) {
      console.warn("[rbx2016] 2017 UI scripts unavailable, using 2016:", e);
      return false;
    }
  }
  const fatal = $("fatal");
  const fatalText = $("fatalText");

  function setStatus(msg, isError) {
    status.textContent = msg || "";
    status.classList.toggle("err", !!isError);
    if (siteStatusHook) { try { siteStatusHook(msg || "", !!isError); } catch (_) { siteStatusHook = null; } }
  }
  // The 2016 website (site2016/) is the menu: it shows its own "now loading"
  // box while a game starts and hears our status lines through this.
  var siteStatusHook = null;
  // Hide whatever menu is up once the game's own loading screen is showing.
  function hideMenus() {
    login.style.display = "none";
    const o = $("siteOverlay");
    if (o && !o.hidden) { o.hidden = true; siteStatusHook = null; }
  }

  function sanitizeName(raw) {
    let s = String(raw || "").replace(/[^A-Za-z0-9 _]/g, "").replace(/\s+/g, " ").trim();
    if (s.length > 20) s = s.slice(0, 20);
    return s || "Player1";
  }

  function saveName() {
    const name = sanitizeName(userName.value);
    userName.value = name;
    try { localStorage.setItem("rblx2016.name", name); } catch (_) {}
    return name;
  }

  // The menu tiles show the year the place title names, if it names one.
  function placeYear(name) {
    const m = /(?:^|\D)((?:19|20)\d{2})(?!\d)/.exec(name || "");
    return m ? m[1] : "";
  }

  // Search box + category chips over the place list.
  const PLACE_CATS = [
    { id: "all", label: "All" },
    { id: "popular", label: "Popular", test: (p) => /popular\)/i.test(p.name) },
    { id: "games", label: "Games", test: (p) => p.kind !== "local" && p.kind !== "mine" && !/classic\)|test map\)|popular\)/i.test(p.name) },
    { id: "classic", label: "Classics", test: (p) => /classic\)/i.test(p.name) },
    { id: "test", label: "Test maps", test: (p) => /test map\)/i.test(p.name) },
    { id: "mine", label: "My Games", test: (p) => p.kind === "mine" },
    { id: "local", label: "Your files", test: (p) => p.kind === "local" },
  ];
  let placeCat = "all";
  try { placeCat = localStorage.getItem("rblx2016.placeCat") || "all"; } catch (_) {}
  function placeVisible(p) {
    const cat = PLACE_CATS.find((c) => c.id === placeCat);
    if (cat && cat.test && !cat.test(p)) return false;
    const q = ($("placeSearch") && $("placeSearch").value.trim().toLowerCase()) || "";
    if (!q) return true;
    const hay = (p.name + " " + placeYear(p.name)).toLowerCase();
    return q.split(/\s+/).every((w) => hay.includes(w));
  }
  function renderChips() {
    const box = $("placeChips");
    if (!box) return;
    box.innerHTML = "";
    for (const c of PLACE_CATS) {
      const n = c.test ? places.filter(c.test).length : places.length;
      if (c.id !== "all" && !n) continue;
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = c.label + " (" + n + ")";
      b.setAttribute("aria-pressed", c.id === placeCat ? "true" : "false");
      b.addEventListener("click", () => {
        placeCat = c.id;
        try { localStorage.setItem("rblx2016.placeCat", placeCat); } catch (_) {}
        renderPlaces();
      });
      box.appendChild(b);
    }
  }

  function renderPlaces() {
    placeList.innerHTML = "";
    if (!PLACE_CATS.some((c) => c.id === placeCat && (!c.test || places.some(c.test)))) placeCat = "all";
    renderChips();
    let shown = 0;
    for (const p of places) {
      if (!placeVisible(p)) continue;
      shown++;
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "place";
      tile.setAttribute("aria-pressed", p === selected ? "true" : "false");
      tile.title = p.name;
      const name = document.createElement("span");
      name.className = "nm";
      name.textContent = p.name;
      const sub = document.createElement("span");
      sub.className = "sub";
      sub.textContent = [p.kind === "local" ? "local file" : p.kind === "mine" ? "my game" : "", placeYear(p.name), formatSize(p.size)]
        .filter(Boolean).join(" \u00b7 ");
      tile.append(name, sub);
      tile.dataset.id = p.id;
      tile.addEventListener("click", () => {
        selected = p;
        renderPlaces();
        setStatus("");
        // Rebuilding the list drops focus; keep keyboard users on the tile.
        const current = [...placeList.children].find((el) => el.dataset.id === p.id);
        if (current) current.focus();
      });
      tile.addEventListener("dblclick", () => play());
      placeList.appendChild(tile);
    }
    if ($("noPlaces")) $("noPlaces").hidden = shown > 0 || !places.length;
    $("placeCount").textContent = places.length
      ? places.length + (places.length === 1 ? " place" : " places") : "no places";
    // The button names the target so a mis-click cannot start the wrong game.
    playBtn.textContent = selected ? "Play " + selected.name : "Play";
    playBtn.title = selected ? "Play " + selected.name : "";
    playBtn.disabled = !selected || !!$("webglWarn").offsetParent;
  }

  function formatSize(bytes) {
    return bytes >= 1048576
      ? (bytes / 1048576).toFixed(1) + " MB"
      : Math.max(1, Math.round(bytes / 1024)) + " KB";
  }

  async function loadPlaces() {
    try {
      const list = await fetchPlaceList();
      const bundled = (Array.isArray(list) ? list : []).map((p) => ({
        id: "place:" + p.file,
        name: brandName(p.name),
        kind: "bundled",
        size: p.bytes,
        // Static deploys ship places gzipped (make_deploy.py); manifest says so.
        src: "places/" + encodeURIComponent(p.file) + (p.gz ? ".gz" : ""),
        bytes: null,
      }));
      // The plain baseplate is the "it just works" starting point: default
      // controls, no choose-a-job freeze, walk around the moment you spawn.
      // Surface it first and pre-select it so Play + WASD works on first launch.
      const isBaseplate = (p) => /baseplate/i.test(p.name);
      bundled.sort((a, b) => (isBaseplate(b) ? 1 : 0) - (isBaseplate(a) ? 1 : 0));
      // Games made in Bloxro Studio (kept in this browser).
      const mine = (window.BloxroGames ? await window.BloxroGames.list() : []).map((g) => ({
        id: "mine:" + g.id, name: g.name, kind: "mine", size: g.size, bytes: null, local: true, mineId: g.id,
      }));
      const locals = places.filter((p) => p.local && p.kind !== "mine");
      const previous = selected && selected.id;
      places.splice(0, places.length, ...mine, ...locals, ...bundled);
      selected = places.find((p) => p.id === previous)
        || places.find((p) => p.kind !== "local" && isBaseplate(p))
        || places[0] || null;
      renderPlaces();
      if (!places.length) {
        setStatus("No places in web/places/. Drop in a .rbxl file or open one locally.", true);
      } else {
        setStatus("");
      }
    } catch (e) {
      setStatus("Could not list web/places/. Open a local place file instead.", true);
    }
  }

  // web/serve.py answers /places by scanning web/places; static hosts (GitHub
  // Pages) use places/manifest.json, which link.py regenerates on every build.
  async function fetchPlaceList() {
    for (const url of ["places", "places/manifest.json"]) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) continue;
        const list = await response.json();
        if (Array.isArray(list)) return list;
      } catch (_) {}
    }
    throw new Error("no place list");
  }

  // Classic maps from the Novetus archive point at that launcher's local
  // asset folder (rbxasset://../../../shareddata/assets/<id>). Send those to
  // the normal asset route instead. XML places only; binary bytes untouched.
  function rewriteSharedAssets(bytes) {
    const head = String.fromCharCode.apply(null, bytes.subarray(0, 8));
    if (!head.startsWith("<roblox")) return bytes;
    const from = "rbxasset://../../../shareddata/assets/", to = "rbxassetid://";
    const pat = new TextEncoder().encode(from), rep = new TextEncoder().encode(to);
    const out = [];
    let start = 0, i = 0, hits = 0;
    while (i <= bytes.length - pat.length) {
      if (bytes[i] === pat[0] && bytes[i + 11] === pat[11]) {
        let k = 1;
        while (k < pat.length && bytes[i + k] === pat[k]) k++;
        if (k === pat.length) {
          out.push(bytes.subarray(start, i), rep);
          i += pat.length; start = i; hits++;
          continue;
        }
      }
      i++;
    }
    if (!hits) return bytes;
    out.push(bytes.subarray(start));
    const total = out.reduce((n, a) => n + a.length, 0);
    const res = new Uint8Array(total);
    let o = 0;
    for (const a of out) { res.set(a, o); o += a.length; }
    console.log("[rbx2016] rewrote", hits, "classic shared-asset paths");
    return res;
  }

  async function readFileBytes(p) {
    if (p.bytes) return p.bytes;
    if (p.mineId && window.BloxroGames) {
      const g = await window.BloxroGames.get(p.mineId);
      if (!g || !g.bytes) throw new Error("That game is no longer in My Games.");
      p.bytes = g.bytes;
      return p.bytes;
    }
    if (!p.src) throw new Error("No place data.");
    const r = await fetch(p.src);
    if (!r.ok) throw new Error("Could not read " + p.src + " (" + r.status + ")");
    let bytes = new Uint8Array(await r.arrayBuffer());
    // Gzipped place (unless the host already decoded it for us).
    if (bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
      bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    }
    p.bytes = rewriteSharedAssets(bytes);
    return p.bytes;
  }

  function openLocalFile(file) {
    if (!file) return;
    if (file.size > MAX_PLACE_BYTES) {
      setStatus("Place file is too large (limit " + (MAX_PLACE_BYTES / 1024 / 1024) + " MB).", true);
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setStatus("Could not read the file.", true);
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result);
      const p = {
        id: "local:" + file.name,
        name: file.name.replace(/\.(rbxlx?|rbxm|xml)$/i, ""),
        kind: "local",
        size: bytes.length,
        bytes,
        local: true,
      };
      const old = places.findIndex((x) => x.id === p.id);
      if (old >= 0) places.splice(old, 1);
      places.unshift(p);
      selected = p;
      renderPlaces();
      setStatus("Loaded " + file.name + ". Press Play.");
    };
    reader.readAsArrayBuffer(file);
  }

  function afterPaint() {
    // Background tabs never run rAF; don't let start-up wait on it forever.
    return new Promise((resolve) => {
      const t = setTimeout(resolve, 250);
      requestAnimationFrame(() => requestAnimationFrame(() => { clearTimeout(t); resolve(); }));
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function captureCanvas() {
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, "roblox-2016.png");
    }, "image/png");
  }

  function startRecording() {
    if (mediaRecorder) return true;
    if (typeof MediaRecorder === "undefined" || typeof canvas.captureStream !== "function") {
      console.warn("Video recording is not supported in this browser.");
      return false;
    }
    try {
      recordStream = canvas.captureStream(30);
      let mime = "video/webm";
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) mime = "video/webm;codecs=vp9";
      else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) mime = "video/webm;codecs=vp8";
      mediaRecorder = new MediaRecorder(recordStream, { mimeType: mime });
      recordChunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size) recordChunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordChunks, { type: "video/webm" });
        recordChunks = [];
        if (recordStream) {
          recordStream.getTracks().forEach((track) => track.stop());
          recordStream = null;
        }
        mediaRecorder = null;
        if (blob.size) downloadBlob(blob, "roblox-2016.webm");
      };
      mediaRecorder.start();
      return true;
    } catch (e) {
      console.warn("Could not start video recording", e);
      if (recordStream) {
        recordStream.getTracks().forEach((track) => track.stop());
        recordStream = null;
      }
      mediaRecorder = null;
      return false;
    }
  }

  function stopRecording() {
    if (!mediaRecorder) return false;
    if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
    return true;
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.warn("Fullscreen request failed", e);
      });
    }
  }

  function installFullscreenSync(mod) {
    if (window.__rblxFullscreenSync) return;
    window.__rblxFullscreenSync = true;
    document.addEventListener("fullscreenchange", () => {
      try {
        mod.ccall("rblx_set_fullscreen", null, ["number"], [document.fullscreenElement ? 1 : 0]);
      } catch (_) {}
    });
  }

  window.rblxScreenshot = () => { screenshotPending = true; };
  window.rblxRecordStart = startRecording;
  window.rblxRecordStop = stopRecording;
  window.rblxToggleFullscreen = toggleFullscreen;

  // link.py splits the 110 MB preloaded content pack into parts under 100 MB,
  // the largest file a static host like GitHub Pages accepts. Reassemble it
  // into a Blob the Emscripten loader fetches as if it were rblx2016.data.
  // The parts list (never cached) also names the build: every engine file is
  // fetched with ?v=<build>, so a browser can't mix a new rblx2016.js with
  // cached parts of the previous build ("shader pack ... is corrupted").
  let engineBuild = null;
  async function engineBuildInfo() {
    if (engineBuild) return engineBuild;
    try {
      const listing = await fetch("js/rblx2016.data.parts.json", { cache: "no-store" });
      engineBuild = listing.ok ? await listing.json() : {};
    } catch (_) {
      engineBuild = {};
    }
    return engineBuild;
  }
  function withBuild(url) {
    const v = engineBuild && engineBuild.version;
    return v ? url + (url.includes("?") ? "&" : "?") + "v=" + v : url;
  }
  async function preloadDataPackage() {
    try {
      const parts = (await engineBuildInfo()).parts;
      if (!Array.isArray(parts) || !parts.length) return null;
      const buffers = await Promise.all(parts.map(async (part) => {
        const response = await fetch(withBuild(part));
        if (!response.ok) throw new Error("missing " + part);
        return response.arrayBuffer();
      }));
      return URL.createObjectURL(new Blob(buffers));
    } catch (e) {
      console.warn("[rbx2016] using the single data package:", e.message);
      return null;
    }
  }

  async function ensureModule() {
    if (engine) return engine;
    if (!modulePromise) {
      modulePromise = (async () => {
        await engineBuildInfo();
        if (typeof window.createRBLX2016Module !== "function") {
          await new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = withBuild("js/rblx2016.js");
            s.onload = resolve;
            s.onerror = () => reject(new Error(
              "The 2016 engine module (js/rblx2016.js) is not present yet. " +
              "Build it with port/build/build-wasm.sh, then reload this page."));
            document.head.appendChild(s);
          });
        }
        if (typeof window.createRBLX2016Module !== "function") {
          throw new Error("js/rblx2016.js loaded, but createRBLX2016Module is missing.");
        }
        if (typeof SharedArrayBuffer === "undefined") {
          throw new Error(
            "This page is not cross-origin isolated, so the threaded engine cannot start. " +
            "Serve it with web/serve.py, or over HTTPS where coi-serviceworker.js can " +
            "register (GitHub Pages).");
        }
        const dataUrl = await preloadDataPackage();
        const mod = await window.createRBLX2016Module({
          canvas: $("gameCanvas"),
          locateFile: (path, prefix) => {
            if (dataUrl && path.endsWith(".data")) return dataUrl;
            if (prefix) return withBuild(prefix + path);
            return withBuild(new URL("js/" + path, location.href).href);
          },
          preRun: [() => console.log("[rbx2016] preRun")],
          onRuntimeInitialized: () => console.log("[rbx2016] runtime initialized"),
          print: (t) => { noteLog(t); console.log("[rbx2016]", t); },
          printErr: (t) => { noteLog(t); console.warn("[rbx2016]", t); },
          onAbort: (what) => engineCrashed(new Error("engine aborted: " + what)),
        });
        // The preload has content/textures/, but older places and parts of the
        // engine ask for rbxasset://Textures/... and the virtual FS is
        // case-sensitive (Windows never was). Mirror the top-level textures.
        try {
          const names = await (await fetch("content/textures-index.json")).json();
          mod.FS_createPath("/content", "Textures", true, true);
          await Promise.all(names.map(async (n) => {
            const r = await fetch("content/textures/" + encodeURIComponent(n));
            if (r.ok) mod.FS_createDataFile("/content/Textures", n, new Uint8Array(await r.arrayBuffer()), true, false, false);
          }));
        } catch (e) { console.warn("[rbx2016] Textures alias skipped:", e); }
        if (typeof mod._rblx_test_thread === "function") {
          console.log("[rbx2016] thread test:", mod.ccall("rblx_test_thread", "number", [], []));
        }
        // Log the renderer, so a software rasterizer is recognisable in bug
        // reports.
        try {
          const canvas = $("gameCanvas");
          const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
          const info = gl && gl.getExtension("WEBGL_debug_renderer_info");
          console.log("[rbx2016] webgl:", !gl ? "none" : (info
            ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL)
            : gl.getParameter(gl.RENDERER)));
        } catch (e) {
          console.log("[rbx2016] webgl: unavailable", e && e.message);
        }
        return mod;
      })().catch((e) => { modulePromise = null; throw e; });
    }
    engine = await modulePromise;
    installFullscreenSync(engine);
    // Dev hooks: reach the engine from the console for diagnostics.
    window.__engine = engine;
    window.rbxRun = (s) => { try { engine.ccall("rblx_run_script", null, ["string"], [String(s)]); } catch (e) { console.warn(e); } };
    window.rbxDebugPlayer = () => { try { engine.ccall("rblx_debug_player", null, [], []); } catch (e) { console.warn(e); } };
    window.rbxKey = (code, down, ch) => { try { engine.ccall("rblx_key_event", null, ["number","number","number","number"], [code, 0, ch||0, down?1:0]); } catch (e) { console.warn(e); } };
    return engine;
  }

  // ---------------------------------------------------------- Xbox boot cover
  // On the Xbox flow the website must never show: from the first paint the
  // page looks like the console. Joining a game shows the console's game-join
  // screen (the dark low-poly texture the in-game loading screen tiles) and
  // hands over to the engine's own loading screen, which uses the same art;
  // starting the shell shows its splash over the menu background.
  const XBOX_FLOW = (() => {
    const q = new URLSearchParams(location.search);
    if (q.get("render") === "avatar" || q.get("render") === "bundles") return "shell";
    return q.get("shell") === "xbox" ? "shell" : (q.get("from") === "xbox" ? "join" : null);
  })();
  let xboxCover = null;
  function showXboxCover() {
    if (!XBOX_FLOW || xboxCover) return;
    xboxCover = document.createElement("div");
    xboxCover.id = "xboxCover";
    const base = "position:fixed;inset:0;z-index:2147483646;transition:opacity .35s ease;";
    if (XBOX_FLOW === "join") {
      // The Xbox One client's game-join screen, laid out exactly like the
      // ten-foot branch of the engine's LoadingScript (same pixels, art and
      // font), so the hand-over to the engine's own screen is seamless:
      // "Cancel (B)" top right, the game's name and "By <creator>" bottom
      // left, the spinner bottom right.
      xboxCover.style.cssText = base + "background:#222 url(content/textures/loading/darkLoadingTexture.png) 0 0 / 512px 512px repeat;" +
        "font-family:RblxSourceSans,'Source Sans Pro','Segoe UI',sans-serif;color:#fff;overflow:hidden";
      const q = new URLSearchParams(location.search);
      const title = placeTitle((q.get("play") || "").replace(/\.rbxlx?$/i, ""));
      const stroke = "text-shadow:-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000";
      const el = (tag, css, text) => { const e = document.createElement(tag); e.style.cssText = "position:absolute;" + css; if (text != null) e.textContent = text; return e; };
      const font = document.createElement("style");
      font.textContent = "@font-face{font-family:RblxSourceSans;src:url(content/fonts/SourceSansPro-Regular.ttf)}" +
        "@keyframes rblxSpin{to{transform:rotate(360deg)}}";
      const bIcon = el("img", "right:32px;top:32px;width:83px;height:83px");
      bIcon.src = "content/textures/ui/Shell/ButtonIcons/BButton.png"; bIcon.alt = "B";
      const cancel = el("div", "right:131px;top:64px;transform:translateY(-50%);font-size:36px;line-height:1;white-space:nowrap", "Cancel");
      const info = el("div", "left:100px;bottom:40px;width:40%;height:110px");
      const name = el("div", "left:0;top:0;width:100%;height:80px;display:flex;align-items:flex-end;font-size:48px;line-height:1.05;" + stroke, title);
      const by = el("div", "left:0;top:80px;height:30px;font-size:28px;line-height:30px;" + stroke, "By");
      const rIcon = el("img", "left:38px;top:80px;width:30px;height:30px");
      rIcon.src = "content/textures/ui/Shell/Icons/RobloxIcon32.png"; rIcon.alt = "";
      const creator = el("div", "left:72px;top:80px;height:30px;font-size:28px;line-height:30px;white-space:nowrap;" + stroke, "BLOXRO");
      info.append(name, by, rIcon, creator);
      const spin = el("img", "right:105px;bottom:45px;width:140px;height:140px;animation:rblxSpin 1.2s linear infinite");
      spin.src = "content/textures/loading/loadingCircle.png"; spin.alt = "";
      xboxCover.append(font, bIcon, cancel, info, spin);
      // B / Esc cancels the join, back to the game's page, as on the console.
      const onKey = (e) => {
        if (!xboxCover) { window.removeEventListener("keydown", onKey, true); return; }
        if (e.key === "Escape" || e.key === "Backspace" || e.key === "b" || e.key === "B") {
          e.preventDefault();
          cancel.textContent = "Canceling...";
          bIcon.remove();
          cancel.style.right = "32px";
          const game = Number(q.get("game")) || 0;
          location.href = "?shell=xbox" + (game ? "&game=" + game : "");
        }
      };
      window.addEventListener("keydown", onKey, true);
    } else {
      xboxCover.style.cssText = base + "background:#0b1a24 url(xboxshell/textures/Background/Home_screen_01.png) center / cover no-repeat;" +
        "display:flex;align-items:center;justify-content:center;";
      const tint = document.createElement("div");
      tint.style.cssText = "position:absolute;inset:0;background:rgb(20,43,60);opacity:.7";
      const logo = document.createElement("img");
      if (new URLSearchParams(location.search).get("game")) {
        // Back from a game: no launch splash, just the menu's spinner.
        const spin = document.createElement("style");
        spin.textContent = "@keyframes rblxSpin{to{transform:rotate(360deg)}}";
        logo.src = "xboxshell/textures/Icons/LoadingSpinner@1080.png";
        logo.alt = "";
        logo.style.cssText = "position:relative;width:120px;height:120px;animation:rblxSpin 1s linear infinite";
        xboxCover.append(spin);
      } else {
        logo.src = "xboxshell/textures/Icons/ROBLOXSplashLogo.png";
        logo.alt = "BLOXRO";
        logo.style.cssText = "position:relative;width:min(46vw,594px)";
      }
      xboxCover.append(tint, logo);
    }
    (document.body || document.documentElement).appendChild(xboxCover);
    // The cover now hides the site; let the page (and the game canvas) render.
    requestAnimationFrame(() => document.documentElement.classList.remove("xbox-boot"));
  }
  function hideXboxCover() {
    if (!xboxCover) return;
    const c = xboxCover;
    xboxCover = null;
    c.style.opacity = "0";
    setTimeout(() => c.remove(), 400);
  }
  // Lift the cover once the engine is drawing its own equivalent screen.
  function watchXboxCover(mod) {
    if (!XBOX_FLOW) return;
    const t0 = performance.now();
    const startFrames = mod.ccall("rblx_frame_count", "number", [], []);
    const timer = setInterval(() => {
      let ready = false;
      try {
        if (XBOX_FLOW === "join") {
          ready = mod.ccall("rblx_loading_gui_ready", "number", [], []) === 1;
        } else {
          // The menu runs over a 3D world. Keep the splash until the engine
          // says the scene has settled (meshes, textures, sky), so the world
          // never visibly assembles itself while assets stream in on the web.
          ready = mod.ccall("rblx_frame_count", "number", [], []) - startFrames > 45 &&
            (engineSceneLoaded || performance.now() - t0 > 45000);
        }
      } catch (_) { ready = true; }
      // Give the engine a moment to paint the screen underneath first.
      if (ready || performance.now() - t0 > 90000) {
        clearInterval(timer);
        setTimeout(hideXboxCover, XBOX_FLOW === "join" ? 350 : 1200);
      }
    }, 100);
  }
  showXboxCover();

  // ---------------------------------------------------------- crash/freeze reports
  // Recent engine output, so a report says what was happening. Sent to the
  // local server only (webserve.py /__crashlog -> _webport/crashlog.jsonl);
  // on other hosts the request just fails quietly.
  const recentLog = []; window.__rblxLog = recentLog;
  let engineSceneLoaded = false;  // engine printed "game loaded" (scene settled)
  let avatarAppliedCount = 0;   // engine "avatar applied" lines so far (render jobs wait on it)
  function noteLog(line) {
    if (window.__rblxLogHook) { try { window.__rblxLogHook(line); } catch (_) {} }
    if (/avatar applied/.test(line)) avatarAppliedCount++;
    if (/RBLX2016: game loaded/.test(line)) engineSceneLoaded = true;
    recentLog.push(String(line).slice(0, 300));
    if (recentLog.length > 60) recentLog.shift();
  }
  function reportInfo() {
    let wasmMB = null;
    try { wasmMB = Math.round(window.__engine.HEAPU8.length / 1048576); } catch (_) {}
    return { place: selected && selected.id, flow: XBOX_FLOW, at: new Date().toISOString(), wasmMB,
      jsMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
      frames: (() => { try { return window.__engine.ccall("rblx_frame_count", "number", [], []); } catch (_) { return null; } })() };
  }
  function sendReport(kind, extra) {
    const body = JSON.stringify(Object.assign({ kind }, reportInfo(), extra || {}, { log: recentLog.slice(-40) }));
    try { navigator.sendBeacon ? navigator.sendBeacon("__crashlog", body) : fetch("__crashlog", { method: "POST", body, keepalive: true }); } catch (_) {}
  }
  // Freeze watchdog: a worker notices when the page stops answering (the main
  // thread is blocked, so the page itself can't) and reports it.
  let watchdog = null;
  function startWatchdog() {
    if (watchdog || typeof Worker === "undefined") return;
    const src = `let last = Date.now(), frozen = false, hidden = false, info = {};
      onmessage = (e) => {
        last = Date.now();
        hidden = !!(e.data && e.data.hidden);
        if (e.data && e.data.info) info = e.data.info;
        if (frozen) { frozen = false; post({ kind: "freeze-ended", ms: e.data.blockedMs || null }); }
      };
      function post(o) { try { fetch(info.url, { method: "POST", body: JSON.stringify(Object.assign({}, info.snapshot || {}, o)) }); } catch (_) {} }
      setInterval(() => {
        const ms = Date.now() - last;
        if (!frozen && !hidden && ms > 6000) { frozen = true; post({ kind: "freeze", ms }); }
      }, 1000);`;
    try {
      watchdog = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
      const url = new URL("__crashlog", location.href).href;
      let lastBeat = Date.now(), n = 0;
      setInterval(() => {
        const now = Date.now();
        const blockedMs = now - lastBeat > 3000 ? now - lastBeat : null;
        lastBeat = now;
        const msg = { blockedMs: document.hidden ? null : blockedMs, hidden: document.hidden };
        if (++n % 4 === 0 || blockedMs) msg.info = { url, snapshot: Object.assign(reportInfo(), { log: recentLog.slice(-25) }) };
        watchdog.postMessage(msg);
      }, 500);
    } catch (e) { console.warn("[rbx2016] watchdog unavailable:", e); }
  }

  // ---------------------------------------------------------- engine crashes
  function isEngineTrap(e) {
    return (typeof WebAssembly !== "undefined" && e instanceof WebAssembly.RuntimeError) ||
      /RuntimeError|unreachable|Aborted\(|null function|out of bounds|signature mismatch/i.test(String(e && (e.stack || e.message || e)));
  }
  let engineDead = false;
  function engineCrashed(err) {
    if (engineDead) return;
    engineDead = true;
    playing = false;
    const msg = String(err && (err.message || err) || "unknown");
    console.error("[rbx2016] ENGINE CRASH:", msg);
    if (window.engineCrashedHook) { try { window.engineCrashedHook(err); } catch (_) {} if (MP_SERVER_MODE) return; }
    sendReport("crash", { error: msg.slice(0, 800), stack: String(err && err.stack || "").slice(0, 1500) });
    try {
      localStorage.setItem("rblx2016.lastCrash", JSON.stringify({ place: selected && selected.id, error: msg.slice(0, 500), at: new Date().toISOString() }));
    } catch (_) {}
    try { for (const c of Object.values((window.__engine && window.__engine.__rbxAudio || { channels: {} }).channels)) c.audio.pause(); } catch (_) {}
    hideXboxCover();
    const back = XBOX_FLOW ? () => { location.href = "?shell=xbox"; } : () => { location.reload(); };
    const box = document.createElement("div");
    box.setAttribute("role", "alertdialog");
    if (XBOX_FLOW) {
      // ErrorOverlay.lua look: dark overlay, error icon, title, message, A/B hint.
      box.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;font-family:'Source Sans Pro',sans-serif;color:#fff";
      box.innerHTML = '<div style="background:rgb(26,57,76);padding:48px 64px;max-width:900px;display:flex;gap:40px;align-items:center">' +
        '<img src="xboxshell/textures/Icons/ErrorIconLargeCopy@1080.png" alt="" style="width:120px">' +
        '<div><div style="font-size:42px;font-weight:300;margin-bottom:14px">Something went wrong</div>' +
        '<div style="font-size:26px;color:#b8b8b8;margin-bottom:28px">' + (XBOX_FLOW === "shell"
          ? "The Xbox menu couldn't start. Press A to try again."
          : "This game stopped working on the web engine. You can go back to the menu and pick another game.") + '</div>' +
        '<div style="font-size:26px;display:flex;align-items:center;gap:10px"><img src="xboxshell/textures/ButtonIcons/AButton.png" alt="A" style="width:44px">' +
        (XBOX_FLOW === "shell" ? "Try Again" : "Back to Menu") + '</div></div></div>';
    } else {
      box.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;color:#fff;font-family:sans-serif";
      box.innerHTML = '<div style="background:#222;padding:28px 34px;border-radius:8px;max-width:560px"><h2 style="margin:0 0 10px">The game crashed</h2>' +
        '<p style="margin:0 0 18px;color:#ccc">This place hit an engine error. Reload to pick another one.</p><button type="button" style="font-size:16px;padding:8px 18px">Reload</button></div>';
    }
    document.body.appendChild(box);
    const go = (e) => {
      if (e.type === "keydown" && !["Enter", " ", "Escape", "Backspace"].includes(e.key)) return;
      back();
    };
    box.addEventListener("click", go);
    window.addEventListener("keydown", go, true);
    // Controller A/B also returns.
    const padTimer = setInterval(() => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const p of pads) if (p && p.buttons && ((p.buttons[0] && p.buttons[0].pressed) || (p.buttons[1] && p.buttons[1].pressed))) { clearInterval(padTimer); back(); }
    }, 50);
  }
  window.addEventListener("error", (e) => { if (playing && isEngineTrap(e.error || e.message)) engineCrashed(e.error || e.message); });
  window.addEventListener("unhandledrejection", (e) => { if (playing && isEngineTrap(e.reason)) engineCrashed(e.reason); });

  function showFatal(err) {
    // On the Xbox flow, failures use the console error screen (Back = retry menu).
    if (XBOX_FLOW) { engineCrashed(err); return; }
    hideXboxCover();
    playing = false;
    playBtn.disabled = !hasWebGL2();
    login.style.pointerEvents = "";
    login.style.display = "block";
    setStatus("The engine could not start.", true);
    // A black screen usually means a renderer switch: show it without hunting.
    const compat = $("compat");
    if (compat) compat.open = true;
    fatalText.textContent = err && err.stack ? err.stack : String(err || "Unknown error");
    fatal.style.display = "flex";
  }

  async function play() {
    if (playing) return;
    if (!selected) { setStatus("Choose a place first.", true); return; }
    const name = saveName();
    playing = true;
    playBtn.disabled = true;
    closeCatalog();
    login.style.pointerEvents = "none";
    fatal.style.display = "none";
    setStatus("Starting the 2016 engine…");
    await afterPaint();

    try {
      const mp = mpSettings();
      if (mp) {
        await playMultiplayer(mp, name);
        return;
      }
      let bytes = await readFileBytes(selected);
      // Newer Studio files (zstd chunks, post-2016 property formats) are
      // rewritten into something the 2016 loader can read.
      if (window.PlaceFix) {
        const fixed = window.PlaceFix.upgrade(bytes);
        const r = fixed.report;
        if (r.zstd || r.dropped || r.relabelled || r.colored)
          console.log("[placefix] upgraded newer place file:", JSON.stringify(r));
        bytes = fixed.bytes;
      }
      setStatus("Starting the 2016 engine… (" + (bytes.length / 1024).toFixed(0) + " KB place)");
      const mod = await ensureModule();
      if (typeof mod._rblx_start_place !== "function") {
        throw new Error(
          "The engine module is built, but rblx_start_place is not exported yet. " +
          "This is the WebClient integration step.");
      }
      const ptr = mod._malloc(bytes.length);
      if (!ptr) throw new Error("Out of Wasm memory while loading the place.");
      mod.HEAPU8.set(bytes, ptr);
      if (RENDER_MODE) {
        // Backdrop for the render scene's sky (the Xbox avatar box colour).
        try {
          const bg = new Uint8Array(await (await fetchRetry("xboxrender/RenderBg.png")).arrayBuffer());
          try { mod.FS_createPath("/", "content/textures/xboxrender", true, true); } catch (_) {}
          try { mod.FS_createDataFile("/content/textures/xboxrender", "RenderBg.png", bg, true, false, false); } catch (_) {}
        } catch (e) { console.warn("[rbx2016] render backdrop missing:", e); }
      }
      // Offline DataStores save per game under this key (engine DataStore.cpp).
      mod.__rblxPlaceKey = selected.id;
      // Hand this game's saved DataStore values to the engine up front, so the
      // engine never has to ask the page while a game script is running.
      if (typeof mod._rblx_ds_put === "function") {
        try {
          const pre = "rblx2016.ds." + selected.id + "|";
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(pre))
              mod.ccall("rblx_ds_put", null, ["string", "string"], [k.slice(pre.length), localStorage.getItem(k) || ""]);
          }
        } catch (e) { console.warn("[rbx2016] saved data not loaded:", e); }
      }
      // Launched from the Xbox menu: run like the Xbox One client (ten-foot
      // platform, the Xbox-era 2017 core scripts, controller first).
      const xboxMode = new URLSearchParams(location.search).get("from") === "xbox";
      if (typeof mod._rblx_set_xbox_mode === "function")
        mod.ccall("rblx_set_xbox_mode", null, ["number"], [xboxMode || SHELL_MODE ? 1 : 0]);
      if (typeof mod._rblx_set_script_year === "function") {
        if (SHELL_MODE) {
          // Never fall back to running the shell's 3D world as a game (you would
          // spawn in it): without the shell scripts, report it instead.
          if (!(await loadShellPack(mod))) throw new Error("The Xbox menu files could not be loaded.");
          mod.ccall("rblx_set_script_year", null, ["number"], [3]);
        } else {
          const use2017 = (ui2017.checked || xboxMode) && await load2017Scripts(mod);
          mod.ccall("rblx_set_script_year", null, ["number"], [use2017 ? 2017 : 2016]);
        }
      }
      // rbxassetid:// resolves to <origin>/asset/?id=N; serve.py proxies that
      // to assetdelivery and caches the bytes.
      // The loading screen shows the game's name and creator (the real client
      // asked Bloxro's servers; here the page knows them).
      if (!SHELL_MODE && !RENDER_MODE && selected) setPlaceInfo(mod, selected.name, selected.local ? (userName.value.trim() || "Player1") : "BLOXRO");
      const rc = mod.ccall("rblx_start_place", "number",
        ["number", "number", "string", "string", "number"],
        // Must include the subpath: a project page lives under /<repo>/ and
        // the engine resolves catalog/item/<id> and /asset against this.
        [ptr, bytes.length, name, new URL(".", location.href).href, touchDevice ? 1 : 0]);
      mod._free(ptr);
      if (rc !== 0) throw new Error("rblx_start_place returned " + rc);
      await afterStart(mod, null);
      console.log("[rbx2016] place started");
    } catch (e) {
      showFatal(e);
    }
  }

  async function configureAssetProxy(mod) {
    // Static hosts have no /asset endpoint. Keep the same-origin URL when
    // the service worker controls the page, so it can serve the packed
    // assets and only fall back to the proxy for the rest.
    // On the local server (webserve.py), /__ap/asset answers from the local
    // asset pack (web/assets: downloaded packages, catalog meshes) and only
    // forwards what it doesn't have to the asset proxy.
    const localHost = /^(127\.0\.0\.1|localhost|\[::1\])$/.test(location.hostname);
    if (localHost) {
      mod.ccall("rblx_set_asset_proxy", null, ["string"], [location.origin + "/__ap"]);
    } else if (!window.__rblxLocalServer &&
        !(navigator.serviceWorker && navigator.serviceWorker.controller)) {
      try {
        const response = await fetch("asset-proxy.json", { cache: "no-store" });
        if (response.ok) {
          const proxy = (await response.json()).base;
          if (proxy) mod.ccall("rblx_set_asset_proxy", null, ["string"], [proxy]);
        }
      } catch (_) {}
    }
  }

  // Everything after the engine has a DataModel: input, frame loop, loading
  // screen hand-off. Shared by solo play and multiplayer joins.
  async function afterStart(mod, mpSession) {
    try {
      mod.ccall("rblx_set_unlock_fps", null, ["number"], [unlockFps.checked ? 1 : 0]);
    } catch (_) {}
    applyRenderOptions(mod);
    startGamepadBridge(mod);
    if (RENDER_KIND === "bundles") runBundleRender(mod); else if (RENDER_MODE) runAvatarRender(mod); else watchXboxCover(mod);
    startWatchdog();
    if (SHELL_MODE) {
      // A controller is always "connected" for the shell (the console shows a
      // reconnect prompt otherwise); the keyboard drives it.
      mod.ccall("rblx_gamepad_connect", null, ["number", "number"], [0, 1]);
      installShellKeys(mod);
      pollShell(mod);
      // Browsers block sound until the first key/click; the shell starts its
      // menu music right away, so retry any sound that was blocked.
      const unlock = () => {
        const A = mod.__rbxAudio;
        if (A) for (const c of Object.values(A.channels)) {
          if (c && !c.paused && c.audio && c.audio.paused && (c.loop || c.audio.currentTime === 0)) c.audio.play().catch(() => {});
        }
      };
      window.addEventListener("keydown", unlock, true);
      window.addEventListener("pointerdown", unlock, true);
    }
    await configureAssetProxy(mod);
    // Hand the worn catalog items to the engine; it applies them when the
    // local character spawns.
    try {
      mod.ccall("rblx_set_avatar", null, ["string"], [avatarSpec()]);
      // Builders Club tier from the Customizer (engine applies it to the player).
      if (typeof mod._rblx_set_membership === "function")
        mod.ccall("rblx_set_membership", null, ["number"], [bcTier()]);
    } catch (_) {}
    if (typeof mod._rblx_has_view === "function" && mod.ccall("rblx_has_view", "number", [], [])) {
      const frame = () => {
        if (!playing) return;
        if (canvas.__flushMouse) canvas.__flushMouse();
        try { mod.ccall("rblx_frame", null, [], []); } catch (e) {
          // A wasm trap mid-frame can leave the engine's lock held; the next
          // frame would then block the page forever. Stop and report instead.
          if (isEngineTrap(e)) { engineCrashed(e); return; }
          console.warn(e);
        }
        if (screenshotPending) {
          screenshotPending = false;
          captureCanvas();
        }
        if (thumbPending) {
          // Read the canvas right after a frame was drawn (WebGL clears it later).
          const cb = thumbPending;
          thumbPending = null;
          canvas.toBlob(cb, "image/jpeg", 0.85);
        }
        rafId = requestAnimationFrame(frame);
      };
      installInput(mod);
      resizeCanvas();
      if (!canvas.__resizeObserved && typeof ResizeObserver !== "undefined") {
        canvas.__resizeObserved = true;
        new ResizeObserver(resizeCanvas).observe(canvas);
      }
      rafId = requestAnimationFrame(frame);
      // Keep the login shell up until the engine's own LoadingScript has
      // built its GUI. The stock loading screen is the only loading UI.
      const startLoad = (tries) => {
        let ready = 0;
        try { ready = mod.ccall("rblx_loading_gui_ready", "number", [], []); } catch (_) {}
        if (!ready && tries > 0) {
          setTimeout(() => startLoad(tries - 1), 100);
          return;
        }
        const begin = async () => {
          if (ready) {
            // Let the LoadingScript paint its background and spinner.
            await new Promise((resolve) => setTimeout(resolve, 900));
            await afterPaint();
          }
          hideMenus();
          setStatus("");
          if (mpSession) return;  // the server streams the game in
          try { mod.ccall("rblx_load_place", "number", [], []); } catch (e) { console.warn(e); }
          // Fallback only; the engine normally spawns the avatar itself and
          // the LoadingScript stays up until then.
          setTimeout(() => { try { mod.ccall("rblx_force_character", null, [], []); } catch (_) {} }, 6000);
        };
        begin();
      };
      startLoad(25);
    } else {
      if (!mpSession) { try { mod.ccall("rblx_load_place", "number", [], []); } catch (_) {} }
      hideMenus();
      setStatus("Place loaded, but the renderer did not start (headless engine).", true);
    }
  }

  // --- Multiplayer ----------------------------------------------------------
  // Real 2016 networking. The first player in a room becomes the host: a
  // hidden frame on their page runs the place on a headless NetworkServer
  // (?mpserver=1 -> hostMain below). Everyone, the host included, joins that
  // server as a NetworkClient, so every game script runs once, server side,
  // just like on a 2016 game server. Datagrams travel over a WebSocket relay
  // (js/net.js).
  const MP_SERVER_MODE = new URLSearchParams(location.search).get("mpserver") === "1";

  // A server picked on the website's game page (Servers tab) applies to that
  // one Play only: undefined = use the saved setting, null = play solo.
  var mpOverride;
  function mpSettings() {
    let enabled = false, room = "", relay = "";
    if (mpOverride !== undefined) {
      const o = mpOverride;
      mpOverride = undefined;
      if (!o || SHELL_MODE || RENDER_MODE || !window.RblxNet) return null;
      try { relay = (localStorage.getItem("rblx2016.mpRelay") || "").trim(); } catch (_) {}
      return { room: String(o.room || "lobby").slice(0, 32), relay: relay || defaultRelay() };
    }
    try { enabled = localStorage.getItem("rblx2016.mp") === "1"; } catch (_) {}
    if (!enabled || SHELL_MODE || RENDER_MODE || !window.RblxNet) return null;
    try { room = (localStorage.getItem("rblx2016.mpRoom") || "").trim(); } catch (_) {}
    try { relay = (localStorage.getItem("rblx2016.mpRelay") || "").trim(); } catch (_) {}
    return { room: room || "lobby", relay: relay || defaultRelay() };
  }

  // A deployment can name its relay in mp-relay.json ({"url": "wss://..."});
  // otherwise the page's own origin (webserve.py / the Cloudflare Worker).
  let configuredRelay = "";
  function defaultRelay() { return configuredRelay || location.origin; }
  fetch("mp-relay.json", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => { if (j && j.url) configuredRelay = String(j.url); })
    .catch(() => {});

  function preloadSavedData(mod, placeKey) {
    mod.__rblxPlaceKey = placeKey;
    if (typeof mod._rblx_ds_put !== "function") return;
    try {
      const pre = "rblx2016.ds." + placeKey + "|";
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(pre))
          mod.ccall("rblx_ds_put", null, ["string", "string"], [k.slice(pre.length), localStorage.getItem(k) || ""]);
      }
    } catch (e) { console.warn("[rbx2016] saved data not loaded:", e); }
  }

  // Starts the server frame for this page and resolves once it is hosting.
  let hostFrame = null;
  function startHostFrame(cfg, place, bytes, year) {
    return new Promise((resolve, reject) => {
      const q = new URLSearchParams({ mpserver: "1", room: cfg.room, relay: cfg.relay, year: String(year) });
      const f = document.createElement("iframe");
      f.title = "game server";
      f.setAttribute("aria-hidden", "true");
      // Kept rendered (not display:none) so the browser doesn't park it.
      f.style.cssText = "position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none;border:0;z-index:-1";
      const timer = setTimeout(() => reject(new Error("The game server did not start (timed out).")), 180000);
      const onMsg = (e) => {
        if (e.origin !== location.origin || e.source !== f.contentWindow || !e.data || !e.data.rblx2016mp) return;
        const m = e.data;
        if (m.t === "ready") {
          f.contentWindow.postMessage({ rblx2016mpPlace: true, bytes, name: place.name, id: place.id }, location.origin);
        } else if (m.t === "status") {
          if (m.msg) setStatus("Starting your game server… " + m.msg);
        } else if (m.t === "hosting") {
          clearTimeout(timer); resolve(m);
        } else if (m.t === "error") {
          clearTimeout(timer); reject(new Error("Game server: " + m.msg));
        } else if (m.t === "crashed") {
          showFatal(new Error("The game server stopped: " + (m.msg || "engine error")));
        }
      };
      window.addEventListener("message", onMsg);
      f.src = "?" + q.toString();
      document.body.appendChild(f);
      hostFrame = f;
    });
  }

  // One multiplayer player per computer (per browser): a second tab or
  // window can't join while one is already playing. The lock is released
  // when the page closes.
  let playerSlot = null;
  function claimPlayerSlot() {
    if (playerSlot) return playerSlot;
    if (!navigator.locks || !navigator.locks.request) return (playerSlot = Promise.resolve(true));
    playerSlot = new Promise((resolve) => {
      navigator.locks.request("rblx2016-multiplayer-player", { ifAvailable: true }, (lock) => {
        if (!lock) { resolve(false); return null; }
        resolve(true);
        return new Promise(() => {});  // held for the life of this page
      }).catch(() => resolve(true));
    });
    return playerSlot.then((ok) => { if (!ok) playerSlot = null; return ok; });
  }

  async function playMultiplayer(cfg, name) {
    // ?multi=1 on a local dev server allows several test players in one browser.
    const devMulti = /^(127\.0\.0\.1|localhost)$/.test(location.hostname) &&
      new URLSearchParams(location.search).get("multi") === "1";
    if (!devMulti && !(await claimPlayerSlot()))
      throw new Error("You're already playing multiplayer in another tab or window. " +
        "Only one player per computer can join; close the other one first.");
    if (cfg.relay === location.origin && !window.__rblxLocalServer &&
        !/^(127\.0\.0\.1|localhost|\[::1\])$/.test(location.hostname) && !/workers\.dev$/.test(location.hostname)) {
      // Static hosts (Vercel, GitHub Pages) can't run the relay themselves.
      try {
        const r = await fetch("mp-relay.json", { cache: "no-store" });
        const j = r.ok ? await r.json() : null;
        if (j && j.url) cfg.relay = configuredRelay = String(j.url);
      } catch (_) {}
      if (cfg.relay === location.origin)
        throw new Error("Multiplayer needs a relay server. Put its address in the Relay URL box " +
          "(or in mp-relay.json when you deploy). See relay/ in the repository.");
    }
    setStatus("Connecting to room “" + cfg.room + "”…");
    const conn = await window.RblxNet.open(cfg.relay, cfg.room, "player");
    let hostIp = conn.host;
    let year = 2016;
    if (!hostIp) {
      // Nobody is hosting this room yet: run the selected place here.
      let bytes = await readFileBytes(selected);
      if (window.PlaceFix) bytes = window.PlaceFix.upgrade(bytes).bytes;
      year = ui2017.checked ? 2017 : 2016;
      setStatus("Starting your game server for “" + selected.name + "”…");
      await startHostFrame(cfg, selected, bytes, year);
      hostIp = await conn.waitHost(60000);
    } else {
      const info = conn.info || {};
      if (info.year) year = info.year;
      setStatus("Joining " + (info.place ? "“" + info.place + "”" : "the game") + " in room “" + cfg.room + "”…");
    }
    const mod = await ensureModule();
    if (typeof mod._rblx_join_start !== "function")
      throw new Error("This engine build has no multiplayer support (rebuild needed).");
    if (typeof mod._rblx_set_script_year === "function") {
      const use2017 = year === 2017 && await load2017Scripts(mod);
      mod.ccall("rblx_set_script_year", null, ["number"], [use2017 ? 2017 : 2016]);
    }
    if (typeof mod._rblx_set_membership === "function")
      mod.ccall("rblx_set_membership", null, ["number"], [bcTier()]);
    // Censor the player's name (the server censors it again).
    if (typeof mod._rblx_filter_text === "function") {
      try { name = mod.ccall("rblx_filter_text", "string", ["string", "number"], [name, 1]) || name; } catch (_) {}
    }
    window.RblxNet.attach(mod, conn);
    conn.on("dropped", () => console.warn("[rbx2016] relay connection dropped; reconnecting"));
    // What you wear: the server dresses your character with it.
    conn.send({ t: "hello", name, spec: avatarSpec() });
    await configureAssetProxy(mod);
    conn.on("host", (m) => {
      if (!m.ip) setStatus("The host left the game.", true);
    });
    const userId = conn.ip & 0xffffff;
    setPlaceInfo(mod, (conn.info && conn.info.place) || "", "BLOXRO");
    const rc = mod.ccall("rblx_join_start", "number",
      ["number", "number", "number", "string", "string", "number"],
      [hostIp >>> 0, window.RblxNet.GAME_PORT, userId, name, new URL(".", location.href).href, touchDevice ? 1 : 0]);
    if (rc !== 0) throw new Error("rblx_join_start returned " + rc);
    window.__mp = { conn, mod };
    watchJoin(mod);
    await afterStart(mod, { conn });
    console.log("[rbx2016] joined room", cfg.room, "as", window.RblxNet.ipString(conn.ip));
  }

  // Surfaces a failed connection (the engine's own UI covers disconnects).
  function watchJoin(mod) {
    const started = Date.now();
    const iv = setInterval(() => {
      let state = 0, msg = "";
      try { state = mod.ccall("rblx_net_state", "number", [], []); msg = mod.ccall("rblx_net_message", "string", [], []); } catch (_) {}
      if (state === 3) {
        clearInterval(iv);
        showFatal(new Error(msg || "Could not connect to the game server."));
      } else if (state === 2 || Date.now() - started > 120000) {
        clearInterval(iv);
      }
    }, 500);
  }

  // The hidden server frame (index.html?mpserver=1).
  async function hostMain() {
    const q = new URLSearchParams(location.search);
    const post = (m) => { try { parent.postMessage(Object.assign({ rblx2016mp: true }, m), location.origin); } catch (_) {} };
    window.engineCrashedHook = (e) => post({ t: "crashed", msg: String((e && e.message) || e) });
    try {
      const place = await new Promise((resolve) => {
        window.addEventListener("message", (e) => {
          if (e.origin === location.origin && e.data && e.data.rblx2016mpPlace) resolve(e.data);
        });
        post({ t: "ready" });
      });
      post({ t: "status", msg: "loading the engine" });
      const mod = await ensureModule();
      if (typeof mod._rblx_host_start !== "function") throw new Error("this engine build cannot host");
      const year = Number(q.get("year")) === 2017 ? 2017 : 2016;
      if (typeof mod._rblx_set_script_year === "function") {
        const use2017 = year === 2017 && await load2017Scripts(mod);
        mod.ccall("rblx_set_script_year", null, ["number"], [use2017 ? 2017 : 2016]);
      }
      preloadSavedData(mod, place.id);
      await configureAssetProxy(mod);
      post({ t: "status", msg: "registering with the relay" });
      const conn = await window.RblxNet.open(q.get("relay") || defaultRelay(), q.get("room") || "lobby", "host");
      window.RblxNet.attach(mod, conn);
      conn.on("hello", (m) => {
        try { mod.ccall("rblx_server_set_avatar", null, ["number", "string"], [m.from & 0xffffff, m.spec || ""]); } catch (_) {}
      });
      post({ t: "status", msg: "loading the place" });
      const bytes = place.bytes;
      const ptr = mod._malloc(bytes.length);
      if (!ptr) throw new Error("out of memory loading the place");
      mod.HEAPU8.set(bytes, ptr);
      const rc = mod.ccall("rblx_host_start", "number", ["number", "number", "number", "string"],
        [ptr, bytes.length, window.RblxNet.GAME_PORT, new URL(".", location.href).href]);
      mod._free(ptr);
      if (rc !== 0) throw new Error("rblx_host_start returned " + rc);
      // Wait until the server is actually listening before anyone joins.
      for (let i = 0; i < 600; i++) {
        const m = mod.ccall("rblx_net_message", "string", [], []);
        if (m === "hosting") break;
        if (m && m.startsWith("host failed")) throw new Error(m);
        await new Promise((r) => setTimeout(r, 200));
      }
      conn.send({ t: "info", place: place.name, file: place.id, year });
      setInterval(() => { try { mod.ccall("rblx_server_tick", null, [], []); } catch (e) { if (isEngineTrap(e)) engineCrashed(e); } }, 300);
      window.__mpServer = { conn, mod };
      post({ t: "hosting", ip: conn.ip });
      console.log("[rbx2016] hosting", place.name, "as", window.RblxNet.ipString(conn.ip));
    } catch (e) {
      console.warn(e);
      post({ t: "error", msg: String((e && e.message) || e) });
    }
  }

  const keysDown = new Set();
  function modFromKeys() {
    let m = 0;
    if (keysDown.has("shift")) m |= 1;       // KMOD_LSHIFT
    if (keysDown.has("control")) m |= 0x40;  // KMOD_LCTRL
    if (keysDown.has("alt")) m |= 0x100;     // KMOD_LALT
    return m;
  }
  function engineKeyCode(e) {
    switch (e.key) {
      case "ArrowUp": return 273;
      case "ArrowDown": return 274;
      case "ArrowRight": return 275;
      case "ArrowLeft": return 276;
      case "Shift": return e.location === 2 ? 303 : 304;
      case "Control": return e.location === 2 ? 305 : 306;
      case "Alt": return e.location === 2 ? 307 : 308;
      case " ": return 32;
      case "Enter": return 13;
      case "Tab": return 9;
      case "Backspace": return 8;
      case "Escape": return 27;
      case "F11": return 292;
      case "F12": return 293;
      case "PrintScreen": return 316;
      default: break;
    }
    if (e.key.length === 1) return e.key.toLowerCase().charCodeAt(0);
    return 0;
  }
  function installInput(mod) {
    if (canvas.__inputInstalled) return;
    canvas.__inputInstalled = true;
    const ccall = (fn, args) => { try { mod.ccall(fn, null, ["number","number","number","number"], args); } catch (_) {} };
    const toCanvas = (e) => {
      const r = canvas.getBoundingClientRect();
      const sx = canvas.width / Math.max(1, r.width);
      const sy = canvas.height / Math.max(1, r.height);
      return [Math.round((e.clientX - r.left) * sx), Math.round((e.clientY - r.top) * sy), sx, sy];
    };
    const updateCursor = () => {
      // The engine draws the 2016 cursor (arrow, hand, tool icons) itself.
      canvas.style.cursor = playing ? "none" : "default";
    };

    // Right-drag captures the pointer like the desktop client: the OS cursor
    // stops at window edges, so without capture camera turning would stick.
    let locked = false;
    let rightDown = false;
    let lockRequested = false;
    let lockTime = 0;
    let skipLockedMove = false;
    const lockedPos = { x: 0, y: 0 };
    const heldKeys = new Map();   // key -> { code, ch }
    const heldButtons = new Set();

    // Mouse motion is coalesced into one engine event per frame, the way the
    // native client processes one mouse message per frame.
    let pending = { x: 0, y: 0, dx: 0, dy: 0, has: false };
    const flushMouse = () => {
      if (!pending.has) return;
      ccall("rblx_mouse_move", [pending.x, pending.y, pending.dx, pending.dy]);
      pending.dx = 0; pending.dy = 0; pending.has = false;
    };
    canvas.__flushMouse = flushMouse;

    const activeTouches = new Map();
    const releaseAll = () => {
      for (const [, h] of heldKeys) ccall("rblx_key_event", [h.code, 0, h.ch, 0]);
      heldKeys.clear();
      keysDown.clear();
      for (const b of heldButtons) ccall("rblx_mouse_button", [b, lockedPos.x, lockedPos.y, 0]);
      heldButtons.clear();
      for (const [id, p] of activeTouches) {
        try {
          mod.ccall("rblx_touch_event", null, ["number", "number", "number", "number"], [id, p[0], p[1], 3]);
        } catch (_) {}
      }
      activeTouches.clear();
      rightDown = false;
      lockRequested = false;
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    };
    canvas.__releaseInput = releaseAll;

    const touchToEngine = (t, state) => {
      const p = toCanvas(t);
      if (state === 0 || state === 1) activeTouches.set(t.identifier, [p[0], p[1]]);
      try {
        mod.ccall("rblx_touch_event", null, ["number", "number", "number", "number"],
          [t.identifier, p[0], p[1], state]);
      } catch (_) {}
    };
    canvas.addEventListener("touchstart", (e) => {
      if (!playing) return;
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (!activeTouches.has(t.identifier)) touchToEngine(t, 0);
      }
    }, { passive: false });
    canvas.addEventListener("touchmove", (e) => {
      if (!playing) return;
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (!activeTouches.has(t.identifier)) touchToEngine(t, 0);
        else touchToEngine(t, 1);
      }
    }, { passive: false });
    canvas.addEventListener("touchend", (e) => {
      if (!playing) return;
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (activeTouches.delete(t.identifier)) {
          const p = toCanvas(t);
          try {
            mod.ccall("rblx_touch_event", null, ["number", "number", "number", "number"],
              [t.identifier, p[0], p[1], 2]);
          } catch (_) {}
        }
      }
    }, { passive: false });
    canvas.addEventListener("touchcancel", (e) => {
      if (!playing) return;
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (activeTouches.delete(t.identifier)) {
          const p = toCanvas(t);
          try {
            mod.ccall("rblx_touch_event", null, ["number", "number", "number", "number"],
              [t.identifier, p[0], p[1], 3]);
          } catch (_) {}
        }
      }
    }, { passive: false });

    document.addEventListener("pointerlockchange", () => {
      locked = document.pointerLockElement === canvas;
      lockRequested = false;
      // The first event after capture can carry the delta from the click
      // position to the capture origin; ignore it once, plus the short warp
      // window. Drop any movement queued before the lock took effect.
      skipLockedMove = locked;
      lockTime = performance.now();
      pending.has = false;
      pending.dx = 0;
      pending.dy = 0;
      updateCursor();
      if (!locked && rightDown) {
        rightDown = false;
        ccall("rblx_mouse_button", [2, lockedPos.x, lockedPos.y, 0]);
      }
    });
    document.addEventListener("pointerlockerror", () => {
      lockRequested = false;
    });
    updateCursor();
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("mousemove", (e) => {
      if (!playing) return;
      // Browser pointer lock warps the cursor to the screen center. Those
      // pre-lock movement deltas must not reach the camera: the right-button
      // drag has already started, and applying them snaps the view.
      if (rightDown && lockRequested) return;
      const p = toCanvas(e);
      let dx = Math.round(e.movementX * p[2]);
      let dy = Math.round(e.movementY * p[3]);
      if (locked && (skipLockedMove || performance.now() - lockTime < 50)) {
        skipLockedMove = false;
        dx = 0;
        dy = 0;
      }
      let x = p[0], y = p[1];
      if (locked) {
        // Right-drag camera look pins the cursor like the 2016 desktop client:
        // the view rotates from the raw deltas while the pointer stays frozen
        // where it was grabbed, so the engine-drawn cursor never drifts across
        // the screen and reappears in place when the button is released.
        x = lockedPos.x; y = lockedPos.y;
      } else {
        lockedPos.x = x; lockedPos.y = y;
      }
      pending.x = x; pending.y = y; pending.dx += dx; pending.dy += dy; pending.has = true;
    });
    canvas.addEventListener("mousedown", (e) => {
      if (!playing) return;
      const p = toCanvas(e);
      heldButtons.add(e.button);
      // Deliver any coalesced motion from before the click before starting a
      // drag. UserInputService processes button-down before queued movement in
      // the same frame, so zero the delta for the camera button: otherwise the
      // pan starts at the click position and then applies the pre-click delta,
      // snapping the view.
      if (e.button === 2) {
        pending.dx = 0;
        pending.dy = 0;
      }
      flushMouse();
      if (e.button === 2) {
        rightDown = true;
        lockedPos.x = p[0]; lockedPos.y = p[1];
        lockRequested = document.pointerLockElement !== canvas;
        if (lockRequested) {
          setTimeout(() => { lockRequested = false; }, 1000);
          try {
            const req = canvas.requestPointerLock();
            if (req && req.catch) req.catch(() => { lockRequested = false; });
          } catch (_) {
            lockRequested = false;
          }
        }
      }
      ccall("rblx_mouse_button", [e.button, p[0], p[1], 1]);
    });
    window.addEventListener("mouseup", (e) => {
      if (!playing) return;
      const p = locked ? [lockedPos.x, lockedPos.y] : toCanvas(e);
      heldButtons.delete(e.button);
      if (e.button === 2) {
        rightDown = false;
        lockRequested = false;
        if (document.pointerLockElement === canvas) document.exitPointerLock();
      }
      ccall("rblx_mouse_button", [e.button, p[0], p[1], 0]);
    });
    canvas.addEventListener("wheel", (e) => {
      if (!playing) return;
      e.preventDefault();
      const p = toCanvas(e);
      ccall("rblx_mouse_wheel", [p[0], p[1], e.deltaY < 0 ? 1 : -1]);
    }, { passive: false });
    window.addEventListener("keydown", (e) => {
      if (!playing) return;
      const k = e.key.toLowerCase();
      if ([" ","arrowup","arrowdown","arrowleft","arrowright","tab","f11","f12","printscreen"].includes(k)) e.preventDefault();
      if (keysDown.has(k)) return;
      keysDown.add(k);
      const code = engineKeyCode(e);
      const ch = e.key.length === 1 ? e.key.charCodeAt(0) : 0;
      if (code) {
        heldKeys.set(k, { code, ch });
        ccall("rblx_key_event", [code, modFromKeys(), ch, 1]);
      }
    });
    window.addEventListener("keyup", (e) => {
      if (!playing) return;
      const k = e.key.toLowerCase();
      keysDown.delete(k);
      const h = heldKeys.get(k);
      heldKeys.delete(k);
      const code = h ? h.code : engineKeyCode(e);
      const ch = h ? h.ch : (e.key.length === 1 ? e.key.charCodeAt(0) : 0);
      if (code) ccall("rblx_key_event", [code, modFromKeys(), ch, 0]);
    });
    window.addEventListener("blur", releaseAll);
    document.addEventListener("visibilitychange", () => { if (document.hidden) releaseAll(); });
  }

  function stop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    screenshotPending = false;
    if (mediaRecorder) { try { stopRecording(); } catch (_) {} }
    if (canvas.__releaseInput) canvas.__releaseInput();
    try {
      if (engine && typeof engine._rblx_stop === "function") {
        engine.ccall("rblx_stop", null, [], []);
      }
    } catch (e) { console.warn(e); }
    playing = false;
    playBtn.disabled = !hasWebGL2();
    login.style.pointerEvents = "";
    login.style.display = "block";
    fatal.style.display = "none";
    setStatus("");
  }

  function hasWebGL2() {
    try {
      const c = document.createElement("canvas");
      return !!(window.WebGL2RenderingContext && c.getContext("webgl2"));
    } catch (_) { return false; }
  }

  function showCookieStatus(status) {
    const state = $("cookieState");
    if (!state) return;
    if (!status) { state.textContent = "status unavailable"; return; }
    if (!status.set) { state.textContent = "not set"; return; }
    state.textContent = "set " + "*".repeat(12) + (status.source ? " · " + status.source : "");
  }

  async function cookieRequest(method, value) {
    const options = { method: method, cache: "no-store", headers: { "X-RBX-Cookie": "1" } };
    if (value !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify({ value: value });
    }
    const response = await fetch("cookie", options);
    if (!response.ok) throw new Error("cookie request failed");
    return await response.json();
  }

  function installCookieUi() {
    const input = $("cookieInput");
    const save = $("cookieSave");
    const clear = $("cookieClear");
    if (!input || !save || !clear) return;
    fetch("cookie", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("no server"))))
      .then((status) => { window.__rblxLocalServer = true; return status; })
      .then(showCookieStatus)
      .catch(() => {
        // No local server: the field stays visible for reference, but there is
        // nothing that could use the cookie and it must not sit in this page.
        $("cookieState").textContent = "needs the local server (python3 web/serve.py)";
        input.disabled = true;
        input.placeholder = "set it in the local server instead";
        save.disabled = true;
        clear.disabled = true;
        const note = $("cookieNote");
        if (note) note.textContent =
          "This hosted copy has no asset proxy, so the cookie cannot be used here. " +
          "Run the site with web/serve.py to download rbxassetid content.";
      });
    save.addEventListener("click", async () => {
      const value = input.value.trim();
      if (!value) { setStatus("Paste the .ROBLOSECURITY value first.", true); return; }
      try {
        const status = await cookieRequest("POST", value);
        input.value = "";
        showCookieStatus(status);
        setStatus("Asset cookie saved. Remote assets load on the next join.");
      } catch (_) {
        setStatus("Could not save the asset cookie.", true);
      }
    });
    clear.addEventListener("click", async () => {
      try {
        const status = await cookieRequest("DELETE");
        input.value = "";
        showCookieStatus(status);
        setStatus("Asset cookie removed.");
      } catch (_) {
        setStatus("Could not remove the asset cookie.", true);
      }
    });
  }

  // ------------------------------------------------------- render options
  // Renderer workarounds for devices where the world renders black. They are
  // read by the engine before it creates the view, so they apply on the next
  // Play (or after a reload).
  function renderOptions() {
    return {
      lightgrid: Number(localStorage.getItem("rblx2016.lightgrid") || "0") || 0,
      gles2: localStorage.getItem("rblx2016.gles2") === "1",
      diag: localStorage.getItem("rblx2016.diag") === "1",
    };
  }

  // A non-default renderer switch must not hide inside a closed section.
  function markRenderOptions() {
    const state = $("compatState");
    if (!state) return;
    const opts = renderOptions();
    state.textContent = opts.lightgrid || opts.gles2 || opts.diag ? "(custom)" : "";
  }

  function installRenderOptions() {
    const grid = $("lightGrid");
    const gles2 = $("gles2Shaders");
    const diag = $("showDiag");
    if (!grid || !gles2 || !diag) return;
    const opts = renderOptions();
    grid.value = String(opts.lightgrid);
    gles2.checked = opts.gles2;
    diag.checked = opts.diag;
    markRenderOptions();
    grid.addEventListener("change", () => {
      localStorage.setItem("rblx2016.lightgrid", grid.value);
      setStatus("Lighting option saved; it applies on the next Play.");
      markRenderOptions();
    });
    gles2.addEventListener("change", () => {
      localStorage.setItem("rblx2016.gles2", gles2.checked ? "1" : "0");
      setStatus("Shader option saved; it applies on the next Play.");
      markRenderOptions();
    });
    diag.addEventListener("change", () => {
      localStorage.setItem("rblx2016.diag", diag.checked ? "1" : "0");
      updateDiag();
      markRenderOptions();
    });
  }

  function applyRenderOptions(mod) {
    const opts = renderOptions();
    try {
      mod.ccall("rblx_set_render_option", null, ["string", "number"], ["lightgrid", opts.lightgrid]);
      mod.ccall("rblx_set_render_option", null, ["string", "number"], ["shaders", opts.gles2 ? 1 : 0]);
    } catch (e) {
      console.warn("[rbx2016] render options not available", e);
    }
  }

  let diagTimer = 0;
  let diagFrames = 0;
  function updateDiag() {
    const box = $("diagBox");
    if (!box) return;
    const opts = renderOptions();
    box.classList.toggle("on", opts.diag);
    if (!opts.diag) return;
    if (!diagTimer) {
      diagTimer = setInterval(updateDiag, 1000);
      const tick = () => { diagFrames++; requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    const info = gl && gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = gl && info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "?";
    const version = gl ? gl.getParameter(gl.VERSION) : "?";
    const maxTex = gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 0;
    const max3D = gl ? gl.getParameter(gl.MAX_3D_TEXTURE_SIZE) : 0;
    let frames = 0;
    try { frames = engine ? engine.ccall("rblx_frame_count", "number", [], []) : 0; } catch (_) {}
    box.textContent =
      "renderer  " + renderer + "\n" +
      "GL        " + version + "\n" +
      "texture   " + maxTex + " / 3D " + max3D + "\n" +
      "lighting  " + (opts.lightgrid === 0 ? "auto" : opts.lightgrid === 1 ? "2D grid" : "no grid") +
      " | shaders " + (opts.gles2 ? "gles2" : "default") + "\n" +
      "fps       " + diagFrames + " page / " + frames + " engine" + "\n" +
      "isolated  " + (window.crossOriginIsolated ? "yes" : "no");
    diagFrames = 0;
  }

  // ---------------------------------------------------------------- catalog
  // The 2016 avatar files are scraped once into web/catalog by
  // port/tools/fetch_catalog.py; the page only reads the manifest.
  const AVATAR_KEY = "rblx2016.avatar";
  const CATEGORIES = [
    { id: "", label: "All Categories" },
    { id: "hat", label: "Hats" },
    { id: "hair", label: "Hair" },
    { id: "shoulder", label: "Shoulder" },
    { id: "back", label: "Back" },
    { id: "head", label: "Heads" },
    { id: "face", label: "Faces" },
    { id: "shirt", label: "Shirts" },
    { id: "pants", label: "Pants" },
    { id: "tshirt", label: "T-Shirts" },
  ];
  // Hats, shoulder and back items are all wearable at once.
  const ACCESSORY_TYPES = ["hat", "hair", "shoulder", "back"];
  const BODY_SLOTS = ["Head", "Left arm", "Right arm", "Torso", "Left leg", "Right leg"];
  const SLOT_SHORT = ["Head", "L arm", "R arm", "Torso", "L leg", "R leg"];
  let bodyPart = 0;
  const BRICK_COLORS = [
    { n: 24, hex: "#f5cd30", name: "Bright yellow" },
    { n: 1, hex: "#f2f3f3", name: "White" },
    { n: 194, hex: "#a3a2a5", name: "Medium stone grey" },
    { n: 199, hex: "#635f62", name: "Dark stone grey" },
    { n: 21, hex: "#c4281c", name: "Bright red" },
    { n: 23, hex: "#0d69ac", name: "Bright blue" },
    { n: 28, hex: "#287f47", name: "Dark green" },
    { n: 37, hex: "#4b974b", name: "Bright green" },
    { n: 106, hex: "#da8541", name: "Bright orange" },
    { n: 5, hex: "#d7c59a", name: "Brick yellow" },
    { n: 192, hex: "#694028", name: "Reddish brown" },
    { n: 217, hex: "#7c5c46", name: "Brown" },
    { n: 18, hex: "#cc8e69", name: "Nougat" },
    { n: 102, hex: "#6e99ca", name: "Medium blue" },
    { n: 119, hex: "#a4bd47", name: "Br. yellowish green" },
    { n: 101, hex: "#da867a", name: "Medium red" },
    { n: 9, hex: "#e8bac8", name: "Light reddish violet" },
    { n: 107, hex: "#008f9c", name: "Bright bluish green" },
    { n: 2, hex: "#a1a5a2", name: "Grey" },
    { n: 226, hex: "#fdea8d", name: "Cool yellow" },
  ];
  const catalogPage = $("catalog");
  const catGrid = $("catGrid");
  const catNote = $("catNote");
  let catalogItems = null;
  let catalogCategory = "";
  let catalogQuery = "";
  let catalogCreator = "";
  let detailItem = null;
  let avatar = loadAvatar();

  function loadAvatar() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(AVATAR_KEY) || "{}") || {}; } catch (_) {}
    // Classic noob: yellow head and arms, bright blue torso, bright green legs.
    const noob = [24, 24, 24, 23, 37, 37];
    const body = Array.isArray(saved.body) && saved.body.length === 6
      ? saved.body.map((n) => Number(n) || 24) : noob.slice();
    // The old all-yellow default was never a deliberate choice; upgrade it.
    if (body.join(",") === "24,24,24,24,24,24") body.splice(0, 6, ...noob);
    const accessories = Array.isArray(saved.accessories) ? saved.accessories
      : (Array.isArray(saved.hats) ? saved.hats : []);
    return {
      shirt: Number(saved.shirt) || 0,
      pants: Number(saved.pants) || 0,
      tshirt: Number(saved.tshirt) || 0,
      face: Number(saved.face) || 0,
      head: Number(saved.head) || 0,
      accessories: accessories.map(Number).filter(Boolean),
      package: Number(saved.package) || 0,
      packageParts: Array.isArray(saved.packageParts) ? saved.packageParts.map(Number).filter(Boolean) : [],
      body,
    };
  }

  function saveAvatar() {
    try { localStorage.setItem(AVATAR_KEY, JSON.stringify(avatar)); } catch (_) {}
    renderWorn();
    renderCustomize();
  }

  // ------------------------------------------------------------- inventory
  // Everything is free: "Get" (or wearing) adds an item to your inventory, and
  // the Customizer lists what you own, like the 2016 Avatar page.
  const INV_KEY = "rblx2016.inventory";
  const inventory = loadInventory();
  function loadInventory() {
    let ids = null;
    try { ids = JSON.parse(localStorage.getItem(INV_KEY) || "null"); } catch (_) {}
    if (!Array.isArray(ids)) {
      // First run: you own whatever you were already wearing.
      ids = ["head", "shirt", "pants", "tshirt", "face"].map((k) => avatar[k]).filter(Boolean)
        .concat(avatar.accessories);
    }
    return new Set(ids.map(Number).filter(Boolean));
  }
  function saveInventory() {
    try { localStorage.setItem(INV_KEY, JSON.stringify([...inventory])); } catch (_) {}
  }
  function owns(id) { return inventory.has(Number(id)); }
  function addToInventory(id) {
    id = Number(id);
    if (!id || inventory.has(id)) return;
    inventory.add(id);
    saveInventory();
  }

  function isWorn(item) {
    if (ACCESSORY_TYPES.includes(item.type)) return avatar.accessories.includes(item.id);
    return avatar[item.type] === item.id;
  }

  function wear(item) {
    addToInventory(item.id);  // everything is free: wearing it means you own it
    if (ACCESSORY_TYPES.includes(item.type)) {
      avatar.accessories = isWorn(item)
        ? avatar.accessories.filter((id) => id !== item.id)
        : avatar.accessories.concat(item.id);
    } else {
      avatar[item.type] = isWorn(item) ? 0 : item.id;
    }
    saveAvatar();
    renderCatalog();
    if (detailItem) renderDetail();
  }

  // The engine applies this list to the local character: one item per clothing
  // slot, any number of hats, plus the six BodyColors values.
  function avatarSpec() {
    const parts = [];
    for (const kind of ["head", "shirt", "pants", "tshirt", "face"]) {
      if (avatar[kind]) parts.push(kind + ":" + avatar[kind]);
    }
    for (const id of avatar.accessories) parts.push("acc:" + id);
    for (const id of avatar.packageParts || []) parts.push("acc:" + id);
    parts.push("body:" + avatar.body.join(","));
    return parts.join(";");
  }

  function itemById(id) {
    return (catalogItems || []).find((it) => it.id === id) || null;
  }

  function itemImage(item) {
    if (item.thumb) return "catalog/" + item.thumb;
    if (item.file) return "catalog/" + item.file;
    return "";  // packages mined from places have no catalog thumbnail
  }

  function renderWorn() {
    const worn = [];
    for (const kind of ["head", "shirt", "pants", "tshirt", "face"]) {
      const item = itemById(avatar[kind]);
      if (item) worn.push(item);
    }
    for (const id of avatar.accessories) {
      const item = itemById(id);
      if (item) worn.push(item);
    }
    const names = worn.map((it) => it.name);
    const line = $("wornLine");
    line.textContent = names.length ? "Wearing: " + names.join(", ") : "Not wearing anything yet.";
    $("catWornLine").textContent = names.length ? names.join(", ") : "nothing worn";
    const bar = $("catWornBar");
    bar.innerHTML = "";
    if (!worn.length) {
      bar.textContent = "You are not wearing anything yet. Click an item to wear it.";
      return;
    }
    const label = document.createElement("span");
    label.innerHTML = "<b>Wearing:</b>";
    bar.appendChild(label);
    for (const item of worn) {
      const chip = document.createElement("span");
      chip.textContent = item.name + " ";
      const x = document.createElement("button");
      x.type = "button";
      x.className = "btn";
      x.textContent = "x";
      x.title = "Remove " + item.name;
      x.addEventListener("click", () => wear(item));
      chip.appendChild(x);
      bar.appendChild(chip);
    }
  }

  function renderCatalog() {
    if (!catalogPage.classList.contains("open")) return;
    const cats = $("catCats");
    if (!cats.childElementCount) {
      for (const cat of CATEGORIES) {
        const link = document.createElement("a");
        link.textContent = cat.label;
        link.dataset.id = cat.id;
        link.tabIndex = 0;
        link.addEventListener("click", () => {
          catalogCategory = cat.id;
          renderCatalog();
        });
        link.addEventListener("keydown", (e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          catalogCategory = cat.id;
          renderCatalog();
        });
        cats.appendChild(link);
      }
    }
    for (const link of cats.children) link.classList.toggle("sel", link.dataset.id === catalogCategory);

    catGrid.innerHTML = "";
    if (!catalogItems) return;
    if (!catalogItems.length) {
      catNote.style.display = "block";
      catNote.innerHTML = "No catalog was scraped yet. Run <code>python3 port/tools/fetch_catalog.py</code>" +
        " to build <code>web/catalog/</code> from the Bloxro website.";
      return;
    }
    catNote.style.display = "none";
    const query = catalogQuery.toLowerCase();
    const shown = catalogItems.filter((it) =>
      (!catalogCategory || it.type === catalogCategory) &&
      (!catalogCreator || it.creator === catalogCreator) &&
      (!query || it.name.toLowerCase().includes(query)));
    if (!shown.length) {
      catNote.style.display = "block";
      catNote.textContent = "No items match that filter.";
      return;
    }
    for (const item of shown) {
      const tile = document.createElement("div");
      tile.className = "tile" + (isWorn(item) ? " worn" : "");
      const src = itemImage(item);
      const img = document.createElement(src ? "img" : "div");
      if (src) {
        img.loading = "lazy";
        img.src = src;
      } else {
        img.textContent = (item.name || "?").slice(0, 1);
        img.style.cssText = "display:flex;align-items:center;justify-content:center;background:#e6ebf1;color:#7d8fa3;font-size:44px";
      }
      img.alt = "";
      if (src && item.file) {
        img.addEventListener("error", () => {
          // Some items have no rendered thumbnail; the template/model still shows.
          if (!img.dataset.fallback) {
            img.dataset.fallback = "1";
            img.src = "catalog/" + item.file;
          }
        });
      }
      const nm = document.createElement("div");
      nm.className = "nm";
      nm.textContent = item.name;
      const cr = document.createElement("div");
      cr.className = "cr";
      cr.textContent = "by " + item.creator;
      const pr = document.createElement("div");
      pr.className = "pr";
      pr.textContent = owns(item.id) ? "Owned" : "Free";
      tile.append(img, nm, cr, pr);
      tile.tabIndex = 0;
      tile.addEventListener("click", () => openDetail(item));
      tile.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetail(item);
        }
      });
      catGrid.appendChild(tile);
    }
  }

  function renderDetail() {
    $("catDetailImg").src = itemImage(detailItem);
    $("catDetailName").textContent = detailItem.name;
    const kind = detailItem.type.replace("tshirt", "t-shirt");
    $("catDetailMeta").textContent = "by " + detailItem.creator +
      (detailItem.created ? " · " + detailItem.created : "") + " · " + kind;
    $("catWear").textContent = isWorn(detailItem) ? "Take off" : "Wear";
    $("catWear").classList.toggle("wearing", isWorn(detailItem));
    const get = $("catGet");
    get.disabled = owns(detailItem.id);
    get.textContent = owns(detailItem.id) ? "Owned" : "Get";
  }

  function openDetail(item) {
    detailItem = item;
    renderDetail();
    $("catDetail").classList.add("open");
  }

  function closeDetail() {
    detailItem = null;
    $("catDetail").classList.remove("open");
  }

  async function loadCatalog() {
    if (catalogItems) return;
    try {
      const response = await fetch("catalog/manifest.json", { cache: "no-store" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const manifest = await response.json();
      // Packages carry body parts in the manifest instead of a single item file.
      catalogItems = (manifest.items || []).filter((it) => it && it.id && it.file);
    } catch (_) {
      catalogItems = [];
    }
    const creators = [...new Set((catalogItems || []).map((it) => it.creator))].sort();
    const select = $("catCreator");
    for (const creator of creators) {
      const option = document.createElement("option");
      option.value = creator;
      option.textContent = creator;
      select.appendChild(option);
    }
    renderWorn();
    renderCatalog();
    renderCustomize();
  }

  // 2016 avatar editor: pick a body part, then pick from the BrickColor palette.
  const COLOUR_BOXES = ["catColours", "czColours"];
  function buildColourPickers() {
    for (const id of COLOUR_BOXES) {
      const box = $(id);
      if (box && !box.childElementCount) buildColourPicker(box);
    }
    renderColours();
  }
  function buildColourPicker(box) {
    const parts = document.createElement("div");
    parts.className = "parts";
    BODY_SLOTS.forEach((slot, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "partBtn";
      const chip = document.createElement("span");
      chip.className = "chip";
      const label = document.createElement("span");
      label.className = "part";
      label.textContent = SLOT_SHORT[i];
      btn.append(chip, label);
      btn.addEventListener("click", () => { bodyPart = i; renderColours(); });
      parts.appendChild(btn);
    });
    const swatches = document.createElement("div");
    swatches.className = "swatches";
    for (const color of BRICK_COLORS) {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.className = "swatch";
      swatch.style.background = color.hex;
      swatch.dataset.n = String(color.n);
      swatch.title = color.name;
      swatch.setAttribute("aria-label", color.name);
      swatch.addEventListener("click", () => {
        avatar.body[bodyPart] = color.n;
        saveAvatar();
        renderColours();
      });
      swatches.appendChild(swatch);
    }
    box.append(parts, swatches);
  }

  function renderColours() {
    for (const id of COLOUR_BOXES) renderColourBox($(id));
  }
  function renderColourBox(box) {
    if (!box) return;
    const byNumber = new Map(BRICK_COLORS.map((c) => [c.n, c]));
    const partButtons = box.querySelectorAll(".partBtn");
    partButtons.forEach((btn, i) => {
      const color = byNumber.get(avatar.body[i]) || BRICK_COLORS[0];
      btn.querySelector(".chip").style.background = color.hex;
      btn.setAttribute("aria-pressed", i === bodyPart ? "true" : "false");
      btn.title = BODY_SLOTS[i] + ": " + color.name;
    });
    const current = String(avatar.body[bodyPart]);
    box.querySelectorAll(".swatch").forEach((swatch) => {
      swatch.setAttribute("aria-pressed", swatch.dataset.n === current ? "true" : "false");
    });
  }

  // ---------------------------------------------------- character customizer
  // The 2016 Avatar page: your inventory by category, what you're wearing,
  // body colours, Builders Club, and a front-view preview drawn from the real
  // clothing templates.
  const customizePage = $("customize");
  const CZ_TABS = [
    { id: "hat", label: "Hats" }, { id: "hair", label: "Hair" }, { id: "face", label: "Faces" },
    { id: "tshirt", label: "T-Shirts" }, { id: "shirt", label: "Shirts" }, { id: "pants", label: "Pants" },
    { id: "shoulder", label: "Shoulder" }, { id: "back", label: "Back" },
  ];
  let czTab = "hat";
  const BC_KEY = "rblx2016.bc";
  const BC_TIERS = [
    { n: 0, label: "None", icon: "" },
    { n: 1, label: "Builders Club", icon: "content/textures/ui/icon_BC-16.png" },
    { n: 2, label: "Turbo BC", icon: "content/textures/ui/icon_TBC-16.png" },
    { n: 3, label: "Outrageous BC", icon: "content/textures/ui/icon_OBC-16.png" },
  ];
  function bcTier() {
    let n = 0;
    try { n = Number(localStorage.getItem(BC_KEY)) || 0; } catch (_) {}
    return Math.max(0, Math.min(3, n));
  }
  function setBcTier(n) {
    try { localStorage.setItem(BC_KEY, String(n)); } catch (_) {}
    renderCustomize();
  }

  function wornList() {
    const worn = [];
    for (const kind of ["head", "shirt", "pants", "tshirt", "face"]) {
      const item = itemById(avatar[kind]);
      if (item) worn.push(item);
    }
    for (const id of avatar.accessories) {
      const item = itemById(id);
      if (item) worn.push(item);
    }
    return worn;
  }

  // 2016 wardrobe tile: framed thumbnail, name, and a "[ wear ]" link.
  function makeTile(item, worn, label) {
    const tile = document.createElement("div");
    tile.className = "czItem" + (worn ? " worn" : "");
    const frame = document.createElement("div");
    frame.className = "thumb";
    const img = document.createElement("img");
    img.loading = "lazy";
    img.alt = "";
    img.src = itemImage(item);
    frame.appendChild(img);
    const nm = document.createElement("div");
    nm.className = "nm";
    nm.textContent = item.name;
    nm.title = item.name;
    const act = document.createElement("button");
    act.type = "button";
    act.className = "act";
    act.textContent = "[ " + label + " ]";
    act.addEventListener("click", () => wear(item));
    tile.append(frame, nm, act);
    return tile;
  }

  // The classic "click a body part" diagram, then a BrickColor palette.
  const BODY_LAYOUT = [  // [slot index, left, top, width, height] in px
    [0, 62, 0, 44, 44],   // Head
    [2, 4, 48, 38, 80],   // Right arm (viewer's left)
    [3, 44, 48, 80, 80],  // Torso
    [1, 126, 48, 38, 80], // Left arm
    [5, 44, 130, 39, 62], // Right leg
    [4, 85, 130, 39, 62], // Left leg
  ];
  function renderBodyDiagram() {
    const body = $("czBody");
    const pal = $("czPalette");
    if (!body || !pal) return;
    if (!body.childElementCount) {
      for (const [slot, x, y, w, h] of BODY_LAYOUT) {
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.slot = String(slot);
        b.style.cssText = "left:" + x + "px;top:" + y + "px;width:" + w + "px;height:" + h + "px";
        b.title = BODY_SLOTS[slot];
        b.setAttribute("aria-label", BODY_SLOTS[slot]);
        b.addEventListener("click", () => { bodyPart = slot; renderBodyDiagram(); renderColours(); });
        body.appendChild(b);
      }
      for (const color of BRICK_COLORS) {
        const c = document.createElement("button");
        c.type = "button";
        c.setAttribute("role", "radio");
        c.dataset.n = String(color.n);
        c.style.background = color.hex;
        c.title = color.name;
        c.setAttribute("aria-label", color.name);
        c.addEventListener("click", () => {
          avatar.body[bodyPart] = color.n;
          saveAvatar();
          renderColours();
        });
        pal.appendChild(c);
      }
    }
    const hexOf = (n) => (BRICK_COLORS.find((c) => c.n === n) || { hex: "#a3a2a5" }).hex;
    for (const b of body.children) {
      const slot = Number(b.dataset.slot);
      b.style.background = hexOf(avatar.body[slot]);
      b.setAttribute("aria-pressed", slot === bodyPart ? "true" : "false");
    }
    for (const c of pal.children) c.setAttribute("aria-checked", Number(c.dataset.n) === avatar.body[bodyPart] ? "true" : "false");
  }

  // 2D (flat front view) or 3D (WebGL, drag to spin), like the 2016 toggle.
  const CZ_MODE_KEY = "rblx2016.czMode";
  let czMode = (() => { try { return localStorage.getItem(CZ_MODE_KEY) || "3d"; } catch (_) { return "3d"; } })();
  let viewer3d = null;
  let viewer3dFailed = false;
  function renderMode() {
    if (czMode === "3d" && !viewer3d && !viewer3dFailed && window.Avatar3D) {
      viewer3d = window.Avatar3D.create($("cz3d"));
      if (!viewer3d) viewer3dFailed = true;
    }
    const three = czMode === "3d" && viewer3d;
    $("cz3d").hidden = !three;
    $("czPreview").hidden = !!three;
    $("czHint").textContent = three ? "Drag to rotate · scroll to zoom"
      : (viewer3dFailed ? "3D needs WebGL; showing the flat view." : "Flat front view.");
    for (const b of document.querySelectorAll("#customize .czMode button")) {
      b.setAttribute("aria-pressed", b.dataset.mode === (three ? "3d" : "2d") ? "true" : "false");
    }
  }
  function setMode(mode) {
    czMode = mode;
    try { localStorage.setItem(CZ_MODE_KEY, mode); } catch (_) {}
    renderMode();
    update3d();
    drawPreview();
  }
  let update3dTimer = 0;
  function update3d() {
    if (!viewer3d || czMode !== "3d" || !customizePage.classList.contains("open")) return;
    clearTimeout(update3dTimer);
    update3dTimer = setTimeout(() => {
      const hexOf = (n) => (BRICK_COLORS.find((c) => c.n === n) || { hex: "#a3a2a5" }).hex;
      const accessories = avatar.accessories.map((id) => itemById(id)).filter(Boolean)
        .map((it) => "catalog/" + it.file);
      const item = (id) => (id ? "catalog/item/" + id : null);
      viewer3d.setAvatar({
        body: avatar.body.map(hexOf),
        shirt: item(avatar.shirt), pants: item(avatar.pants), tshirt: item(avatar.tshirt),
        face: avatar.face ? item(avatar.face) : "content/textures/face.png",
        accessories, brickHex: hexOf,
      });
    }, 30);
  }

  const CZ_PAGE = 12;
  let czPage = 0;
  function renderCustomize() {
    if (!customizePage || !customizePage.classList.contains("open")) return;
    const tabs = $("czTabs");
    if (!tabs.childElementCount) {
      for (const t of CZ_TABS) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "tab");
        b.dataset.id = t.id;
        b.textContent = t.label;
        b.addEventListener("click", () => { czTab = t.id; czPage = 0; renderCustomize(); });
        tabs.appendChild(b);
      }
    }
    for (const b of tabs.children) b.setAttribute("aria-selected", b.dataset.id === czTab ? "true" : "false");

    const bc = $("czBc");
    if (!bc.childElementCount) {
      for (const t of BC_TIERS) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "radio");
        b.dataset.n = String(t.n);
        if (t.icon) { const i = document.createElement("img"); i.src = t.icon; i.alt = ""; b.appendChild(i); }
        b.appendChild(document.createTextNode(t.label));
        b.addEventListener("click", () => setBcTier(t.n));
        bc.appendChild(b);
      }
    }
    const tier = bcTier();
    for (const b of bc.children) b.setAttribute("aria-checked", Number(b.dataset.n) === tier ? "true" : "false");
    const icon = $("czBcIcon");
    if (BC_TIERS[tier].icon) { icon.src = BC_TIERS[tier].icon; icon.hidden = false; } else icon.hidden = true;
    $("czNameText").textContent = (userName.value || "").trim() || "Player1";

    renderBodyDiagram();

    const wearing = $("czWearing");
    wearing.innerHTML = "";
    const worn = wornList();
    if (!worn.length) wearing.textContent = "You aren't wearing anything. Pick something from your wardrobe.";
    for (const item of worn) wearing.appendChild(makeTile(item, true, "remove"));

    const grid = $("czGrid");
    const note = $("czNote");
    const pager = $("czPager");
    grid.innerHTML = "";
    pager.innerHTML = "";
    if (!catalogItems) {
      note.style.display = "block";
      note.textContent = "Loading your wardrobe…";
    } else {
      const tab = CZ_TABS.find((t) => t.id === czTab);
      const mine = catalogItems.filter((it) => it.type === czTab && owns(it.id));
      if (!mine.length) {
        note.style.display = "block";
        note.textContent = "You don't have any " + tab.label.toLowerCase() +
          " yet. Everything in the Catalog is free.";
        const shop = document.createElement("button");
        shop.type = "button";
        shop.className = "btn";
        shop.textContent = "Shop " + tab.label;
        shop.addEventListener("click", () => {
          closeCustomize();
          catalogCategory = czTab;
          openCatalog();
        });
        note.appendChild(shop);
      } else {
        note.style.display = "none";
        const pages = Math.ceil(mine.length / CZ_PAGE);
        czPage = Math.max(0, Math.min(czPage, pages - 1));
        for (const item of mine.slice(czPage * CZ_PAGE, czPage * CZ_PAGE + CZ_PAGE)) {
          const on = isWorn(item);
          grid.appendChild(makeTile(item, on, on ? "remove" : "wear"));
        }
        if (pages > 1) {
          const prev = document.createElement("button");
          prev.type = "button";
          prev.textContent = "« Previous";
          prev.disabled = czPage === 0;
          prev.addEventListener("click", () => { czPage--; renderCustomize(); });
          const label = document.createElement("span");
          label.textContent = "Page " + (czPage + 1) + " of " + pages;
          const next = document.createElement("button");
          next.type = "button";
          next.textContent = "Next »";
          next.disabled = czPage >= pages - 1;
          next.addEventListener("click", () => { czPage++; renderCustomize(); });
          pager.append(prev, label, next);
        }
      }
    }
    renderMode();
    update3d();
    drawPreview();
  }

  // Front view of an R6 character: body colours, then the front faces of the
  // pants and shirt templates (standard 585x559 layout), the t-shirt and face.
  const previewImages = new Map();
  function previewImage(src) {
    if (!src) return null;
    let img = previewImages.get(src);
    if (!img) {
      img = new Image();
      img.onload = () => drawPreview();
      img.src = src;
      previewImages.set(src, img);
    }
    return img.complete && img.naturalWidth ? img : null;
  }
  function drawPreview() {
    const cv = $("czPreview");
    if (!cv || !customizePage.classList.contains("open")) return;
    const g = cv.getContext("2d");
    g.clearRect(0, 0, cv.width, cv.height);
    const hex = (n) => (BRICK_COLORS.find((c) => c.n === n) || { hex: "#a3a2a5" }).hex;
    const s = 44;
    const headSize = Math.round(1.15 * s);
    const totalH = headSize + 2 + 4 * s;
    const ox = (cv.width - 4 * s) / 2;
    const oy = (cv.height - totalH) / 2;
    const ty = oy + headSize + 2;
    const R = {
      torso: { x: ox + s, y: ty, w: 2 * s, h: 2 * s },
      rArm: { x: ox, y: ty, w: s, h: 2 * s },          // character's right = viewer's left
      lArm: { x: ox + 3 * s, y: ty, w: s, h: 2 * s },
      rLeg: { x: ox + s, y: ty + 2 * s, w: s, h: 2 * s },
      lLeg: { x: ox + 2 * s, y: ty + 2 * s, w: s, h: 2 * s },
    };
    const head = { x: ox + 2 * s - headSize / 2, y: oy, w: headSize, h: headSize };
    const b = avatar.body;  // [Head, LArm, RArm, Torso, LLeg, RLeg]
    const fill = (r, c) => { g.fillStyle = c; g.fillRect(r.x, r.y, r.w, r.h); };
    fill(R.rArm, hex(b[2])); fill(R.lArm, hex(b[1])); fill(R.torso, hex(b[3]));
    fill(R.rLeg, hex(b[5])); fill(R.lLeg, hex(b[4]));
    g.fillStyle = hex(b[0]);
    const rr = 9;
    g.beginPath();
    g.moveTo(head.x + rr, head.y);
    g.arcTo(head.x + head.w, head.y, head.x + head.w, head.y + head.h, rr);
    g.arcTo(head.x + head.w, head.y + head.h, head.x, head.y + head.h, rr);
    g.arcTo(head.x, head.y + head.h, head.x, head.y, rr);
    g.arcTo(head.x, head.y, head.x + head.w, head.y, rr);
    g.closePath();
    g.fill();
    const blit = (img, sx, sy, sw, sh, r) => {
      const kx = img.naturalWidth / 585, ky = img.naturalHeight / 559;
      g.drawImage(img, sx * kx, sy * ky, sw * kx, sh * ky, r.x, r.y, r.w, r.h);
    };
    const pants = avatar.pants ? previewImage("catalog/item/" + avatar.pants) : null;
    if (pants) {
      blit(pants, 231, 74, 128, 128, R.torso);
      blit(pants, 217, 355, 64, 128, R.rLeg);
      blit(pants, 308, 355, 64, 128, R.lLeg);
    }
    const shirt = avatar.shirt ? previewImage("catalog/item/" + avatar.shirt) : null;
    if (shirt) {
      blit(shirt, 231, 74, 128, 128, R.torso);
      blit(shirt, 217, 355, 64, 128, R.rArm);
      blit(shirt, 308, 355, 64, 128, R.lArm);
    }
    const tee = avatar.tshirt ? previewImage("catalog/item/" + avatar.tshirt) : null;
    if (tee) g.drawImage(tee, R.torso.x + 10, R.torso.y + 10, R.torso.w - 20, R.torso.h - 20);
    const face = previewImage(avatar.face ? "catalog/item/" + avatar.face : "content/textures/face.png");
    if (face) g.drawImage(face, head.x, head.y, head.w, head.h);
    const extras = avatar.accessories.length;
    if (extras) {
      g.fillStyle = "#4c5c6d";
      g.font = "12px 'Segoe UI', sans-serif";
      g.textAlign = "center";
      g.fillText("+ " + extras + (extras === 1 ? " accessory" : " accessories"), cv.width / 2, cv.height - 6);
    }
  }

  function openCustomize() {
    if (catalogPage.classList.contains("open")) closeCatalog();
    customizePage.classList.add("open");
    buildColourPickers();
    renderCustomize();
    loadCatalog();
  }
  function closeCustomize() {
    customizePage.classList.remove("open");
  }

  // ------------------------------------------------- ported 2016 site pages
  // site2016/catalog.html and character.html share this page's saved avatar
  // (localStorage) and tell us when it changes or when to close.
  // site2016/ is the 2016 roblox.com rebuilt as BLOXRO. Without ?play,
  // ?studio etc. it is the whole menu (index.html#/games.html ...); the old
  // browser-owned menu (#login) stays underneath as the engine's control panel
  // and as ?classic=1.
  const SITE_PAGE = /^(home|games|game|develop|catalog|character|profile|inventory|settings|info)\.html(\?[^#]*)?$/;
  let siteMode = false;
  function siteRouteFromHash() {
    let h = "";
    h = location.hash.replace(/^#\/?/, "");  // kept percent-encoded, as the frame's URL is
    return SITE_PAGE.test(h) ? h : "home.html";
  }
  function openSite(page) {
    const url = /\.html/.test(page) ? page : page + ".html";
    $("siteFrame").src = "site2016/" + url;
    $("siteOverlay").hidden = false;
  }
  function closeSite() {
    if (siteMode) { openSite("home"); return; }
    $("siteOverlay").hidden = true;
    $("siteFrame").src = "about:blank";
    reloadAvatarFromStorage();
  }
  function reloadAvatarFromStorage() {
    avatar = loadAvatar();
    inventory.clear();
    for (const id of loadInventory()) inventory.add(id);
    renderWorn();
    renderCatalog();
    renderCustomize();
  }
  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin || !e.data || !e.data.rblx2016) return;
    if (e.data.rblx2016 === "close") closeSite();
    else if (e.data.rblx2016 === "avatar") reloadAvatarFromStorage();
  });
  // Keep the address bar on the page being shown, so a reload (or leaving a
  // game, which reloads) comes back to it.
  function syncSiteHash() {
    if (!siteMode || playing) return;
    let w = null;
    try { w = $("siteFrame").contentWindow; } catch (_) {}
    if (!w) return;
    let path = "";
    try { path = w.location.pathname + w.location.search; } catch (_) { return; }
    const m = /\/site2016\/([a-z]+\.html(?:\?[^#]*)?)$/.exec(path);
    if (!m) return;
    const hash = m[1] === "home.html" ? "" : "#/" + m[1];
    try { history.replaceState(null, "", location.pathname + location.search + hash); } catch (_) {}
    try { if (w.document.title) document.title = w.document.title; } catch (_) {}
  }
  // What the website pages may ask of the engine page (same origin only).
  function sitePlace(p) {
    return { id: p.id, name: p.name, kind: p.kind, size: p.size || 0,
      file: p.kind === "bundled" ? p.id.slice(6) : "", mineId: p.mineId || "" };
  }
  let placesReady = null;
  window.RBLX2016_SITE = {
    places: () => places.map(sitePlace),
    ready: () => placesReady || Promise.resolve(),
    refresh: () => (placesReady = loadPlaces()),
    canPlay: () => hasWebGL2(),
    busy: () => playing,
    relay: () => defaultRelay(),
    // opts.server: {room} joins that multiplayer server once; opts.solo: no
    // multiplayer even if it's switched on; opts.onStatus(text, isError).
    play(id, opts) {
      opts = opts || {};
      if (playing) return false;
      const p = places.find((x) => x.id === id);
      if (!p) return false;
      selected = p;
      renderPlaces();
      mpOverride = opts.server ? { room: opts.server.room } : opts.solo ? null : undefined;
      siteStatusHook = typeof opts.onStatus === "function" ? opts.onStatus : null;
      play();
      return true;
    },
    // A .rbxl from the visitor's computer; resolves to its place id.
    openFile(file) {
      return new Promise((resolve, reject) => {
        if (!file) { reject(new Error("No file.")); return; }
        if (file.size > MAX_PLACE_BYTES) {
          reject(new Error("Place file is too large (limit " + (MAX_PLACE_BYTES / 1024 / 1024) + " MB).")); return;
        }
        file.arrayBuffer().then((buf) => {
          const p = { id: "local:" + file.name, name: file.name.replace(/\.(rbxlx?|rbxm|xml)$/i, ""),
            kind: "local", size: buf.byteLength, bytes: new Uint8Array(buf), local: true };
          const old = places.findIndex((x) => x.id === p.id);
          if (old >= 0) places.splice(old, 1);
          places.unshift(p);
          renderPlaces();
          resolve(p.id);
        }, reject);
      });
    },
    // Settings live on the old menu's controls, so the engine reads them as before.
    control: (id) => (/^(userName|ui2017|unlockFps|lightGrid|gles2Shaders|showDiag|cookieInput|cookieSave|cookieClear|cookieState|cookieNote|mpRelay|mpEnable|mpRoom)$/.test(id) ? $(id) : null),
  };

  function openCatalog() {
    catalogPage.classList.add("open");
    renderWorn();
    renderCatalog();
    loadCatalog();
  }

  function closeCatalog() {
    catalogPage.classList.remove("open");
    closeDetail();
  }

  async function boot() {
    if (MP_SERVER_MODE) { document.title = "game server"; hostMain(); return; }
    window.RBLX2016_CORE = { ensureModule, configureAssetProxy, applyRenderOptions, isEngineTrap, engineCrashed,
      fetchPlaceList, readFileBytes, brandName };
    if (new URLSearchParams(location.search).has("studio") && window.BloxroStudio) {
      login.style.display = "none";
      window.BloxroStudio.boot(window.RBLX2016_CORE);
      return;
    }
    try { userName.value = localStorage.getItem("rblx2016.name") || "Player1"; } catch (_) {}
    try { unlockFps.checked = localStorage.getItem("rblx2016.unlockFps") === "1"; } catch (_) {}
    try { ui2017.checked = localStorage.getItem("rblx2016.ui2017") === "1"; } catch (_) {}
    ui2017.addEventListener("change", () => {
      try { localStorage.setItem("rblx2016.ui2017", ui2017.checked ? "1" : "0"); } catch (_) {}
    });
    unlockFps.addEventListener("change", () => {
      try { localStorage.setItem("rblx2016.unlockFps", unlockFps.checked ? "1" : "0"); } catch (_) {}
    });
    // Multiplayer settings
    const mpEnable = $("mpEnable"), mpRoom = $("mpRoom"), mpRelay = $("mpRelay");
    if (mpEnable && mpRoom && mpRelay) {
      try { mpEnable.checked = localStorage.getItem("rblx2016.mp") === "1"; } catch (_) {}
      try { mpRoom.value = localStorage.getItem("rblx2016.mpRoom") || ""; } catch (_) {}
      try { mpRelay.value = localStorage.getItem("rblx2016.mpRelay") || ""; } catch (_) {}
      mpEnable.addEventListener("change", () => {
        try { localStorage.setItem("rblx2016.mp", mpEnable.checked ? "1" : "0"); } catch (_) {}
      });
      mpRoom.addEventListener("input", () => {
        try { localStorage.setItem("rblx2016.mpRoom", mpRoom.value.trim()); } catch (_) {}
      });
      mpRelay.addEventListener("input", () => {
        try { localStorage.setItem("rblx2016.mpRelay", mpRelay.value.trim()); } catch (_) {}
      });
    }
    userName.addEventListener("input", saveName);
    userName.addEventListener("blur", saveName);
    openFile.addEventListener("change", () => openLocalFile(openFile.files[0]));
    // Catalog / Customize open the ported 2016 roblox.com pages in an overlay.
    $("catalogBtn").addEventListener("click", () => openSite("catalog"));
    $("catClose").addEventListener("click", closeCatalog);
    $("catSearch").addEventListener("input", () => {
      catalogQuery = $("catSearch").value.trim();
      renderCatalog();
    });
    $("catCreator").addEventListener("change", () => {
      catalogCreator = $("catCreator").value;
      renderCatalog();
    });
    $("catWear").addEventListener("click", () => { if (detailItem) wear(detailItem); });
    $("catDetailClose").addEventListener("click", closeDetail);
    $("catGet").addEventListener("click", () => {
      if (!detailItem) return;
      addToInventory(detailItem.id);
      renderDetail();
      renderCatalog();
      renderCustomize();
    });
    $("customizeBtn").addEventListener("click", () => openSite("character"));
    $("czClose").addEventListener("click", closeCustomize);
    $("czToCatalog").addEventListener("click", () => { closeCustomize(); openCatalog(); });
    $("catToCustomize").addEventListener("click", openCustomize);
    for (const b of document.querySelectorAll("#customize .czMode button")) {
      b.addEventListener("click", () => setMode(b.dataset.mode));
    }
    $("czShopLink").addEventListener("click", (e) => {
      e.preventDefault();
      closeCustomize();
      catalogCategory = czTab;
      openCatalog();
    });
    $("catDetail").addEventListener("click", (e) => {
      if (e.target === $("catDetail")) closeDetail();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if ($("catDetail").classList.contains("open")) closeDetail();
      else if (catalogPage.classList.contains("open")) closeCatalog();
    });
    buildColourPickers();
    installRenderOptions();
    updateDiag();
    renderWorn();
    loadCatalog();  // keeps the "Wearing:" line on the menu in sync
    $("openFileBtn").addEventListener("click", () => openFile.click());
    $("refreshPlaces").addEventListener("click", () => loadPlaces());
    $("placeSearch").addEventListener("input", () => renderPlaces());
    $("placeSearch").addEventListener("keydown", (e) => {
      // Enter plays the first match.
      if (e.key !== "Enter") return;
      const first = places.find(placeVisible);
      if (first) { selected = first; renderPlaces(); play(); }
    });
    playBtn.addEventListener("click", play);
    $("fatalBack").addEventListener("click", () => { location.reload(); });
    login.addEventListener("dragover", (e) => { e.preventDefault(); login.classList.add("drag"); });
    login.addEventListener("dragleave", () => login.classList.remove("drag"));
    login.addEventListener("drop", (e) => {
      e.preventDefault();
      login.classList.remove("drag");
      openLocalFile(e.dataTransfer.files[0]);
    });
    document.addEventListener("dragover", (e) => e.preventDefault());
    document.addEventListener("drop", (e) => e.preventDefault());
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !playing && document.activeElement === userName) play();
    });

    if (!hasWebGL2()) {
      $("webglWarn").style.display = "block";
      playBtn.disabled = true;
    }
    renderPlaces();
    {
      const sq = new URLSearchParams(location.search);
      siteMode = !SHELL_MODE && !RENDER_MODE && !XBOX_FLOW &&
        !["play", "test", "suite", "classic", "embed"].some((k) => sq.has(k));
      if (siteMode) {
        $("siteFrame").addEventListener("load", syncSiteHash);
        window.addEventListener("hashchange", () => {
          const want = siteRouteFromHash();
          let have = "";
          try { have = $("siteFrame").contentWindow.location.pathname.split("/site2016/")[1] + $("siteFrame").contentWindow.location.search; } catch (_) {}
          if (want !== have && !(want === "home.html" && /^home\.html/.test(have))) openSite(want);
        });
        openSite(siteRouteFromHash());
      }
    }
    placesReady = loadPlaces();
    await placesReady;
    installCookieUi();
    window.RBLX2016_MENU = { play, stop, places };
    // The engine menu's Leave button (Exit verb) calls this. Reload instead of
    // re-initializing the engine in place: the native client also leaves the
    // game client entirely, and a fresh page avoids stale Lua/RunService state.
    window.rblxLeaveGame = () => { location.reload(); };

    // ?play=<place file> starts that place right away (the Xbox menu's Play
    // button links here); with &from=xbox, leaving the game returns there.
    const q = new URLSearchParams(location.search);
    if (SHELL_MODE && !playBtn.disabled) {
      let rendered = null;
      try { rendered = localStorage.getItem("rblx2016.xbox.avatarRendered"); } catch (_) {}
      // Hidden tabs can't render, so a background boot doesn't start the job.
      if (rendered !== avatarRenderKey() && !q.has("norender") && document.visibilityState === "visible") {
        // On a static host the picture is kept by the service worker; on a
        // first visit, give it a moment to take control before rendering.
        const sw = navigator.serviceWorker;
        if (sw && !sw.controller && !/^(127\.0\.0\.1|localhost|\[::1\])$/.test(location.hostname)) {
          await Promise.race([
            new Promise((r) => sw.addEventListener("controllerchange", r, { once: true })),
            new Promise((r) => setTimeout(r, 5000)),
          ]);
        }
        location.replace("?render=avatar" + returnGameParam()); return;
      }
    }
    const autoPlay = q.get("play") || (SHELL_MODE ? "shell" : null) || (RENDER_MODE ? "render" : null);
    if (autoPlay && !playBtn.disabled) {
      // The shell runs over its own 3D world (PlatformContent/durango ScaledWorld);
      // the avatar render job over an empty scene.
      const p = SHELL_MODE
        ? { id: "shell:world", name: "BLOXRO for Xbox", kind: "shell", src: "xboxshell/ScaledWorld.rbxl", bytes: null }
        : RENDER_MODE
          ? { id: "render:avatar", name: "Avatar render", kind: "shell", src: "xboxrender/AvatarRender.rbxlx", bytes: null }
          : places.find((x) => x.id === autoPlay || x.id === "place:" + autoPlay);
      if (p) {
        selected = p;
        renderPlaces();
        if (q.get("from") === "studio" && p.mineId) {
          // Playtest from Bloxro Studio: leaving (or Stop) goes back to editing.
          const back = () => { location.href = "?studio=" + encodeURIComponent(p.mineId) + (q.get("mute") ? "&mute=1" : ""); };
          window.rblxLeaveGame = back;
          const stopBtn = document.createElement("button");
          stopBtn.type = "button";
          stopBtn.id = "studioStop";
          stopBtn.textContent = "■ Stop";
          stopBtn.title = "Stop testing and go back to Studio";
          stopBtn.style.cssText = "position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:200;padding:5px 14px;" +
            "font:600 13px 'Segoe UI',system-ui,sans-serif;color:#fff;background:#c0392b;border:1px solid #8e2a1f;border-radius:4px;cursor:pointer;opacity:.9";
          stopBtn.addEventListener("click", back);
          document.body.appendChild(stopBtn);
        }
        if (q.get("from") === "xbox") window.rblxLeaveGame = () => {
          // Back to the game's page in the menu, like the console app.
          const game = Number(q.get("game")) || 0;
          location.href = "?shell=xbox" + (game ? "&game=" + game : "");
        };
        play();
      } else {
        setStatus("That game isn't in the place list.", true);
      }
    }

    // Warm the 70 MB wasm + 107 MB content pack while the user is still on the
    // menu, so pressing Play only pays for the place itself.
    if (!playBtn.disabled) {
      const warm = () => { ensureModule().catch(() => {}); };
      if ("requestIdleCallback" in window) requestIdleCallback(warm, { timeout: 2500 });
      else setTimeout(warm, 500);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
