'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ChevronRight, X, RefreshCw, Grid3X3 } from 'lucide-react';

interface SectorStock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
}

interface SectorPerformance {
    id: string;
    name: string;
    icon: string;
    change: number;
    avgChange: number;
    topGainer: { symbol: string; name: string; change: number } | null;
    topLoser: { symbol: string; name: string; change: number } | null;
    stockCount: number;
    stocks: SectorStock[];
}

interface SectorHeatmapProps {
    onSelectStock?: (symbol: string) => void;
}

export default function SectorHeatmap({ onSelectStock }: SectorHeatmapProps) {
    const [sectors, setSectors] = useState<SectorPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedSector, setExpandedSector] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchSectorData = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/sectors');
            if (!res.ok) throw new Error('Failed to fetch sector data');

            const data = await res.json();
            setSectors(data.sectors);
            setLastUpdated(new Date(data.timestamp));
        } catch (err) {
            console.error('Error fetching sectors:', err);
            setError('Failed to load sector data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSectorData();
    }, []);

    const getHeatmapColor = (change: number): string => {
        if (change >= 3) return 'var(--green)';
        if (change >= 2) return 'rgba(34, 197, 94, 0.8)';
        if (change >= 1) return 'rgba(34, 197, 94, 0.6)';
        if (change >= 0.5) return 'rgba(34, 197, 94, 0.4)';
        if (change > 0) return 'rgba(34, 197, 94, 0.25)';
        if (change === 0) return 'var(--bg-tertiary)';
        if (change > -0.5) return 'rgba(239, 68, 68, 0.25)';
        if (change > -1) return 'rgba(239, 68, 68, 0.4)';
        if (change > -2) return 'rgba(239, 68, 68, 0.6)';
        if (change > -3) return 'rgba(239, 68, 68, 0.8)';
        return 'var(--red)';
    };

    const getTextColor = (change: number): string => {
        if (Math.abs(change) > 1) return 'white';
        return 'var(--text-primary)';
    };

    const formatChange = (change: number): string => {
        return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    };

    const handleSectorClick = (sectorId: string) => {
        setExpandedSector(expandedSector === sectorId ? null : sectorId);
    };

    const handleStockClick = (symbol: string) => {
        if (onSelectStock) {
            onSelectStock(symbol);
        }
    };

    if (loading) {
        return (
            <div className="sector-heatmap">
                <div className="sector-heatmap-header">
                    <div className="sector-heatmap-title">
                        <Grid3X3 size={20} />
                        <h2>Sector Heatmap</h2>
                    </div>
                </div>
                <div className="sector-loading">
                    <div className="loading-spinner" />
                    <p>Loading sector data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sector-heatmap">
                <div className="sector-heatmap-header">
                    <div className="sector-heatmap-title">
                        <Grid3X3 size={20} />
                        <h2>Sector Heatmap</h2>
                    </div>
                </div>
                <div className="sector-error">
                    <p>{error}</p>
                    <button onClick={fetchSectorData} className="retry-btn">
                        <RefreshCw size={16} />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const selectedSector = sectors.find(s => s.id === expandedSector);

    return (
        <div className="sector-heatmap">
            <div className="sector-heatmap-header">
                <div className="sector-heatmap-title">
                    <Grid3X3 size={20} />
                    <h2>Sector Heatmap</h2>
                </div>
                <div className="sector-heatmap-actions">
                    {lastUpdated && (
                        <span className="last-updated">
                            Updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                    <button onClick={fetchSectorData} className="refresh-btn" title="Refresh data">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            <div className="sector-grid">
                {sectors.map((sector) => (
                    <button
                        key={sector.id}
                        className={`sector-tile ${expandedSector === sector.id ? 'active' : ''}`}
                        style={{
                            backgroundColor: getHeatmapColor(sector.change),
                            color: getTextColor(sector.change),
                        }}
                        onClick={() => handleSectorClick(sector.id)}
                    >
                        <div className="sector-tile-header">
                            <span className="sector-icon">{sector.icon}</span>
                            <ChevronRight
                                size={16}
                                className={`expand-icon ${expandedSector === sector.id ? 'expanded' : ''}`}
                            />
                        </div>
                        <div className="sector-tile-name">{sector.name}</div>
                        <div className="sector-tile-change">
                            {sector.change >= 0 ? (
                                <TrendingUp size={14} />
                            ) : (
                                <TrendingDown size={14} />
                            )}
                            {formatChange(sector.change)}
                        </div>
                        <div className="sector-tile-stocks">
                            {sector.stockCount} stocks
                        </div>
                    </button>
                ))}
            </div>

            {/* Expanded Sector Details */}
            {selectedSector && (
                <div className="sector-details">
                    <div className="sector-details-header">
                        <div className="sector-details-title">
                            <span className="sector-icon">{selectedSector.icon}</span>
                            <h3>{selectedSector.name}</h3>
                            <span className={`sector-change ${selectedSector.change >= 0 ? 'positive' : 'negative'}`}>
                                {formatChange(selectedSector.change)}
                            </span>
                        </div>
                        <button onClick={() => setExpandedSector(null)} className="close-details">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="sector-highlights">
                        {selectedSector.topGainer && (
                            <div className="highlight-card gainer">
                                <span className="highlight-label">Top Gainer</span>
                                <span className="highlight-name">
                                    {selectedSector.topGainer.name.replace('.NS', '')}
                                </span>
                                <span className="highlight-change positive">
                                    {formatChange(selectedSector.topGainer.change)}
                                </span>
                            </div>
                        )}
                        {selectedSector.topLoser && (
                            <div className="highlight-card loser">
                                <span className="highlight-label">Top Loser</span>
                                <span className="highlight-name">
                                    {selectedSector.topLoser.name.replace('.NS', '')}
                                </span>
                                <span className="highlight-change negative">
                                    {formatChange(selectedSector.topLoser.change)}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="sector-stocks-list">
                        {selectedSector.stocks.map((stock) => (
                            <button
                                key={stock.symbol}
                                className="sector-stock-item"
                                onClick={() => handleStockClick(stock.symbol)}
                            >
                                <div className="stock-info">
                                    <span className="stock-symbol">
                                        {stock.symbol.replace('.NS', '').replace('.BO', '')}
                                    </span>
                                    <span className="stock-name">{stock.name}</span>
                                </div>
                                <div className="stock-data">
                                    <span className="stock-price">
                                        ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </span>
                                    <span className={`stock-change ${stock.changePercent >= 0 ? 'positive' : 'negative'}`}>
                                        {stock.changePercent >= 0 ? (
                                            <TrendingUp size={12} />
                                        ) : (
                                            <TrendingDown size={12} />
                                        )}
                                        {formatChange(stock.changePercent)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
