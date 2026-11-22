// Multiplayer relay for the Roblox 2016 web port (Node.js).
// Runs anywhere Node runs (Render, Fly.io, Railway, a VPS, your PC).
//   npm install && node server.js        (PORT env var, default 8787)
// Point the site at it with mp-relay.json: {"url": "wss://your-relay.example"}
// Protocol: see relay/cloudflare/worker.js (identical).
"use strict";
const http = require("http");
const { WebSocketServer } = require("ws");

const PORT = Number(process.env.PORT) || 8787;
const MAX_ROOM = 50;
const rooms = new Map(); // name -> { next, conns: Map<ip, conn>, host, hellos: Map, info }

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Roblox 2016 multiplayer relay: OK\n");
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 4 << 20 });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, "http://x");
  const m = url.pathname.match(/^\/mp\/([^/]{1,64})\/?$/);
  if (!m) { socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, (ws) => join(ws, decodeURIComponent(m[1]),
    url.searchParams.get("role") === "host" ? "host" : "player"));
});

function text(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch (_) {} }

function join(ws, name, role) {
  let room = rooms.get(name);
  if (!room) rooms.set(name, room = { next: 2, conns: new Map(), host: 0, hellos: new Map(), info: {} });
  if (room.conns.size >= MAX_ROOM) { text(ws, { t: "error", msg: "room is full" }); ws.close(); return; }
  if (role === "host" && room.host) { text(ws, { t: "error", msg: "this room already has a host" }); ws.close(); return; }
  const c = { ws, ip: ((10 << 24) | room.next++) >>> 0, role };
  room.conns.set(c.ip, c);
  if (role === "host") room.host = c.ip;
  text(ws, { t: "welcome", ip: c.ip, host: room.host, info: room.info, players: room.conns.size });
  if (role === "host") {
    for (const o of room.conns.values()) if (o !== c) text(o.ws, { t: "host", ip: c.ip });
    for (const h of room.hellos.values()) text(ws, h);
  }

  ws.on("message", (data, isBinary) => {
    if (!isBinary) {
      let msg; try { msg = JSON.parse(data.toString()); } catch (_) { return; }
      if (msg.t === "hello") {
        const h = { t: "hello", from: c.ip, name: String(msg.name || "").slice(0, 32), spec: String(msg.spec || "").slice(0, 4000) };
        room.hellos.set(c.ip, h);
        const host = room.conns.get(room.host);
        if (host) text(host.ws, h);
      } else if (msg.t === "info" && c.role === "host") {
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
      hdr.writeUInt32LE(c.ip, 0); hdr.writeUInt16LE(sport, 4);
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
    if (!room.conns.delete(c.ip)) return;
    room.hellos.delete(c.ip);
    if (room.host === c.ip) {
      room.host = 0; room.info = {};
      for (const o of room.conns.values()) text(o.ws, { t: "host", ip: 0 });
    } else {
      const host = room.conns.get(room.host);
      if (host) text(host.ws, { t: "bye", from: c.ip });
    }
    if (!room.conns.size) rooms.delete(name);
  };
  ws.on("close", gone);
  ws.on("error", gone);
}

server.listen(PORT, () => console.log("relay listening on :" + PORT));
