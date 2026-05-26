// KPKP Service Worker — network-first strategy
// The SW exists for PWA installability. We do NOT cache HTML pages because
// Vercel deployments change JS chunk names, causing stale-cache load errors.

const CACHE = 'kpkp-v3'

// Only cache truly static, content-hashed assets that never change
const PRECACHE = [
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/manifest.json',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      // allSettled: a missing icon won't block the SW install
      .then(c => Promise.allSettled(PRECACHE.map(url => c.add(url))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    // Delete all old cache versions
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // API routes — always network, never cache
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(request))
    return
  }

  // HTML page navigations — always network-first, fall back to cache only if offline
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(request, clone))
          }
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Static assets (icons, manifest) — cache-first (they are content-hashed or rarely change)
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
        }
        return res
      })
    })
  )
})
