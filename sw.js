// URBAN RICH HIGH-PERFORMANCE STOREFRONT SERVICE WORKER
const STATIC_CACHE_NAME = 'urban-rich-user-v4_static';
const MEDIA_CACHE_NAME = 'urban-rich-media-v1';

const STATIC_ASSETS = [
  '/',
  'index.html',
  'shop.html',
  'styles.css',
  'main.js',
  'config.js',
  'manifest.json',
  'images/logo.jpg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(err => console.log('SW install cache bypass:', err));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== STATIC_CACHE_NAME && cache !== MEDIA_CACHE_NAME) {
            console.log('Purging stale storefront cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // 1. DEDICATED MEDIA CACHE (Cache-First for Images & Supabase Storage Assets)
  const isImageOrMedia = event.request.destination === 'image' || 
    url.pathname.match(/\.(webp|jpg|jpeg|png|gif|svg|avif)$/i) || 
    url.hostname.includes('supabase.co') && url.pathname.includes('/storage/v1/object/public/');

  if (isImageOrMedia) {
    event.respondWith(
      caches.open(MEDIA_CACHE_NAME).then((mediaCache) => {
        return mediaCache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Serve instantly from local cache without touching Supabase Egress
            return cachedResponse;
          }

          // Fetch single time and store in media cache
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              mediaCache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => caches.match('images/logo.jpg'));
        });
      })
    );
    return;
  }

  // 2. NETWORK-FIRST FOR LIVE PAGES & DYNAMIC DATA
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
