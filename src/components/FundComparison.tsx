'use client';

import { useState, useEffect, useRef } from 'react';
import {
    ArrowLeftRight, Plus, X, Search, Star, TrendingUp, TrendingDown,
    Download, Share2, Loader2, BarChart3, PieChart, AlertTriangle
} from 'lucide-react';
import { createChart, IChartApi, LineSeries } from 'lightweight-charts';
import type { MutualFund, MutualFundCategory } from '@/types/mutualFunds';
import { CATEGORY_LABELS, RISK_COLORS } from '@/types/mutualFunds';

interface FundComparisonProps {
    initialFunds?: MutualFund[];
    onClose?: () => void;
}

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

const COMPARISON_METRICS = [
    { key: 'nav', label: 'NAV', format: 'currency' },
    { key: 'returns.oneYear', label: '1Y Returns', format: 'percent' },
    { key: 'returns.threeYear', label: '3Y Returns', format: 'percent' },
    { key: 'returns.fiveYear', label: '5Y Returns', format: 'percent' },
    { key: 'aum', label: 'AUM', format: 'crore' },
    { key: 'expenseRatio', label: 'Expense Ratio', format: 'percent' },
    { key: 'rating', label: 'Rating', format: 'stars' },
    { key: 'riskLevel', label: 'Risk Level', format: 'risk' },
    { key: 'minInvestment', label: 'Min Investment', format: 'currency' },
] as const;

export default function FundComparison({ initialFunds = [], onClose }: FundComparisonProps) {
    const [selectedFunds, setSelectedFunds] = useState<MutualFund[]>(initialFunds);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MutualFund[]>([]);
    const [searching, setSearching] = useState(false);
    const [allFunds, setAllFunds] = useState<MutualFund[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'table' | 'chart' | 'risk'>('table');

    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    // Fetch all funds on mount
    useEffect(() => {
        const fetchFunds = async () => {
            try {
                const response = await fetch('/api/mutual-funds');
                if (response.ok) {
                    const data = await response.json();
                    setAllFunds(data.funds || []);
                }
            } catch (error) {
                console.error('Error fetching funds:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFunds();
    }, []);

    // Search funds
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        const query = searchQuery.toLowerCase();
        const results = allFunds
            .filter(fund =>
                !selectedFunds.find(sf => sf.id === fund.id) &&
                (fund.name.toLowerCase().includes(query) ||
                    fund.amc.toLowerCase().includes(query) ||
                    CATEGORY_LABELS[fund.category].toLowerCase().includes(query))
            )
            .slice(0, 5);

        setSearchResults(results);
        setSearching(false);
    }, [searchQuery, allFunds, selectedFunds]);

    // Add fund to comparison
    const addFund = (fund: MutualFund) => {
        if (selectedFunds.length >= 4) {
            alert('Maximum 4 funds can be compared at once');
            return;
        }
        setSelectedFunds(prev => [...prev, fund]);
        setSearchQuery('');
        setSearchResults([]);
    };

    // Remove fund from comparison
    const removeFund = (fundId: string) => {
        setSelectedFunds(prev => prev.filter(f => f.id !== fundId));
    };

    // Get nested property value
    const getNestedValue = (obj: MutualFund, path: string): number | string | undefined => {
        return path.split('.').reduce((acc: Record<string, unknown> | undefined, key) => {
            return acc?.[key] as Record<string, unknown> | undefined;
        }, obj as unknown as Record<string, unknown>) as number | string | undefined;
    };

    // Format value based on type
    const formatValue = (value: unknown, format: string): string => {
        if (value === undefined || value === null) return '-';

        switch (format) {
            case 'currency':
                return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
            case 'percent':
                const num = Number(value);
                return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
            case 'crore':
                return `₹${Number(value).toLocaleString('en-IN')} Cr`;
            case 'stars':
                return '★'.repeat(Number(value)) + '☆'.repeat(5 - Number(value));
            case 'risk':
                return String(value).replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
            default:
                return String(value);
        }
    };

    // Find best value in a row
    const getBestValue = (metric: typeof COMPARISON_METRICS[number]): string | null => {
        if (selectedFunds.length < 2) return null;

        const values = selectedFunds.map(fund => ({
            id: fund.id,
            value: getNestedValue(fund, metric.key) as number,
        })).filter(v => v.value !== undefined);

        if (values.length < 2) return null;

        // Determine if higher or lower is better
        const higherIsBetter = ['returns.oneYear', 'returns.threeYear', 'returns.fiveYear', 'rating', 'aum'].includes(metric.key);
        const lowerIsBetter = ['expenseRatio', 'minInvestment'].includes(metric.key);

        if (higherIsBetter) {
            const best = values.reduce((a, b) => a.value > b.value ? a : b);
            return best.id;
        }
        if (lowerIsBetter) {
            const best = values.reduce((a, b) => a.value < b.value ? a : b);
            return best.id;
        }

        return null;
    };

    // Create performance chart
    useEffect(() => {
        if (!chartContainerRef.current || selectedFunds.length === 0 || view !== 'chart') return;

        // Cleanup previous chart
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: 'transparent' },
                textColor: '#9ca3af',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 350,
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
        });

        chartRef.current = chart;

        // Add a series for each fund (simulated historical data)
        selectedFunds.forEach((fund, index) => {
            const series = chart.addSeries(LineSeries, {
                color: CHART_COLORS[index],
                lineWidth: 2,
            });

            // Generate simulated performance data based on returns
            const data = generatePerformanceData(fund);
            series.setData(data as any);
        });

        chart.timeScale().fitContent();

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [selectedFunds, view]);

    // Generate simulated performance data
    const generatePerformanceData = (fund: MutualFund) => {
        const data = [];
        const baseValue = 100;
        const monthlyReturn = (fund.returns.oneYear || 10) / 100 / 12;
        let value = baseValue;

        for (let i = 36; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);

            // Add some volatility
            const volatility = (Math.random() - 0.5) * 0.03;
            value = value * (1 + monthlyReturn + volatility);

            data.push({
                time: date.toISOString().split('T')[0],
                value: value,
            });
        }

        return data;
    };

    // Export comparison as image
    const handleExport = async () => {
        // Simple text export for now
        const text = selectedFunds.map(fund => {
            return `${fund.name}\n` +
                `Category: ${CATEGORY_LABELS[fund.category]}\n` +
                `NAV: ₹${fund.nav}\n` +
                `1Y Return: ${fund.returns.oneYear}%\n` +
                `AUM: ₹${fund.aum} Cr\n` +
                `Risk: ${fund.riskLevel}\n\n`;
        }).join('---\n');

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fund-comparison.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    // Render star rating
    const renderStars = (rating?: number) => {
        if (!rating) return <span className="no-rating">-</span>;
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map(i => (
                    <Star
                        key={i}
                        size={14}
                        className={i <= rating ? 'filled' : 'empty'}
                        fill={i <= rating ? '#f59e0b' : 'none'}
                        strokeWidth={i <= rating ? 0 : 1.5}
                    />
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="fund-comparison loading">
                <Loader2 size={24} className="spin" />
                <span>Loading funds...</span>
            </div>
        );
    }

    return (
        <div className="fund-comparison">
            {/* Header */}
            <div className="comparison-header">
                <div className="comparison-title">
                    <ArrowLeftRight size={20} />
                    <h2>Fund Comparison</h2>
                    <span className="fund-count">{selectedFunds.length}/4 funds</span>
                </div>
                <div className="comparison-actions">
                    {selectedFunds.length > 0 && (
                        <>
                            <button className="action-btn" onClick={handleExport}>
                                <Download size={16} />
                                Export
                            </button>
                            <button
                                className="action-btn clear"
                                onClick={() => setSelectedFunds([])}
                            >
                                Clear All
                            </button>
                        </>
                    )}
                    {onClose && (
                        <button className="action-btn close" onClick={onClose}>
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="comparison-search">
                <div className="search-input">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search funds to compare..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={selectedFunds.length >= 4}
                    />
                    {searching && <Loader2 size={14} className="spin" />}
                </div>
                {searchResults.length > 0 && (
                    <div className="search-dropdown">
                        {searchResults.map(fund => (
                            <button
                                key={fund.id}
                                className="search-result"
                                onClick={() => addFund(fund)}
                            >
                                <div className="result-info">
                                    <strong>{fund.name}</strong>
                                    <span>{fund.amc} • {CATEGORY_LABELS[fund.category]}</span>
                                </div>
                                <div className="result-stats">
                                    <span className={`return ${(fund.returns.oneYear || 0) >= 0 ? 'positive' : 'negative'}`}>
                                        {fund.returns.oneYear}%
                                    </span>
                                    {renderStars(fund.rating)}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected Funds Pills */}
            {selectedFunds.length > 0 && (
                <div className="selected-funds">
                    {selectedFunds.map((fund, index) => (
                        <div
                            key={fund.id}
                            className="fund-pill"
                            style={{ borderColor: CHART_COLORS[index] }}
                        >
                            <span
                                className="fund-color"
                                style={{ background: CHART_COLORS[index] }}
                            />
                            <span className="fund-name">{fund.name}</span>
                            <button onClick={() => removeFund(fund.id)}>
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {selectedFunds.length === 0 ? (
                <div className="comparison-empty">
                    <ArrowLeftRight size={48} />
                    <h3>Compare Mutual Funds</h3>
                    <p>Search and select up to 4 funds to compare their performance, returns, and other metrics side by side.</p>

                    {/* Quick picks */}
                    <div className="quick-picks">
                        <h4>Popular Comparisons</h4>
                        <div className="quick-pick-btns">
                            {allFunds.slice(0, 4).map(fund => (
                                <button
                                    key={fund.id}
                                    onClick={() => addFund(fund)}
                                >
                                    <Plus size={12} />
                                    {fund.name.substring(0, 30)}...
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* View Toggle */}
                    <div className="comparison-view-toggle">
                        <button
                            className={view === 'table' ? 'active' : ''}
                            onClick={() => setView('table')}
                        >
                            <BarChart3 size={14} />
                            Compare
                        </button>
                        <button
                            className={view === 'chart' ? 'active' : ''}
                            onClick={() => setView('chart')}
                        >
                            <TrendingUp size={14} />
                            Performance
                        </button>
                        <button
                            className={view === 'risk' ? 'active' : ''}
                            onClick={() => setView('risk')}
                        >
                            <AlertTriangle size={14} />
                            Risk Analysis
                        </button>
                    </div>

                    {view === 'table' && (
                        <div className="comparison-table">
                            {/* Header Row */}
                            <div className="table-row header">
                                <div className="table-cell metric">Metric</div>
                                {selectedFunds.map((fund, index) => (
                                    <div
                                        key={fund.id}
                                        className="table-cell fund"
                                        style={{ borderTopColor: CHART_COLORS[index] }}
                                    >
                                        <span className="fund-short-name">
                                            {fund.name.split(' ').slice(0, 3).join(' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Data Rows */}
                            {COMPARISON_METRICS.map(metric => {
                                const bestId = getBestValue(metric);
                                return (
                                    <div key={metric.key} className="table-row">
                                        <div className="table-cell metric">{metric.label}</div>
                                        {selectedFunds.map(fund => {
                                            const value = getNestedValue(fund, metric.key);
                                            const isBest = bestId === fund.id;
                                            return (
                                                <div
                                                    key={fund.id}
                                                    className={`table-cell value ${isBest ? 'best' : ''} ${metric.format === 'percent' && typeof value === 'number'
                                                        ? value >= 0 ? 'positive' : 'negative'
                                                        : ''
                                                        }`}
                                                >
                                                    {metric.format === 'stars'
                                                        ? renderStars(value as number)
                                                        : metric.format === 'risk'
                                                            ? <span style={{ color: RISK_COLORS[value as MutualFund['riskLevel']] }}>
                                                                {formatValue(value, metric.format)}
                                                            </span>
                                                            : formatValue(value, metric.format)
                                                    }
                                                    {isBest && <span className="best-badge">Best</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {view === 'chart' && (
                        <div className="comparison-chart">
                            <h3>Performance Comparison (Normalized to 100)</h3>
                            <div className="chart-legend">
                                {selectedFunds.map((fund, index) => (
                                    <span key={fund.id} className="legend-item">
                                        <span
                                            className="legend-color"
                                            style={{ background: CHART_COLORS[index] }}
                                        />
                                        {fund.name.split(' ').slice(0, 2).join(' ')}
                                    </span>
                                ))}
                            </div>
                            <div ref={chartContainerRef} className="chart-container" />
                        </div>
                    )}

                    {view === 'risk' && (
                        <div className="risk-analysis">
                            <h3>Risk Analysis</h3>
                            <div className="risk-grid">
                                {selectedFunds.map((fund, index) => (
                                    <div key={fund.id} className="risk-card">
                                        <div
                                            className="risk-header"
                                            style={{ borderLeftColor: CHART_COLORS[index] }}
                                        >
                                            <strong>{fund.name.split(' ').slice(0, 3).join(' ')}</strong>
                                        </div>
                                        <div className="risk-metrics">
                                            <div className="risk-item">
                                                <span>Risk Level</span>
                                                <span
                                                    className="risk-badge"
                                                    style={{
                                                        background: RISK_COLORS[fund.riskLevel],
                                                        color: 'white'
                                                    }}
                                                >
                                                    {fund.riskLevel.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="risk-item">
                                                <span>Category</span>
                                                <span>{CATEGORY_LABELS[fund.category]}</span>
                                            </div>
                                            <div className="risk-item">
                                                <span>AUM</span>
                                                <span>₹{fund.aum} Cr</span>
                                            </div>
                                            <div className="risk-item">
                                                <span>Expense Ratio</span>
                                                <span>{fund.expenseRatio}%</span>
                                            </div>
                                        </div>
                                        <div className="returns-section">
                                            <h4>Returns</h4>
                                            <div className="returns-grid">
                                                {fund.returns.oneMonth !== undefined && (
                                                    <div className={`return-item ${fund.returns.oneMonth >= 0 ? 'positive' : 'negative'}`}>
                                                        <span>1M</span>
                                                        <span>{fund.returns.oneMonth.toFixed(2)}%</span>
                                                    </div>
                                                )}
                                                {fund.returns.threeMonth !== undefined && (
                                                    <div className={`return-item ${fund.returns.threeMonth >= 0 ? 'positive' : 'negative'}`}>
                                                        <span>3M</span>
                                                        <span>{fund.returns.threeMonth.toFixed(2)}%</span>
                                                    </div>
                                                )}
                                                {fund.returns.oneYear !== undefined && (
                                                    <div className={`return-item ${fund.returns.oneYear >= 0 ? 'positive' : 'negative'}`}>
                                                        <span>1Y</span>
                                                        <span>{fund.returns.oneYear.toFixed(2)}%</span>
                                                    </div>
                                                )}
                                                {fund.returns.threeYear !== undefined && (
                                                    <div className={`return-item ${fund.returns.threeYear >= 0 ? 'positive' : 'negative'}`}>
                                                        <span>3Y</span>
                                                        <span>{fund.returns.threeYear.toFixed(2)}%</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
