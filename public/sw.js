/* Quran Complex service worker: shell cache + on-demand page cache */
const SHELL_CACHE = 'qc-shell-v3'
const PAGE_CACHE = 'qc-pages-v1'
const SCOPE = self.registration.scope
const SHELL_ASSETS = [
  SCOPE,
  `${SCOPE}index.html`,
  `${SCOPE}manifest.webmanifest`,
  `${SCOPE}icon.svg`,
  `${SCOPE}icon-192.png`,
  `${SCOPE}icon-512.png`,
  `${SCOPE}apple-touch-icon.png`,
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== PAGE_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

async function fromCacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok || response.type === 'opaque') {
    cache.put(request, response.clone()).catch(() => {})
  }
  return response
}

async function fromNetworkFirst(request) {
  const cache = await caches.open(PAGE_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok || response.type === 'opaque') {
      cache.put(request, response.clone()).catch(() => {})
    }
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) return cached
    throw error
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (url.origin === self.location.origin) {
    event.respondWith(fromCacheFirst(request, SHELL_CACHE))
    return
  }

  if (url.hostname.endsWith('blogger.googleusercontent.com') || url.hostname.endsWith('googleusercontent.com')) {
    event.respondWith(fromNetworkFirst(request))
  }
})

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'CACHE_PAGE' || typeof data.url !== 'string') return

  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => fetch(data.url, { mode: 'no-cors' }).then((response) => cache.put(data.url, response)))
      .then(() => {
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => client.postMessage({ type: 'PAGE_CACHED', url: data.url }))
        })
      })
      .catch(() => {
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => client.postMessage({ type: 'PAGE_CACHE_FAILED', url: data.url }))
        })
      }),
  )
})
