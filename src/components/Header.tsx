'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import type { MarketIndex } from '@/types/stock';
import ThemeToggle from './ThemeToggle';

export default function Header() {
    const [indices, setIndices] = useState<MarketIndex[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchIndices = async () => {
        try {
            const res = await fetch('/api/indices');
            const data = await res.json();
            setIndices(data);
        } catch (error) {
            console.error('Error fetching indices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIndices();
        // Refresh every 30 seconds
        const interval = setInterval(fetchIndices, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="header">
            <div className="header-content">
                <div className="logo">
                    <div className="logo-icon">
                        <TrendingUp size={24} />
                    </div>
                    <h1>Artha <span className="text-ai">AI</span></h1>
                    <span className="badge">India</span>
                </div>

                <div className="header-actions">
                    <ThemeToggle />
                </div>

                <div className="indices">
                    {loading ? (
                        <div className="loading-indices">
                            <RefreshCw size={16} className="spin" />
                            <span>Loading indices...</span>
                        </div>
                    ) : (
                        indices.map((index) => (
                            <div key={index.symbol} className="index-card">
                                <span className="index-name">{index.name}</span>
                                <span className="index-value">
                                    {index.value.toLocaleString('en-IN', {
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                                <span className={`index-change ${index.change >= 0 ? 'positive' : 'negative'}`}>
                                    {index.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {index.change >= 0 ? '+' : ''}
                                    {index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </header>
    );
}
