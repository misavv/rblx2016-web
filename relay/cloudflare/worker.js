/* Multiplayer relay for the Roblox 2016 web port (Cloudflare Worker).
 *
 * The site itself can live anywhere (Vercel, GitHub Pages...). Browsers there
 * open a WebSocket to  wss://<this worker>/mp/<room>?role=host|player  and
 * this relay forwards the engines' RakNet datagrams between them. One Durable
 * Object per room keeps everyone in that room on the same instance.
 *
 * Protocol (same as webserve.py and relay/node/server.js):
 *   binary up   : repeated [u32 dstIp][u16 dstPort][u16 srcPort][u16 len][data]
 *   binary down : repeated [u32 srcIp][u16 srcPort][u16 dstPort][u16 len][data]
 *   text        : JSON control (welcome / host / hello / info / bye / error)
 *   reconnect   : ?ip=<welcome.ip>&key=<welcome.key> gets the same address back
 */
const MAX_ROOM = 50;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/mp\/([^/]{1,64})\/?$/);
    if (m) {
      if (request.headers.get("Upgrade") !== "websocket")
        return new Response("Expected a WebSocket upgrade.", { status: 426 });
      const room = decodeURIComponent(m[1]);
      const stub = env.ROOM.get(env.ROOM.idFromName(room));
      return stub.fetch(request);
    }
    if (url.pathname === "/" || url.pathname === "/health")
      return new Response("Roblox 2016 multiplayer relay: OK\n", { headers: { "Content-Type": "text/plain" } });
    return new Response("Not found", { status: 404 });
  },
};

const HOST_GRACE_MS = 10000;  // a host that drops may reconnect within this

function randomKey() {
  const b = new Uint8Array(12); crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

export class Room {
  constructor(state, env) {
    this.state = state;
    this.next = 2;
    this.conns = new Map();   // ip -> { ws, ip, role }
    this.keys = new Map();    // ip -> reconnect key
    this.host = 0;
    this.hostTimer = null;
    this.hellos = new Map();  // ip -> hello message (replayed to a new host)
    this.info = {};
  }

  async fetch(request) {
    const params = new URL(request.url).searchParams;
    const role = params.get("role") === "host" ? "host" : "player";
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    const text = (ws, obj) => { try { ws.send(JSON.stringify(obj)); } catch (_) {} };
    const reply = () => new Response(null, { status: 101, webSocket: client });

    // Reconnect: same address back if the key matches.
    const wantIp = Number(params.get("ip")) >>> 0, wantKey = params.get("key") || "";
    const known = this.keys.get(wantIp);
    const reclaim = !!(wantIp && wantKey && (known ? known === wantKey : !this.conns.has(wantIp)) &&
      (role !== "host" || !this.host || this.host === wantIp));
    if (!reclaim) {
      if (this.conns.size >= MAX_ROOM) { text(server, { t: "error", msg: "room is full" }); server.close(1008, "full"); return reply(); }
      if (role === "host" && this.host) { text(server, { t: "error", msg: "this room already has a host" }); server.close(1008, "host"); return reply(); }
    }
    const ip = reclaim ? wantIp : ((10 << 24) | this.next++) >>> 0;
    if (reclaim) this.next = Math.max(this.next, (ip & 0xffffff) + 1);
    const old = this.conns.get(ip);
    if (old) { old.replaced = true; try { old.ws.close(1000, "replaced"); } catch (_) {} }
    const key = known && reclaim ? known : randomKey();
    this.keys.set(ip, key);
    const c = { ws: server, ip, role };
    this.conns.set(ip, c);
    if (role === "host") {
      if (this.hostTimer) { clearTimeout(this.hostTimer); this.hostTimer = null; }
      this.host = ip;
    }
    text(server, { t: "welcome", ip, key, host: this.host, info: this.info, players: this.conns.size });
    if (role === "host") {
      for (const o of this.conns.values()) if (o !== c) text(o.ws, { t: "host", ip });
      for (const h of this.hellos.values()) text(server, h);
    }

    server.addEventListener("message", (ev) => {
      const data = ev.data;
      if (typeof data === "string") {
        let msg; try { msg = JSON.parse(data); } catch (_) { return; }
        if (msg.t === "hello") {
          const h = { t: "hello", from: ip, name: String(msg.name || "").slice(0, 32), spec: String(msg.spec || "").slice(0, 4000) };
          this.hellos.set(ip, h);
          const host = this.conns.get(this.host);
          if (host) text(host.ws, h);
        } else if (msg.t === "info" && role === "host") {
          this.info = {};
          for (const k of ["place", "file", "players", "year"]) if (k in msg) this.info[k] = msg[k];
          for (const o of this.conns.values()) if (o !== c) text(o.ws, { t: "info", info: this.info });
        }
        return;
      }
      // Binary: regroup the datagrams per destination and rewrite headers.
      const bytes = new Uint8Array(data);
      const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const out = new Map();
      let i = 0;
      while (i + 10 <= bytes.length) {
        const dst = dv.getUint32(i, true), dport = dv.getUint16(i + 4, true),
              sport = dv.getUint16(i + 6, true), len = dv.getUint16(i + 8, true);
        const payload = bytes.subarray(i + 10, i + 10 + len);
        i += 10 + len;
        let list = out.get(dst);
        if (!list) out.set(dst, list = []);
        list.push([sport, dport, payload]);
      }
      for (const [dst, list] of out) {
        const t = this.conns.get(dst);
        if (!t) continue;
        let size = 0;
        for (const [, , p] of list) size += 10 + p.length;
        const buf = new Uint8Array(size), odv = new DataView(buf.buffer);
        let o = 0;
        for (const [sport, dport, p] of list) {
          odv.setUint32(o, ip, true); odv.setUint16(o + 4, sport, true);
          odv.setUint16(o + 6, dport, true); odv.setUint16(o + 8, p.length, true);
          buf.set(p, o + 10); o += 10 + p.length;
        }
        try { t.ws.send(buf); } catch (_) {}
      }
    });

    const gone = () => {
      if (c.replaced || this.conns.get(ip) !== c) return;
      this.conns.delete(ip);
      if (this.host === ip) {
        // Give the host a moment to reconnect before telling everyone.
        this.hostTimer = setTimeout(() => {
          this.hostTimer = null;
          if (this.host === ip && !this.conns.has(ip)) {
            this.host = 0; this.info = {};
            for (const o of this.conns.values()) text(o.ws, { t: "host", ip: 0 });
          }
        }, HOST_GRACE_MS);
      } else {
        this.hellos.delete(ip);
        const host = this.conns.get(this.host);
        if (host) text(host.ws, { t: "bye", from: ip });
      }
    };
    server.addEventListener("close", gone);
    server.addEventListener("error", gone);
    return reply();
  }
}
