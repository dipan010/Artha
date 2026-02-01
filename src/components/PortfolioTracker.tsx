'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Briefcase, Plus, Trash2, RefreshCw, TrendingUp, TrendingDown,
    Edit2, X, Download, Upload, Search, PieChart, BarChart3,
    Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { STOCK_SECTORS, type StockSector } from '@/types/portfolio';
import { createChart, IChartApi } from 'lightweight-charts';

interface PortfolioTrackerProps {
    onSelectStock?: (symbol: string) => void;
}

export default function PortfolioTracker({ onSelectStock }: PortfolioTrackerProps) {
    const {
        portfolio,
        summary,
        sectorAllocation,
        loading,
        refreshing,
        addHolding,
        updateHolding,
        deleteHolding,
        refreshPrices,
        exportPortfolio,
        importPortfolio,
        clearPortfolio,
    } = usePortfolio();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'value' | 'pnl' | 'pnlPercent'>('value');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'holdings' | 'sectors'>('holdings');

    // Add holding form state
    const [newHolding, setNewHolding] = useState({
        symbol: '',
        name: '',
        quantity: '',
        price: '',
        sector: '' as StockSector | '',
    });
    const [searchResults, setSearchResults] = useState<Array<{ symbol: string; name: string }>>([]);
    const [searching, setSearching] = useState(false);
    const [adding, setAdding] = useState(false);

    // Import state
    const [importData, setImportData] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Search for stocks
    const searchStocks = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const response = await fetch(`/api/stocks?query=${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.results?.slice(0, 5) || []);
            }
        } catch {
            // Ignore errors
        } finally {
            setSearching(false);
        }
    };

    // Handle adding a new holding
    const handleAddHolding = async () => {
        if (!newHolding.symbol || !newHolding.quantity || !newHolding.price) return;

        setAdding(true);
        try {
            await addHolding(
                newHolding.symbol,
                newHolding.name || newHolding.symbol,
                parseFloat(newHolding.quantity),
                parseFloat(newHolding.price),
                newHolding.sector as StockSector || undefined
            );
            setNewHolding({ symbol: '', name: '', quantity: '', price: '', sector: '' });
            setShowAddModal(false);
        } catch (error) {
            console.error('Error adding holding:', error);
        } finally {
            setAdding(false);
        }
    };

    // Handle stock selection from search
    const handleSelectSearchResult = (result: { symbol: string; name: string }) => {
        setNewHolding(prev => ({
            ...prev,
            symbol: result.symbol,
            name: result.name,
        }));
        setSearchResults([]);
    };

    // Handle export
    const handleExport = () => {
        const data = exportPortfolio();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `artha-portfolio-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Handle import from file
    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setImportData(content);
            };
            reader.readAsText(file);
        }
    };

    // Process import
    const handleImport = () => {
        if (importPortfolio(importData)) {
            setShowImportModal(false);
            setImportData('');
        }
    };

    // Sort and filter holdings
    const filteredHoldings = portfolio?.holdings
        .filter(h =>
            searchQuery === '' ||
            h.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            h.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            let aVal, bVal;
            switch (sortBy) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'value':
                    aVal = a.currentValue || a.investedValue;
                    bVal = b.currentValue || b.investedValue;
                    break;
                case 'pnl':
                    aVal = a.pnl || 0;
                    bVal = b.pnl || 0;
                    break;
                case 'pnlPercent':
                    aVal = a.pnlPercent || 0;
                    bVal = b.pnlPercent || 0;
                    break;
                default:
                    aVal = 0;
                    bVal = 0;
            }

            if (typeof aVal === 'string') {
                return sortOrder === 'asc'
                    ? aVal.localeCompare(bVal as string)
                    : (bVal as string).localeCompare(aVal);
            }
            return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        }) || [];

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Format percentage
    const formatPercent = (value: number) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    };

    if (loading) {
        return (
            <div className="portfolio-tracker loading">
                <Loader2 size={24} className="spin" />
                <span>Loading portfolio...</span>
            </div>
        );
    }

    return (
        <div className="portfolio-tracker">
            {/* Header */}
            <div className="portfolio-header">
                <div className="portfolio-title">
                    <Briefcase size={20} />
                    <h2>Portfolio</h2>
                    {refreshing && <Loader2 size={16} className="spin" />}
                </div>
                <div className="portfolio-actions">
                    <button className="portfolio-action-btn" onClick={() => setShowAddModal(true)}>
                        <Plus size={16} />
                    </button>
                    <button className="portfolio-action-btn" onClick={refreshPrices} disabled={refreshing}>
                        <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
                    </button>
                    <button className="portfolio-action-btn" onClick={handleExport}>
                        <Download size={16} />
                    </button>
                    <button className="portfolio-action-btn" onClick={() => setShowImportModal(true)}>
                        <Upload size={16} />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="portfolio-summary">
                    <div className="summary-card main">
                        <span className="summary-label">Current Value</span>
                        <span className="summary-value">{formatCurrency(summary.currentValue)}</span>
                        <span className={`summary-change ${summary.totalPnL >= 0 ? 'positive' : 'negative'}`}>
                            {summary.totalPnL >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {formatCurrency(Math.abs(summary.totalPnL))} ({formatPercent(summary.totalPnLPercent)})
                        </span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-label">Invested</span>
                        <span className="summary-value">{formatCurrency(summary.totalInvested)}</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-label">Day Change</span>
                        <span className={`summary-value ${summary.dayChange >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(summary.dayChange)}
                        </span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-label">Holdings</span>
                        <span className="summary-value">{summary.holdingsCount}</span>
                    </div>
                </div>
            )}

            {/* View Toggle */}
            <div className="portfolio-view-toggle">
                <button
                    className={`view-btn ${view === 'holdings' ? 'active' : ''}`}
                    onClick={() => setView('holdings')}
                >
                    <BarChart3 size={14} />
                    Holdings
                </button>
                <button
                    className={`view-btn ${view === 'sectors' ? 'active' : ''}`}
                    onClick={() => setView('sectors')}
                >
                    <PieChart size={14} />
                    Sectors
                </button>
            </div>

            {view === 'holdings' ? (
                <>
                    {/* Search & Sort */}
                    <div className="portfolio-controls">
                        <div className="portfolio-search">
                            <Search size={14} />
                            <input
                                type="text"
                                placeholder="Search holdings..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="portfolio-sort">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                            >
                                <option value="value">Value</option>
                                <option value="name">Name</option>
                                <option value="pnl">P&L</option>
                                <option value="pnlPercent">P&L %</option>
                            </select>
                            <button onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')}>
                                {sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        </div>
                    </div>

                    {/* Holdings List */}
                    <div className="portfolio-holdings">
                        {filteredHoldings.length === 0 ? (
                            <div className="portfolio-empty">
                                <Briefcase size={32} />
                                <p>No holdings yet</p>
                                <button onClick={() => setShowAddModal(true)}>
                                    <Plus size={14} />
                                    Add your first stock
                                </button>
                            </div>
                        ) : (
                            filteredHoldings.map(holding => (
                                <div
                                    key={holding.id}
                                    className="holding-card"
                                    onClick={() => onSelectStock?.(holding.symbol)}
                                >
                                    <div className="holding-info">
                                        <div className="holding-name">
                                            <strong>{holding.symbol.replace('.NS', '').replace('.BO', '')}</strong>
                                            <span>{holding.name}</span>
                                        </div>
                                        <div className="holding-meta">
                                            <span>{holding.quantity} shares</span>
                                            <span>Avg: ₹{holding.avgBuyPrice.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="holding-values">
                                        <div className="holding-current">
                                            <span className="holding-price">
                                                {holding.currentPrice
                                                    ? `₹${holding.currentPrice.toFixed(2)}`
                                                    : '-'
                                                }
                                            </span>
                                            <span className="holding-value">
                                                {formatCurrency(holding.currentValue || holding.investedValue)}
                                            </span>
                                        </div>
                                        <div className={`holding-pnl ${(holding.pnl || 0) >= 0 ? 'positive' : 'negative'}`}>
                                            <span>{formatCurrency(Math.abs(holding.pnl || 0))}</span>
                                            <span>{formatPercent(holding.pnlPercent || 0)}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="holding-delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Delete this holding?')) {
                                                deleteHolding(holding.id);
                                            }
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </>
            ) : (
                /* Sector Allocation View */
                <div className="portfolio-sectors">
                    {sectorAllocation.map(sector => (
                        <div key={sector.sector} className="sector-card">
                            <div className="sector-header">
                                <span className="sector-name">{sector.sector}</span>
                                <span className="sector-percentage">{sector.percentage.toFixed(1)}%</span>
                            </div>
                            <div className="sector-bar">
                                <div
                                    className="sector-bar-fill"
                                    style={{ width: `${sector.percentage}%` }}
                                />
                            </div>
                            <div className="sector-value">{formatCurrency(sector.value)}</div>
                            <div className="sector-holdings">
                                {sector.holdings.map(h => (
                                    <span key={h.id} className="sector-holding-tag">
                                        {h.symbol.replace('.NS', '')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Holding Modal */}
            {showAddModal && (
                <div className="portfolio-modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="portfolio-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add Holding</h3>
                            <button onClick={() => setShowAddModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Stock Symbol</label>
                                <div className="search-input-wrapper">
                                    <input
                                        type="text"
                                        placeholder="Search for a stock..."
                                        value={newHolding.symbol}
                                        onChange={(e) => {
                                            setNewHolding(prev => ({ ...prev, symbol: e.target.value }));
                                            searchStocks(e.target.value);
                                        }}
                                    />
                                    {searching && <Loader2 size={14} className="spin" />}
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="search-dropdown">
                                        {searchResults.map(result => (
                                            <button
                                                key={result.symbol}
                                                onClick={() => handleSelectSearchResult(result)}
                                            >
                                                <strong>{result.symbol}</strong>
                                                <span>{result.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Company Name</label>
                                <input
                                    type="text"
                                    placeholder="Company name"
                                    value={newHolding.name}
                                    onChange={(e) => setNewHolding(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Quantity</label>
                                    <input
                                        type="number"
                                        placeholder="No. of shares"
                                        value={newHolding.quantity}
                                        onChange={(e) => setNewHolding(prev => ({ ...prev, quantity: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Buy Price (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Price per share"
                                        value={newHolding.price}
                                        onChange={(e) => setNewHolding(prev => ({ ...prev, price: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Sector (Optional)</label>
                                <select
                                    value={newHolding.sector}
                                    onChange={(e) => setNewHolding(prev => ({ ...prev, sector: e.target.value as StockSector }))}
                                >
                                    <option value="">Select sector</option>
                                    {STOCK_SECTORS.map(sector => (
                                        <option key={sector} value={sector}>{sector}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-cancel" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="modal-submit"
                                onClick={handleAddHolding}
                                disabled={!newHolding.symbol || !newHolding.quantity || !newHolding.price || adding}
                            >
                                {adding ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                                Add Holding
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="portfolio-modal-overlay" onClick={() => setShowImportModal(false)}>
                    <div className="portfolio-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Import Portfolio</h3>
                            <button onClick={() => setShowImportModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Upload JSON File</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileImport}
                                />
                            </div>
                            <div className="form-group">
                                <label>Or paste JSON data</label>
                                <textarea
                                    placeholder='{"holdings": [...], "transactions": [...]}'
                                    value={importData}
                                    onChange={(e) => setImportData(e.target.value)}
                                    rows={6}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-cancel" onClick={() => setShowImportModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="modal-submit"
                                onClick={handleImport}
                                disabled={!importData}
                            >
                                <Upload size={14} />
                                Import
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
