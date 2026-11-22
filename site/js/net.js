/* Multiplayer transport for the 2016 engine in the browser.
 *
 * The engine runs real 2016 replication (NetworkServer / NetworkClient over
 * RakNet). RakNet's UDP sockets are virtual (port/src/WebClient/vudp.cpp);
 * this file moves those datagrams between the engine and a WebSocket relay
 * (webserve.py locally, cloudflare/worker.js or relay/server.js online).
 *
 *   RblxNet.open(relay, room, role)  -> connection (welcome = {ip, host, info})
 *   RblxNet.attach(mod, conn)        -> pumps datagrams engine <-> relay
 *
 * Wire format (little endian):
 *   up   (page -> relay): repeated [u32 dstIp][u16 dstPort][u16 srcPort][u16 len][data]
 *   down (relay -> page): repeated [u32 srcIp][u16 srcPort][u16 dstPort][u16 len][data]
 * Text frames carry JSON control messages.
 */
(function () {
  "use strict";

  const GAME_PORT = 53640;  // the port 2016 game servers listened on

  function relayUrl(relay, room, role) {
    let base = (relay || location.origin).trim().replace(/\/+$/, "");
    if (!/^wss?:\/\//i.test(base)) base = base.replace(/^http/i, "ws");
    if (!/^wss?:\/\//i.test(base)) base = (location.protocol === "https:" ? "wss://" : "ws://") + base;
    return base + "/mp/" + encodeURIComponent(room || "lobby") + "?role=" + role;
  }

  function ipString(ip) {
    return [ip >>> 24, (ip >>> 16) & 255, (ip >>> 8) & 255, ip & 255].join(".");
  }

  // Opens the relay socket and resolves once the relay has assigned an address.
  function open(relay, room, role) {
    return new Promise((resolve, reject) => {
      let ws;
      try { ws = new WebSocket(relayUrl(relay, room, role)); } catch (e) { reject(e); return; }
      ws.binaryType = "arraybuffer";
      const conn = {
        ws, room, role,
        ip: 0, host: 0, info: {},
        listeners: {},
        on(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
        emit(type, msg) { (this.listeners[type] || []).forEach((fn) => { try { fn(msg); } catch (e) { console.warn(e); } }); },
        send(obj) { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); },
        close() { try { ws.close(); } catch (_) {} },
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
      const timer = setTimeout(() => {
        if (!settled) { settled = true; try { ws.close(); } catch (_) {} reject(new Error("The multiplayer relay did not answer.")); }
      }, 10000);
      ws.onmessage = (ev) => {
        if (typeof ev.data !== "string") {
          if (conn.onBinary) conn.onBinary(new Uint8Array(ev.data));
          return;
        }
        let msg;
        try { msg = JSON.parse(ev.data); } catch (_) { return; }
        if (msg.t === "welcome") {
          conn.ip = msg.ip >>> 0;
          conn.host = msg.host >>> 0;
          conn.info = msg.info || {};
          if (!settled) { settled = true; clearTimeout(timer); resolve(conn); }
          return;
        }
        if (msg.t === "error") {
          if (!settled) { settled = true; clearTimeout(timer); reject(new Error(msg.msg || "relay error")); }
          conn.emit("error", msg);
          return;
        }
        if (msg.t === "host") conn.host = msg.ip >>> 0;
        if (msg.t === "info") conn.info = msg.info || {};
        conn.emit(msg.t, msg);
      };
      ws.onerror = () => {
        if (!settled) { settled = true; clearTimeout(timer); reject(new Error("Could not reach the multiplayer relay at " + relayUrl(relay, room, role))); }
      };
      ws.onclose = () => {
        if (!settled) { settled = true; clearTimeout(timer); reject(new Error("The multiplayer relay closed the connection.")); }
        conn.emit("closed", {});
      };
    });
  }

  // Engine <-> relay datagram pump.
  function attach(mod, conn) {
    if (typeof mod._rblx_net_take !== "function") throw new Error("This engine build has no network bridge.");
    mod.ccall("rblx_net_set_ip", null, ["number"], [conn.ip >>> 0]);
    const lenPtr = mod._malloc(4);
    let inBuf = 0, inCap = 0;
    let stats = { up: 0, down: 0, upBytes: 0, downBytes: 0 };
    conn.stats = stats;

    const drain = () => {
      if (conn.ws.readyState !== 1) return;
      for (let guard = 0; guard < 8; guard++) {
        const p = mod._rblx_net_take(lenPtr);
        const n = mod.HEAP32[lenPtr >> 2];
        if (!p || n <= 0) break;
        conn.ws.send(mod.HEAPU8.slice(p, p + n));
        stats.up++; stats.upBytes += n;
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
        if (len > inCap) {
          if (inBuf) mod._free(inBuf);
          inCap = Math.max(2048, len);
          inBuf = mod._malloc(inCap);
        }
        mod.HEAPU8.set(bytes.subarray(i, i + len), inBuf);
        mod._rblx_net_push(src, sport, dport, inBuf, len);
        i += len;
        stats.down++; stats.downBytes += len;
      }
      drain();  // replies are often ready right away
    };

    // Wake up as soon as the engine queues a datagram. Atomics.waitAsync is
    // not throttled in background tabs (timers are), which matters for the
    // host, whose server keeps running while its tab is hidden.
    let running = true;
    conn.stop = () => { running = false; };
    const sigIndex = mod._rblx_net_signal() >> 2;
    if (typeof Atomics.waitAsync === "function") {
      (async () => {
        while (running && conn.ws.readyState <= 1) {
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

  window.RblxNet = { open, attach, ipString, GAME_PORT };
})();
