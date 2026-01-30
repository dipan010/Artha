'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Calendar, TrendingUp, RefreshCw, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

interface DividendStock {
    symbol: string;
    name: string;
    price: number;
    dividendYield: number | null;
    dividendRate: number | null;
    exDividendDate: string | null;
    fiveYearAvgYield: number | null;
    lastDividend: number | null;
}

interface DividendSummary {
    totalStocks: number;
    yieldingStocks: number;
    averageYield: number;
    nextExDate: DividendStock | null;
}

// High dividend yield stocks from India
const DEFAULT_DIVIDEND_STOCKS = [
    'COALINDIA.NS', 'POWERGRID.NS', 'ONGC.NS', 'IOC.NS', 'GAIL.NS',
    'HINDUNILVR.NS', 'ITC.NS', 'VEDL.NS', 'OIL.NS', 'NMDC.NS'
];

interface DividendTrackerProps {
    watchlistSymbols?: string[];
    onSelectStock?: (symbol: string) => void;
}

export default function DividendTracker({ watchlistSymbols, onSelectStock }: DividendTrackerProps) {
    const [stocks, setStocks] = useState<DividendStock[]>([]);
    const [summary, setSummary] = useState<DividendSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'yield' | 'calendar'>('yield');
    const [sortBy, setSortBy] = useState<'yield' | 'name' | 'exDate'>('yield');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const symbolsToFetch = watchlistSymbols && watchlistSymbols.length > 0
        ? watchlistSymbols
        : DEFAULT_DIVIDEND_STOCKS;

    const fetchDividendData = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/dividends?symbols=${symbolsToFetch.join(',')}`);
            if (!res.ok) throw new Error('Failed to fetch dividend data');

            const data = await res.json();
            setStocks(data.stocks);
            setSummary(data.summary);
        } catch (err) {
            console.error('Error fetching dividends:', err);
            setError('Failed to load dividend data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDividendData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbolsToFetch.join(',')]);

    const sortedStocks = [...stocks].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case 'yield':
                comparison = (b.dividendYield || 0) - (a.dividendYield || 0);
                break;
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'exDate':
                const dateA = a.exDividendDate ? new Date(a.exDividendDate).getTime() : 0;
                const dateB = b.exDividendDate ? new Date(b.exDividendDate).getTime() : 0;
                comparison = dateA - dateB;
                break;
        }

        return sortDir === 'asc' ? comparison : -comparison;
    });

    const upcomingExDates = stocks
        .filter(s => s.exDividendDate && new Date(s.exDividendDate) >= new Date())
        .sort((a, b) =>
            new Date(a.exDividendDate!).getTime() - new Date(b.exDividendDate!).getTime()
        );

    const handleSort = (column: 'yield' | 'name' | 'exDate') => {
        if (sortBy === column) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDir('desc');
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getDaysUntil = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    if (loading) {
        return (
            <div className="dividend-tracker">
                <div className="dividend-header">
                    <div className="dividend-title">
                        <DollarSign size={20} />
                        <h2>Dividend Tracker</h2>
                    </div>
                </div>
                <div className="dividend-loading">
                    <div className="loading-spinner" />
                    <p>Loading dividend data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dividend-tracker">
                <div className="dividend-header">
                    <div className="dividend-title">
                        <DollarSign size={20} />
                        <h2>Dividend Tracker</h2>
                    </div>
                </div>
                <div className="dividend-error">
                    <p>{error}</p>
                    <button onClick={fetchDividendData} className="retry-btn">
                        <RefreshCw size={16} />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="dividend-tracker">
            <div className="dividend-header">
                <div className="dividend-title">
                    <DollarSign size={20} />
                    <h2>Dividend Tracker</h2>
                </div>
                <div className="dividend-actions">
                    <div className="view-tabs">
                        <button
                            className={`view-tab ${viewMode === 'yield' ? 'active' : ''}`}
                            onClick={() => setViewMode('yield')}
                        >
                            <TrendingUp size={14} />
                            Yield
                        </button>
                        <button
                            className={`view-tab ${viewMode === 'calendar' ? 'active' : ''}`}
                            onClick={() => setViewMode('calendar')}
                        >
                            <Calendar size={14} />
                            Calendar
                        </button>
                    </div>
                    <button onClick={fetchDividendData} className="refresh-btn" title="Refresh">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="dividend-summary">
                    <div className="summary-card">
                        <span className="summary-label">Avg. Yield</span>
                        <span className="summary-value highlight">
                            {summary.averageYield.toFixed(2)}%
                        </span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-label">Dividend Stocks</span>
                        <span className="summary-value">
                            {summary.yieldingStocks}/{summary.totalStocks}
                        </span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-label">Next Ex-Date</span>
                        <span className="summary-value">
                            {summary.nextExDate
                                ? formatDate(summary.nextExDate.exDividendDate)
                                : 'None'}
                        </span>
                    </div>
                </div>
            )}

            {viewMode === 'yield' ? (
                /* Yield Table View */
                <div className="dividend-table-container">
                    <table className="dividend-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('name')} className="sortable">
                                    Stock
                                    {sortBy === 'name' && (
                                        sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                                    )}
                                </th>
                                <th>Price</th>
                                <th onClick={() => handleSort('yield')} className="sortable">
                                    Yield
                                    {sortBy === 'yield' && (
                                        sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                                    )}
                                </th>
                                <th onClick={() => handleSort('exDate')} className="sortable">
                                    Ex-Date
                                    {sortBy === 'exDate' && (
                                        sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                                    )}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedStocks.map(stock => (
                                <tr
                                    key={stock.symbol}
                                    onClick={() => onSelectStock?.(stock.symbol)}
                                    className="clickable"
                                >
                                    <td>
                                        <div className="stock-cell">
                                            <span className="symbol">
                                                {stock.symbol.replace('.NS', '').replace('.BO', '')}
                                            </span>
                                            <span className="name">{stock.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </td>
                                    <td>
                                        <span className={`yield-value ${stock.dividendYield && stock.dividendYield > 3 ? 'high' : ''}`}>
                                            {stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : '-'}
                                        </span>
                                    </td>
                                    <td>{formatDate(stock.exDividendDate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Calendar View */
                <div className="dividend-calendar">
                    <h3 className="calendar-title">Upcoming Ex-Dividend Dates</h3>
                    {upcomingExDates.length > 0 ? (
                        <div className="calendar-list">
                            {upcomingExDates.map(stock => {
                                const daysUntil = getDaysUntil(stock.exDividendDate!);
                                return (
                                    <button
                                        key={stock.symbol}
                                        className="calendar-item"
                                        onClick={() => onSelectStock?.(stock.symbol)}
                                    >
                                        <div className="calendar-date">
                                            <span className="day">
                                                {new Date(stock.exDividendDate!).getDate()}
                                            </span>
                                            <span className="month">
                                                {new Date(stock.exDividendDate!).toLocaleDateString('en-IN', { month: 'short' })}
                                            </span>
                                        </div>
                                        <div className="calendar-stock">
                                            <span className="symbol">
                                                {stock.symbol.replace('.NS', '').replace('.BO', '')}
                                            </span>
                                            <span className="name">{stock.name}</span>
                                        </div>
                                        <div className="calendar-info">
                                            <span className="yield">
                                                {stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : '-'}
                                            </span>
                                            <span className={`days-until ${daysUntil <= 7 ? 'soon' : ''}`}>
                                                {daysUntil === 0 ? 'Today' :
                                                    daysUntil === 1 ? 'Tomorrow' :
                                                        `${daysUntil} days`}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="no-upcoming">
                            <Calendar size={32} />
                            <p>No upcoming ex-dividend dates</p>
                        </div>
                    )}
                </div>
            )}

            <div className="dividend-note">
                <p>
                    {!watchlistSymbols || watchlistSymbols.length === 0
                        ? 'Showing top dividend stocks. Add stocks to your watchlist to track their dividends.'
                        : `Tracking ${stocks.length} stocks from your watchlist.`}
                </p>
            </div>
        </div>
    );
}
