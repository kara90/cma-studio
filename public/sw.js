/**
 * CMA Studio service worker — deliberately CONSERVATIVE.
 *
 * SECURITY RULES (locked — see the project's locked invariants):
 *   • /api/* is NEVER cached or intercepted — auth, renders, billing and the
 *     user's fal traffic always hit the network, always fresh.
 *   • HTML navigations are network-first (a deploy is visible on next load);
 *     when the network is down we show a branded offline screen that is
 *     INLINED here, so it can never break on a build-hash change.
 *   • Only same-origin, hash-named immutable assets (/_next/static, /icons,
 *     /clips, fonts, images) are cached, cache-first — they can never go stale
 *     because their filenames change on every build.
 */
// Bump this on any change that must reach already-installed clients: a new
// VERSION reinstalls the worker, drops every old cache, and claims all tabs.
const VERSION = 'cma-sw-v4';
const STATIC_CACHE = `${VERSION}-static`;

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<title>Offline — CMA Studio</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#05060a;color:#f4efe6;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;text-align:center}
  .card{padding:40px 28px;max-width:340px}
  .ring{width:64px;height:64px;margin:0 auto 22px;border-radius:9999px;
    border:2px solid rgba(188,152,99,.5);display:flex;align-items:center;justify-content:center}
  .dot{width:22px;height:22px;border-radius:9999px;background:radial-gradient(circle at 35% 35%,#e7cfa3,#bc9863)}
  h1{font-size:20px;font-weight:700;letter-spacing:-.02em;margin:0 0 10px}
  p{font-size:14px;line-height:1.65;color:#8b8f99;margin:0 0 24px}
  button{cursor:pointer;border:0;border-radius:12px;padding:12px 26px;font-size:14px;font-weight:600;color:#000;
    background:linear-gradient(to bottom,#e7cfa3,#bc9863)}
</style></head>
<body><div class="card">
  <div class="ring"><div class="dot"></div></div>
  <h1>You're off the grid.</h1>
  <p>CMA Studio needs a connection to reach the models and your library. Reconnect and roll again.</p>
  <button onclick="location.reload()">Retry</button>
</div></body></html>`;

// Only hash-named immutable assets are cache-first. The favicon and app icons
// are NOT cached here so a logo change is never masked by a stale cached icon.
const CACHEABLE = /^\/(_next\/static\/|clips\/)/;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(STATIC_CACHE));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch cross-origin (fal, supabase, stripe…)
  if (url.pathname.startsWith('/api/')) return; // hard rule: APIs are never intercepted

  // Navigations: ALWAYS fresh. cache:'reload' bypasses the browser HTTP cache
  // so a new deploy is never masked by a stale cached page. Branded offline
  // screen only when the network is truly unreachable.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req, { cache: 'reload' }).catch(() =>
        fetch(req).catch(() => new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })),
      ),
    );
    return;
  }

  // Immutable static assets: cache first.
  if (CACHEABLE.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })(),
    );
  }
});
