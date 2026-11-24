/* Multiplayer transport for the 2016 engine in the browser.
 *
 * The engine runs real 2016 replication (NetworkServer / NetworkClient over
 * RakNet). RakNet's UDP sockets are virtual (port/src/WebClient/vudp.cpp);
 * this file moves those datagrams between the engine and a WebSocket relay
 * (webserve.py locally, cloudflare/worker.js or relay/node/server.js online).
 *
 *   RblxNet.open(relay, room, role)  -> connection (welcome = {ip, key, host, info})
 *   RblxNet.attach(mod, conn)        -> pumps datagrams engine <-> relay
 *
 * Two things keep games smooth:
 *   - In-page loopback: the host's own player and the host's server live in
 *     the same page (the server in a hidden frame), so datagrams between them
 *     are handed over directly instead of going out to the relay and back.
 *   - Reconnect: if the relay connection drops (some hosts cut WebSockets
 *     after a few minutes), it reconnects with the same address and key, so
 *     RakNet never notices beyond a short hiccup.
 *
 * Wire format (little endian):
 *   up   (page -> relay): repeated [u32 dstIp][u16 dstPort][u16 srcPort][u16 len][data]
 *   down (relay -> page): repeated [u32 srcIp][u16 srcPort][u16 dstPort][u16 len][data]
 * Text frames carry JSON control messages.
 */
(function () {
  "use strict";

  const GAME_PORT = 53640;  // the port 2016 game servers listened on

  function relayUrl(relay, room, role, ip, key) {
    let base = (relay || location.origin).trim().replace(/\/+$/, "");
    if (!/^wss?:\/\//i.test(base)) base = base.replace(/^http/i, "ws");
    if (!/^wss?:\/\//i.test(base)) base = (location.protocol === "https:" ? "wss://" : "ws://") + base;
    let url = base + "/mp/" + encodeURIComponent(room || "lobby") + "?role=" + role;
    if (ip && key) url += "&ip=" + (ip >>> 0) + "&key=" + encodeURIComponent(key);
    return url;
  }

  function ipString(ip) {
    return [ip >>> 24, (ip >>> 16) & 255, (ip >>> 8) & 255, ip & 255].join(".");
  }

  // Engines in this page (the player and, for the host, the server frame)
  // register here so datagrams between them skip the relay.
  function localBus() {
    try {
      const top = window.top;
      return top.__rblxNetBus || (top.__rblxNetBus = new Map());
    } catch (_) {
      return window.__rblxNetBus || (window.__rblxNetBus = new Map());
    }
  }

  // Opens the relay socket and resolves once the relay has assigned an address.
  function open(relay, room, role) {
    return new Promise((resolve, reject) => {
      const conn = {
        ws: null, relay, room, role,
        ip: 0, key: "", host: 0, info: {},
        listeners: {},
        sticky: {},   // control messages re-sent after a reconnect (hello / info)
        closed: false,
        reconnects: 0,
        retryUntil: 0,
        on(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
        emit(type, msg) { (this.listeners[type] || []).forEach((fn) => { try { fn(msg); } catch (e) { console.warn(e); } }); },
        send(obj) {
          if (obj && (obj.t === "hello" || obj.t === "info")) this.sticky[obj.t] = obj;
          if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(obj));
        },
        close() { this.closed = true; try { this.ws && this.ws.close(); } catch (_) {} },
        // Resolves with the host's address (now, or once a host appears).
        waitHost(timeoutMs) {
          if (this.host) return Promise.resolve(this.host);
          return new Promise((res, rej) => {
            const t = setTimeout(() => rej(new Error("No game server appeared in this room.")), timeoutMs || 120000);
            this.on("host", (m) => { if (m.ip) { clearTimeout(t); res(m.ip); } });
            this.on("closed", () => { clearTimeout(t); rej(new Error("Lost the connection to the relay.")); });
          });
        },
        onBinary: null,
      };

      let settled = false;
      const fail = (msg) => {
        if (!settled) { settled = true; reject(new Error(msg)); }
      };

      // One socket; on an unexpected close after the first welcome, a new
      // socket takes over with the same address.
      const connect = (isRetry) => {
        let ws;
        try { ws = new WebSocket(relayUrl(relay, room, role, conn.ip, conn.key)); }
        catch (e) { if (!isRetry) fail(String(e)); return; }
        ws.binaryType = "arraybuffer";
        let welcomed = false;
        const timer = setTimeout(() => {
          if (!welcomed) { try { ws.close(); } catch (_) {} if (!isRetry) fail("The multiplayer relay did not answer."); }
        }, 10000);
        ws.onmessage = (ev) => {
          if (typeof ev.data !== "string") {
            if (conn.onBinary) conn.onBinary(new Uint8Array(ev.data));
            return;
          }
          let msg;
          try { msg = JSON.parse(ev.data); } catch (_) { return; }
          if (msg.t === "welcome") {
            welcomed = true;
            clearTimeout(timer);
            const firstIp = conn.ip;
            conn.ws = ws;
            conn.ip = msg.ip >>> 0;
            conn.key = msg.key || "";
            conn.host = msg.host >>> 0;
            conn.info = msg.info || {};
            if (isRetry) {
              conn.retryUntil = 0;
              if (firstIp && conn.ip !== firstIp) console.warn("[rbx2016] relay gave a new address after reconnecting");
              conn.reconnects++;
              for (const k of Object.keys(conn.sticky)) ws.send(JSON.stringify(conn.sticky[k]));
              conn.emit("reconnected", msg);
              if (conn.host) conn.emit("host", { t: "host", ip: conn.host });
              console.log("[rbx2016] relay reconnected as", ipString(conn.ip));
            }
            if (!settled) { settled = true; resolve(conn); }
            return;
          }
          if (msg.t === "error") {
            if (!isRetry) fail(msg.msg || "relay error");
            conn.emit("error", msg);
            return;
          }
          if (msg.t === "host") conn.host = msg.ip >>> 0;
          if (msg.t === "info") conn.info = msg.info || {};
          conn.emit(msg.t, msg);
        };
        ws.onerror = () => {
          if (!isRetry && !welcomed) fail("Could not reach the multiplayer relay at " + relayUrl(relay, room, role));
        };
        ws.onclose = () => {
          clearTimeout(timer);
          if (!isRetry && !welcomed) { fail("The multiplayer relay closed the connection."); return; }
          if (welcomed && conn.ws !== ws) return;   // an older socket
          if (conn.closed) { conn.emit("closed", {}); return; }
          // Keep trying for a while; RakNet tolerates a few seconds of silence.
          if (!conn.retryUntil) conn.retryUntil = Date.now() + 30000;
          if (Date.now() > conn.retryUntil) { conn.emit("closed", {}); return; }
          if (welcomed) conn.emit("dropped", {});
          setTimeout(() => { if (!conn.closed) connect(true); }, welcomed ? 100 : 1000);
        };
      };
      connect(false);
    });
  }

  // A private room inside this page: no relay, no WebSocket. The game server
  // frame and the player reach each other over the local bus only. Used to
  // run single-player games on a real 2016 game server.
  function localRooms() {
    try { return window.top.__rblxLocalRooms || (window.top.__rblxLocalRooms = new Map()); }
    catch (_) { return window.__rblxLocalRooms || (window.__rblxLocalRooms = new Map()); }
  }
  function openLocal(room, role) {
    const rooms = localRooms();
    let r = rooms.get(room);
    if (!r) { r = { next: 2, host: 0, hostConn: null, conns: new Set(), hellos: new Map(), info: {} }; rooms.set(room, r); }
    const conn = {
      ws: null, local: true, relay: "local", room, role,
      ip: ((10 << 24) | r.next++) >>> 0, key: "", host: r.host, info: r.info,
      listeners: {}, closed: false, reconnects: 0,
      on(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
      emit(type, msg) { (this.listeners[type] || []).forEach((fn) => { try { fn(msg); } catch (e) { console.warn(e); } }); },
      send(obj) {
        if (!obj) return;
        if (obj.t === "hello") {
          const h = { t: "hello", from: this.ip, name: String(obj.name || "").slice(0, 32), spec: String(obj.spec || "").slice(0, 4000) };
          r.hellos.set(this.ip, h);
          if (r.hostConn && r.hostConn !== this) r.hostConn.emit("hello", h);
        } else if (obj.t === "info" && role === "host") {
          r.info = {};
          for (const k of ["place", "file", "players", "year"]) if (k in obj) r.info[k] = obj[k];
          for (const c of r.conns) if (c !== this) { c.info = r.info; c.emit("info", { t: "info", info: r.info }); }
        }
      },
      close() {
        if (this.closed) return;
        this.closed = true;
        r.conns.delete(this);
        if (r.hostConn === this) {
          r.host = 0; r.hostConn = null;
          for (const c of r.conns) { c.host = 0; c.emit("host", { t: "host", ip: 0 }); }
        }
        if (!r.conns.size) rooms.delete(room);
        this.emit("closed", {});
      },
      waitHost(timeoutMs) {
        if (this.host) return Promise.resolve(this.host);
        return new Promise((res, rej) => {
          const t = setTimeout(() => rej(new Error("The game server did not start.")), timeoutMs || 120000);
          this.on("host", (m) => { if (m.ip) { clearTimeout(t); res(m.ip); } });
        });
      },
      onBinary: null,
    };
    r.conns.add(conn);
    if (role === "host") {
      r.host = conn.ip; r.hostConn = conn; conn.host = conn.ip;
      for (const c of r.conns) if (c !== conn) { c.host = conn.ip; c.emit("host", { t: "host", ip: conn.ip }); }
      for (const h of r.hellos.values()) setTimeout(() => conn.emit("hello", h), 0);
    }
    return Promise.resolve(conn);
  }

  // Engine <-> relay datagram pump.
  function attach(mod, conn) {
    if (typeof mod._rblx_net_take !== "function") throw new Error("This engine build has no network bridge.");
    mod.ccall("rblx_net_set_ip", null, ["number"], [conn.ip >>> 0]);
    const lenPtr = mod._malloc(4);
    let inBuf = 0, inCap = 0;
    const stats = { up: 0, down: 0, upBytes: 0, downBytes: 0, local: 0 };
    conn.stats = stats;
    const bus = localBus();

    // Hands one datagram to this engine.
    const deliver = (src, sport, dport, data) => {
      const len = data.length;
      if (len > inCap) {
        if (inBuf) mod._free(inBuf);
        inCap = Math.max(2048, len);
        inBuf = mod._malloc(inCap);
      }
      mod.HEAPU8.set(data, inBuf);
      mod._rblx_net_push(src, sport, dport, inBuf, len);
      stats.down++; stats.downBytes += len;
    };
    const entry = { deliver, ip: conn.ip >>> 0 };
    bus.set(entry.ip, entry);
    conn.on("reconnected", () => {
      if ((conn.ip >>> 0) === entry.ip) return;
      if (bus.get(entry.ip) === entry) bus.delete(entry.ip);
      entry.ip = conn.ip >>> 0;
      bus.set(entry.ip, entry);
      mod.ccall("rblx_net_set_ip", null, ["number"], [entry.ip]);
    });

    // Batch from the engine: [u32 ip][u16 dport][u16 sport][u16 len][data]...
    const drain = () => {
      for (let guard = 0; guard < 8; guard++) {
        const p = mod._rblx_net_take(lenPtr);
        const n = mod.HEAP32[lenPtr >> 2];
        if (!p || n <= 0) break;
        const heap = mod.HEAPU8;
        const open = conn.ws && conn.ws.readyState === 1;
        if (bus.size < 2) {
          if (open) { conn.ws.send(heap.slice(p, p + n)); stats.up++; stats.upBytes += n; }
          continue;
        }
        // Split: engines in this page get theirs directly, the rest goes out.
        const dv = new DataView(heap.buffer, p, n);
        let i = 0, remote = null, rlen = 0;
        while (i + 10 <= n) {
          const dst = dv.getUint32(i, true), dport = dv.getUint16(i + 4, true),
                sport = dv.getUint16(i + 6, true), len = dv.getUint16(i + 8, true);
          if (i + 10 + len > n) break;
          const target = bus.get(dst >>> 0);
          if (target && target !== entry) {
            target.deliver(entry.ip, sport, dport, heap.slice(p + i + 10, p + i + 10 + len));
            stats.local++;
          } else {
            (remote = remote || []).push(heap.slice(p + i, p + i + 10 + len));
            rlen += 10 + len;
          }
          i += 10 + len;
        }
        if (remote && open) {
          const out = new Uint8Array(rlen);
          let o = 0;
          for (const r of remote) { out.set(r, o); o += r.length; }
          conn.ws.send(out);
          stats.up++; stats.upBytes += rlen;
        }
      }
    };

    conn.onBinary = (bytes) => {
      const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      let i = 0;
      while (i + 10 <= bytes.length) {
        const src = dv.getUint32(i, true), sport = dv.getUint16(i + 4, true),
              dport = dv.getUint16(i + 6, true), len = dv.getUint16(i + 8, true);
        i += 10;
        if (i + len > bytes.length) break;
        deliver(src, sport, dport, bytes.subarray(i, i + len));
        i += len;
      }
      drain();  // replies are often ready right away
    };

    // Wake up as soon as the engine queues a datagram. Atomics.waitAsync is
    // not throttled in background tabs (timers are), which matters for the
    // host, whose server keeps running while its tab is hidden.
    let running = true;
    conn.stop = () => { running = false; if (bus.get(entry.ip) === entry) bus.delete(entry.ip); };
    window.addEventListener("pagehide", () => conn.stop());
    const sigIndex = mod._rblx_net_signal() >> 2;
    if (typeof Atomics.waitAsync === "function") {
      (async () => {
        while (running && !conn.closed) {
          const heap = mod.HEAP32;
          const seen = Atomics.load(heap, sigIndex);
          drain();
          const r = Atomics.waitAsync(heap, sigIndex, seen, 100);
          if (r.async) await r.value;
        }
      })();
    } else {
      const iv = setInterval(() => { if (!running) clearInterval(iv); else drain(); }, 4);
      // Timers are slowed in hidden tabs; a message channel isn't.
      const ch = new MessageChannel();
      let last = 0;
      ch.port1.onmessage = () => {
        if (!running) return;
        drain();
        const now = performance.now();
        if (document.hidden && now - last > 2) { last = now; ch.port2.postMessage(0); }
        else setTimeout(() => ch.port2.postMessage(0), 4);
      };
      ch.port2.postMessage(0);
    }
    return conn;
  }

  window.RblxNet = { open, openLocal, attach, ipString, GAME_PORT };
})();
