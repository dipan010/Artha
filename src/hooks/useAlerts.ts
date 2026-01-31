'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PriceAlert, AlertLog, AlertSettings, AlertType } from '@/types/alerts';
import { DEFAULT_ALERT_SETTINGS } from '@/types/alerts';
import { useNotifications } from './useNotifications';

const STORAGE_KEYS = {
    alerts: 'artha_price_alerts',
    logs: 'artha_alert_logs',
    settings: 'artha_alert_settings',
};

export function useAlerts() {
    const [alerts, setAlerts] = useState<PriceAlert[]>([]);
    const [logs, setLogs] = useState<AlertLog[]>([]);
    const [settings, setSettings] = useState<AlertSettings>(DEFAULT_ALERT_SETTINGS);
    const [isChecking, setIsChecking] = useState(false);

    const { showNotification, playSound, requestPermission } = useNotifications();
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Load data from localStorage
    useEffect(() => {
        try {
            const storedAlerts = localStorage.getItem(STORAGE_KEYS.alerts);
            const storedLogs = localStorage.getItem(STORAGE_KEYS.logs);
            const storedSettings = localStorage.getItem(STORAGE_KEYS.settings);

            if (storedAlerts) {
                const parsed = JSON.parse(storedAlerts);
                setAlerts(parsed.map((a: PriceAlert) => ({
                    ...a,
                    createdAt: new Date(a.createdAt),
                    triggeredAt: a.triggeredAt ? new Date(a.triggeredAt) : undefined,
                    expiresAt: a.expiresAt ? new Date(a.expiresAt) : undefined,
                })));
            }

            if (storedLogs) {
                const parsed = JSON.parse(storedLogs);
                setLogs(parsed.map((l: AlertLog) => ({
                    ...l,
                    triggeredAt: new Date(l.triggeredAt),
                })));
            }

            if (storedSettings) {
                setSettings({ ...DEFAULT_ALERT_SETTINGS, ...JSON.parse(storedSettings) });
            }
        } catch {
            // Ignore localStorage errors
        }
    }, []);

    // Save alerts to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.alerts, JSON.stringify(alerts));
        } catch {
            // Ignore
        }
    }, [alerts]);

    // Save logs to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
        } catch {
            // Ignore
        }
    }, [logs]);

    // Save settings to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
        } catch {
            // Ignore
        }
    }, [settings]);

    // Create a new alert
    const createAlert = useCallback((
        symbol: string,
        stockName: string,
        type: AlertType,
        targetValue: number,
        options?: { notifySound?: boolean; notes?: string; expiresAt?: Date }
    ): PriceAlert => {
        const alert: PriceAlert = {
            id: Date.now().toString(),
            symbol,
            stockName,
            type,
            targetValue,
            status: 'active',
            createdAt: new Date(),
            notifySound: options?.notifySound ?? settings.soundEnabled,
            notes: options?.notes,
            expiresAt: options?.expiresAt,
        };

        setAlerts(prev => [...prev, alert]);
        return alert;
    }, [settings.soundEnabled]);

    // Delete an alert
    const deleteAlert = useCallback((alertId: string) => {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
    }, []);

    // Toggle alert status
    const toggleAlert = useCallback((alertId: string) => {
        setAlerts(prev => prev.map(a => {
            if (a.id === alertId) {
                return {
                    ...a,
                    status: a.status === 'active' ? 'paused' : 'active',
                };
            }
            return a;
        }));
    }, []);

    // Check alerts against current price
    const checkAlert = useCallback((alert: PriceAlert, currentPrice: number, currentVolume?: number, avgVolume?: number): boolean => {
        if (alert.status !== 'active') return false;

        // Check if expired
        if (alert.expiresAt && new Date() > alert.expiresAt) {
            setAlerts(prev => prev.map(a =>
                a.id === alert.id ? { ...a, status: 'expired' } : a
            ));
            return false;
        }

        let triggered = false;

        switch (alert.type) {
            case 'price_above':
                triggered = currentPrice >= alert.targetValue;
                break;
            case 'price_below':
                triggered = currentPrice <= alert.targetValue;
                break;
            case 'percent_change_up':
                if (alert.currentValue) {
                    const changePercent = ((currentPrice - alert.currentValue) / alert.currentValue) * 100;
                    triggered = changePercent >= alert.targetValue;
                }
                break;
            case 'percent_change_down':
                if (alert.currentValue) {
                    const changePercent = ((alert.currentValue - currentPrice) / alert.currentValue) * 100;
                    triggered = changePercent >= alert.targetValue;
                }
                break;
            case 'volume_spike':
                if (currentVolume && avgVolume) {
                    const volumeRatio = (currentVolume / avgVolume) * 100;
                    triggered = volumeRatio >= alert.targetValue;
                }
                break;
        }

        return triggered;
    }, []);

    // Trigger an alert
    const triggerAlert = useCallback((alert: PriceAlert, triggeredValue: number) => {
        // Update alert status
        setAlerts(prev => prev.map(a =>
            a.id === alert.id ? { ...a, status: 'triggered', triggeredAt: new Date() } : a
        ));

        // Create log entry
        const log: AlertLog = {
            id: Date.now().toString(),
            alertId: alert.id,
            symbol: alert.symbol,
            type: alert.type,
            targetValue: alert.targetValue,
            triggeredValue,
            triggeredAt: new Date(),
            acknowledged: false,
        };
        setLogs(prev => [log, ...prev].slice(0, 50)); // Keep last 50 logs

        // Show notification
        const typeLabels: Record<AlertType, string> = {
            price_above: 'reached',
            price_below: 'dropped to',
            percent_change_up: 'up',
            percent_change_down: 'down',
            volume_spike: 'volume spike at',
        };

        showNotification({
            title: `🔔 Alert: ${alert.stockName}`,
            body: `${alert.symbol} has ${typeLabels[alert.type]} ₹${triggeredValue.toFixed(2)}`,
            tag: alert.id,
        });

        // Play sound if enabled
        if (alert.notifySound && settings.soundEnabled) {
            playSound();
        }
    }, [settings.soundEnabled, showNotification, playSound]);

    // Check all active alerts with price data
    const checkAllAlerts = useCallback(async (priceData: Record<string, { price: number; volume?: number; avgVolume?: number }>) => {
        setIsChecking(true);

        const activeAlerts = alerts.filter(a => a.status === 'active');

        for (const alert of activeAlerts) {
            const data = priceData[alert.symbol];
            if (data) {
                const triggered = checkAlert(alert, data.price, data.volume, data.avgVolume);
                if (triggered) {
                    triggerAlert(alert, data.price);
                }
            }
        }

        setIsChecking(false);
    }, [alerts, checkAlert, triggerAlert]);

    // Clear all logs
    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    // Update settings
    const updateSettings = useCallback((newSettings: Partial<AlertSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    // Start periodic alert checking
    const startAlertChecking = useCallback((fetchPrices: () => Promise<Record<string, { price: number; volume?: number; avgVolume?: number }>>) => {
        if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
        }

        const check = async () => {
            const priceData = await fetchPrices();
            await checkAllAlerts(priceData);
        };

        check(); // Initial check
        checkIntervalRef.current = setInterval(check, settings.refreshInterval * 1000);
    }, [checkAllAlerts, settings.refreshInterval]);

    // Stop periodic checking
    const stopAlertChecking = useCallback(() => {
        if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
        };
    }, []);

    // Get active alerts count
    const activeAlertsCount = alerts.filter(a => a.status === 'active').length;
    const triggeredAlertsCount = logs.filter(l => !l.acknowledged).length;

    return {
        alerts,
        logs,
        settings,
        isChecking,
        activeAlertsCount,
        triggeredAlertsCount,
        createAlert,
        deleteAlert,
        toggleAlert,
        triggerAlert,
        checkAllAlerts,
        clearLogs,
        updateSettings,
        requestPermission,
        startAlertChecking,
        stopAlertChecking,
    };
}
