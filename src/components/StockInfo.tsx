'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Plus, Check } from 'lucide-react';
import type { StockQuote, WatchlistItem } from '@/types/stock';

interface StockInfoProps {
    symbol: string | null;
    watchlist: WatchlistItem[];
    onAddToWatchlist: (item: WatchlistItem) => void;
}

export default function StockInfo({ symbol, watchlist, onAddToWatchlist }: StockInfoProps) {
    const [quote, setQuote] = useState<StockQuote | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isInWatchlist = watchlist.some((item) => item.symbol === symbol);

    useEffect(() => {
        if (!symbol) {
            setQuote(null);
            return;
        }

        const fetchQuote = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`/api/stocks/${encodeURIComponent(symbol)}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setQuote(data);
            } catch (err) {
                setError('Failed to load stock data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchQuote();
        const interval = setInterval(fetchQuote, 15000);
        return () => clearInterval(interval);
    }, [symbol]);

    const handleAddToWatchlist = () => {
        if (quote && !isInWatchlist) {
            onAddToWatchlist({
                symbol: quote.symbol,
                name: quote.name,
                addedAt: new Date().toISOString(),
            });
        }
    };

    if (!symbol) {
        return null;
    }

    if (loading && !quote) {
        return (
            <div className="stock-info loading">
                <RefreshCw size={24} className="spin" />
                <span>Loading stock data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="stock-info error">
                <span>{error}</span>
            </div>
        );
    }

    if (!quote) return null;

    const isPositive = quote.change >= 0;

    return (
        <div className="stock-info">
            <div className="stock-header">
                <div className="stock-title">
                    <h2>{quote.name}</h2>
                    <span className="stock-symbol">{quote.symbol}</span>
                    <span className="stock-exchange">{quote.exchange}</span>
                </div>

                <button
                    className={`watchlist-btn ${isInWatchlist ? 'added' : ''}`}
                    onClick={handleAddToWatchlist}
                    disabled={isInWatchlist}
                >
                    {isInWatchlist ? <Check size={16} /> : <Plus size={16} />}
                    {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                </button>
            </div>

            <div className="price-section">
                <div className="current-price">
                    <span className="price">₹{quote.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    <span className={`change ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        {isPositive ? '+' : ''}
                        {quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
                    </span>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat">
                    <span className="stat-label">Open</span>
                    <span className="stat-value">₹{quote.open.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Previous Close</span>
                    <span className="stat-value">₹{quote.previousClose.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Day High</span>
                    <span className="stat-value positive">₹{quote.high.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Day Low</span>
                    <span className="stat-value negative">₹{quote.low.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Volume</span>
                    <span className="stat-value">{(quote.volume / 1000000).toFixed(2)}M</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Market Cap</span>
                    <span className="stat-value">
                        {quote.marketCap ? `₹${(quote.marketCap / 10000000).toFixed(0)} Cr` : 'N/A'}
                    </span>
                </div>
                <div className="stat">
                    <span className="stat-label">52W High</span>
                    <span className="stat-value positive">
                        ₹{quote.fiftyTwoWeekHigh?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 'N/A'}
                    </span>
                </div>
                <div className="stat">
                    <span className="stat-label">52W Low</span>
                    <span className="stat-value negative">
                        ₹{quote.fiftyTwoWeekLow?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 'N/A'}
                    </span>
                </div>
            </div>
        </div>
    );
}
