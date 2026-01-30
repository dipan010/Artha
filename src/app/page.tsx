'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import StockChart from '@/components/StockChart';
import StockInfo from '@/components/StockInfo';
import AIInsights from '@/components/AIInsights';
import Watchlist from '@/components/Watchlist';
import type { WatchlistItem } from '@/types/stock';

const WATCHLIST_KEY = 'artha-watchlist';

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  // Load watchlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(WATCHLIST_KEY);
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse watchlist:', e);
      }
    }
  }, []);

  // Save watchlist to localStorage
  useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const handleAddToWatchlist = (item: WatchlistItem) => {
    if (!watchlist.some(w => w.symbol === item.symbol)) {
      setWatchlist([...watchlist, item]);
    }
  };

  const handleRemoveFromWatchlist = (symbol: string) => {
    setWatchlist(watchlist.filter(w => w.symbol !== symbol));
  };

  return (
    <div className="app">
      <Header />

      <main className="main-content">
        <div className="content-grid">
          <div className="left-panel">
            <SearchBar onSelectStock={setSelectedSymbol} />

            <div className="chart-section">
              <StockInfo
                symbol={selectedSymbol}
                watchlist={watchlist}
                onAddToWatchlist={handleAddToWatchlist}
              />
              <StockChart symbol={selectedSymbol} />
            </div>

            <AIInsights symbol={selectedSymbol} />
          </div>

          <div className="right-panel">
            <Watchlist
              items={watchlist}
              selectedSymbol={selectedSymbol}
              onSelectStock={setSelectedSymbol}
              onRemoveStock={handleRemoveFromWatchlist}
            />
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Artha AI. Data provided by Yahoo Finance. AI analysis powered by Google Gemini.</p>
        <p className="disclaimer">
          This application is for informational purposes only. Not financial advice.
        </p>
      </footer>
    </div>
  );
}
