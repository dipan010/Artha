'use client';

import { useState } from 'react';
import { Bell, BellOff, Smartphone, Volume2, VolumeX, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationSettingsProps {
    onClose?: () => void;
}

export default function NotificationSettings({ onClose }: NotificationSettingsProps) {
    const {
        isSupported,
        permission,
        isSubscribed,
        loading,
        channels,
        requestPermission,
        subscribe,
        unsubscribe,
        showNotification,
        updateChannel,
    } = usePushNotifications();

    const [soundEnabled, setSoundEnabled] = useState(() => {
        if (typeof window === 'undefined') return true;
        const saved = localStorage.getItem('artha_sound_enabled');
        return saved !== 'false';
    });

    const [vibrationEnabled, setVibrationEnabled] = useState(() => {
        if (typeof window === 'undefined') return true;
        const saved = localStorage.getItem('artha_vibration_enabled');
        return saved !== 'false';
    });

    const [isSubscribing, setIsSubscribing] = useState(false);

    const handleSubscribe = async () => {
        setIsSubscribing(true);
        await subscribe();
        setIsSubscribing(false);
    };

    const handleUnsubscribe = async () => {
        setIsSubscribing(true);
        await unsubscribe();
        setIsSubscribing(false);
    };

    const handleSoundToggle = () => {
        const newValue = !soundEnabled;
        setSoundEnabled(newValue);
        localStorage.setItem('artha_sound_enabled', String(newValue));
    };

    const handleVibrationToggle = () => {
        const newValue = !vibrationEnabled;
        setVibrationEnabled(newValue);
        localStorage.setItem('artha_vibration_enabled', String(newValue));
    };

    const testNotification = () => {
        showNotification({
            title: '🔔 Test Notification',
            body: 'Push notifications are working correctly!',
            data: { type: 'general' },
        });
    };

    if (loading) {
        return (
            <div className="notification-settings">
                <div className="notification-settings-loading">
                    <Loader2 size={24} className="spin" />
                    <span>Loading notification settings...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="notification-settings">
            <div className="notification-settings-header">
                <div className="notification-settings-title">
                    <Bell size={20} />
                    <h3>Notification Settings</h3>
                </div>
                {onClose && (
                    <button className="notification-settings-close" onClick={onClose}>
                        ×
                    </button>
                )}
            </div>

            {!isSupported ? (
                <div className="notification-settings-unsupported">
                    <BellOff size={32} />
                    <p>Push notifications are not supported in this browser.</p>
                    <span>Try using a modern browser like Chrome, Firefox, or Edge.</span>
                </div>
            ) : (
                <>
                    {/* Permission Status */}
                    <div className="notification-status">
                        <div className="status-icon">
                            {permission === 'granted' ? (
                                <CheckCircle size={24} className="status-granted" />
                            ) : permission === 'denied' ? (
                                <AlertTriangle size={24} className="status-denied" />
                            ) : (
                                <Bell size={24} className="status-default" />
                            )}
                        </div>
                        <div className="status-content">
                            <h4>
                                {permission === 'granted' ? 'Notifications Enabled' :
                                    permission === 'denied' ? 'Notifications Blocked' :
                                        'Notifications Not Set Up'}
                            </h4>
                            <p>
                                {permission === 'granted' ?
                                    (isSubscribed ? 'You will receive push notifications for alerts.' : 'Click below to enable push notifications.') :
                                    permission === 'denied' ?
                                        'Please enable notifications in your browser settings.' :
                                        'Enable notifications to receive price alerts and news updates.'}
                            </p>
                        </div>
                    </div>

                    {/* Subscribe/Unsubscribe Button */}
                    {permission !== 'denied' && (
                        <div className="notification-subscribe">
                            {isSubscribed ? (
                                <button
                                    className="subscribe-btn unsubscribe"
                                    onClick={handleUnsubscribe}
                                    disabled={isSubscribing}
                                >
                                    {isSubscribing ? (
                                        <Loader2 size={16} className="spin" />
                                    ) : (
                                        <BellOff size={16} />
                                    )}
                                    Disable Push Notifications
                                </button>
                            ) : (
                                <button
                                    className="subscribe-btn"
                                    onClick={handleSubscribe}
                                    disabled={isSubscribing}
                                >
                                    {isSubscribing ? (
                                        <Loader2 size={16} className="spin" />
                                    ) : (
                                        <Smartphone size={16} />
                                    )}
                                    Enable Push Notifications
                                </button>
                            )}
                            <button
                                className="test-notification-btn"
                                onClick={testNotification}
                                disabled={permission !== 'granted'}
                            >
                                Test Notification
                            </button>
                        </div>
                    )}

                    {/* Notification Channels */}
                    <div className="notification-channels">
                        <h4>Notification Types</h4>
                        <div className="channels-list">
                            {channels.map(channel => (
                                <div key={channel.id} className="channel-item">
                                    <div className="channel-info">
                                        <span className="channel-name">{channel.name}</span>
                                        <span className="channel-desc">{channel.description}</span>
                                    </div>
                                    <button
                                        className={`channel-toggle ${channel.enabled ? 'active' : ''}`}
                                        onClick={() => updateChannel(channel.id, !channel.enabled)}
                                    >
                                        {channel.enabled ? (
                                            <ToggleRight size={24} />
                                        ) : (
                                            <ToggleLeft size={24} />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sound & Vibration */}
                    <div className="notification-preferences">
                        <h4>Preferences</h4>
                        <div className="preference-item">
                            <div className="preference-info">
                                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                                <span>Notification Sound</span>
                            </div>
                            <button
                                className={`preference-toggle ${soundEnabled ? 'active' : ''}`}
                                onClick={handleSoundToggle}
                            >
                                {soundEnabled ? (
                                    <ToggleRight size={24} />
                                ) : (
                                    <ToggleLeft size={24} />
                                )}
                            </button>
                        </div>
                        <div className="preference-item">
                            <div className="preference-info">
                                <Smartphone size={18} />
                                <span>Vibration</span>
                            </div>
                            <button
                                className={`preference-toggle ${vibrationEnabled ? 'active' : ''}`}
                                onClick={handleVibrationToggle}
                            >
                                {vibrationEnabled ? (
                                    <ToggleRight size={24} />
                                ) : (
                                    <ToggleLeft size={24} />
                                )}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
