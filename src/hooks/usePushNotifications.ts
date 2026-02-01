'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface PushNotificationOptions {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    requireInteraction?: boolean;
    vibrate?: number[];
    data?: {
        url?: string;
        type?: 'price_alert' | 'news' | 'portfolio' | 'general';
        symbol?: string;
        alertId?: string;
    };
    actions?: { action: string; title: string }[];
}

interface NotificationChannel {
    id: string;
    name: string;
    enabled: boolean;
    description: string;
}

const DEFAULT_CHANNELS: NotificationChannel[] = [
    { id: 'price_alerts', name: 'Price Alerts', enabled: true, description: 'Notifications when your price alerts trigger' },
    { id: 'news', name: 'Breaking News', enabled: true, description: 'Important market news updates' },
    { id: 'portfolio', name: 'Portfolio Updates', enabled: false, description: 'Daily portfolio summary' },
    { id: 'market_open', name: 'Market Open/Close', enabled: false, description: 'Market hours reminders' },
];

export function usePushNotifications() {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
    const [channels, setChannels] = useState<NotificationChannel[]>(DEFAULT_CHANNELS);
    const [loading, setLoading] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize on mount
    useEffect(() => {
        const init = async () => {
            // Check if push notifications are supported
            const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
            setIsSupported(supported);

            if (!supported) {
                setLoading(false);
                return;
            }

            // Get current permission
            setPermission(Notification.permission);

            // Load saved channel preferences
            try {
                const savedChannels = localStorage.getItem('artha_notification_channels');
                if (savedChannels) {
                    setChannels(JSON.parse(savedChannels));
                }
            } catch {
                // Ignore localStorage errors
            }

            // Register service worker
            try {
                const reg = await navigator.serviceWorker.register('/sw.js');
                setRegistration(reg);

                // Check if already subscribed
                const subscription = await reg.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }

            // Create audio element for notification sounds
            if (typeof window !== 'undefined') {
                audioRef.current = new Audio('/notification.mp3');
                audioRef.current.volume = 0.5;
            }

            setLoading(false);
        };

        init();
    }, []);

    // Listen for messages from service worker
    useEffect(() => {
        if (!isSupported) return;

        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'NOTIFICATION_CLICK') {
                // Handle notification click in the app
                const { data } = event.data;
                if (data.symbol) {
                    window.location.href = `/?symbol=${data.symbol}`;
                } else if (data.type === 'news') {
                    window.location.href = '/?view=news';
                }
            }
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);
        return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }, [isSupported]);

    // Request permission
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported) return false;

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result === 'granted';
        } catch {
            return false;
        }
    }, [isSupported]);

    // Subscribe to push notifications
    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported || !registration) return false;

        try {
            // Request permission first
            const granted = await requestPermission();
            if (!granted) return false;

            // Subscribe to push manager
            // Note: In production, you'd need a VAPID key from your server
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    // This is a placeholder - replace with your actual VAPID public key
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
                    'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
                ).buffer as ArrayBuffer,
            });

            // Send subscription to server (if you have a backend)
            // await fetch('/api/push/subscribe', {
            //     method: 'POST',
            //     body: JSON.stringify(subscription),
            // });

            setIsSubscribed(true);
            return true;
        } catch (error) {
            console.error('Push subscription failed:', error);
            return false;
        }
    }, [isSupported, registration, requestPermission]);

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async (): Promise<boolean> => {
        if (!registration) return false;

        try {
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
            }
            setIsSubscribed(false);
            return true;
        } catch (error) {
            console.error('Unsubscribe failed:', error);
            return false;
        }
    }, [registration]);

    // Show a local notification (for testing or when push server not available)
    const showNotification = useCallback(async (options: PushNotificationOptions) => {
        if (!isSupported || permission !== 'granted') {
            // Fall back to in-app notification
            showInAppNotification(options);
            return;
        }

        // Check if channel is enabled
        if (options.data?.type) {
            const channelId = options.data.type === 'price_alert' ? 'price_alerts' : options.data.type;
            const channel = channels.find(c => c.id === channelId);
            if (channel && !channel.enabled) {
                return; // Channel is disabled
            }
        }

        try {
            if (registration) {
                // Use service worker to show notification
                await registration.showNotification(options.title, {
                    body: options.body,
                    icon: options.icon || '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: options.tag,
                    vibrate: options.vibrate || [200, 100, 200],
                    requireInteraction: options.requireInteraction || false,
                    data: options.data,
                    actions: options.actions || [
                        { action: 'view', title: 'View' },
                        { action: 'dismiss', title: 'Dismiss' },
                    ],
                } as NotificationOptions);
            } else {
                // Fallback to browser notification
                new Notification(options.title, {
                    body: options.body,
                    icon: options.icon || '/favicon.ico',
                    tag: options.tag,
                });
            }
        } catch (error) {
            console.error('Notification error:', error);
            showInAppNotification(options);
        }
    }, [isSupported, permission, registration, channels]);

    // Show in-app toast notification
    const showInAppNotification = useCallback((options: PushNotificationOptions) => {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <div class="notification-content">
                <strong>${options.title}</strong>
                <p>${options.body}</p>
            </div>
            <button class="notification-close">×</button>
        `;

        const closeBtn = toast.querySelector('.notification-close');
        closeBtn?.addEventListener('click', () => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        });

        if (options.data?.url) {
            toast.style.cursor = 'pointer';
            toast.addEventListener('click', (e) => {
                if (!(e.target as HTMLElement).classList.contains('notification-close')) {
                    window.location.href = options.data!.url!;
                }
            });
        }

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }, []);

    // Play notification sound
    const playSound = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {
                // Ignore autoplay errors
            });
        }
    }, []);

    // Update channel preference
    const updateChannel = useCallback((channelId: string, enabled: boolean) => {
        setChannels(prev => {
            const updated = prev.map(c =>
                c.id === channelId ? { ...c, enabled } : c
            );
            try {
                localStorage.setItem('artha_notification_channels', JSON.stringify(updated));
            } catch {
                // Ignore
            }
            return updated;
        });
    }, []);

    return {
        isSupported,
        permission,
        isSubscribed,
        loading,
        channels,
        requestPermission,
        subscribe,
        unsubscribe,
        showNotification,
        showInAppNotification,
        playSound,
        updateChannel,
    };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
