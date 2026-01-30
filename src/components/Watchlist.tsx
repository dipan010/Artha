'use client';

import { TrendingUp, TrendingDown, X, Star } from 'lucide-react';
import type { WatchlistItem, StockQuote } from '@/types/stock';
import { useEffect, useState } from 'react';

interface WatchlistProps {
    items: WatchlistItem[];
    selectedSymbol: string | null;
    onSelectStock: (symbol: string) => void;
    onRemoveStock: (symbol: string) => void;
}

interface WatchlistItemWithPrice extends WatchlistItem {
    price?: number;
    change?: number;
    changePercent?: number;
}

export default function Watchlist({
    items,
    selectedSymbol,
    onSelectStock,
    onRemoveStock,
}: WatchlistProps) {
    const [itemsWithPrices, setItemsWithPrices] = useState<WatchlistItemWithPrice[]>(items);

    useEffect(() => {
        setItemsWithPrices(items);

        if (items.length === 0) return;

        const fetchPrices = async () => {
            const updatedItems = await Promise.all(
                items.map(async (item) => {
                    try {
                        const res = await fetch(`/api/stocks/${encodeURIComponent(item.symbol)}`);
                        if (!res.ok) return item;
                        const data: StockQuote = await res.json();
                        return {
                            ...item,
                            price: data.price,
                            change: data.change,
                            changePercent: data.changePercent,
                        };
                    } catch {
                        return item;
                    }
                })
            );
            setItemsWithPrices(updatedItems);
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 30000);
        return () => clearInterval(interval);
    }, [items]);

    return (
        <div className="watchlist">
            <div className="watchlist-header">
                <Star size={18} />
                <h3>Watchlist</h3>
                <span className="count">{items.length}</span>
            </div>

            {items.length === 0 ? (
                <div className="watchlist-empty">
                    <p>No stocks in watchlist</p>
                    <span>Search and add stocks to track them here</span>
                </div>
            ) : (
                <div className="watchlist-items">
                    {itemsWithPrices.map((item) => {
                        const isPositive = (item.change || 0) >= 0;
                        const isSelected = item.symbol === selectedSymbol;

                        return (
                            <div
                                key={item.symbol}
                                className={`watchlist-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => onSelectStock(item.symbol)}
                            >
                                <div className="item-info">
                                    <span className="item-symbol">{item.symbol.replace('.NS', '').replace('.BO', '')}</span>
                                    <span className="item-name">{item.name}</span>
                                </div>

                                <div className="item-price">
                                    {item.price !== undefined ? (
                                        <>
                                            <span className="price">₹{item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                            <span className={`change ${isPositive ? 'positive' : 'negative'}`}>
                                                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                {item.changePercent?.toFixed(2)}%
                                            </span>
                                        </>
                                    ) : (
                                        <span className="loading">...</span>
                                    )}
                                </div>

                                <button
                                    className="remove-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveStock(item.symbol);
                                    }}
                                    title="Remove from watchlist"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
