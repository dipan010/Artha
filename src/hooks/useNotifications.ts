'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface NotificationOptions {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    requireInteraction?: boolean;
    onClick?: () => void;
}

export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSupported, setIsSupported] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Check if notifications are supported
        setIsSupported('Notification' in window);

        if ('Notification' in window) {
            setPermission(Notification.permission);
        }

        // Create audio element for notification sounds
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/notification.mp3');
            audioRef.current.volume = 0.5;
        }
    }, []);

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

    const showNotification = useCallback((options: NotificationOptions) => {
        // Always show in-app notification
        showInAppNotification(options);

        // Try to show browser notification
        if (isSupported && permission === 'granted') {
            const notification = new Notification(options.title, {
                body: options.body,
                icon: options.icon || '/favicon.ico',
                tag: options.tag,
                requireInteraction: options.requireInteraction,
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
                options.onClick?.();
            };
        }
    }, [isSupported, permission]);

    const showInAppNotification = useCallback((options: NotificationOptions) => {
        // Create and show in-app toast notification
        const container = document.getElementById('notification-container') || createNotificationContainer();

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

        if (options.onClick) {
            toast.addEventListener('click', (e) => {
                if (!(e.target as HTMLElement).classList.contains('notification-close')) {
                    options.onClick?.();
                }
            });
            toast.style.cursor = 'pointer';
        }

        container.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }, []);

    const createNotificationContainer = (): HTMLElement => {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    };

    const playSound = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {
                // Ignore autoplay errors
            });
        }
    }, []);

    return {
        permission,
        isSupported,
        requestPermission,
        showNotification,
        showInAppNotification,
        playSound,
    };
}
