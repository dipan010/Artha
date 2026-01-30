'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import StockChart from '@/components/StockChart';
import StockInfo from '@/components/StockInfo';
import AIInsights from '@/components/AIInsights';
import WatchlistManager from '@/components/WatchlistManager';

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  return (
    <div className="app">
      <Header />

      <main className="main-content">
        <div className="content-grid">
          <div className="left-panel">
            <SearchBar onSelectStock={setSelectedSymbol} />

            <div className="chart-section">
              <StockInfo symbol={selectedSymbol} />
              <StockChart symbol={selectedSymbol} />
            </div>

            <AIInsights symbol={selectedSymbol} />
          </div>

          <div className="right-panel">
            <WatchlistManager
              selectedSymbol={selectedSymbol}
              onSelectStock={setSelectedSymbol}
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

