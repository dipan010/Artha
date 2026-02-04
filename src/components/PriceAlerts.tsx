'use client';

import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Pause, Play, X, Settings, History, Volume2, VolumeX, AlertTriangle, Loader2 } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import type { AlertType, PriceAlert } from '@/types/alerts';
import { ALERT_TYPE_LABELS, ALERT_TYPE_ICONS } from '@/types/alerts';

interface PriceAlertsProps {
    selectedSymbol?: string | null;
    onSelectStock?: (symbol: string) => void;
}

export default function PriceAlerts({ selectedSymbol, onSelectStock }: PriceAlertsProps) {
    const {
        alerts,
        logs,
        settings,
        activeAlertsCount,
        createAlert,
        deleteAlert,
        toggleAlert,
        clearLogs,
        updateSettings,
        requestPermission,
    } = useAlerts();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'triggered' | 'all'>('active');

    // Create alert form state
    const [newAlert, setNewAlert] = useState({
        symbol: '',
        stockName: '',
        type: 'price_above' as AlertType,
        targetValue: 0,
        notifySound: true,
        notes: '',
    });

    // Search state
    const [searchResults, setSearchResults] = useState<Array<{ symbol: string; name: string }>>([]);
    const [searching, setSearching] = useState(false);

    // Pre-fill with selected symbol
    useEffect(() => {
        if (selectedSymbol) {
            setNewAlert(prev => ({
                ...prev,
                symbol: selectedSymbol,
                stockName: selectedSymbol.replace('.NS', '').replace('.BO', ''),
            }));
        }
    }, [selectedSymbol]);

    // Search for stocks
    const searchStocks = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(Array.isArray(data) ? data.slice(0, 5) : []);
            }
        } catch {
            // Ignore errors
        } finally {
            setSearching(false);
        }
    };

    // Handle stock selection from search
    const handleSelectSearchResult = (result: { symbol: string; name: string }) => {
        setNewAlert(prev => ({
            ...prev,
            symbol: result.symbol,
            stockName: result.name,
        }));
        setSearchResults([]);
    };

    const handleCreateAlert = () => {
        if (!newAlert.symbol || !newAlert.targetValue) return;

        createAlert(
            newAlert.symbol,
            newAlert.stockName || newAlert.symbol,
            newAlert.type,
            newAlert.targetValue,
            {
                notifySound: newAlert.notifySound,
                notes: newAlert.notes || undefined,
            }
        );

        // Reset form
        setNewAlert({
            symbol: selectedSymbol || '',
            stockName: selectedSymbol?.replace('.NS', '').replace('.BO', '') || '',
            type: 'price_above',
            targetValue: 0,
            notifySound: true,
            notes: '',
        });
        setShowCreateModal(false);
    };

    const filteredAlerts = alerts.filter(alert => {
        switch (activeTab) {
            case 'active':
                return alert.status === 'active';
            case 'triggered':
                return alert.status === 'triggered';
            default:
                return true;
        }
    });

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <div className="price-alerts-container">
            {/* Header */}
            <div className="price-alerts-header">
                <div className="price-alerts-title">
                    <Bell size={20} />
                    <h2>Price Alerts</h2>
                    {activeAlertsCount > 0 && (
                        <span className="alert-count">{activeAlertsCount}</span>
                    )}
                </div>
                <div className="price-alerts-actions">
                    <button
                        className="alerts-action-btn"
                        onClick={() => setShowLogsModal(true)}
                        title="Alert History"
                    >
                        <History size={18} />
                    </button>
                    <button
                        className="alerts-action-btn"
                        onClick={() => setShowSettingsModal(true)}
                        title="Settings"
                    >
                        <Settings size={18} />
                    </button>
                    <button
                        className="alerts-create-btn"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus size={18} />
                        Create Alert
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="alerts-tabs">
                <button
                    className={`alerts-tab ${activeTab === 'active' ? 'active' : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    Active ({alerts.filter(a => a.status === 'active').length})
                </button>
                <button
                    className={`alerts-tab ${activeTab === 'triggered' ? 'active' : ''}`}
                    onClick={() => setActiveTab('triggered')}
                >
                    Triggered ({alerts.filter(a => a.status === 'triggered').length})
                </button>
                <button
                    className={`alerts-tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All ({alerts.length})
                </button>
            </div>

            {/* Alerts List */}
            <div className="alerts-list">
                {filteredAlerts.length === 0 ? (
                    <div className="alerts-empty">
                        <AlertTriangle size={32} className="empty-icon" />
                        <p>No {activeTab} alerts</p>
                        <button
                            className="alerts-create-btn-sm"
                            onClick={() => setShowCreateModal(true)}
                        >
                            Create your first alert
                        </button>
                    </div>
                ) : (
                    filteredAlerts.map(alert => (
                        <AlertCard
                            key={alert.id}
                            alert={alert}
                            onToggle={() => toggleAlert(alert.id)}
                            onDelete={() => deleteAlert(alert.id)}
                            onClick={() => onSelectStock?.(alert.symbol)}
                        />
                    ))
                )}
            </div>

            {/* Create Alert Modal */}
            {showCreateModal && (
                <div className="portfolio-modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="portfolio-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create Price Alert</h3>
                            <button onClick={() => setShowCreateModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Search Stock</label>
                                <div className="search-input-wrapper">
                                    <input
                                        type="text"
                                        value={newAlert.symbol}
                                        onChange={e => {
                                            setNewAlert(prev => ({
                                                ...prev,
                                                symbol: e.target.value.toUpperCase(),
                                                stockName: ''
                                            }));
                                            searchStocks(e.target.value);
                                        }}
                                        placeholder="Search by symbol or company name..."
                                    />
                                    {searching && <Loader2 size={14} className="spin" />}
                                    {searchResults.length > 0 && (
                                        <div className="search-dropdown">
                                            {searchResults.map(result => (
                                                <button
                                                    key={result.symbol}
                                                    type="button"
                                                    onClick={() => handleSelectSearchResult(result)}
                                                >
                                                    <strong>{result.symbol}</strong>
                                                    <span>{result.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {newAlert.stockName && (
                                    <div className="selected-stock-info">
                                        <span className="selected-label">Selected:</span>
                                        <span className="selected-name">{newAlert.stockName}</span>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Alert Type</label>
                                <div className="alert-type-grid">
                                    {(Object.keys(ALERT_TYPE_LABELS) as AlertType[]).map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            className={`alert-type-btn ${newAlert.type === type ? 'active' : ''}`}
                                            onClick={() => setNewAlert(prev => ({ ...prev, type }))}
                                        >
                                            <span>{ALERT_TYPE_ICONS[type]}</span>
                                            {ALERT_TYPE_LABELS[type]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>
                                    {newAlert.type.includes('percent') ? 'Percentage (%)' :
                                        newAlert.type === 'volume_spike' ? 'Volume Threshold (%)' :
                                            'Target Price (₹)'}
                                </label>
                                <input
                                    type="number"
                                    value={newAlert.targetValue || ''}
                                    onChange={e => setNewAlert(prev => ({ ...prev, targetValue: Number(e.target.value) }))}
                                    placeholder={newAlert.type.includes('percent') ? '5' : '1500'}
                                />
                            </div>

                            <div className="form-group">
                                <label>Notes (optional)</label>
                                <input
                                    type="text"
                                    value={newAlert.notes}
                                    onChange={e => setNewAlert(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Reminder note..."
                                />
                            </div>

                            <div className="form-group checkbox-group">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={newAlert.notifySound}
                                        onChange={e => setNewAlert(prev => ({ ...prev, notifySound: e.target.checked }))}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                                <label onClick={() => setNewAlert(prev => ({ ...prev, notifySound: !prev.notifySound }))}>
                                    Play notification sound
                                </label>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="modal-cancel" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="modal-submit"
                                onClick={handleCreateAlert}
                                disabled={!newAlert.symbol || !newAlert.targetValue}
                            >
                                <Plus size={14} />
                                Create Alert
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
                    <div className="modal-content alerts-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Alert Settings</h3>
                            <button className="modal-close" onClick={() => setShowSettingsModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group checkbox-group">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.soundEnabled}
                                        onChange={e => updateSettings({ soundEnabled: e.target.checked })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                                <label onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}>
                                    Enable notification sounds
                                </label>
                            </div>

                            <div className="form-group checkbox-group">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.browserNotifications}
                                        onChange={async (e) => {
                                            if (e.target.checked) {
                                                const granted = await requestPermission();
                                                updateSettings({ browserNotifications: granted });
                                            } else {
                                                updateSettings({ browserNotifications: false });
                                            }
                                        }}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                                <label onClick={() => !settings.browserNotifications && requestPermission().then(granted => updateSettings({ browserNotifications: granted }))}>
                                    Enable browser notifications
                                </label>
                            </div>

                            <div className="form-group">
                                <label>Refresh Interval (seconds)</label>
                                <input
                                    type="number"
                                    min={10}
                                    max={300}
                                    value={settings.refreshInterval}
                                    onChange={e => updateSettings({ refreshInterval: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-primary" onClick={() => setShowSettingsModal(false)}>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logs Modal */}
            {showLogsModal && (
                <div className="modal-overlay" onClick={() => setShowLogsModal(false)}>
                    <div className="modal-content alerts-modal logs-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Alert History</h3>
                            <div className="modal-header-actions">
                                {logs.length > 0 && (
                                    <button className="btn-text" onClick={clearLogs}>
                                        Clear All
                                    </button>
                                )}
                                <button className="modal-close" onClick={() => setShowLogsModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="modal-body logs-body">
                            {logs.length === 0 ? (
                                <div className="alerts-empty">
                                    <History size={32} className="empty-icon" />
                                    <p>No alert history yet</p>
                                </div>
                            ) : (
                                <div className="logs-list">
                                    {logs.map(log => (
                                        <div key={log.id} className="log-item">
                                            <span className="log-icon">{ALERT_TYPE_ICONS[log.type]}</span>
                                            <div className="log-details">
                                                <span className="log-symbol">{log.symbol}</span>
                                                <span className="log-value">₹{log.triggeredValue.toFixed(2)}</span>
                                            </div>
                                            <span className="log-time">{formatTime(log.triggeredAt)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Alert Card Component
interface AlertCardProps {
    alert: PriceAlert;
    onToggle: () => void;
    onDelete: () => void;
    onClick: () => void;
}

function AlertCard({ alert, onToggle, onDelete, onClick }: AlertCardProps) {
    const getStatusClass = () => {
        switch (alert.status) {
            case 'active': return 'status-active';
            case 'triggered': return 'status-triggered';
            case 'paused': return 'status-paused';
            case 'expired': return 'status-expired';
            default: return '';
        }
    };

    return (
        <div className={`alert-card ${getStatusClass()}`}>
            <button className="alert-card-content" onClick={onClick}>
                <div className="alert-icon">
                    {ALERT_TYPE_ICONS[alert.type]}
                </div>
                <div className="alert-details">
                    <div className="alert-symbol">{alert.stockName}</div>
                    <div className="alert-condition">
                        {ALERT_TYPE_LABELS[alert.type]}:
                        {alert.type.includes('percent') || alert.type === 'volume_spike'
                            ? ` ${alert.targetValue}%`
                            : ` ₹${alert.targetValue.toFixed(2)}`}
                    </div>
                    {alert.notes && <div className="alert-notes">{alert.notes}</div>}
                </div>
                <div className="alert-status-badge">{alert.status}</div>
            </button>
            <div className="alert-actions">
                <button
                    className="alert-action-btn"
                    onClick={onToggle}
                    title={alert.status === 'active' ? 'Pause' : 'Resume'}
                >
                    {alert.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                    className="alert-action-btn"
                    onClick={onToggle}
                    title={alert.notifySound ? 'Sound On' : 'Sound Off'}
                >
                    {alert.notifySound ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button
                    className="alert-action-btn delete"
                    onClick={onDelete}
                    title="Delete"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
