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

export class Room {
  constructor(state, env) {
    this.state = state;
    this.next = 2;
    this.conns = new Map();   // ip -> { ws, ip, role }
    this.host = 0;
    this.hellos = new Map();  // ip -> hello message (replayed to a new host)
    this.info = {};
  }

  async fetch(request) {
    const role = new URL(request.url).searchParams.get("role") === "host" ? "host" : "player";
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    const text = (ws, obj) => { try { ws.send(JSON.stringify(obj)); } catch (_) {} };

    if (this.conns.size >= MAX_ROOM) { text(server, { t: "error", msg: "room is full" }); server.close(1008, "full"); return new Response(null, { status: 101, webSocket: client }); }
    if (role === "host" && this.host) { text(server, { t: "error", msg: "this room already has a host" }); server.close(1008, "host"); return new Response(null, { status: 101, webSocket: client }); }

    const c = { ws: server, ip: ((10 << 24) | this.next++) >>> 0, role };
    this.conns.set(c.ip, c);
    if (role === "host") this.host = c.ip;
    text(server, { t: "welcome", ip: c.ip, host: this.host, info: this.info, players: this.conns.size });
    if (role === "host") {
      for (const o of this.conns.values()) if (o !== c) text(o.ws, { t: "host", ip: c.ip });
      for (const h of this.hellos.values()) text(server, h);
    }

    server.addEventListener("message", (ev) => {
      const data = ev.data;
      if (typeof data === "string") {
        let msg; try { msg = JSON.parse(data); } catch (_) { return; }
        if (msg.t === "hello") {
          const h = { t: "hello", from: c.ip, name: String(msg.name || "").slice(0, 32), spec: String(msg.spec || "").slice(0, 4000) };
          this.hellos.set(c.ip, h);
          const host = this.conns.get(this.host);
          if (host) text(host.ws, h);
        } else if (msg.t === "info" && c.role === "host") {
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
          odv.setUint32(o, c.ip, true); odv.setUint16(o + 4, sport, true);
          odv.setUint16(o + 6, dport, true); odv.setUint16(o + 8, p.length, true);
          buf.set(p, o + 10); o += 10 + p.length;
        }
        try { t.ws.send(buf); } catch (_) {}
      }
    });

    const gone = () => {
      if (!this.conns.has(c.ip)) return;
      this.conns.delete(c.ip);
      this.hellos.delete(c.ip);
      if (this.host === c.ip) {
        this.host = 0; this.info = {};
        for (const o of this.conns.values()) text(o.ws, { t: "host", ip: 0 });
      } else {
        const host = this.conns.get(this.host);
        if (host) text(host.ws, { t: "bye", from: c.ip });
      }
    };
    server.addEventListener("close", gone);
    server.addEventListener("error", gone);
    return new Response(null, { status: 101, webSocket: client });
  }
}
