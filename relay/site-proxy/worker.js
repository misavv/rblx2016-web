/* blox.lhs.lol -> the game site on Vercel.
 *
 * The site itself is deployed on Vercel (site/ in the repository). This
 * Worker puts it on a domain in your Cloudflare account: every request is
 * passed to UPSTREAM unchanged (path, query, method, body) and the answer is
 * streamed back with its headers, including the cross-origin isolation
 * headers the engine needs. Nothing is stored here.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const upstream = new URL(env.UPSTREAM || "https://archivieblocks.vercel.app");
    url.protocol = upstream.protocol;
    url.hostname = upstream.hostname;
    url.port = upstream.port;
    const headers = new Headers(request.headers);
    headers.delete("host");
    const init = { method: request.method, headers, redirect: "manual" };
    if (request.method !== "GET" && request.method !== "HEAD") init.body = request.body;
    const response = await fetch(url.toString(), init);
    const out = new Headers(response.headers);
    // Keep redirects on this domain.
    const loc = out.get("location");
    if (loc && loc.startsWith(upstream.origin)) out.set("location", loc.slice(upstream.origin.length) || "/");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: out });
  },
};
