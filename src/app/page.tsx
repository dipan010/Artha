'use client';

import { useState, useEffect } from 'react';
import { BarChart3, ArrowLeftRight, Grid3X3, DollarSign, Calendar, Bell, Newspaper, Wallet } from 'lucide-react';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import StockChart from '@/components/StockChart';
import StockInfo from '@/components/StockInfo';
import AIInsights from '@/components/AIInsights';
import WatchlistManager from '@/components/WatchlistManager';
import ComparisonTool from '@/components/ComparisonTool';
import SectorHeatmap from '@/components/SectorHeatmap';
import DividendTracker from '@/components/DividendTracker';
import MarketCalendar from '@/components/MarketCalendar';
import AIChatAssistant from '@/components/AIChatAssistant';
import PriceAlerts from '@/components/PriceAlerts';
import NewsPanel from '@/components/NewsPanel';
import MutualFundsExplorer from '@/components/MutualFundsExplorer';

type ViewMode = 'single' | 'compare' | 'sectors' | 'dividends' | 'calendar' | 'alerts' | 'news' | 'funds';

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Load watchlist from localStorage for chat context
  useEffect(() => {
    const loadWatchlist = () => {
      try {
        const stored = localStorage.getItem('artha_watchlist');
        if (stored) {
          const items = JSON.parse(stored);
          setWatchlist(items.map((item: { symbol: string }) => item.symbol));
        }
      } catch {
        // Ignore localStorage errors
      }
    };
    loadWatchlist();

    // Listen for storage changes
    window.addEventListener('storage', loadWatchlist);
    return () => window.removeEventListener('storage', loadWatchlist);
  }, []);

  const handleStockSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    setViewMode('single');
  };

  // Chat context based on current state
  const chatContext = {
    currentStock: selectedSymbol ? {
      symbol: selectedSymbol,
      name: selectedSymbol.replace('.NS', '').replace('.BO', ''),
    } : undefined,
    watchlist: watchlist.length > 0 ? watchlist : undefined,
  };

  return (
    <div className="app">
      <Header />

      <main className="main-content">
        <div className="content-grid">
          <div className="left-panel">
            {/* View Toggle */}
            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === 'single' ? 'active' : ''}`}
                onClick={() => setViewMode('single')}
              >
                <BarChart3 size={16} />
                Stock
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'compare' ? 'active' : ''}`}
                onClick={() => setViewMode('compare')}
              >
                <ArrowLeftRight size={16} />
                Compare
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'sectors' ? 'active' : ''}`}
                onClick={() => setViewMode('sectors')}
              >
                <Grid3X3 size={16} />
                Sectors
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'dividends' ? 'active' : ''}`}
                onClick={() => setViewMode('dividends')}
              >
                <DollarSign size={16} />
                Dividends
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                onClick={() => setViewMode('calendar')}
              >
                <Calendar size={16} />
                Calendar
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'alerts' ? 'active' : ''}`}
                onClick={() => setViewMode('alerts')}
              >
                <Bell size={16} />
                Alerts
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'news' ? 'active' : ''}`}
                onClick={() => setViewMode('news')}
              >
                <Newspaper size={16} />
                News
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'funds' ? 'active' : ''}`}
                onClick={() => setViewMode('funds')}
              >
                <Wallet size={16} />
                Funds
              </button>
            </div>

            {viewMode === 'single' && (
              <>
                <SearchBar onSelectStock={setSelectedSymbol} />

                <div className="chart-section">
                  <StockInfo symbol={selectedSymbol} />
                  <StockChart symbol={selectedSymbol} />
                </div>

                <AIInsights symbol={selectedSymbol} />
              </>
            )}

            {viewMode === 'compare' && <ComparisonTool />}

            {viewMode === 'sectors' && (
              <SectorHeatmap onSelectStock={handleStockSelect} />
            )}

            {viewMode === 'dividends' && (
              <DividendTracker onSelectStock={handleStockSelect} />
            )}

            {viewMode === 'calendar' && (
              <MarketCalendar onSelectStock={handleStockSelect} />
            )}

            {viewMode === 'alerts' && (
              <PriceAlerts
                selectedSymbol={selectedSymbol}
                onSelectStock={handleStockSelect}
              />
            )}

            {viewMode === 'news' && (
              <NewsPanel selectedSymbol={selectedSymbol} />
            )}

            {viewMode === 'funds' && (
              <MutualFundsExplorer />
            )}
          </div>

          <div className="right-panel">
            <WatchlistManager
              selectedSymbol={selectedSymbol}
              onSelectStock={handleStockSelect}
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

      {/* AI Chat Assistant - Floating Widget */}
      <AIChatAssistant context={chatContext} />
    </div>
  );
}
