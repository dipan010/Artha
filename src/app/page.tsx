'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3, ArrowLeftRight, Grid3X3, DollarSign, Calendar, Bell,
  Newspaper, Wallet, Briefcase, Calculator, Scale, Settings
} from 'lucide-react';
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
import PortfolioTracker from '@/components/PortfolioTracker';
import SIPCalculator from '@/components/SIPCalculator';
import FundComparison from '@/components/FundComparison';
import NotificationSettings from '@/components/NotificationSettings';

type ViewMode =
  | 'single'
  | 'compare'
  | 'sectors'
  | 'dividends'
  | 'calendar'
  | 'alerts'
  | 'news'
  | 'funds'
  | 'portfolio'
  | 'sip'
  | 'fund-compare'
  | 'notifications';

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

  // Navigation items grouped
  const navGroups = [
    {
      label: 'Stocks',
      items: [
        { id: 'single', icon: BarChart3, label: 'Stock' },
        { id: 'compare', icon: ArrowLeftRight, label: 'Compare' },
        { id: 'sectors', icon: Grid3X3, label: 'Sectors' },
        { id: 'dividends', icon: DollarSign, label: 'Dividends' },
      ],
    },
    {
      label: 'Portfolio',
      items: [
        { id: 'portfolio', icon: Briefcase, label: 'Portfolio' },
        { id: 'alerts', icon: Bell, label: 'Alerts' },
      ],
    },
    {
      label: 'Mutual Funds',
      items: [
        { id: 'funds', icon: Wallet, label: 'Explore' },
        { id: 'fund-compare', icon: Scale, label: 'Fund Comp' },
        { id: 'sip', icon: Calculator, label: 'SIP Calc' },
      ],
    },
    {
      label: 'More',
      items: [
        { id: 'news', icon: Newspaper, label: 'News' },
        { id: 'calendar', icon: Calendar, label: 'Calendar' },
        { id: 'notifications', icon: Settings, label: 'Notify' },
      ],
    },
  ];

  return (
    <div className="app">
      <Header />

      <main className="main-content">
        <div className="content-grid">
          <div className="left-panel">
            {/* View Toggle - Enhanced with groups */}
            <div className="view-toggle-container">
              {navGroups.map((group, groupIndex) => (
                <div key={group.label} className="view-toggle-group">
                  {groupIndex > 0 && <div className="toggle-divider" />}
                  {group.items.map(item => (
                    <button
                      key={item.id}
                      className={`view-toggle-btn ${viewMode === item.id ? 'active' : ''}`}
                      onClick={() => setViewMode(item.id as ViewMode)}
                      title={item.label}
                    >
                      <item.icon size={16} />
                      <span className="toggle-label">{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* View Content */}
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

            {viewMode === 'portfolio' && (
              <PortfolioTracker onSelectStock={handleStockSelect} />
            )}

            {viewMode === 'sip' && (
              <SIPCalculator />
            )}

            {viewMode === 'fund-compare' && (
              <FundComparison />
            )}

            {viewMode === 'notifications' && (
              <NotificationSettings />
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
