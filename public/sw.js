const CACHE_NAME = 'noisy-en-fete-v1';
const STATIC_ASSETS = [
  '/',
  '/logo.png',
  '/icon32.png',
  '/manifest.json'
];

// Installation : mise en cache des ressources statiques
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: mise en cache des ressources');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch : stratégie Network First (toujours essayer le réseau d'abord)
// Fallback sur le cache si pas de réseau
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET et les APIs externes
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('supabase.co')) return;
  if (event.request.url.includes('stripe.com')) return;
  if (event.request.url.includes('api.anthropic.com')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Mettre en cache la réponse réseau
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Pas de réseau → fallback cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback ultime : page d'accueil
          return caches.match('/');
        });
      })
  );
});

// Notifications push
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Noisy en Fête';
  const options = {
    body: data.body || 'Votre commande est prête !',
    icon: '/logo.png',
    badge: '/icon32.png',
    vibrate: [300, 100, 300],
    tag: 'commande',
    requireInteraction: true,
    actions: [
      { action: 'open', title: '👀 Voir ma commande' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Clic sur notification
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      if (windowClients.length > 0) {
        windowClients[0].focus();
      } else {
        clients.openWindow('/');
      }
    })
  );
});
