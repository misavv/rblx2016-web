/* Cross-origin isolation + local asset store for static hosting.
 *
 * The engine is built with pthreads, so the page needs SharedArrayBuffer,
 * which browsers only expose to cross-origin isolated pages. On a host that
 * cannot send COOP/COEP (GitHub Pages) this worker adds the headers and
 * reloads the page once.
 *
 * It also answers /asset/?id=N from web/assets/<id>.gz, the packed copy of
 * every mesh and texture the bundled places and catalog accessories use.
 * Ids outside the pack are fetched through the Worker from asset-proxy.json
 * (unless a local server is answering). Responses are cached so later visits
 * (and offline) are instant.
 */
const ASSET_CACHE = "rblx2016-assets";
let assetIndex = null;
let proxyBase;
let localServer;

async function packedAssetIds() {
  if (assetIndex) return assetIndex;
  try {
    const response = await fetch(new URL("assets/index.json", self.registration.scope), { cache: "no-cache" });
    assetIndex = new Set(response.ok ? (await response.json()).ids || [] : []);
  } catch (_) {
    assetIndex = new Set();
  }
  return assetIndex;
}

async function gunzip(response) {
  if (typeof DecompressionStream === "undefined" || !response.body) return response.arrayBuffer();
  const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

function withIsolationHeaders(response) {
  if (response.status === 0) return response;
  const headers = new Headers(response.headers);
  // fetch() already decoded the body, so the original encoding and length no
  // longer describe it (GitHub Pages gzips XML/text files).
  headers.delete("Content-Encoding");
  headers.delete("Content-Length");
  headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
}

function isAssetRequest(event) {
  const url = new URL(event.request.url);
  return event.request.method === "GET" && url.pathname.toLowerCase().replace(/\/+$/, "").endsWith("/asset") &&
    /^\d{1,20}$/.test(url.searchParams.get("id") || url.searchParams.get("assetId") || "");
}

async function servePackedAsset(event) {
  const url = new URL(event.request.url);
  // A project page lives under /<repo>/, so match the path suffix.
  const path = url.pathname.toLowerCase().replace(/\/+$/, "");
  if (!path.endsWith("/asset")) return null;
  const id = url.searchParams.get("id") || url.searchParams.get("assetId");
  if (!id || !/^\d{1,20}$/.test(id)) return null;
  if (!(await packedAssetIds()).has(id)) return null;
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(event.request);
  if (cached) return cached;
  try {
    const packed = await fetch(new URL("assets/" + id + ".gz", self.registration.scope));
    if (!packed.ok) return null;
    const body = await gunzip(packed);
    const response = new Response(body, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
    await cache.put(event.request, response.clone());
    return response;
  } catch (_) {
    return null;
  }
}

async function assetProxyBase() {
  if (proxyBase !== undefined) return proxyBase;
  try {
    const response = await fetch(new URL("asset-proxy.json", self.registration.scope), { cache: "no-cache" });
    proxyBase = response.ok ? ((await response.json()).base || "") : "";
  } catch (_) {
    proxyBase = "";
  }
  return proxyBase;
}

async function hasLocalServer() {
  if (localServer !== undefined) return localServer;
  try {
    localServer = (await fetch(new URL("cookie", self.registration.scope), { cache: "no-store" })).ok;
  } catch (_) {
    localServer = false;
  }
  return localServer;
}

// The pack covers the bundled places and the old catalog; anything else
// (new hats, updated meshes) comes from the Worker that holds the session.
async function serveProxiedAsset(event) {
  const url = new URL(event.request.url);
  const path = url.pathname.toLowerCase().replace(/\/+$/, "");
  if (!path.endsWith("/asset")) return null;
  const id = url.searchParams.get("id") || url.searchParams.get("assetId");
  if (!id || !/^\d{1,20}$/.test(id)) return null;
  if (await hasLocalServer()) return null;
  const base = await assetProxyBase();
  if (!base) return null;
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(event.request);
  if (cached) return cached;
  try {
    const response = await fetch(base.replace(/\/+$/, "") + "/asset?id=" + id);
    // A proxy that refuses (expired session: 401/403) won't start working
    // mid-visit; stop asking it, so missing assets fail at once.
    if (response.status === 401 || response.status === 403) proxyBase = "";
    if (!response.ok) return null;
    const body = await response.arrayBuffer();
    const stored = new Response(body, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
    await cache.put(event.request, stored.clone());
    return stored;
  } catch (_) {
    return null;
  }
}

// Pictures the page saves (POST __thumb?file=NAME: the Xbox menu's avatar
// render, package pictures). webserve.py writes them to web/thumbs/; on a
// static host they are kept here, in this browser, and served back at
// thumbs/NAME.png|jpg, with thumbs/index.json extended to list them.
const THUMB_CACHE = "rblx2016-thumbs";
const THUMB_INDEX = "__rblx2016_thumb_index";

async function saveThumb(event) {
  const request = event.request;
  if (request.method !== "POST") return null;
  const url = new URL(request.url);
  if (!url.pathname.toLowerCase().replace(/\/+$/, "").endsWith("/__thumb")) return null;
  const name = url.searchParams.get("file") || "";
  if (!/^[\w .()-]{1,120}$/.test(name)) return new Response("bad name", { status: 400 });
  const body = new Uint8Array(await request.arrayBuffer());
  const png = body[0] === 0x89 && body[1] === 0x50, jpg = body[0] === 0xff && body[1] === 0xd8;
  if (!png && !jpg) return new Response("not an image", { status: 400 });
  const ext = png ? ".png" : ".jpg";
  const cache = await caches.open(THUMB_CACHE);
  const key = new URL("thumbs/" + name + ext, self.registration.scope).href;
  await cache.put(key, new Response(body, { headers: { "Content-Type": png ? "image/png" : "image/jpeg", "Cache-Control": "no-cache" } }));
  const idxKey = new URL(THUMB_INDEX, self.registration.scope).href;
  let index = {};
  try { const r = await cache.match(idxKey); if (r) index = await r.json(); } catch (_) {}
  index[name] = "thumbs/" + name + ext;
  await cache.put(idxKey, new Response(JSON.stringify(index), { headers: { "Content-Type": "application/json" } }));
  return new Response("ok", { headers: { "Content-Type": "text/plain" } });
}

async function serveThumb(event) {
  const request = event.request;
  if (request.method !== "GET") return null;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname + "thumbs/")) return null;
  const cache = await caches.open(THUMB_CACHE);
  if (url.pathname.endsWith("/thumbs/index.json")) {
    const local = await cache.match(new URL(THUMB_INDEX, self.registration.scope).href);
    if (!local) return null;
    let index = {};
    try { const r = await fetch(request); if (r.ok) index = await r.json(); } catch (_) {}
    Object.assign(index, await local.json());
    return new Response(JSON.stringify(index), { headers: { "Content-Type": "application/json" } });
  }
  return (await cache.match(url.origin + url.pathname)) || null;
}

if (typeof window === "undefined") {
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
  self.addEventListener("fetch", (event) => {
    const request = event.request;
    if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;
    event.respondWith(
      (async () => {
        try {
          const saved = await saveThumb(event);
          if (saved) return withIsolationHeaders(saved);
          const thumb = await serveThumb(event);
          if (thumb) return withIsolationHeaders(thumb);
          const packed = await servePackedAsset(event);
          if (packed) return withIsolationHeaders(packed);
          const proxied = await serveProxiedAsset(event);
          if (proxied) return withIsolationHeaders(proxied);
          // Not bundled and no proxy: answer at once instead of asking the
          // static host (which has no /asset route) for every retry.
          if (isAssetRequest(event)) return withIsolationHeaders(new Response("", { status: 404 }));
          return withIsolationHeaders(await fetch(request));
        } catch (_) {
          return Response.error();
        }
      })(),
    );
  });
} else if (window.isSecureContext && navigator.serviceWorker &&
           !/^(127\.0\.0\.1|localhost|\[::1\])$/.test(location.hostname)) {
  // Hosts that send the isolation headers themselves (Vercel's vercel.json)
  // still need the worker: it serves the packed assets (/asset/?id=N). It
  // takes control as soon as it activates (clients.claim), so no reload.
  // Without the headers (GitHub Pages) it also provides isolation, which
  // needs one reload.
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("coi-serviceworker.js").then((registration) => {
      if (window.crossOriginIsolated) return;
      if (sessionStorage.getItem("rblx2016.coi-reloaded") === "1") return;
      const reload = () => {
        sessionStorage.setItem("rblx2016.coi-reloaded", "1");
        location.reload();
      };
      if (registration.active) reload();
      else if (registration.installing || registration.waiting) {
        navigator.serviceWorker.ready.then(reload);
      }
    }).catch((error) => console.warn("[rbx2016] service worker unavailable:", error));
  });
}
