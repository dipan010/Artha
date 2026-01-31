/**
 * Alert Types for Price Alerts & Notifications
 */

export type AlertType =
    | 'price_above'
    | 'price_below'
    | 'percent_change_up'
    | 'percent_change_down'
    | 'volume_spike';

export type AlertStatus = 'active' | 'triggered' | 'expired' | 'paused';

export interface PriceAlert {
    id: string;
    symbol: string;
    stockName: string;
    type: AlertType;
    targetValue: number;
    currentValue?: number;
    status: AlertStatus;
    createdAt: Date;
    triggeredAt?: Date;
    expiresAt?: Date;
    notifySound: boolean;
    notes?: string;
}

export interface AlertLog {
    id: string;
    alertId: string;
    symbol: string;
    type: AlertType;
    targetValue: number;
    triggeredValue: number;
    triggeredAt: Date;
    acknowledged: boolean;
}

export interface AlertSettings {
    soundEnabled: boolean;
    browserNotifications: boolean;
    autoVolumeSpike: boolean;
    volumeSpikeThreshold: number; // Percentage above average
    refreshInterval: number; // Seconds between price checks
}

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
    soundEnabled: true,
    browserNotifications: true,
    autoVolumeSpike: false,
    volumeSpikeThreshold: 200, // 200% of average
    refreshInterval: 30,
};

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
    price_above: 'Price Above',
    price_below: 'Price Below',
    percent_change_up: 'Up by %',
    percent_change_down: 'Down by %',
    volume_spike: 'Volume Spike',
};

export const ALERT_TYPE_ICONS: Record<AlertType, string> = {
    price_above: '📈',
    price_below: '📉',
    percent_change_up: '🚀',
    percent_change_down: '💥',
    volume_spike: '📊',
};
