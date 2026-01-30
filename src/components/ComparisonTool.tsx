'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Search, TrendingUp, TrendingDown, BarChart3, ArrowLeftRight } from 'lucide-react';
import { createChart, LineSeries, LineData, IChartApi, Time } from 'lightweight-charts';

interface CompareStock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    marketCap: number | null;
    pe: number | null;
    volume: number;
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
    history: { time: string; close: number; normalizedClose: number }[];
}

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];
const TIME_RANGES = [
    { label: '1W', value: '5d' },
    { label: '1M', value: '1mo' },
    { label: '3M', value: '3mo' },
    { label: '6M', value: '6mo' },
    { label: '1Y', value: '1y' },
];

interface ComparisonToolProps {
    onClose?: () => void;
}

export default function ComparisonTool({ onClose }: ComparisonToolProps) {
    const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
    const [stocksData, setStocksData] = useState<CompareStock[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ symbol: string; name: string }[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [range, setRange] = useState('1mo');
    const [showSearch, setShowSearch] = useState(false);

    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Search for stocks
    const handleSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        try {
            const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                // Filter out already selected stocks - API returns array directly
                const filtered = (Array.isArray(data) ? data : []).filter(
                    (r: { symbol: string }) => !selectedSymbols.includes(r.symbol)
                );
                setSearchResults(filtered.slice(0, 5));
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setSearchLoading(false);
        }
    }, [selectedSymbols]);

    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            handleSearch(searchQuery);
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, handleSearch]);

    // Add stock to comparison
    const addStock = (symbol: string) => {
        if (selectedSymbols.length < 4 && !selectedSymbols.includes(symbol)) {
            setSelectedSymbols([...selectedSymbols, symbol]);
            setSearchQuery('');
            setSearchResults([]);
            setShowSearch(false);
        }
    };

    // Remove stock from comparison
    const removeStock = (symbol: string) => {
        setSelectedSymbols(selectedSymbols.filter(s => s !== symbol));
        setStocksData(stocksData.filter(s => s.symbol !== symbol));
    };

    // Fetch comparison data
    useEffect(() => {
        if (selectedSymbols.length === 0) {
            setStocksData([]);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/compare?symbols=${selectedSymbols.join(',')}&range=${range}`
                );
                if (res.ok) {
                    const data = await res.json();
                    setStocksData(data.stocks);
                }
            } catch (error) {
                console.error('Error fetching comparison:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedSymbols, range]);

    // Create/update chart
    useEffect(() => {
        if (!chartContainerRef.current || stocksData.length === 0) return;

        // Clear existing chart
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
            layout: {
                background: { color: 'transparent' },
                textColor: 'var(--text-secondary)',
            },
            grid: {
                vertLines: { color: 'var(--border-color)' },
                horzLines: { color: 'var(--border-color)' },
            },
            crosshair: {
                mode: 1,
            },
            rightPriceScale: {
                borderColor: 'var(--border-color)',
            },
            timeScale: {
                borderColor: 'var(--border-color)',
                timeVisible: true,
            },
        });

        chartRef.current = chart;

        // Add series for each stock
        stocksData.forEach((stock, index) => {
            const series = chart.addSeries(LineSeries, {
                color: CHART_COLORS[index % CHART_COLORS.length],
                lineWidth: 2,
                title: stock.symbol.replace('.NS', '').replace('.BO', ''),
            });

            const lineData: LineData[] = stock.history.map(h => ({
                time: h.time as Time,
                value: h.normalizedClose,
            }));

            series.setData(lineData);
        });

        chart.timeScale().fitContent();

        // Resize handler
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
    }, [stocksData]);

    const formatMarketCap = (cap: number | null) => {
        if (!cap) return 'N/A';
        if (cap >= 10000000) return `₹${(cap / 10000000).toFixed(0)} Cr`;
        if (cap >= 100000) return `₹${(cap / 100000).toFixed(0)} L`;
        return `₹${cap.toLocaleString('en-IN')}`;
    };

    const formatVolume = (vol: number) => {
        if (vol >= 10000000) return `${(vol / 10000000).toFixed(2)} Cr`;
        if (vol >= 100000) return `${(vol / 100000).toFixed(2)} L`;
        return vol.toLocaleString('en-IN');
    };

    return (
        <div className="comparison-tool">
            <div className="comparison-header">
                <div className="comparison-title">
                    <ArrowLeftRight size={20} />
                    <h2>Stock Comparison</h2>
                    <span className="stock-count">{selectedSymbols.length}/4</span>
                </div>
                {onClose && (
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Stock Selector */}
            <div className="comparison-selector">
                <div className="selected-stocks">
                    {selectedSymbols.map((symbol, index) => {
                        const stock = stocksData.find(s => s.symbol === symbol);
                        return (
                            <div
                                key={symbol}
                                className="selected-stock-chip"
                                style={{ borderColor: CHART_COLORS[index] }}
                            >
                                <span
                                    className="chip-color"
                                    style={{ backgroundColor: CHART_COLORS[index] }}
                                />
                                <span className="chip-symbol">
                                    {symbol.replace('.NS', '').replace('.BO', '')}
                                </span>
                                {stock && (
                                    <span className={`chip-change ${stock.changePercent >= 0 ? 'positive' : 'negative'}`}>
                                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                    </span>
                                )}
                                <button onClick={() => removeStock(symbol)} className="chip-remove">
                                    <X size={14} />
                                </button>
                            </div>
                        );
                    })}

                    {selectedSymbols.length < 4 && (
                        <div className="add-stock-container">
                            {showSearch ? (
                                <div className="stock-search-input">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search stocks..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                    <button onClick={() => {
                                        setShowSearch(false);
                                        setSearchQuery('');
                                        setSearchResults([]);
                                    }}>
                                        <X size={14} />
                                    </button>

                                    {searchResults.length > 0 && (
                                        <div className="search-dropdown">
                                            {searchResults.map(result => (
                                                <button
                                                    key={result.symbol}
                                                    onClick={() => addStock(result.symbol)}
                                                    className="search-result"
                                                >
                                                    <span className="result-symbol">
                                                        {result.symbol.replace('.NS', '').replace('.BO', '')}
                                                    </span>
                                                    <span className="result-name">{result.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {searchLoading && (
                                        <div className="search-dropdown">
                                            <div className="search-loading">Searching...</div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button className="add-stock-btn" onClick={() => setShowSearch(true)}>
                                    <Plus size={16} />
                                    Add Stock
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Time Range Selector */}
                {selectedSymbols.length > 0 && (
                    <div className="range-selector">
                        {TIME_RANGES.map(r => (
                            <button
                                key={r.value}
                                className={`range-btn ${range === r.value ? 'active' : ''}`}
                                onClick={() => setRange(r.value)}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Empty State */}
            {selectedSymbols.length === 0 && (
                <div className="comparison-empty">
                    <BarChart3 size={48} />
                    <h3>Compare Stocks</h3>
                    <p>Add up to 4 stocks to compare their performance side by side</p>
                    <button className="add-stock-btn primary" onClick={() => setShowSearch(true)}>
                        <Plus size={16} />
                        Add First Stock
                    </button>
                </div>
            )}

            {/* Loading State */}
            {loading && selectedSymbols.length > 0 && (
                <div className="comparison-loading">
                    <div className="loading-spinner" />
                    <p>Loading comparison data...</p>
                </div>
            )}

            {/* Chart */}
            {!loading && stocksData.length > 0 && (
                <>
                    <div className="comparison-chart">
                        <div className="chart-label">
                            <span>Normalized Performance (%)</span>
                        </div>
                        <div ref={chartContainerRef} className="chart-container" />
                    </div>

                    {/* Metrics Table */}
                    <div className="comparison-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Metric</th>
                                    {stocksData.map((stock, i) => (
                                        <th key={stock.symbol} style={{ color: CHART_COLORS[i] }}>
                                            {stock.symbol.replace('.NS', '').replace('.BO', '')}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Current Price</td>
                                    {stocksData.map(stock => (
                                        <td key={stock.symbol}>
                                            ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td>Change</td>
                                    {stocksData.map(stock => (
                                        <td key={stock.symbol} className={stock.changePercent >= 0 ? 'positive' : 'negative'}>
                                            <span className="change-icon">
                                                {stock.changePercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            </span>
                                            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td>Market Cap</td>
                                    {stocksData.map(stock => (
                                        <td key={stock.symbol}>{formatMarketCap(stock.marketCap)}</td>
                                    ))}
                                </tr>
                                <tr>
                                    <td>P/E Ratio</td>
                                    {stocksData.map(stock => (
                                        <td key={stock.symbol}>{stock.pe?.toFixed(2) || 'N/A'}</td>
                                    ))}
                                </tr>
                                <tr>
                                    <td>Volume</td>
                                    {stocksData.map(stock => (
                                        <td key={stock.symbol}>{formatVolume(stock.volume)}</td>
                                    ))}
                                </tr>
                                <tr>
                                    <td>52W High</td>
                                    {stocksData.map(stock => (
                                        <td key={stock.symbol}>
                                            {stock.fiftyTwoWeekHigh
                                                ? `₹${stock.fiftyTwoWeekHigh.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                                                : 'N/A'}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td>52W Low</td>
                                    {stocksData.map(stock => (
                                        <td key={stock.symbol}>
                                            {stock.fiftyTwoWeekLow
                                                ? `₹${stock.fiftyTwoWeekLow.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                                                : 'N/A'}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
