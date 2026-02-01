// Service Worker for Artha AI Push Notifications
const CACHE_NAME = 'artha-ai-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache
const STATIC_ASSETS = [
    '/',
    '/favicon.ico',
    '/notification.mp3',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Push notification event
self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const options = {
            body: data.body || 'New notification from Artha AI',
            icon: data.icon || '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: data.vibrate || [200, 100, 200],
            tag: data.tag || 'artha-notification',
            requireInteraction: data.requireInteraction || false,
            data: {
                url: data.url || '/',
                type: data.type || 'general',
                symbol: data.symbol,
                alertId: data.alertId,
            },
            actions: data.actions || [
                { action: 'view', title: 'View' },
                { action: 'dismiss', title: 'Dismiss' },
            ],
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'Artha AI', options)
        );
    } catch (error) {
        console.error('Push notification error:', error);
    }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data;
    let targetUrl = '/';

    if (event.action === 'view' || !event.action) {
        if (data.type === 'price_alert' && data.symbol) {
            targetUrl = `/?symbol=${data.symbol}`;
        } else if (data.type === 'news') {
            targetUrl = '/?view=news';
        } else if (data.url) {
            targetUrl = data.url;
        }
    }

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            // Check if any client is already open
            for (const client of clients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.postMessage({
                        type: 'NOTIFICATION_CLICK',
                        data: data,
                    });
                    return client.focus();
                }
            }
            // Open new window
            return self.clients.openWindow(targetUrl);
        })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-alerts') {
        event.waitUntil(syncAlerts());
    }
});

async function syncAlerts() {
    try {
        // Get pending alerts from IndexedDB or similar
        const pendingAlerts = await getPendingAlerts();

        for (const alert of pendingAlerts) {
            await fetch('/api/alerts/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alert),
            });
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

async function getPendingAlerts() {
    // Placeholder - implement with IndexedDB if needed
    return [];
}

// Message handler for communication with main app
self.addEventListener('message', (event) => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'SHOW_NOTIFICATION') {
        const { title, options } = event.data;
        self.registration.showNotification(title, options);
    }
});
