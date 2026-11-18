/* Quran Complex landing service worker: makes qurancomplex.ly installable on Android */
const CACHE = 'qc-landing-v1'
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
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // التنقل يُحدَّث من الشبكة أولاً كي تظهر نسخة البوابة الجديدة فوراً.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone())).catch(() => {})
          return response
        })
        .catch(async () => (await caches.match(request)) || caches.match(`${SCOPE}index.html`)),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  )
})
