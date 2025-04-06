/**
 * Service Worker pour le site de compétition e-sport
 * Permet le fonctionnement hors ligne et améliore les performances
 */

// Nom et version du cache
const CACHE_NAME = 'esport-competition-cache-v1';

// Ressources à mettre en cache lors de l'installation
const RESOURCES_TO_CACHE = [
  '/',
  '/index.html',
  '/inscription.html',
  '/connexion.html',
  '/resultats.html',
  '/calendrier.html',
  '/classement.html',
  '/newsletter.html',
  '/reglement.html',
  '/paiement.html',
  '/style.css',
  '/charte-graphique.css',
  '/js/app.js',
  '/images/favicon.png',
  // Ajoutez d'autres ressources importantes ici
];

// Installation du Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(RESOURCES_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Forcer l'activation immédiate
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  // Supprimer les anciennes versions du cache
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim()) // Prendre le contrôle immédiatement
  );
});

// Stratégie de mise en cache : Network First pour les API, Cache First pour les ressources statiques
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Pour les requêtes API, essayer d'abord le réseau puis le cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Mettre en cache une copie de la réponse
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Si le réseau échoue, essayer de récupérer depuis le cache
          return caches.match(event.request);
        })
    );
  } 
  // Pour les requêtes d'images, utiliser le cache d'abord puis le réseau
  else if (url.pathname.startsWith('/images/') || event.request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Retourner depuis le cache si disponible
          if (response) {
            return response;
          }
          
          // Sinon, récupérer depuis le réseau
          return fetch(event.request).then(networkResponse => {
            // Mettre en cache une copie de la réponse
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            return networkResponse;
          });
        })
    );
  }
  // Pour les autres ressources statiques, stratégie Cache First
  else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Retourner depuis le cache si disponible
          if (response) {
            return response;
          }
          
          // Sinon, récupérer depuis le réseau
          return fetch(event.request).then(networkResponse => {
            // Ne pas mettre en cache les requêtes non GET
            if (event.request.method !== 'GET') {
              return networkResponse;
            }
            
            // Mettre en cache une copie de la réponse
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            return networkResponse;
          });
        })
    );
  }
});

// Synchronisation en arrière-plan lorsque la connexion est rétablie
self.addEventListener('sync', event => {
  if (event.tag === 'sync-results') {
    event.waitUntil(syncResults());
  } else if (event.tag === 'sync-newsletter') {
    event.waitUntil(syncNewsletter());
  }
});

// Notifications push
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/images/icon-192x192.png',
    badge: '/images/badge-96x96.png',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Action lorsqu'une notification est cliquée
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Fonction pour synchroniser les résultats en attente
async function syncResults() {
  // Récupérer les résultats en attente depuis IndexedDB
  const db = await openDatabase();
  const pendingResults = await db.getAll('pendingResults');
  
  // Soumettre chaque résultat en attente
  const syncPromises = pendingResults.map(async result => {
    try {
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(result)
      });
      
      if (response.ok) {
        // Supprimer le résultat de la file d'attente
        await db.delete('pendingResults', result.id);
      }
    } catch (error) {
      console.error('Erreur de synchronisation:', error);
    }
  });
  
  return Promise.all(syncPromises);
}

// Fonction pour synchroniser les abonnements newsletter en attente
async function syncNewsletter() {
  // Récupérer les abonnements en attente depuis IndexedDB
  const db = await openDatabase();
  const pendingSubscriptions = await db.getAll('pendingSubscriptions');
  
  // Soumettre chaque abonnement en attente
  const syncPromises = pendingSubscriptions.map(async subscription => {
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      });
      
      if (response.ok) {
        // Supprimer l'abonnement de la file d'attente
        await db.delete('pendingSubscriptions', subscription.id);
      }
    } catch (error) {
      console.error('Erreur de synchronisation newsletter:', error);
    }
  });
  
  return Promise.all(syncPromises);
}

// Fonction pour ouvrir une connexion IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('esport-competition-db', 1);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Créer les object stores nécessaires s'ils n'existent pas
      if (!db.objectStoreNames.contains('pendingResults')) {
        db.createObjectStore('pendingResults', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('pendingSubscriptions')) {
        db.createObjectStore('pendingSubscriptions', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = event => {
      const db = event.target.result;
      
      // Créer un wrapper simplifié pour les opérations IndexedDB
      const dbWrapper = {
        getAll: (storeName) => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        },
        delete: (storeName, id) => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
      };
      
      resolve(dbWrapper);
    };
    
    request.onerror = event => {
      reject(event.target.error);
    };
  });
}
