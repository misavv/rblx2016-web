# Roblox 2016 in the browser

The 2016 Roblox client engine compiled to WebAssembly, with real 2016-style
multiplayer: the first player in a room hosts the game on a 2016
`NetworkServer` running in their browser, and everyone else joins it as a
`NetworkClient`. Game scripts run once, on the host's server, the way they did
on Roblox's game servers.

## What's in here

| Folder     | What it is                                               | Deploy to |
|------------|----------------------------------------------------------|-----------|
| `site/`    | The game client: engine (`js/`), content, places, menus  | Vercel project 1 |
| `catalog/` | Avatar catalog item files and thumbnails (about 420 MB)  | Vercel project 2 |
| `relay/`   | Multiplayer relay (WebSocket); Vercel can't host these   | Cloudflare Workers, or any Node host |

The site and the catalog are separate projects because a Vercel Hobby deployment
holds at most about 1 GB of static files. The site proxies `/catalog/item/*` and
`/catalog/thumbs/*` to the catalog project, so the browser sees a single site.

## Deploying on Vercel

1. Push this repository to GitHub. A **private** repository works with Vercel.
2. **Catalog project:** in Vercel, choose *Add New → Project*, import the repo, and set
   - Project Name: `archivieblocks-catalog`
   - Root Directory: `catalog`
   - Framework Preset: *Other*, with no build command and output directory `.`

   `site/vercel.json` already points at `https://archivieblocks-catalog.vercel.app`.
   If you pick another name, replace that address in `site/vercel.json` (twice).
   The catalog only redeploys when something in `catalog/` changes.
3. **Site project:** import the same repo again as a second project, with
   - Root Directory: `site`
   - Framework Preset: *Other*, with no build command and output directory `.`
4. Deploy the multiplayer relay (see below) and put its address in
   `site/mp-relay.json`, for example `{ "url": "wss://rblx2016-relay.<you>.workers.dev" }`.
   Commit and push.

`site/vercel.json` sends the `Cross-Origin-Opener-Policy` and
`Cross-Origin-Embedder-Policy` headers. The engine needs these because it runs
on threads (SharedArrayBuffer).

## Multiplayer relay

Browsers can't send UDP, so each engine's RakNet packets are tunnelled over a
WebSocket to a small relay, which forwards them between the players in a room.
The relay never sees game state; it only forwards packets.

Use Cloudflare or a Node host for the relay. A relay on Vercel works only
partly: Vercel ends every WebSocket after about 5 minutes and may split a room
across server instances. Players reconnect automatically after a drop, but
games are smoother on a relay built for long connections.

**Cloudflare Workers (free plan, recommended):**

```
cd relay/cloudflare
npx wrangler login
npx wrangler deploy
```

The relay address is `wss://rblx2016-relay.<your-subdomain>.workers.dev`.

**Any Node 18+ host (Render, Fly.io, Railway, a VPS):**

```
cd relay/node
npm install
PORT=8787 node server.js
```

Put it behind HTTPS so pages can connect with `wss://`.

Players can also paste a relay address into the **Relay URL** box on the play
page, which overrides `mp-relay.json`.

## Playing together

1. Everyone ticks **Play with friends** and types the same **room name**.
2. The first person to press Play hosts the place they picked. Their tab runs
   the server, so keep it open.
3. Everyone who joins that room afterwards plays the host's game, whatever
   place they had selected.

If the host leaves, the server shuts down with them. If the relay connection
drops briefly, everyone reconnects with the same address and keeps playing.

- **One player per computer:** a second tab or window in the same browser
  can't join multiplayer while one is already playing.
- **Chat and name filter:** the host's server censors swear words, slurs and
  personal info (phone numbers, e-mails, links) in chat with `#`, including
  l33t, stretched and spaced-out spellings, and censors player names the same
  way. It covers the classic 2016 chat, the 2017 chat and the Lua APIs
  `Chat:FilterStringAsync`, `FilterStringForBroadcast` and
  `FilterStringForPlayerAsync`.

## Notes

- Places are stored gzipped (`*.rbxl.gz`, unpacked in the browser) to fit the size limit.
- `?play=<place file>` starts a place straight away. `?shell=xbox` opens the Xbox One menu.
- Hosting needs a desktop browser with plenty of memory: the host's tab runs two engines,
  the server and their own client.
