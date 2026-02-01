'use client';

import { useState, useEffect } from 'react';
import { Wallet, RefreshCw, Star, TrendingUp, TrendingDown, Filter, ChevronRight, Loader2 } from 'lucide-react';
import type { MutualFund, MutualFundCategory } from '@/types/mutualFunds';
import { CATEGORY_LABELS, CATEGORY_ICONS, RISK_COLORS } from '@/types/mutualFunds';

type SortPeriod = 'oneMonth' | 'threeMonth' | 'sixMonth' | 'oneYear' | 'threeYear' | 'fiveYear';

export default function MutualFundsExplorer() {
    const [funds, setFunds] = useState<MutualFund[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<MutualFundCategory | 'all'>('all');
    const [sortBy, setSortBy] = useState<SortPeriod>('oneYear');
    const [expandedFund, setExpandedFund] = useState<string | null>(null);

    const fetchFunds = async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (selectedCategory !== 'all') {
                params.set('category', selectedCategory);
            }
            params.set('sortBy', sortBy);

            const response = await fetch(`/api/mutual-funds?${params}`);
            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            setFunds(data.funds);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load mutual funds');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFunds();
    }, [selectedCategory, sortBy]);

    const formatReturn = (value?: number) => {
        if (value === undefined) return '-';
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
    };

    const renderStars = (rating?: number) => {
        if (!rating) return null;
        return (
            <div className="fund-rating">
                {[1, 2, 3, 4, 5].map(i => (
                    <Star
                        key={i}
                        size={14}
                        className={i <= rating ? 'filled' : ''}
                    />
                ))}
            </div>
        );
    };

    const categories: (MutualFundCategory | 'all')[] = [
        'all', 'large_cap', 'mid_cap', 'small_cap', 'elss', 'index', 'hybrid', 'debt', 'sectoral'
    ];

    return (
        <div className="mutual-funds-container">
            {/* Header */}
            <div className="mf-header">
                <div className="mf-title">
                    <Wallet size={20} />
                    <h2>Mutual Funds Explorer</h2>
                </div>
                <button className="mf-refresh" onClick={fetchFunds} disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                </button>
            </div>

            {/* Filters */}
            <div className="mf-filters">
                <div className="mf-categories">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`mf-category ${selectedCategory === cat ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat !== 'all' && <span>{CATEGORY_ICONS[cat]}</span>}
                            {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
                        </button>
                    ))}
                </div>

                <div className="mf-sort">
                    <Filter size={14} />
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as SortPeriod)}
                    >
                        <option value="oneMonth">1M Return</option>
                        <option value="threeMonth">3M Return</option>
                        <option value="sixMonth">6M Return</option>
                        <option value="oneYear">1Y Return</option>
                        <option value="threeYear">3Y Return</option>
                        <option value="fiveYear">5Y Return</option>
                    </select>
                </div>
            </div>

            {/* Fund List */}
            <div className="mf-list">
                {loading ? (
                    <div className="mf-loading">
                        <Loader2 size={24} className="spin" />
                        <span>Loading mutual funds...</span>
                    </div>
                ) : error ? (
                    <div className="mf-error">
                        <p>{error}</p>
                        <button onClick={fetchFunds}>Try Again</button>
                    </div>
                ) : funds.length === 0 ? (
                    <div className="mf-empty">
                        <Wallet size={32} className="empty-icon" />
                        <p>No mutual funds found</p>
                    </div>
                ) : (
                    funds.map(fund => (
                        <div
                            key={fund.id}
                            className={`mf-card ${expandedFund === fund.id ? 'expanded' : ''}`}
                        >
                            <button
                                className="mf-card-header"
                                onClick={() => setExpandedFund(expandedFund === fund.id ? null : fund.id)}
                            >
                                <div className="mf-card-icon">
                                    {CATEGORY_ICONS[fund.category]}
                                </div>
                                <div className="mf-card-info">
                                    <div className="mf-card-name">{fund.name}</div>
                                    <div className="mf-card-meta">
                                        <span className="mf-amc">{fund.amc}</span>
                                        {renderStars(fund.rating)}
                                    </div>
                                </div>
                                <div className="mf-card-returns">
                                    <span className={`mf-return ${(fund.returns[sortBy] || 0) >= 0 ? 'positive' : 'negative'}`}>
                                        {(fund.returns[sortBy] || 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {formatReturn(fund.returns[sortBy])}
                                    </span>
                                    <span className="mf-return-label">
                                        {sortBy === 'oneMonth' ? '1M' :
                                            sortBy === 'threeMonth' ? '3M' :
                                                sortBy === 'sixMonth' ? '6M' :
                                                    sortBy === 'oneYear' ? '1Y' :
                                                        sortBy === 'threeYear' ? '3Y' : '5Y'}
                                    </span>
                                </div>
                                <ChevronRight
                                    size={18}
                                    className={`mf-expand-icon ${expandedFund === fund.id ? 'rotated' : ''}`}
                                />
                            </button>

                            {/* Expanded Details */}
                            {expandedFund === fund.id && (
                                <div className="mf-card-details">
                                    <div className="mf-details-grid">
                                        <div className="mf-detail">
                                            <span className="mf-detail-label">NAV</span>
                                            <span className="mf-detail-value">₹{fund.nav.toFixed(2)}</span>
                                        </div>
                                        <div className="mf-detail">
                                            <span className="mf-detail-label">AUM</span>
                                            <span className="mf-detail-value">₹{fund.aum.toLocaleString()} Cr</span>
                                        </div>
                                        <div className="mf-detail">
                                            <span className="mf-detail-label">Expense Ratio</span>
                                            <span className="mf-detail-value">{fund.expenseRatio}%</span>
                                        </div>
                                        <div className="mf-detail">
                                            <span className="mf-detail-label">Min Investment</span>
                                            <span className="mf-detail-value">₹{fund.minInvestment}</span>
                                        </div>
                                    </div>

                                    <div className="mf-returns-table">
                                        <h4>Returns Performance</h4>
                                        <div className="mf-returns-grid">
                                            <div className="mf-return-item">
                                                <span>1M</span>
                                                <span className={(fund.returns.oneMonth || 0) >= 0 ? 'positive' : 'negative'}>
                                                    {formatReturn(fund.returns.oneMonth)}
                                                </span>
                                            </div>
                                            <div className="mf-return-item">
                                                <span>3M</span>
                                                <span className={(fund.returns.threeMonth || 0) >= 0 ? 'positive' : 'negative'}>
                                                    {formatReturn(fund.returns.threeMonth)}
                                                </span>
                                            </div>
                                            <div className="mf-return-item">
                                                <span>6M</span>
                                                <span className={(fund.returns.sixMonth || 0) >= 0 ? 'positive' : 'negative'}>
                                                    {formatReturn(fund.returns.sixMonth)}
                                                </span>
                                            </div>
                                            <div className="mf-return-item">
                                                <span>1Y</span>
                                                <span className={(fund.returns.oneYear || 0) >= 0 ? 'positive' : 'negative'}>
                                                    {formatReturn(fund.returns.oneYear)}
                                                </span>
                                            </div>
                                            <div className="mf-return-item">
                                                <span>3Y</span>
                                                <span className={(fund.returns.threeYear || 0) >= 0 ? 'positive' : 'negative'}>
                                                    {formatReturn(fund.returns.threeYear)}
                                                </span>
                                            </div>
                                            <div className="mf-return-item">
                                                <span>5Y</span>
                                                <span className={(fund.returns.fiveYear || 0) >= 0 ? 'positive' : 'negative'}>
                                                    {formatReturn(fund.returns.fiveYear)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mf-risk-indicator">
                                        <span className="mf-risk-label">Risk Level:</span>
                                        <span
                                            className="mf-risk-badge"
                                            style={{ background: RISK_COLORS[fund.riskLevel] }}
                                        >
                                            {fund.riskLevel.replace('_', ' ')}
                                        </span>
                                    </div>

                                    {fund.exitLoad && (
                                        <div className="mf-exit-load">
                                            <span>Exit Load: {fund.exitLoad}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
