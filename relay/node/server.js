// Multiplayer relay for the Bloxro 2016 web port (Node.js).
// Runs anywhere Node runs (Render, Fly.io, Railway, a VPS, your PC).
//   npm install && node server.js        (PORT env var, default 8787)
// Point the site at it with mp-relay.json: {"url": "wss://your-relay.example"}
// Protocol: see relay/cloudflare/worker.js (identical).
"use strict";
const http = require("http");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");

const PORT = Number(process.env.PORT) || 8787;
const MAX_ROOM = 50;
const HOST_GRACE_MS = 10000;  // a host that drops may reconnect within this
const rooms = new Map();

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bloxro 2016 multiplayer relay: OK\n");
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 4 << 20 });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, "http://x");
  const m = url.pathname.match(/^\/mp\/([^/]{1,64})\/?$/);
  if (!m) { socket.destroy(); return; }
  socket.setNoDelay(true);
  wss.handleUpgrade(req, socket, head, (ws) => join(ws, decodeURIComponent(m[1]), url.searchParams));
});

function text(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch (_) {} }
function getRoom(name) {
  let room = rooms.get(name);
  if (!room) rooms.set(name, room = { next: 2, conns: new Map(), keys: new Map(), host: 0, hostTimer: null, hellos: new Map(), info: {} });
  return room;
}
function maybeDrop(name, room) {
  if (!room.conns.size && !room.hostTimer) rooms.delete(name);
}

function join(ws, name, params) {
  const role = params.get("role") === "host" ? "host" : "player";
  const room = getRoom(name);
  const wantIp = Number(params.get("ip")) >>> 0, wantKey = params.get("key") || "";
  // Reconnect: same address back, if the key matches (or the relay restarted
  // and has never seen this address).
  const known = room.keys.get(wantIp);
  const reclaim = wantIp && wantKey && (known ? known === wantKey : !room.conns.has(wantIp)) &&
    (role !== "host" || !room.host || room.host === wantIp);
  if (!reclaim) {
    if (room.conns.size >= MAX_ROOM) { text(ws, { t: "error", msg: "room is full" }); ws.close(); return; }
    if (role === "host" && room.host) { text(ws, { t: "error", msg: "this room already has a host" }); ws.close(); return; }
  }
  const ip = reclaim ? wantIp : ((10 << 24) | room.next++) >>> 0;
  if (reclaim) room.next = Math.max(room.next, (ip & 0xffffff) + 1);
  const old = room.conns.get(ip);
  if (old) { old.replaced = true; try { old.ws.close(); } catch (_) {} }
  const key = known && reclaim ? known : crypto.randomBytes(12).toString("hex");
  room.keys.set(ip, key);
  const c = { ws, ip, role };
  room.conns.set(ip, c);
  if (role === "host") {
    if (room.hostTimer) { clearTimeout(room.hostTimer); room.hostTimer = null; }
    room.host = ip;
  }
  text(ws, { t: "welcome", ip, key, host: room.host, info: room.info, players: room.conns.size });
  if (role === "host") {
    for (const o of room.conns.values()) if (o !== c) text(o.ws, { t: "host", ip });
    for (const h of room.hellos.values()) text(ws, h);
  }

  ws.on("message", (data, isBinary) => {
    if (!isBinary) {
      let msg; try { msg = JSON.parse(data.toString()); } catch (_) { return; }
      if (msg.t === "hello") {
        const h = { t: "hello", from: ip, name: String(msg.name || "").slice(0, 32), spec: String(msg.spec || "").slice(0, 4000) };
        room.hellos.set(ip, h);
        const host = room.conns.get(room.host);
        if (host) text(host.ws, h);
      } else if (msg.t === "info" && role === "host") {
        room.info = {};
        for (const k of ["place", "file", "players", "year"]) if (k in msg) room.info[k] = msg[k];
        for (const o of room.conns.values()) if (o !== c) text(o.ws, { t: "info", info: room.info });
      }
      return;
    }
    const buf = Buffer.isBuffer(data) ? data : Buffer.concat(data);
    const out = new Map();
    let i = 0;
    while (i + 10 <= buf.length) {
      const dst = buf.readUInt32LE(i), dport = buf.readUInt16LE(i + 4),
            sport = buf.readUInt16LE(i + 6), len = buf.readUInt16LE(i + 8);
      const payload = buf.subarray(i + 10, i + 10 + len);
      i += 10 + len;
      const hdr = Buffer.alloc(10);
      hdr.writeUInt32LE(ip, 0); hdr.writeUInt16LE(sport, 4);
      hdr.writeUInt16LE(dport, 6); hdr.writeUInt16LE(payload.length, 8);
      let list = out.get(dst);
      if (!list) out.set(dst, list = []);
      list.push(hdr, payload);
    }
    for (const [dst, list] of out) {
      const t = room.conns.get(dst);
      if (t && t.ws.readyState === 1) t.ws.send(Buffer.concat(list));
    }
  });

  const gone = () => {
    if (c.replaced || room.conns.get(ip) !== c) return;
    room.conns.delete(ip);
    if (room.host === ip) {
      // Give the host a moment to reconnect before telling everyone.
      room.hostTimer = setTimeout(() => {
        room.hostTimer = null;
        if (room.host === ip && !room.conns.has(ip)) {
          room.host = 0; room.info = {};
          for (const o of room.conns.values()) text(o.ws, { t: "host", ip: 0 });
        }
        maybeDrop(name, room);
      }, HOST_GRACE_MS);
    } else {
      room.hellos.delete(ip);
      const host = room.conns.get(room.host);
      if (host) text(host.ws, { t: "bye", from: ip });
    }
    maybeDrop(name, room);
  };
  ws.on("close", gone);
  ws.on("error", gone);
}

server.listen(PORT, () => console.log("relay listening on :" + PORT));
