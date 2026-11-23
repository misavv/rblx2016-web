/* Bloxro Studio: a small edit-mode Studio around the 2016 engine.
 *
 * ?studio            start page (My Games, new baseplate, open a file)
 * ?studio=<gameId>   edit that game
 *
 * The engine runs the place in edit mode (port/src/WebClient/studio.cpp:
 * no physics, no game scripts, no player) and answers text commands. The
 * editor itself (camera, picking, gizmos, Explorer, Properties, scripts) is
 * this file; object work is done by a small Lua library (STUDIO_LUA) that
 * the engine runs at the Studio command-bar identity.
 *
 * Games are kept in IndexedDB as binary .rbxl (BloxroGames). Play saves the
 * game and starts it like any other place (?play=mine:<id>&from=studio);
 * leaving the game comes back here.
 */
(function () {
  "use strict";

  // ------------------------------------------------------------- My Games
  const DB_NAME = "bloxro-games", STORE = "games";
  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE, { keyPath: "id" }); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function tx(mode, fn) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const store = t.objectStore(STORE);
      let result;
      Promise.resolve(fn(store)).then((r) => { result = r; });
      t.oncomplete = () => { db.close(); resolve(result); };
      t.onerror = () => { db.close(); reject(t.error); };
    });
  }
  const reqP = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const Games = {
    async list() {
      try {
        const all = await tx("readonly", (s) => reqP(s.getAll()));
        return (all || []).map((g) => ({ id: g.id, name: g.name, size: g.size, updated: g.updated }))
          .sort((a, b) => b.updated - a.updated);
      } catch (_) { return []; }
    },
    get(id) { return tx("readonly", (s) => reqP(s.get(id))); },
    put(game) {
      game.updated = Date.now();
      game.size = game.bytes ? game.bytes.length : 0;
      return tx("readwrite", (s) => reqP(s.put(game)));
    },
    del(id) { return tx("readwrite", (s) => reqP(s.delete(id))); },
    newId() { return "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },
  };
  window.BloxroGames = Games;

  // ------------------------------------------------------------- Lua side
  const STUDIO_LUA = String.raw`
local BS = {}
_G.BS = BS
local Http = game:GetService("HttpService")
for _, n in ipairs({"StarterGui","StarterPack","StarterPlayer","ServerScriptService","ServerStorage",
    "ReplicatedStorage","ReplicatedFirst","Teams","SoundService","Chat"}) do
  pcall(function() game:GetService(n) end)
end
local function enc(t) return Http:JSONEncode(t) end
BS.enc = enc
local function parts(objs)
  local out, seen = {}, {}
  local function add(o)
    if o:IsA("BasePart") and not o:IsA("Terrain") and not seen[o] then seen[o] = true; out[#out+1] = o end
    for _, c in ipairs(o:GetChildren()) do add(c) end
  end
  for _, o in ipairs(objs) do add(o) end
  return out
end
BS.parts = parts
local function cfa(cf) return {cf:components()} end
function BS.box(o)
  if o:IsA("BasePart") and not o:IsA("Terrain") then
    return {cf = cfa(o.CFrame), size = {o.Size.X, o.Size.Y, o.Size.Z}, part = true}
  end
  local ps = parts({o})
  if #ps == 0 then return false end
  local inf = math.huge
  local mnx, mny, mnz, mxx, mxy, mxz = inf, inf, inf, -inf, -inf, -inf
  for _, p in ipairs(ps) do
    local cf, s = p.CFrame, p.Size / 2
    for _, sx in ipairs({-1, 1}) do for _, sy in ipairs({-1, 1}) do for _, sz in ipairs({-1, 1}) do
      local w = cf * Vector3.new(s.X * sx, s.Y * sy, s.Z * sz)
      if w.X < mnx then mnx = w.X end; if w.Y < mny then mny = w.Y end; if w.Z < mnz then mnz = w.Z end
      if w.X > mxx then mxx = w.X end; if w.Y > mxy then mxy = w.Y end; if w.Z > mxz then mxz = w.Z end
    end end end
  end
  return {cf = {(mnx+mxx)/2, (mny+mxy)/2, (mnz+mxz)/2, 1,0,0, 0,1,0, 0,0,1}, size = {mxx-mnx, mxy-mny, mxz-mnz}}
end
function BS.boxes(...)
  local t = {}
  for i, o in ipairs({...}) do
    local ok, b = pcall(BS.box, o)
    t[i] = ok and b or false
  end
  return enc(t)
end
-- Ray from the camera. mode "select": skip Locked parts and Terrain.
function BS.ray(ox, oy, oz, dx, dy, dz, mode, ...)
  local ign = {...}
  local ray = Ray.new(Vector3.new(ox, oy, oz), Vector3.new(dx, dy, dz) * 4000)
  for _ = 1, 32 do
    local hit, pos, nrm = workspace:FindPartOnRayWithIgnoreList(ray, ign)
    if not hit then return nil, "null" end
    if mode == "select" and (hit:IsA("Terrain") or hit.Locked) then
      ign[#ign+1] = hit
    else
      nrm = nrm or Vector3.new(0, 1, 0)
      local top = hit
      if mode == "select" then
        while top.Parent and top.Parent ~= workspace and top.Parent:IsA("Model") do top = top.Parent end
      end
      return hit, enc({pos.X, pos.Y, pos.Z, nrm.X, nrm.Y, nrm.Z}), top
    end
  end
  return nil, "null"
end
function BS.begin(...)
  BS.objs = {...}
  BS.orig = {}
  for _, p in ipairs(parts(BS.objs)) do BS.orig[#BS.orig+1] = {p, p.CFrame, p.Size} end
  return #BS.orig
end
function BS.xform(dx, dy, dz, ax, ay, az, deg, px, py, pz)
  local rot = CFrame.new()
  if deg ~= 0 then rot = CFrame.fromAxisAngle(Vector3.new(ax, ay, az), math.rad(deg)) end
  local pivot, d = Vector3.new(px, py, pz), Vector3.new(dx, dy, dz)
  for _, e in ipairs(BS.orig) do
    e[1].CFrame = (rot * (e[2] - pivot)) + pivot + d
  end
  return BS.boxes(unpack(BS.objs))
end
function BS.resize(axis, sign, delta)
  local e = BS.orig[1]
  if not e then return "[]" end
  local p, cf, s = e[1], e[2], e[3]
  local a = {s.X, s.Y, s.Z}
  local min = 0.2
  local nv = math.max(min, a[axis] + delta)
  local real = nv - a[axis]
  a[axis] = nv
  pcall(function() p.FormFactor = Enum.FormFactor.Custom end)
  if p:IsA("Part") and p.Shape == Enum.PartType.Ball then a = {nv, nv, nv} end
  p.Size = Vector3.new(a[1], a[2], a[3])
  local off = {0, 0, 0}
  off[axis] = sign * real / 2
  p.CFrame = cf * CFrame.new(off[1], off[2], off[3])
  return BS.boxes(unpack(BS.objs))
end
function BS.newPart(kind, ox, oy, oz, dx, dy, dz)
  local p
  if kind == "Wedge" then p = Instance.new("WedgePart")
  elseif kind == "Corner" then p = Instance.new("CornerWedgePart")
  elseif kind == "Truss" then p = Instance.new("TrussPart")
  elseif kind == "Spawn" then p = Instance.new("SpawnLocation")
  elseif kind == "Seat" then p = Instance.new("Seat")
  else
    p = Instance.new("Part")
    if kind == "Ball" then p.Shape = Enum.PartType.Ball; pcall(function() p.FormFactor = Enum.FormFactor.Custom end); p.Size = Vector3.new(2, 2, 2)
    elseif kind == "Cylinder" then p.Shape = Enum.PartType.Cylinder; pcall(function() p.FormFactor = Enum.FormFactor.Custom end); p.Size = Vector3.new(2, 2, 2) end
  end
  p.Anchored = true
  BS.place(p, ox, oy, oz, dx, dy, dz)
  p.Parent = workspace
  return p
end
-- Puts a new object where the camera looks, resting on what is there.
function BS.place(o, ox, oy, oz, dx, dy, dz)
  local origin, dir = Vector3.new(ox, oy, oz), Vector3.new(dx, dy, dz)
  local hit, pos = workspace:FindPartOnRay(Ray.new(origin, dir * 1000))
  local b = BS.box(o)
  local h = b and b.size[2] or 1
  local target = hit and (pos + Vector3.new(0, h / 2, 0)) or (origin + dir * 20)
  if o:IsA("BasePart") then
    o.CFrame = CFrame.new(math.floor(target.X + 0.5), target.Y, math.floor(target.Z + 0.5))
  elseif o:IsA("Model") and b then
    BS.begin(o)
    local c = Vector3.new(b.cf[1], b.cf[2], b.cf[3])
    BS.xform(target.X - c.X, target.Y - c.Y, target.Z - c.Z, 0, 1, 0, 0, 0, 0, 0)
  end
end
function BS.insert(cls, parent, ox, oy, oz, dx, dy, dz)
  local o = Instance.new(cls)
  if cls == "ModuleScript" then o.Source = "local module = {}\n\nreturn module\n"
  elseif o:IsA("BaseScript") then o.Source = 'print("Hello world!")\n' end
  if o:IsA("BasePart") then
    o.Anchored = true
    BS.place(o, ox, oy, oz, dx, dy, dz)
    if not parent or not (parent:IsA("Model") or parent:IsA("Folder") or parent == workspace) then parent = workspace end
  end
  o.Parent = parent or workspace
  return o
end
function BS.delete(...)
  for _, o in ipairs({...}) do pcall(function() o.Parent = nil end) end
end
function BS.duplicate(...)
  local out = {}
  for _, o in ipairs({...}) do
    local ok, c = pcall(function() return o:Clone() end)
    if ok and c then c.Parent = o.Parent; out[#out+1] = c end
  end
  return unpack(out)
end
BS.clip = {}
function BS.copy(...)
  BS.clip = {}
  for _, o in ipairs({...}) do
    local ok, c = pcall(function() return o:Clone() end)
    if ok and c then BS.clip[#BS.clip+1] = c end
  end
  return #BS.clip
end
function BS.paste(parent)
  local out = {}
  for _, c in ipairs(BS.clip) do
    local n = c:Clone()
    n.Parent = parent or workspace
    out[#out+1] = n
  end
  return unpack(out)
end
function BS.group(...)
  local objs = {...}
  if #objs == 0 then return nil end
  local m = Instance.new("Model")
  m.Parent = objs[1].Parent
  for _, o in ipairs(objs) do o.Parent = m end
  return m
end
function BS.ungroup(...)
  local out = {}
  for _, m in ipairs({...}) do
    if m:IsA("Model") or m:IsA("Folder") then
      local p = m.Parent
      for _, c in ipairs(m:GetChildren()) do c.Parent = p; out[#out+1] = c end
      m.Parent = nil
    end
  end
  return unpack(out)
end
function BS.setParent(target, ...)
  for _, o in ipairs({...}) do
    if o ~= target and not o:IsAncestorOf(target) then pcall(function() o.Parent = target end) end
  end
end
function BS.setAll(prop, value, ...)
  for _, o in ipairs({...}) do pcall(function() o[prop] = value end) end
end
function BS.camera()
  local c = workspace.CurrentCamera.CoordinateFrame
  local l = c.lookVector
  return enc({c.p.X, c.p.Y, c.p.Z, l.X, l.Y, l.Z})
end
function BS.info(o)
  return enc({name = o.Name, cls = o.ClassName, path = o:GetFullName()})
end
return "ready"
`;

  // ------------------------------------------------------------- styles
  const CSS = `
body.studio{ background:#2b2b2b; overflow:hidden; }
body.studio #login{ display:none !important; }
body.studio #view{ position:fixed; z-index:1; }
#studio{ position:fixed; inset:0; z-index:5; display:grid; font:12px/1.35 "Segoe UI", system-ui, sans-serif; color:#1b1b1b;
  grid-template-rows: 30px 86px 1fr 170px; grid-template-columns: 1fr 300px; background:transparent; pointer-events:none; }
#studio > *{ pointer-events:auto; }
#stTitle{ grid-column:1/3; display:flex; align-items:center; gap:8px; background:#1f4e86; color:#fff; padding:0 10px; }
#stTitle .logo{ font-weight:800; letter-spacing:.5px; }
#stTitle input{ background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.25); color:#fff; font:inherit; padding:2px 6px; border-radius:3px; width:220px; }
#stTitle .sp{ flex:1; }
#stTitle button{ background:transparent; border:1px solid rgba(255,255,255,.3); color:#fff; padding:2px 9px; border-radius:3px; cursor:pointer; font:inherit; }
#stTitle button:hover{ background:rgba(255,255,255,.15); }
#stTitle button:disabled{ opacity:.4; cursor:default; }
#stSaved{ opacity:.75; font-size:11px; }
#stRibbon{ grid-column:1/3; display:flex; align-items:stretch; background:#fbfbfb; border-bottom:1px solid #c9c9c9; padding:4px 6px; gap:2px; overflow-x:auto; }
.rbGroup{ display:flex; flex-direction:column; border-right:1px solid #ddd; padding:0 6px; }
.rbGroup .rbItems{ display:flex; gap:2px; flex:1; align-items:center; }
.rbGroup .rbLabel{ text-align:center; color:#6b6b6b; font-size:10.5px; padding-top:2px; }
.rb{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; min-width:48px; height:56px; padding:2px 5px;
  border:1px solid transparent; background:transparent; border-radius:3px; cursor:pointer; font:inherit; color:#1b1b1b; }
.rb:hover{ background:#e5f1fb; border-color:#cce4f7; }
.rb.on{ background:#cce4f7; border-color:#7eb4ea; }
.rb .ic{ width:26px; height:26px; display:flex; align-items:center; justify-content:center; font-size:19px; line-height:1; }
.rb.small{ height:26px; flex-direction:row; min-width:0; gap:4px; }
.rb.small .ic{ width:16px; height:16px; font-size:14px; }
.rbCol{ display:flex; flex-direction:column; gap:2px; justify-content:center; }
.rbSnap{ display:flex; align-items:center; gap:4px; height:22px; }
.rbSnap input[type=number]{ width:46px; font:inherit; padding:1px 3px; }
.rb.play .ic{ color:#2c9b2c; }
#stCenter{ grid-row:3; grid-column:1; position:relative; display:flex; flex-direction:column; min-width:0; min-height:0; pointer-events:none; }
#stTabs{ display:flex; background:#dcdcdc; border-bottom:1px solid #bdbdbd; height:24px; pointer-events:auto; overflow-x:auto; }
#stTabs .tab{ padding:3px 10px; border-right:1px solid #c4c4c4; cursor:pointer; white-space:nowrap; display:flex; gap:6px; align-items:center; }
#stTabs .tab.on{ background:#fff; }
#stTabs .tab .x{ opacity:.55; } #stTabs .tab .x:hover{ opacity:1; }
#stViewport{ position:relative; flex:1; min-height:0; }
#stOverlay{ position:absolute; inset:0; width:100%; height:100%; pointer-events:auto; outline:none; }
#stLoading{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:#5b7fa6; color:#fff; font-size:15px; pointer-events:none; }
#stEditor{ position:absolute; inset:0; display:none; background:#fff; pointer-events:auto; }
#stEditor textarea{ width:100%; height:100%; border:0; resize:none; outline:none; padding:8px 10px; box-sizing:border-box;
  font:13px/1.45 Consolas, "Cascadia Mono", monospace; tab-size:4; white-space:pre; color:#000; background:#fff; }
#stHint{ position:absolute; left:8px; bottom:6px; color:#fff; text-shadow:0 1px 2px #000; font-size:11px; pointer-events:none; opacity:.85; }
#stRight{ grid-row:3/5; grid-column:2; display:flex; flex-direction:column; border-left:1px solid #bdbdbd; min-height:0; background:#fff; }
.pane{ display:flex; flex-direction:column; min-height:0; }
.paneHead{ background:#dcdcdc; padding:3px 8px; font-weight:600; border-bottom:1px solid #c4c4c4; display:flex; align-items:center; gap:6px; }
.paneHead input{ flex:1; font:inherit; padding:1px 4px; min-width:0; }
#stExplorer{ flex:1 1 50%; }
#stProps{ flex:1 1 50%; border-top:1px solid #bdbdbd; }
.paneBody{ overflow:auto; flex:1; min-height:0; }
.tnode{ display:flex; align-items:center; gap:3px; padding:1px 4px; white-space:nowrap; cursor:default; user-select:none; }
.tnode:hover{ background:#e5f1fb; }
.tnode.sel{ background:#cce4f7; }
.tnode.drop{ outline:1px dashed #1f6fd1; }
.tnode .tw{ width:12px; text-align:center; color:#555; font-size:9px; cursor:pointer; flex:none; }
.tnode .ci{ width:16px; height:14px; border-radius:3px; font-size:9px; font-weight:700; color:#fff; display:flex; align-items:center; justify-content:center; flex:none; }
.tnode input{ font:inherit; padding:0 2px; width:140px; }
.pcat{ background:#ececec; font-weight:600; padding:2px 6px; border-top:1px solid #ddd; cursor:pointer; user-select:none; }
.prow{ display:grid; grid-template-columns: 42% 58%; border-bottom:1px solid #f0f0f0; align-items:center; min-height:20px; }
.prow .pn{ padding:1px 6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#333; }
.prow .pv{ padding:1px 3px; display:flex; align-items:center; gap:4px; min-width:0; }
.prow .pv input[type=text], .prow .pv select{ width:100%; font:inherit; border:1px solid transparent; padding:1px 3px; background:transparent; min-width:0; }
.prow .pv input[type=text]:hover, .prow .pv select:hover{ border-color:#ccc; }
.prow .pv input[type=text]:focus{ border-color:#7eb4ea; background:#fff; outline:none; }
.prow.ro .pv input{ color:#888; }
.swatch{ width:14px; height:14px; border:1px solid #888; flex:none; }
#stBottom{ grid-row:4; grid-column:1; display:flex; flex-direction:column; border-top:1px solid #bdbdbd; background:#fff; min-height:0; }
#stOutput{ flex:1; overflow:auto; font:12px/1.4 Consolas, monospace; padding:3px 8px; white-space:pre-wrap; }
#stOutput .w{ color:#d07a00; } #stOutput .e{ color:#d01010; } #stOutput .i{ color:#1f6fd1; }
#stCmd{ display:flex; border-top:1px solid #ccc; }
#stCmd input{ flex:1; border:0; padding:4px 8px; font:12px Consolas, monospace; outline:none; }
#stMenu{ position:fixed; z-index:50; background:#fff; border:1px solid #aaa; box-shadow:2px 3px 8px rgba(0,0,0,.25); padding:3px 0; min-width:170px; display:none; }
#stMenu div{ padding:4px 16px; cursor:pointer; } #stMenu div:hover{ background:#cce4f7; }
#stMenu hr{ border:0; border-top:1px solid #ddd; margin:3px 0; }
#stModal{ position:fixed; inset:0; z-index:60; background:rgba(0,0,0,.35); display:none; align-items:center; justify-content:center; }
#stModal .box{ background:#fff; width:min(420px, calc(100vw - 32px)); max-height:80vh; display:flex; flex-direction:column; border-radius:4px; box-shadow:0 6px 30px rgba(0,0,0,.4); }
#stModal .box h3{ margin:0; padding:9px 12px; background:#1f4e86; color:#fff; font-size:13px; border-radius:4px 4px 0 0; }
#stModal .box input{ margin:8px 10px; font:inherit; padding:4px 6px; }
#stModal .list{ overflow:auto; flex:1; padding:0 6px 8px; }
#stModal .list div{ padding:3px 8px; cursor:pointer; display:flex; gap:6px; align-items:center; }
#stModal .list div:hover, #stModal .list div.on{ background:#cce4f7; }
#stStart{ position:fixed; inset:0; z-index:70; background:#e9e9e9; display:flex; flex-direction:column; font:13px "Segoe UI", system-ui, sans-serif; color:#1b1b1b; overflow:auto; }
#stStart header{ background:#1f4e86; color:#fff; padding:12px 18px; display:flex; align-items:center; gap:12px; }
#stStart header b{ font-size:17px; letter-spacing:.5px; } #stStart header a{ color:#fff; margin-left:auto; }
#stStart main{ padding:18px; max-width:980px; width:100%; box-sizing:border-box; margin:0 auto; }
#stStart h2{ font-size:14px; margin:16px 0 8px; color:#333; }
#stStart .row{ display:flex; gap:10px; flex-wrap:wrap; }
#stStart .card{ width:180px; background:#fff; border:1px solid #c9c9c9; border-radius:4px; cursor:pointer; overflow:hidden; display:flex; flex-direction:column; }
#stStart .card:hover{ border-color:#1f6fd1; box-shadow:0 2px 8px rgba(31,111,209,.25); }
#stStart .card .art{ height:96px; background:linear-gradient(#8fb4dc,#cfe0f1); display:flex; align-items:center; justify-content:center; font-size:34px; color:#fff; }
#stStart .card .nm{ padding:6px 8px 2px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
#stStart .card .sub{ padding:0 8px 6px; color:#777; font-size:11px; }
#stStart .card .acts{ display:flex; border-top:1px solid #eee; }
#stStart .card .acts button{ flex:1; border:0; background:none; padding:5px; cursor:pointer; font:inherit; color:#1f4e86; }
#stStart .card .acts button:hover{ background:#e5f1fb; }
#stStart .empty{ color:#777; }
@media (max-width: 760px){
  #studio{ grid-template-columns: 1fr; grid-template-rows: 30px 86px 1fr 120px 220px; }
  #stRight{ grid-row:5; grid-column:1; flex-direction:row; border-left:0; border-top:1px solid #bdbdbd; }
  #stExplorer, #stProps{ flex:1 1 50%; border-top:0; }
  #stTitle input{ width:120px; }
}
`;

  // ------------------------------------------------------------- helpers
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  function luaStr(s) {
    s = String(s);
    let eq = "";
    while ((s + "]").includes("]" + eq + "]")) eq += "=";
    return "[" + eq + "[\n" + s + "]" + eq + "]";
  }
  const num = (n) => (Number.isFinite(n) ? +n.toFixed(4) : 0);
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: (a) => Math.hypot(a[0], a[1], a[2]),
    norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  };
  const CLASS_COLORS = {
    Workspace: "#3f7fd0", Players: "#3a9b5c", Lighting: "#e0a800", Part: "#8a8a8a", Model: "#6b4fbf",
    Script: "#2f6fb8", LocalScript: "#2fa0b8", ModuleScript: "#7b5bb8", Folder: "#d9a43a", Camera: "#555",
    Terrain: "#4f8f3f", SpawnLocation: "#2f8f8f", Decal: "#c05ab0", Sound: "#c0603a",
  };
  function classBadge(cls) {
    const c = CLASS_COLORS[cls] || (/Part$|Seat$/.test(cls) ? "#8a8a8a" : /Light$/.test(cls) ? "#e0b000" :
      /Value$/.test(cls) ? "#5a7a9a" : /Gui|Frame|Label|Button|TextBox|Image/.test(cls) ? "#3a9bd0" :
      /Service$|Storage$|Starter|First$|Teams|Chat/.test(cls) ? "#4a6a8a" : "#7a8a9a");
    const b = el("span", "ci", cls.replace(/[^A-Z]/g, "").slice(0, 2) || cls.slice(0, 2));
    b.style.background = c;
    return b;
  }

  const INSERTABLE = ["Part", "WedgePart", "CornerWedgePart", "TrussPart", "SpawnLocation", "Seat", "VehicleSeat",
    "Model", "Folder", "Script", "LocalScript", "ModuleScript", "PointLight", "SpotLight", "SurfaceLight", "Fire",
    "Smoke", "Sparkles", "ParticleEmitter", "Sound", "Decal", "Texture", "SpecialMesh", "BlockMesh", "CylinderMesh",
    "ClickDetector", "Humanoid", "Tool", "HopperBin", "IntValue", "NumberValue", "StringValue", "BoolValue",
    "ObjectValue", "Vector3Value", "CFrameValue", "BrickColorValue", "Color3Value", "RemoteEvent", "RemoteFunction",
    "BindableEvent", "BindableFunction", "ScreenGui", "Frame", "TextLabel", "TextButton", "TextBox", "ImageLabel",
    "ImageButton", "ScrollingFrame", "BillboardGui", "SurfaceGui", "Weld", "Team", "Sky", "Configuration", "Attachment",
    "BodyVelocity", "BodyPosition", "BodyGyro", "BodyForce", "BodyAngularVelocity", "Hint", "Message", "Dialog",
    "SelectionBox", "Shirt", "Pants", "BodyColors", "Animation"];
  const SCRIPT_CLASSES = new Set(["Script", "LocalScript", "ModuleScript"]);

  // ------------------------------------------------------------- Studio
  let core = null, mod = null;
  let game = null;              // { id, name, bytes }
  const pending = new Map();
  let selection = [];           // [{id,name,cls,kids}]
  let boxes = [];               // boxes of the selection (from Lua)
  let tool = "select";
  let dirty = false;
  let ready = false;
  const cam = { pos: [0, 20, 40], yaw: 0, pitch: -0.3, fov: 70, sent: "" };
  const keys = new Set();
  const nodes = new Map();      // id -> node
  const kids = new Map();       // id -> [ids]
  const expanded = new Set([0]);
  const scripts = [];           // open script tabs {node, text, loaded}
  let activeTab = null;         // null = viewport
  let snapMove = 1, snapRot = 15, snapOn = true;
  let outputEl = null;

  function cmd(...fields) {
    return new Promise((resolve, reject) => {
      let id = 0;
      try { id = mod.ccall("rblx_studio_cmd", "number", ["string"], [fields.map(String).join("\x01")]); }
      catch (e) { reject(e); return; }
      pending.set(id, { resolve, reject });
    });
  }
  // Every chunk runs in a fresh thread; the library lives in the shared _G.
  const lua = (code, objs) => cmd("lua", "local BS = _G.BS; " + code, (objs || []).map((o) => o.id).join(","));
  const bs = (call, objs) => lua("return BS." + call, objs);
  async function bsJson(call, objs) {
    const r = await bs(call, objs);
    try { return JSON.parse(r[0]); } catch (_) { return null; }
  }
  function argList(objs) { return objs.map((_, i) => "select(" + (i + 1) + ", ...)").join(", "); }

  function log(text, kind) {
    if (!outputEl) return;
    const line = el("div", kind || "", text);
    outputEl.appendChild(line);
    while (outputEl.childNodes.length > 500) outputEl.removeChild(outputEl.firstChild);
    outputEl.scrollTop = outputEl.scrollHeight;
  }
  function onEngineLog(t) {
    const m = /^RBLX2016 (OUT|WARN|ERROR): ([\s\S]*)$/.exec(String(t));
    if (!m) return;
    if (/^RBLX2016[: ]/.test(m[2])) return;   // the port's own diagnostics
    log(m[2], m[1] === "ERROR" ? "e" : m[1] === "WARN" ? "w" : "");
  }
  function markDirty() {
    dirty = true;
    const s = $("stSaved");
    if (s) s.textContent = "Unsaved changes";
  }
  async function waypoint(name) {
    markDirty();
    try { updateUndo(await cmd("hist", "wp", name)); } catch (_) {}
  }
  function updateUndo(h) {
    if (!h) return;
    $("stUndo").disabled = !h.undo;
    $("stRedo").disabled = !h.redo;
  }

  // ------------------------------------------------------------- camera
  function camVectors() {
    const cp = Math.cos(cam.pitch);
    const fwd = [-Math.sin(cam.yaw) * cp, Math.sin(cam.pitch), -Math.cos(cam.yaw) * cp];
    const right = V.norm(V.cross(fwd, [0, 1, 0]));
    const up = V.cross(right, fwd);
    return { fwd, right, up };
  }
  function viewSize() {
    const o = $("stOverlay");
    return { w: o.clientWidth || 1, h: o.clientHeight || 1 };
  }
  function screenRay(x, y) {
    const { w, h } = viewSize();
    const { fwd, right, up } = camVectors();
    const t = Math.tan((cam.fov * Math.PI / 180) / 2);
    const nx = (2 * x / w - 1) * t * (w / h), ny = (1 - 2 * y / h) * t;
    return { o: cam.pos.slice(), d: V.norm(V.add(fwd, V.add(V.mul(right, nx), V.mul(up, ny)))) };
  }
  function project(p) {
    const { w, h } = viewSize();
    const { fwd, right, up } = camVectors();
    const v = V.sub(p, cam.pos);
    const z = V.dot(v, fwd);
    if (z < 0.05) return null;
    const t = Math.tan((cam.fov * Math.PI / 180) / 2);
    const x = V.dot(v, right) / (z * t * (w / h)), y = V.dot(v, up) / (z * t);
    return [(x + 1) / 2 * w, (1 - y) / 2 * h, z];
  }
  function sendCamera() {
    const { fwd } = camVectors();
    const tgt = V.add(cam.pos, V.mul(fwd, 10));
    const s = [...cam.pos, ...tgt].map(num).join("\x01") + "\x01" + cam.fov;
    if (s === cam.sent) return;
    cam.sent = s;
    cmd("cam", ...s.split("\x01")).catch(() => {});
  }
  let lastT = performance.now();
  function moveCamera() {
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;
    if (activeTab || document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const { fwd, right } = camVectors();
    let m = [0, 0, 0];
    if (keys.has("KeyW")) m = V.add(m, fwd);
    if (keys.has("KeyS")) m = V.sub(m, fwd);
    if (keys.has("KeyD")) m = V.add(m, right);
    if (keys.has("KeyA")) m = V.sub(m, right);
    if (keys.has("KeyE")) m = V.add(m, [0, 1, 0]);
    if (keys.has("KeyQ")) m = V.sub(m, [0, 1, 0]);
    if (m[0] || m[1] || m[2]) {
      const speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 10 : 40;
      cam.pos = V.add(cam.pos, V.mul(V.norm(m), speed * dt));
    }
  }
  function focusSelection() {
    if (!boxes.length) return;
    const g = gizmoBox();
    if (!g) return;
    const r = Math.max(4, V.len(g.half) * 2.2);
    const { fwd } = camVectors();
    cam.pos = V.sub(g.c, V.mul(fwd, r));
  }

  // ------------------------------------------------------------- boxes & gizmos
  function boxInfo(b) {
    const cf = b.cf;
    return {
      c: [cf[0], cf[1], cf[2]],
      ax: [[cf[3], cf[6], cf[9]], [cf[4], cf[7], cf[10]], [cf[5], cf[8], cf[11]]],
      half: [b.size[0] / 2, b.size[1] / 2, b.size[2] / 2],
      part: !!b.part,
    };
  }
  function corners(bi) {
    const out = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      out.push(V.add(bi.c, V.add(V.mul(bi.ax[0], bi.half[0] * sx), V.add(V.mul(bi.ax[1], bi.half[1] * sy), V.mul(bi.ax[2], bi.half[2] * sz)))));
    }
    return out;
  }
  // One box for the gizmo: the object's own box for a single selection,
  // the world box around everything otherwise.
  function gizmoBox() {
    const list = boxes.filter(Boolean).map(boxInfo);
    if (!list.length) return null;
    if (list.length === 1) return list[0];
    const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (const b of list) for (const p of corners(b)) for (let i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], p[i]); mx[i] = Math.max(mx[i], p[i]); }
    return { c: V.mul(V.add(mn, mx), 0.5), ax: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], half: V.mul(V.sub(mx, mn), 0.5), part: false };
  }
  const AXIS_COLORS = ["#e8412c", "#3fbf3f", "#2c7be8"];
  function handleLength(g) {
    return Math.max(1.5, V.len(V.sub(g.c, cam.pos)) * 0.09);
  }
  function gizmoHandles() {
    const g = gizmoBox();
    if (!g || tool === "select") return [];
    const out = [];
    if (tool === "move" || tool === "scale") {
      if (tool === "scale" && !(selection.length === 1 && g.part)) return [];
      const L = handleLength(g);
      for (let i = 0; i < 3; i++) for (const s of [1, -1]) {
        const a = V.mul(g.ax[i], s);
        const base = V.add(g.c, V.mul(a, g.half[i]));
        const tip = V.add(base, V.mul(a, tool === "move" ? L : L * 0.6));
        out.push({ kind: tool, axis: i, sign: s, dir: g.ax[i], base, tip, c: g.c });
      }
    } else if (tool === "rotate") {
      const r = Math.max(g.half[0], g.half[1], g.half[2]) + handleLength(g) * 0.6;
      for (let i = 0; i < 3; i++) {
        const u = g.ax[(i + 1) % 3], v = g.ax[(i + 2) % 3];
        const pts = [];
        for (let k = 0; k <= 64; k++) {
          const t = k / 64 * Math.PI * 2;
          pts.push(V.add(g.c, V.add(V.mul(u, Math.cos(t) * r), V.mul(v, Math.sin(t) * r))));
        }
        out.push({ kind: "rotate", axis: i, dir: g.ax[i], u, v, pts, c: g.c, r });
      }
    }
    return out;
  }
  function distToSeg(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  }
  function hitHandle(x, y) {
    let best = null, bestD = 9;
    for (const h of gizmoHandles()) {
      if (h.kind === "rotate") {
        const pp = h.pts.map(project);
        for (let k = 0; k + 1 < pp.length; k++) {
          if (!pp[k] || !pp[k + 1]) continue;
          const d = distToSeg([x, y], pp[k], pp[k + 1]);
          if (d < bestD) { bestD = d; best = h; }
        }
      } else {
        const a = project(h.base), b = project(h.tip);
        if (!a || !b) continue;
        const d = Math.min(distToSeg([x, y], a, b), Math.hypot(x - b[0], y - b[1]) - 4);
        if (d < bestD) { bestD = d; best = h; }
      }
    }
    return best;
  }
  // Closest point on the line (p, dir) to the mouse ray: the distance along dir.
  function axisParam(p, dir, ray) {
    const w0 = V.sub(p, ray.o);
    const a = V.dot(dir, dir), b = V.dot(dir, ray.d), c = V.dot(ray.d, ray.d);
    const d = V.dot(dir, w0), e = V.dot(ray.d, w0);
    const den = a * c - b * b;
    if (Math.abs(den) < 1e-6) return null;
    return (b * e - c * d) / den;
  }
  function planeHit(ray, p, n) {
    const den = V.dot(ray.d, n);
    if (Math.abs(den) < 1e-6) return null;
    const t = V.dot(V.sub(p, ray.o), n) / den;
    return t > 0 ? V.add(ray.o, V.mul(ray.d, t)) : null;
  }
  const snap = (v, inc) => (snapOn && inc > 0 ? Math.round(v / inc) * inc : v);

  function drawOverlay() {
    const o = $("stOverlay");
    const dpr = window.devicePixelRatio || 1;
    const w = o.clientWidth, h = o.clientHeight;
    if (o.width !== Math.round(w * dpr) || o.height !== Math.round(h * dpr)) { o.width = Math.round(w * dpr); o.height = Math.round(h * dpr); }
    const g = o.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    if (activeTab) return;
    // Selection boxes.
    g.lineWidth = 1.5;
    g.strokeStyle = "#1a8cff";
    const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    for (const b of boxes) {
      if (!b) continue;
      const pc = corners(boxInfo(b)).map(project);
      g.beginPath();
      for (const [i, j] of edges) {
        if (!pc[i] || !pc[j]) continue;
        g.moveTo(pc[i][0], pc[i][1]);
        g.lineTo(pc[j][0], pc[j][1]);
      }
      g.stroke();
    }
    if (hoverBox && !boxes.some((b) => b && b.cf[0] === hoverBox.cf[0] && b.cf[1] === hoverBox.cf[1])) {
      g.strokeStyle = "rgba(26,140,255,.45)";
      const pc = corners(boxInfo(hoverBox)).map(project);
      g.beginPath();
      for (const [i, j] of edges) {
        if (!pc[i] || !pc[j]) continue;
        g.moveTo(pc[i][0], pc[i][1]);
        g.lineTo(pc[j][0], pc[j][1]);
      }
      g.stroke();
    }
    // Handles.
    const active = drag && drag.handle;
    for (const hd of gizmoHandles()) {
      const col = AXIS_COLORS[hd.axis];
      const hot = active && active.axis === hd.axis && (hd.kind === "rotate" || active.sign === hd.sign);
      if (hd.kind === "rotate") {
        g.strokeStyle = col;
        g.lineWidth = hot ? 4 : 2.5;
        g.beginPath();
        let started = false;
        for (const p of hd.pts.map(project)) {
          if (!p) { started = false; continue; }
          if (!started) { g.moveTo(p[0], p[1]); started = true; } else g.lineTo(p[0], p[1]);
        }
        g.stroke();
        continue;
      }
      const a = project(hd.base), b = project(hd.tip);
      if (!a || !b) continue;
      g.strokeStyle = col;
      g.fillStyle = col;
      g.lineWidth = hot ? 4 : 2.5;
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
      if (hd.kind === "move") {
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const s = hot ? 11 : 9;
        g.beginPath();
        g.moveTo(b[0] + Math.cos(ang) * s, b[1] + Math.sin(ang) * s);
        g.lineTo(b[0] + Math.cos(ang + 2.5) * s, b[1] + Math.sin(ang + 2.5) * s);
        g.lineTo(b[0] + Math.cos(ang - 2.5) * s, b[1] + Math.sin(ang - 2.5) * s);
        g.closePath(); g.fill();
      } else {
        g.beginPath(); g.arc(b[0], b[1], hot ? 7 : 5.5, 0, Math.PI * 2); g.fill();
      }
    }
  }

  // ------------------------------------------------------------- selection
  async function refreshBoxes() {
    if (!selection.length) { boxes = []; return; }
    const r = await bsJson("boxes(" + argList(selection) + ")", selection).catch(() => null);
    boxes = Array.isArray(r) ? r : [];
  }
  function setSelection(list) {
    const seen = new Set();
    selection = list.filter((n) => n && n.id && !seen.has(n.id) && seen.add(n.id));
    renderTree();
    refreshBoxes();
    renderProps();
  }
  function toggleSelect(node, additive) {
    if (!additive) { setSelection(node ? [node] : []); return; }
    if (selection.some((s) => s.id === node.id)) setSelection(selection.filter((s) => s.id !== node.id));
    else setSelection([...selection, node]);
  }

  // ------------------------------------------------------------- explorer
  async function loadKids(id) {
    const list = await cmd("tree", id).catch(() => null);
    if (!Array.isArray(list)) { kids.delete(id); return; }
    for (const n of list) nodes.set(n.id, Object.assign(nodes.get(n.id) || {}, n));
    kids.set(id, list.map((n) => n.id));
  }
  let treeTimer = 0;
  function refreshTree() {
    clearTimeout(treeTimer);
    treeTimer = setTimeout(async () => {
      for (const id of [...expanded]) await loadKids(id);
      // Drop deleted objects from the selection.
      const alive = new Set();
      for (const l of kids.values()) for (const i of l) alive.add(i);
      const before = selection.length;
      selection = selection.filter((s) => alive.has(s.id) || !isShown(s.id));
      renderTree();
      if (selection.length !== before) { refreshBoxes(); renderProps(); }
    }, 30);
  }
  function isShown(id) {
    for (const [p, l] of kids) if (expanded.has(p) && l.includes(id)) return true;
    return false;
  }
  let renaming = 0;
  let dragNode = null;
  function renderTree() {
    const body = $("stTreeBody");
    if (!body) return;
    const filter = ($("stTreeFilter").value || "").trim().toLowerCase();
    body.innerHTML = "";
    const selIds = new Set(selection.map((s) => s.id));
    const walk = (pid, depth) => {
      for (const id of kids.get(pid) || []) {
        const n = nodes.get(id);
        if (!n) continue;
        const matches = !filter || n.name.toLowerCase().includes(filter) || n.cls.toLowerCase().includes(filter);
        const row = el("div", "tnode" + (selIds.has(id) ? " sel" : ""));
        row.style.paddingLeft = (4 + depth * 14) + "px";
        const tw = el("span", "tw", n.kids ? (expanded.has(id) ? "▼" : "▶") : "");
        tw.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (expanded.has(id)) expanded.delete(id);
          else { expanded.add(id); await loadKids(id); }
          renderTree();
        });
        row.append(tw, classBadge(n.cls));
        if (renaming === id) {
          const inp = el("input");
          inp.value = n.name;
          const done = async (ok) => {
            if (renaming !== id) return;
            renaming = 0;
            if (ok && inp.value && inp.value !== n.name) {
              await cmd("set", id, "Name", inp.value).catch((e) => log(e.message, "e"));
              await waypoint("Rename");
              refreshTree();
              renderProps();
            } else renderTree();
          };
          inp.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") done(true); if (e.key === "Escape") done(false); });
          inp.addEventListener("blur", () => done(true));
          row.append(inp);
          setTimeout(() => { inp.focus(); inp.select(); }, 0);
        } else {
          row.append(el("span", "", n.name));
        }
        row.title = n.cls;
        row.draggable = pid !== 0;
        row.addEventListener("click", (e) => toggleSelect(n, e.ctrlKey || e.metaKey || e.shiftKey));
        row.addEventListener("dblclick", () => {
          if (SCRIPT_CLASSES.has(n.cls)) openScript(n);
          else { renaming = id; renderTree(); }
        });
        row.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          if (!selIds.has(id)) setSelection([n]);
          showMenu(e.clientX, e.clientY);
        });
        row.addEventListener("dragstart", (e) => { dragNode = n; e.dataTransfer.effectAllowed = "move"; });
        row.addEventListener("dragover", (e) => { if (dragNode && dragNode.id !== id) { e.preventDefault(); row.classList.add("drop"); } });
        row.addEventListener("dragleave", () => row.classList.remove("drop"));
        row.addEventListener("drop", async (e) => {
          e.preventDefault();
          row.classList.remove("drop");
          if (!dragNode) return;
          const moving = selection.some((s) => s.id === dragNode.id) ? selection : [dragNode];
          dragNode = null;
          await bs("setParent(...)", [n, ...moving]).catch(() => {});
          await waypoint("Reparent");
          expanded.add(id);
          refreshTree();
        });
        if (matches || filter === "") body.appendChild(row);
        if (expanded.has(id) || (filter && n.kids && kids.has(id))) walk(id, depth + 1);
      }
    };
    walk(0, 0);
  }
  async function revealInTree(node) {
    // Expand the parents of an object picked in the 3D view.
    const path = await lua("local o = ... local t = {} local p = o.Parent while p and p ~= game do table.insert(t, 1, p) p = p.Parent end return unpack(t)", [node]).catch(() => []);
    for (const p of path || []) {
      if (!p || !p.id) continue;
      nodes.set(p.id, Object.assign(nodes.get(p.id) || {}, p));
      if (!expanded.has(p.id)) { expanded.add(p.id); await loadKids(p.id); }
    }
    renderTree();
    const rows = $("stTreeBody").querySelectorAll(".tnode.sel");
    if (rows[0]) rows[0].scrollIntoView({ block: "nearest" });
  }

  // ------------------------------------------------------------- properties
  let propsToken = 0;
  const closedCats = new Set();
  async function renderProps() {
    const body = $("stPropBody");
    if (!body) return;
    const token = ++propsToken;
    if (!selection.length) { body.innerHTML = "<div style='padding:8px;color:#888'>Select an object to see its properties.</div>"; return; }
    const first = selection[0];
    let data;
    try { data = await cmd("props", first.id); } catch (e) { body.textContent = e.message; return; }
    if (token !== propsToken) return;
    $("stPropTitle").textContent = "Properties - " + (selection.length > 1 ? selection.length + " objects" : first.cls + " \"" + first.name + "\"");
    body.innerHTML = "";
    const cats = new Map();
    for (const p of data.props) {
      const c = p.c || "Data";
      if (!cats.has(c)) cats.set(c, []);
      cats.get(c).push(p);
    }
    const order = ["Appearance", "Data", "Behavior", "Part", "Surface", "Surface Inputs", "Shape", "Camera", "Text", "Image"];
    const names = [...cats.keys()].sort((a, b) => ((order.indexOf(a) + 1) || 99) - ((order.indexOf(b) + 1) || 99) || a.localeCompare(b));
    for (const c of names) {
      const head = el("div", "pcat", (closedCats.has(c) ? "▶ " : "▼ ") + c);
      head.addEventListener("click", () => { closedCats.has(c) ? closedCats.delete(c) : closedCats.add(c); renderProps(); });
      body.appendChild(head);
      if (closedCats.has(c)) continue;
      for (const p of cats.get(c).sort((a, b) => a.n.localeCompare(b.n))) body.appendChild(propRow(p));
    }
  }
  function colorOf(p) {
    if (p.t === "Color3") {
      const m = p.v.split(",").map(Number);
      if (m.length === 3) return "rgb(" + m.map((x) => Math.round(Math.max(0, Math.min(1, x)) * 255)).join(",") + ")";
    }
    return null;
  }
  function propRow(p) {
    const row = el("div", "prow" + (p.ro ? " ro" : ""));
    const name = el("div", "pn", p.n);
    name.title = p.n + " (" + p.t + ")";
    const val = el("div", "pv");
    const commit = async (text) => {
      const targets = selection.length ? selection : [];
      let failed = null;
      for (const t of targets) {
        try { await cmd("set", t.id, p.n, text); } catch (e) { if (t === targets[0]) failed = e; }
      }
      if (failed) log(p.n + ": " + failed.message, "e");
      await waypoint("Change " + p.n);
      if (p.n === "Name") refreshTree();
      refreshBoxes();
      renderProps();
    };
    if (p.t === "bool" && !p.ro) {
      const cb = el("input");
      cb.type = "checkbox";
      cb.checked = p.v === "true";
      cb.addEventListener("change", () => commit(cb.checked ? "true" : "false"));
      val.appendChild(cb);
    } else if (p.e && !p.ro) {
      const sel = el("select");
      for (const it of p.e) {
        const o = el("option", "", it);
        o.value = it;
        if (it === p.v) o.selected = true;
        sel.appendChild(o);
      }
      if (!p.e.includes(p.v)) { const o = el("option", "", p.v); o.selected = true; sel.prepend(o); }
      sel.addEventListener("change", () => commit(sel.value));
      val.appendChild(sel);
    } else {
      const sw = colorOf(p);
      if (sw) {
        const s = el("span", "swatch");
        s.style.background = sw;
        const picker = el("input");
        picker.type = "color";
        picker.style.cssText = "width:0;height:0;opacity:0;position:absolute;";
        const m = p.v.split(",").map(Number);
        picker.value = "#" + m.map((x) => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, "0")).join("");
        picker.addEventListener("change", () => {
          const h = picker.value;
          commit([1, 3, 5].map((i) => (parseInt(h.substr(i, 2), 16) / 255).toFixed(4)).join(", "));
        });
        s.addEventListener("click", () => { if (!p.ro) picker.click(); });
        val.append(s, picker);
      }
      const inp = el("input");
      inp.type = "text";
      inp.value = p.v;
      inp.readOnly = !!p.ro;
      inp.title = p.v;
      inp.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter") inp.blur();
        if (e.key === "Escape") { inp.value = p.v; inp.blur(); }
      });
      inp.addEventListener("blur", () => { if (!p.ro && inp.value !== p.v) commit(inp.value); });
      val.appendChild(inp);
      if (p.t === "ProtectedString" || (p.n === "Source")) {
        inp.readOnly = true;
        inp.value = "(open the script to edit)";
      }
    }
    row.append(name, val);
    return row;
  }

  // ------------------------------------------------------------- actions
  function cameraRayArgs() {
    const r = screenRay(viewSize().w / 2, viewSize().h / 2);
    return [...r.o, ...r.d].map(num).join(", ");
  }
  async function insertPart(kind) {
    const r = await bs("newPart(\"" + kind + "\", " + cameraRayArgs() + ")").catch((e) => { log(e.message, "e"); return null; });
    await waypoint("Insert " + kind);
    await refreshTree();
    if (r && r[0]) { nodes.set(r[0].id, r[0]); setSelection([r[0]]); revealInTree(r[0]); }
  }
  async function insertObject(cls) {
    const parent = selection.length === 1 ? selection[0] : null;
    const r = await lua("return BS.insert(" + JSON.stringify(cls) + ", " + (parent ? "..." : "nil") + ", " + cameraRayArgs() + ")", parent ? [parent] : [])
      .catch((e) => { log("Could not insert " + cls + ": " + e.message, "e"); return null; });
    if (!r || !r[0]) return;
    await waypoint("Insert " + cls);
    if (parent) { expanded.add(parent.id); }
    refreshTree();
    nodes.set(r[0].id, r[0]);
    setSelection([r[0]]);
    revealInTree(r[0]);
    if (SCRIPT_CLASSES.has(cls)) openScript(r[0]);
  }
  async function deleteSelection() {
    if (!selection.length) return;
    const objs = selection;
    for (const s of scripts.slice()) if (objs.some((o) => o.id === s.node.id)) closeScript(s, false);
    await bs("delete(...)", objs).catch(() => {});
    setSelection([]);
    await waypoint("Delete");
    refreshTree();
  }
  async function duplicateSelection() {
    if (!selection.length) return;
    const r = await bs("duplicate(...)", selection).catch(() => null);
    await waypoint("Duplicate");
    refreshTree();
    if (r && r.length) setSelection(r.filter(Boolean));
  }
  async function copySelection() {
    if (!selection.length) return;
    const n = await bs("copy(...)", selection).catch(() => null);
    log("Copied " + (n ? n[0] : 0) + " object(s)", "i");
  }
  async function paste() {
    const parent = selection.length === 1 && !/Part$/.test(selection[0].cls) ? selection[0] : null;
    const r = await lua("return BS.paste(" + (parent ? "..." : "nil") + ")", parent ? [parent] : []).catch(() => null);
    await waypoint("Paste");
    refreshTree();
    if (r && r.length) setSelection(r.filter(Boolean));
  }
  async function groupSelection() {
    if (!selection.length) return;
    const r = await bs("group(...)", selection).catch(() => null);
    await waypoint("Group");
    refreshTree();
    if (r && r[0]) setSelection([r[0]]);
  }
  async function ungroupSelection() {
    if (!selection.length) return;
    const r = await bs("ungroup(...)", selection).catch(() => null);
    await waypoint("Ungroup");
    refreshTree();
    setSelection((r || []).filter(Boolean));
  }
  async function toggleAnchor() {
    if (!selection.length) return;
    const parts = await lua("local n, a = 0, 0 for _, p in ipairs(BS.parts({...})) do n = n + 1 if p.Anchored then a = a + 1 end end return n, a", selection).catch(() => null);
    if (!parts || !parts[0]) return;
    const anchor = parts[1] < parts[0];
    await lua("for _, p in ipairs(BS.parts({...})) do p.Anchored = " + anchor + " end", selection).catch(() => {});
    await waypoint(anchor ? "Anchor" : "Unanchor");
    log((anchor ? "Anchored " : "Unanchored ") + parts[0] + " part(s)", "i");
    renderProps();
  }
  async function rotateSelection(axis) {
    if (!selection.length) return;
    const g = gizmoBox();
    if (!g) return;
    await bs("begin(...)", selection);
    const a = axis === 1 ? [0, 1, 0] : [0, 0, 1];
    const r = await bsJson("xform(0,0,0," + a.join(",") + ",90," + g.c.map(num).join(",") + ")");
    if (Array.isArray(r)) boxes = r;
    await waypoint("Rotate");
    renderProps();
  }
  async function undo(redo) {
    try { updateUndo(await cmd("hist", redo ? "redo" : "undo")); } catch (_) {}
    markDirty();
    refreshTree();
    refreshBoxes();
    renderProps();
  }

  // ------------------------------------------------------------- scripts
  async function openScript(node) {
    let s = scripts.find((x) => x.node.id === node.id);
    if (!s) {
      const r = await lua("return (...).Source", [node]).catch((e) => { log(e.message, "e"); return null; });
      if (!r) return;
      s = { node, text: r[0] || "", saved: r[0] || "" };
      scripts.push(s);
    }
    showTab(s);
  }
  async function flushScript(s) {
    if (!s || s.text === s.saved) return;
    await lua("(...).Source = " + luaStr(s.text), [s.node]).catch((e) => log(e.message, "e"));
    s.saved = s.text;
    await waypoint("Edit script");
  }
  async function flushScripts() {
    if (activeTab) activeTab.text = $("stCode").value;
    for (const s of scripts) await flushScript(s);
  }
  function closeScript(s, flush) {
    if (flush !== false) flushScript(s);
    const i = scripts.indexOf(s);
    if (i >= 0) scripts.splice(i, 1);
    if (activeTab === s) showTab(null);
    else renderTabs();
  }
  function showTab(s) {
    if (activeTab) { activeTab.text = $("stCode").value; flushScript(activeTab); }
    activeTab = s;
    const ed = $("stEditor");
    if (s) {
      ed.style.display = "block";
      $("stCode").value = s.text;
      $("view").style.visibility = "hidden";
      setTimeout(() => $("stCode").focus(), 0);
    } else {
      ed.style.display = "none";
      $("view").style.visibility = "";
    }
    renderTabs();
  }
  function renderTabs() {
    const bar = $("stTabs");
    bar.innerHTML = "";
    const vt = el("div", "tab" + (activeTab ? "" : " on"), (game && game.name) || "Place");
    vt.addEventListener("click", () => showTab(null));
    bar.appendChild(vt);
    for (const s of scripts) {
      const t = el("div", "tab" + (activeTab === s ? " on" : ""));
      t.append(classBadge(s.node.cls), el("span", "", s.node.name));
      const x = el("span", "x", "✕");
      x.addEventListener("click", (e) => { e.stopPropagation(); if (activeTab === s) s.text = $("stCode").value; closeScript(s); });
      t.appendChild(x);
      t.addEventListener("click", () => showTab(s));
      bar.appendChild(t);
    }
  }

  // ------------------------------------------------------------- menus
  function showMenu(x, y) {
    const m = $("stMenu");
    m.innerHTML = "";
    const one = selection.length === 1 ? selection[0] : null;
    const items = [];
    if (one && SCRIPT_CLASSES.has(one.cls)) items.push(["Edit script", () => openScript(one)]);
    items.push(["Insert Object...", openInsert], null,
      ["Cut  (Ctrl+X)", async () => { await copySelection(); deleteSelection(); }],
      ["Copy  (Ctrl+C)", copySelection], ["Paste Into  (Ctrl+V)", paste],
      ["Duplicate  (Ctrl+D)", duplicateSelection], ["Delete  (Del)", deleteSelection], null,
      ["Rename  (F2)", () => { if (one) { renaming = one.id; renderTree(); } }],
      ["Group  (Ctrl+G)", groupSelection], ["Ungroup  (Ctrl+U)", ungroupSelection],
      ["Anchor / Unanchor", toggleAnchor], ["Zoom to  (F)", focusSelection]);
    for (const it of items) {
      if (!it) { m.appendChild(el("hr")); continue; }
      const d = el("div", "", it[0]);
      d.addEventListener("click", () => { hideMenu(); it[1](); });
      m.appendChild(d);
    }
    m.style.display = "block";
    m.style.left = Math.min(x, innerWidth - 190) + "px";
    m.style.top = Math.min(y, innerHeight - m.offsetHeight - 8) + "px";
  }
  function hideMenu() { const m = $("stMenu"); if (m) m.style.display = "none"; }
  function openInsert() {
    const modal = $("stModal");
    modal.innerHTML = "";
    const box = el("div", "box");
    box.appendChild(el("h3", "", "Insert Object" + (selection.length === 1 ? " into " + selection[0].name : "")));
    const inp = el("input");
    inp.placeholder = "Search classes";
    const list = el("div", "list");
    let shown = [];
    let cursor = 0;
    const render = () => {
      const q = inp.value.trim().toLowerCase();
      shown = INSERTABLE.filter((c) => c.toLowerCase().includes(q));
      cursor = Math.min(cursor, Math.max(0, shown.length - 1));
      list.innerHTML = "";
      shown.forEach((c, i) => {
        const d = el("div", i === cursor ? "on" : "");
        d.append(classBadge(c), el("span", "", c));
        d.addEventListener("click", () => { close(); insertObject(c); });
        list.appendChild(d);
      });
    };
    const close = () => { modal.style.display = "none"; };
    inp.addEventListener("input", () => { cursor = 0; render(); });
    inp.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Escape") close();
      if (e.key === "ArrowDown") { cursor = Math.min(shown.length - 1, cursor + 1); render(); }
      if (e.key === "ArrowUp") { cursor = Math.max(0, cursor - 1); render(); }
      if (e.key === "Enter" && shown[cursor]) { close(); insertObject(shown[cursor]); }
    });
    modal.onclick = (e) => { if (e.target === modal) close(); };
    box.append(inp, list);
    modal.appendChild(box);
    modal.style.display = "flex";
    render();
    inp.focus();
  }

  // ------------------------------------------------------------- viewport input
  let drag = null;       // { mode, ... }
  let hoverBox = null;
  let xformBusy = false, xformNext = null;
  function sendXform(call) {
    if (xformBusy) { xformNext = call; return; }
    xformBusy = true;
    bsJson(call).then((r) => { if (Array.isArray(r)) boxes = r; }).catch(() => {}).finally(() => {
      xformBusy = false;
      if (xformNext) { const c = xformNext; xformNext = null; sendXform(c); }
    });
  }
  async function xformDone(name) {
    while (xformBusy || xformNext) await new Promise((r) => setTimeout(r, 10));
    await waypoint(name);
    renderProps();
  }
  async function pick(x, y, mode, ignore) {
    const r = screenRay(x, y);
    const args = [...r.o, ...r.d].map(num).join(", ") + ", \"" + mode + "\"" + (ignore && ignore.length ? ", ..." : "");
    const res = await lua("return BS.ray(" + args + ")", ignore || []).catch(() => null);
    if (!res || !res[0]) return null;
    let info = null;
    try { info = JSON.parse(res[1]); } catch (_) {}
    return { part: res[0], top: res[2] || res[0], pos: info ? info.slice(0, 3) : null, normal: info ? info.slice(3, 6) : [0, 1, 0] };
  }
  function installViewportInput() {
    const ov = $("stOverlay");
    ov.tabIndex = 0;
    let hoverBusy = false, hoverAt = 0;
    ov.addEventListener("contextmenu", (e) => e.preventDefault());
    ov.addEventListener("pointerdown", async (e) => {
      hideMenu();
      ov.focus();
      const x = e.offsetX, y = e.offsetY;
      if (e.button === 2 || e.button === 1) {
        drag = { mode: e.button === 2 ? "look" : "pan", x, y, moved: false };
        ov.setPointerCapture(e.pointerId);
        return;
      }
      if (e.button !== 0 || !ready) return;
      const h = hitHandle(x, y);
      if (h) {
        ov.setPointerCapture(e.pointerId);
        const ray = screenRay(x, y);
        drag = { mode: "handle", handle: h, startRay: ray };
        if (h.kind === "rotate") {
          const p = planeHit(ray, h.c, h.dir);
          drag.startAngle = p ? Math.atan2(V.dot(V.sub(p, h.c), h.v), V.dot(V.sub(p, h.c), h.u)) : 0;
        } else {
          drag.startT = axisParam(h.base, h.dir, ray);
        }
        await bs("begin(...)", selection);
        return;
      }
      const hit = await pick(x, y, "select");
      const target = hit ? (e.altKey ? hit.part : hit.top) : null;
      if (!target) {
        if (!(e.ctrlKey || e.shiftKey)) setSelection([]);
        return;
      }
      nodes.set(target.id, Object.assign(nodes.get(target.id) || {}, target));
      const already = selection.some((s) => s.id === target.id);
      if (e.ctrlKey || e.shiftKey) toggleSelect(target, true);
      else if (!already) setSelection([target]);
      revealInTree(target);
      if (tool === "select" || !gizmoHandles().length) {
        ov.setPointerCapture(e.pointerId);
        drag = { mode: "free", x, y, startHit: hit.pos, moved: false };
      }
    });
    ov.addEventListener("pointermove", async (e) => {
      const x = e.offsetX, y = e.offsetY;
      if (!drag) {
        // Hover outline, like Studio.
        const now = performance.now();
        if (ready && tool === "select" && !hoverBusy && now - hoverAt > 60) {
          hoverBusy = true; hoverAt = now;
          const hit = await pick(x, y, "select").catch(() => null);
          if (hit) {
            const b = await bsJson("boxes(...)", [e.altKey ? hit.part : hit.top]).catch(() => null);
            hoverBox = b && b[0] ? b[0] : null;
          } else hoverBox = null;
          hoverBusy = false;
        }
        ov.style.cursor = hitHandle(x, y) ? "pointer" : "default";
        return;
      }
      const dx = x - drag.x, dy = y - drag.y;
      if (drag.mode === "look") {
        cam.yaw -= (e.movementX || 0) * 0.006;
        cam.pitch = Math.max(-1.55, Math.min(1.55, cam.pitch - (e.movementY || 0) * 0.006));
        return;
      }
      if (drag.mode === "pan") {
        const { right, up } = camVectors();
        cam.pos = V.add(cam.pos, V.add(V.mul(right, -(e.movementX || 0) * 0.08), V.mul(up, (e.movementY || 0) * 0.08)));
        return;
      }
      const ray = screenRay(x, y);
      if (drag.mode === "handle") {
        const h = drag.handle;
        if (h.kind === "rotate") {
          const p = planeHit(ray, h.c, h.dir);
          if (!p) return;
          const ang = Math.atan2(V.dot(V.sub(p, h.c), h.v), V.dot(V.sub(p, h.c), h.u));
          let deg = (ang - drag.startAngle) * 180 / Math.PI;
          deg = snap(deg, snapRot);
          sendXform("xform(0,0,0," + h.dir.map(num).join(",") + "," + num(deg) + "," + h.c.map(num).join(",") + ")");
        } else {
          const t = axisParam(h.base, h.dir, ray);
          if (t == null || drag.startT == null) return;
          const d = snap(t - drag.startT, snapMove);
          if (h.kind === "move") {
            const mv = V.mul(h.dir, d);
            sendXform("xform(" + mv.map(num).join(",") + ",0,1,0,0,0,0,0)");
          } else {
            sendXform("resize(" + (h.axis + 1) + "," + h.sign + "," + num(h.sign * d) + ")");
          }
        }
        return;
      }
      if (drag.mode === "free") {
        if (!drag.moved && Math.hypot(dx, dy) < 4) return;
        if (!drag.moved) {
          drag.moved = true;
          const g = gizmoBox();
          drag.bottom = g ? g.c[1] - g.half[1] : drag.startHit[1];
          await bs("begin(...)", selection);
        }
        if (drag.picking) return;
        drag.picking = true;
        const hit = await pick(x, y, "drag", selection).catch(() => null);
        drag.picking = false;
        if (!drag) return;
        let mv;
        if (hit && hit.pos && hit.normal[1] > 0.5) {
          mv = [hit.pos[0] - drag.startHit[0], hit.pos[1] - drag.bottom, hit.pos[2] - drag.startHit[2]];
        } else {
          const p = planeHit(ray, drag.startHit, [0, 1, 0]);
          if (!p) return;
          mv = [p[0] - drag.startHit[0], 0, p[2] - drag.startHit[2]];
        }
        mv[0] = snap(mv[0], snapMove);
        mv[2] = snap(mv[2], snapMove);
        sendXform("xform(" + mv.map(num).join(",") + ",0,1,0,0,0,0,0)");
      }
    });
    const end = async (e) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      try { ov.releasePointerCapture(e.pointerId); } catch (_) {}
      if (d.mode === "handle") await xformDone(d.handle.kind === "rotate" ? "Rotate" : d.handle.kind === "scale" ? "Resize" : "Move");
      else if (d.mode === "free" && d.moved) await xformDone("Drag");
    };
    ov.addEventListener("pointerup", end);
    ov.addEventListener("pointercancel", end);
    ov.addEventListener("wheel", (e) => {
      e.preventDefault();
      const { fwd } = camVectors();
      const step = Math.max(-12, Math.min(12, -e.deltaY * 0.04));
      cam.pos = V.add(cam.pos, V.mul(fwd, step * (keys.has("ShiftLeft") ? 0.25 : 1)));
    }, { passive: false });
  }

  function installKeys() {
    const typing = () => document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    window.addEventListener("keydown", (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === "s") { e.preventDefault(); save(); return; }
      if (e.key === "F5") { e.preventDefault(); playtest(); return; }
      if (typing()) {
        if (e.target && e.target.id === "stCode" && e.key === "Tab") {
          e.preventDefault();
          const t = e.target, s = t.selectionStart, en = t.selectionEnd;
          t.value = t.value.slice(0, s) + "\t" + t.value.slice(en);
          t.selectionStart = t.selectionEnd = s + 1;
          if (activeTab) activeTab.text = t.value;
        }
        return;
      }
      keys.add(e.code);
      if (ctrl) {
        const k = e.key.toLowerCase();
        const map = { z: () => undo(false), y: () => undo(true), d: duplicateSelection, c: copySelection, v: paste,
          g: groupSelection, u: ungroupSelection, x: async () => { await copySelection(); deleteSelection(); },
          r: () => rotateSelection(1), t: () => rotateSelection(2), a: selectAll };
        if (map[k]) { e.preventDefault(); map[k](); }
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteSelection(); }
      else if (e.key === "F2" && selection.length === 1) { renaming = selection[0].id; renderTree(); }
      else if (e.key === "f" || e.key === "F") focusSelection();
      else if (e.key === "1") setTool("select");
      else if (e.key === "2") setTool("move");
      else if (e.key === "3") setTool("scale");
      else if (e.key === "4") setTool("rotate");
      else if (e.key === "Escape") { setSelection([]); hideMenu(); }
    });
    window.addEventListener("keyup", (e) => keys.delete(e.code));
    window.addEventListener("blur", () => keys.clear());
    document.addEventListener("click", (e) => { if (!$("stMenu").contains(e.target)) hideMenu(); });
  }

  // Ctrl+A: everything directly in Workspace except the camera and terrain.
  function selectAll() {
    const ws = (kids.get(0) || []).map((i) => nodes.get(i)).find((n) => n && n.cls === "Workspace");
    if (!ws) return;
    setSelection((kids.get(ws.id) || []).map((i) => nodes.get(i)).filter((n) => n && n.cls !== "Camera" && n.cls !== "Terrain"));
  }

  function setTool(t) {
    tool = t;
    for (const b of document.querySelectorAll("[data-tool]")) b.classList.toggle("on", b.dataset.tool === t);
    hoverBox = null;
  }

  // ------------------------------------------------------------- save / play
  async function saveBytes() {
    await flushScripts();
    return cmd("save");
  }
  async function save() {
    if (!ready) return null;
    try {
      const bytes = await saveBytes();
      game.name = ($("stName").value || "Untitled Game").trim();
      game.bytes = bytes;
      await Games.put(game);
      dirty = false;
      $("stSaved").textContent = "Saved " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      log("Saved \"" + game.name + "\" to My Games (" + Math.round(bytes.length / 1024) + " KB)", "i");
      return bytes;
    } catch (e) {
      log("Save failed: " + e.message, "e");
      return null;
    }
  }
  async function download() {
    const bytes = await save();
    if (!bytes) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
    a.download = (game.name || "game").replace(/[\\/:*?"<>|]+/g, "_") + ".rbxl";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  async function playtest() {
    if (!(await save())) return;
    dirty = false;
    const q = new URLSearchParams(location.search);
    location.href = "?play=" + encodeURIComponent("mine:" + game.id) + "&from=studio" + (q.get("mute") ? "&mute=1" : "");
  }
  function openFilePicker(onBytes) {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".rbxl,.rbxlx";
    inp.onchange = async () => {
      const f = inp.files[0];
      if (!f) return;
      onBytes(new Uint8Array(await f.arrayBuffer()), f.name.replace(/\.(rbxlx?)$/i, ""));
    };
    inp.click();
  }
  async function importGame(bytes, name) {
    const g = { id: Games.newId(), name: name || "Imported Game", bytes };
    await Games.put(g);
    location.href = "?studio=" + g.id + muteParam();
  }
  const muteParam = () => (new URLSearchParams(location.search).get("mute") ? "&mute=1" : "");
  async function newBaseplate() {
    try {
      const list = await core.fetchPlaceList();
      const p = list.find((x) => /^Baseplate/i.test(x.name));
      if (!p) throw new Error("no baseplate template");
      const bytes = await core.readFileBytes({ src: "places/" + encodeURIComponent(p.file) + (p.gz ? ".gz" : "") });
      const g = { id: Games.newId(), name: "My Game", bytes };
      await Games.put(g);
      location.href = "?studio=" + g.id + muteParam();
    } catch (e) {
      alert("Could not create a new game: " + e.message);
    }
  }

  // ------------------------------------------------------------- start page
  async function startPage() {
    injectCss();
    const page = el("div");
    page.id = "stStart";
    page.innerHTML = "<header><b>BLOXRO STUDIO</b><span>2016 edition</span><a href='./'>Back to games</a></header><main></main>";
    document.body.appendChild(page);
    const main = page.querySelector("main");
    main.appendChild(el("h2", "", "New"));
    const row = el("div", "row");
    const card = (art, name, sub, onClick, acts) => {
      const c = el("div", "card");
      const a = el("div", "art", art);
      c.append(a, el("div", "nm", name), el("div", "sub", sub));
      a.addEventListener("click", onClick);
      c.querySelector(".nm").addEventListener("click", onClick);
      if (acts) {
        const bar = el("div", "acts");
        for (const [label, fn] of acts) {
          const b = el("button", "", label);
          b.addEventListener("click", (e) => { e.stopPropagation(); fn(); });
          bar.appendChild(b);
        }
        c.appendChild(bar);
      }
      return c;
    };
    row.append(card("▦", "Baseplate", "Start a new game", newBaseplate),
      card("⇧", "Open file...", ".rbxl / .rbxlx from your computer", () => openFilePicker(importGame)));
    main.appendChild(row);
    main.appendChild(el("h2", "", "My Games"));
    const mine = el("div", "row");
    main.appendChild(mine);
    const games = await Games.list();
    if (!games.length) mine.appendChild(el("div", "empty", "No games yet. Start from a baseplate."));
    for (const g of games) {
      const when = new Date(g.updated).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
      mine.appendChild(card("⚒", g.name, when + " · " + Math.max(1, Math.round(g.size / 1024)) + " KB",
        () => { location.href = "?studio=" + g.id + muteParam(); }, [
          ["Edit", () => { location.href = "?studio=" + g.id + muteParam(); }],
          ["Play", () => { location.href = "?play=" + encodeURIComponent("mine:" + g.id) + muteParam(); }],
          ["Delete", async () => {
            if (!confirm("Delete \"" + g.name + "\"? This can't be undone.")) return;
            await Games.del(g.id);
            page.remove();
            startPage();
          }],
        ]));
    }
  }

  // ------------------------------------------------------------- layout
  function injectCss() {
    if ($("stCss")) return;
    const style = el("style");
    style.id = "stCss";
    style.textContent = CSS;
    document.head.appendChild(style);
    document.body.classList.add("studio");
  }
  function buildUi() {
    injectCss();
    const root = el("div");
    root.id = "studio";
    root.innerHTML = `
<div id="stTitle"><span class="logo">BLOXRO STUDIO</span><input id="stName" aria-label="Game name">
  <button id="stUndo" title="Undo (Ctrl+Z)" disabled>↶</button><button id="stRedo" title="Redo (Ctrl+Y)" disabled>↷</button>
  <span id="stSaved"></span><span class="sp"></span>
  <button id="stExit" title="Back to the start page">Exit</button></div>
<div id="stRibbon">
  <div class="rbGroup"><div class="rbItems">
    <button class="rb" id="rbSave"><span class="ic">\u{1F4BE}</span>Save</button>
    <div class="rbCol"><button class="rb small" id="rbDownload"><span class="ic">⬇</span>Download .rbxl</button>
    <button class="rb small" id="rbOpen"><span class="ic">\u{1F4C2}</span>Open .rbxl</button></div>
  </div><div class="rbLabel">File</div></div>
  <div class="rbGroup"><div class="rbItems">
    <button class="rb" data-tool="select" title="Select (1)"><span class="ic">↖</span>Select</button>
    <button class="rb" data-tool="move" title="Move (2)"><span class="ic">✥</span>Move</button>
    <button class="rb" data-tool="scale" title="Scale (3)"><span class="ic">⤢</span>Scale</button>
    <button class="rb" data-tool="rotate" title="Rotate (4)"><span class="ic">↻</span>Rotate</button>
  </div><div class="rbLabel">Tools</div></div>
  <div class="rbGroup"><div class="rbItems"><div class="rbCol">
    <label class="rbSnap"><input type="checkbox" id="snapOn" checked>Move <input type="number" id="snapMove" value="1" min="0" step="0.2"> studs</label>
    <label class="rbSnap">Rotate <input type="number" id="snapRot" value="15" min="0" step="5"> °</label>
  </div></div><div class="rbLabel">Snap to Grid</div></div>
  <div class="rbGroup"><div class="rbItems">
    <button class="rb" id="rbPart"><span class="ic">■</span>Part</button>
    <div class="rbCol">
      <button class="rb small" data-part="Ball"><span class="ic">●</span>Sphere</button>
      <button class="rb small" data-part="Cylinder"><span class="ic">▮</span>Cylinder</button></div>
    <div class="rbCol">
      <button class="rb small" data-part="Wedge"><span class="ic">◢</span>Wedge</button>
      <button class="rb small" data-part="Spawn"><span class="ic">⚑</span>Spawn</button></div>
    <button class="rb" id="rbInsert"><span class="ic">✚</span>Object</button>
  </div><div class="rbLabel">Insert</div></div>
  <div class="rbGroup"><div class="rbItems">
    <button class="rb" id="rbAnchor"><span class="ic">⚓</span>Anchor</button>
    <div class="rbCol"><button class="rb small" id="rbGroup"><span class="ic">▣</span>Group</button>
    <button class="rb small" id="rbUngroup"><span class="ic">▢</span>Ungroup</button></div>
    <div class="rbCol"><button class="rb small" id="rbDup"><span class="ic">⧉</span>Duplicate</button>
    <button class="rb small" id="rbDel"><span class="ic">✖</span>Delete</button></div>
  </div><div class="rbLabel">Edit</div></div>
  <div class="rbGroup"><div class="rbItems">
    <button class="rb play" id="rbPlay" title="Play (F5)"><span class="ic">▶</span>Play</button>
  </div><div class="rbLabel">Test</div></div>
</div>
<div id="stCenter"><div id="stTabs"></div><div id="stViewport"><canvas id="stOverlay"></canvas>
  <div id="stEditor"><textarea id="stCode" spellcheck="false" aria-label="Script source"></textarea></div>
  <div id="stHint">Right-drag to look · WASD/QE to fly · Wheel to zoom · F to focus</div>
  <div id="stLoading">Loading Studio…</div></div></div>
<div id="stBottom"><div class="paneHead">Output</div><div id="stOutput"></div>
  <div id="stCmd"><input id="stCmdInput" placeholder="Run a command (Lua)" spellcheck="false"></div></div>
<div id="stRight">
  <div class="pane" id="stExplorer"><div class="paneHead">Explorer <input id="stTreeFilter" placeholder="Filter"></div><div class="paneBody" id="stTreeBody"></div></div>
  <div class="pane" id="stProps"><div class="paneHead" id="stPropTitle">Properties</div><div class="paneBody" id="stPropBody"></div></div>
</div>`;
    document.body.appendChild(root);
    const menu = el("div"); menu.id = "stMenu"; document.body.appendChild(menu);
    const modal = el("div"); modal.id = "stModal"; document.body.appendChild(modal);
    outputEl = $("stOutput");

    $("rbSave").onclick = save;
    $("rbDownload").onclick = download;
    $("rbOpen").onclick = () => openFilePicker(importGame);
    $("rbPart").onclick = () => insertPart("Block");
    for (const b of document.querySelectorAll("[data-part]")) b.onclick = () => insertPart(b.dataset.part);
    for (const b of document.querySelectorAll("[data-tool]")) b.onclick = () => setTool(b.dataset.tool);
    $("rbInsert").onclick = openInsert;
    $("rbAnchor").onclick = toggleAnchor;
    $("rbGroup").onclick = groupSelection;
    $("rbUngroup").onclick = ungroupSelection;
    $("rbDup").onclick = duplicateSelection;
    $("rbDel").onclick = deleteSelection;
    $("rbPlay").onclick = playtest;
    $("stUndo").onclick = () => undo(false);
    $("stRedo").onclick = () => undo(true);
    $("stExit").onclick = () => { location.href = "?studio" + muteParam(); };
    $("snapOn").onchange = () => { snapOn = $("snapOn").checked; };
    $("snapMove").onchange = () => { snapMove = Math.max(0, Number($("snapMove").value) || 0); };
    $("snapRot").onchange = () => { snapRot = Math.max(0, Number($("snapRot").value) || 0); };
    $("stTreeFilter").addEventListener("input", renderTree);
    $("stTreeFilter").addEventListener("keydown", (e) => e.stopPropagation());
    $("stName").addEventListener("change", () => { game.name = $("stName").value.trim() || "Untitled Game"; document.title = game.name + " - Bloxro Studio"; renderTabs(); markDirty(); });
    $("stName").addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") $("stName").blur(); });
    $("stCode").addEventListener("input", () => { if (activeTab) { activeTab.text = $("stCode").value; markDirty(); } });
    const cmdIn = $("stCmdInput");
    const history = [];
    let hIdx = 0;
    cmdIn.addEventListener("keydown", async (e) => {
      e.stopPropagation();
      if (e.key === "ArrowUp" && history.length) { hIdx = Math.max(0, hIdx - 1); cmdIn.value = history[hIdx]; e.preventDefault(); }
      if (e.key === "ArrowDown" && history.length) { hIdx = Math.min(history.length, hIdx + 1); cmdIn.value = history[hIdx] || ""; e.preventDefault(); }
      if (e.key !== "Enter" || !cmdIn.value.trim()) return;
      const src = cmdIn.value;
      history.push(src); hIdx = history.length;
      cmdIn.value = "";
      log("> " + src, "i");
      try {
        await lua(src);
        await waypoint("Command");
      } catch (err) { log(err.message, "e"); }
      refreshTree();
      refreshBoxes();
      renderProps();
    });
    window.addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
    setTool("select");
    renderTabs();
  }

  function layoutView() {
    const vp = $("stViewport").getBoundingClientRect();
    const view = $("view");
    view.style.left = vp.left + "px";
    view.style.top = vp.top + "px";
    view.style.width = vp.width + "px";
    view.style.height = vp.height + "px";
    if (mod && vp.width > 0 && vp.height > 0) {
      try { mod.ccall("rblx_resize", null, ["number", "number"], [Math.round(vp.width), Math.round(vp.height)]); } catch (_) {}
    }
  }

  // ------------------------------------------------------------- boot
  async function boot(c) {
    core = c;
    const q = new URLSearchParams(location.search);
    const id = q.get("studio");
    if (!id || id === "1") { document.title = "Bloxro Studio"; startPage(); return; }
    game = await Games.get(id).catch(() => null);
    if (!game) { document.title = "Bloxro Studio"; startPage(); return; }
    document.title = game.name + " - Bloxro Studio";
    buildUi();
    $("stName").value = game.name;
    $("stSaved").textContent = "Saved";
    window.__rblxLogHook = onEngineLog;
    layoutView();
    new ResizeObserver(layoutView).observe($("stViewport"));
    window.addEventListener("resize", layoutView);
    try {
      mod = await core.ensureModule();
      if (typeof mod._rblx_studio_cmd !== "function") throw new Error("This engine build has no Studio support yet.");
      mod.rblxStudioResult = (rid, ok, text) => {
        const p = pending.get(rid);
        if (!p) return;
        pending.delete(rid);
        if (!ok) { p.reject(new Error(text)); return; }
        let v = text;
        try { v = JSON.parse(text); } catch (_) {}
        p.resolve(v);
      };
      mod.rblxStudioBytes = (rid, ptr, len) => {
        const p = pending.get(rid);
        if (!p) return;
        pending.delete(rid);
        p.resolve(mod.HEAPU8.slice(ptr, ptr + len));
      };
      mod.ccall("rblx_set_studio_mode", null, ["number"], [1]);
      if (typeof mod._rblx_set_script_year === "function") mod.ccall("rblx_set_script_year", null, ["number"], [2016]);
      if (typeof mod._rblx_set_xbox_mode === "function") mod.ccall("rblx_set_xbox_mode", null, ["number"], [0]);
      let bytes = game.bytes;
      if (window.PlaceFix) bytes = window.PlaceFix.upgrade(bytes).bytes;
      const ptr = mod._malloc(bytes.length);
      mod.HEAPU8.set(bytes, ptr);
      const rc = mod.ccall("rblx_start_place", "number", ["number", "number", "string", "string", "number"],
        [ptr, bytes.length, "Studio", new URL(".", location.href).href, 0]);
      mod._free(ptr);
      if (rc !== 0) throw new Error("the engine could not open this place (" + rc + ")");
      await core.configureAssetProxy(mod);
      core.applyRenderOptions(mod);
      layoutView();
      let lastFrame = 0, dead = false;
      const step = () => {
        if (dead) return;
        lastFrame = performance.now();
        try { mod.ccall("rblx_frame", null, [], []); } catch (e) {
          if (core.isEngineTrap(e)) { dead = true; core.engineCrashed(e); return; }
          console.warn(e);
        }
        if (ready) { moveCamera(); sendCamera(); }
        drawOverlay();
      };
      const frame = () => { step(); requestAnimationFrame(frame); };
      requestAnimationFrame(frame);
      // Background tabs get no animation frames; keep answering commands.
      setInterval(() => { if (performance.now() - lastFrame > 400) step(); }, 250);
      mod.ccall("rblx_load_place", "number", [], []);
      // The first command resolves once the place is in.
      const r = await lua(STUDIO_LUA);
      if (!r || r[0] !== "ready") throw new Error("the Studio scripts did not start");
      const c0 = await bsJson("camera()");
      if (c0) {
        cam.pos = c0.slice(0, 3);
        const l = c0.slice(3, 6);
        cam.yaw = Math.atan2(-l[0], -l[2]);
        cam.pitch = Math.asin(Math.max(-1, Math.min(1, l[1])));
      }
      updateUndo(await cmd("hist", "reset").catch(() => null));
      await loadKids(0);
      const ws = (kids.get(0) || []).map((i) => nodes.get(i)).find((n) => n.cls === "Workspace");
      if (ws) { expanded.add(ws.id); await loadKids(ws.id); }
      renderTree();
      renderProps();
      installViewportInput();
      installKeys();
      ready = true;
      $("stLoading").style.display = "none";
      log("Bloxro Studio ready. Editing \"" + game.name + "\".", "i");
    } catch (e) {
      $("stLoading").textContent = "Studio could not start: " + (e && e.message || e);
      console.error(e);
    }
  }

  window.BloxroStudio = { boot, Games };
  // Console access for debugging.
  window.__studio = { cmd: (...a) => cmd(...a), lua: (c, o) => lua(c, o), get selection() { return selection; },
    get boxes() { return boxes; }, cam, nodes, kids, project, gizmoHandles, hitHandle, get drag() { return drag; } };
})();
