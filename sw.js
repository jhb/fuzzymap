// SPDX-License-Identifier: AGPL-3.0-or-later – Copyright (C) 2026 die Autorinnen und Autoren von fuzzymap
// Service Worker (Vanilla JS – in PyScript nicht möglich): Offline-Cache.
const CACHE = "fuzzymap-v46";
// Alles, was die App beim Start braucht – liegt vollständig im eigenen Verzeichnis (vendor/).
// Damit ist die App schon nach dem ersten Laden komplett offline nutzbar.
const CORE = [
  "./", "./index.html", "./style.css", "./main.mpy", "./manifest.webmanifest",
  "./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png",
  "./vendor/fonts/fonts.css",
  "./vendor/fonts/plus-jakarta-sans-latin-400.woff2", "./vendor/fonts/plus-jakarta-sans-latin-500.woff2",
  "./vendor/fonts/plus-jakarta-sans-latin-700.woff2",
  "./vendor/pyscript/core.js", "./vendor/pyscript/core.css", "./vendor/pyscript/core-7nKZylPm.js",
  "./vendor/pyscript/deprecations-manager-UP6tbwFz.js", "./vendor/pyscript/donkey-e7O5G-23.js",
  "./vendor/pyscript/error-rn9rvhrW.js", "./vendor/pyscript/py-editor-CkR6M58-.js",
  "./vendor/pyscript/py-game-Db5sMM1q.js", "./vendor/pyscript/py-terminal-DywECqks.js",
  "./vendor/micropython/micropython.mjs", "./vendor/micropython/micropython.wasm"
];

self.addEventListener("install", (e) => {
  // cache: "reload" umgeht den HTTP-Cache des Browsers – sonst könnten alte Dateien in den neuen Cache geraten.
  e.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(CORE.map((u) => c.add(new Request(u, { cache: "reload" }))))));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// Stale-while-revalidate: sofort aus dem Cache, im Hintergrund aktualisieren.
// So werden auch nachgeladene PyScript-/MicroPython-Dateien offline verfügbar.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const hit = await cache.match(e.request);
    const net = fetch(e.request).then((res) => {
      if (res && (res.ok || res.type === "opaque")) cache.put(e.request, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
