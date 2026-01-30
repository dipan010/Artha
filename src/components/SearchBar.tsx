'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Sparkles } from 'lucide-react';
import type { StockSearchResult } from '@/types/stock';
import { POPULAR_STOCKS } from '@/lib/constants';

interface SearchBarProps {
    onSelectStock: (symbol: string) => void;
}

export default function SearchBar({ onSelectStock }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<StockSearchResult[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (query.length < 1) {
            setResults([]);
            return;
        }

        setLoading(true);
        timeoutRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [query]);

    const handleSelect = (symbol: string) => {
        onSelectStock(symbol);
        setQuery('');
        setShowResults(false);
    };

    return (
        <div className="search-container">
            <div className="search-bar">
                <Search size={20} className="search-icon" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search stocks (e.g., RELIANCE, TCS, INFY)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowResults(true)}
                />
                {query && (
                    <button
                        className="clear-btn"
                        onClick={() => {
                            setQuery('');
                            inputRef.current?.focus();
                        }}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {showResults && (
                <div className="search-results">
                    {loading ? (
                        <div className="search-loading">
                            <Sparkles size={16} className="spin" />
                            <span>Searching...</span>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="results-list">
                            {results.map((stock) => (
                                <button
                                    key={stock.symbol}
                                    className="result-item"
                                    onClick={() => handleSelect(stock.symbol)}
                                >
                                    <TrendingUp size={16} />
                                    <span className="result-symbol">{stock.symbol}</span>
                                    <span className="result-name">{stock.name}</span>
                                    <span className="result-exchange">{stock.exchange}</span>
                                </button>
                            ))}
                        </div>
                    ) : query.length > 0 ? (
                        <div className="no-results">No results found</div>
                    ) : (
                        <div className="popular-stocks">
                            <div className="popular-title">Popular Stocks</div>
                            <div className="popular-grid">
                                {POPULAR_STOCKS.slice(0, 8).map((stock) => (
                                    <button
                                        key={stock.symbol}
                                        className="popular-item"
                                        onClick={() => handleSelect(stock.symbol)}
                                    >
                                        <span className="popular-symbol">
                                            {stock.symbol.replace('.NS', '')}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showResults && (
                <div
                    className="search-overlay"
                    onClick={() => setShowResults(false)}
                />
            )}
        </div>
    );
}
