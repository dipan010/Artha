'use client';

import { useState } from 'react';
import { BarChart3, ArrowLeftRight, Grid3X3 } from 'lucide-react';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import StockChart from '@/components/StockChart';
import StockInfo from '@/components/StockInfo';
import AIInsights from '@/components/AIInsights';
import WatchlistManager from '@/components/WatchlistManager';
import ComparisonTool from '@/components/ComparisonTool';
import SectorHeatmap from '@/components/SectorHeatmap';

type ViewMode = 'single' | 'compare' | 'sectors';

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('single');

  const handleStockSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    setViewMode('single');
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
                <BarChart3 size={18} />
                Single Stock
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'compare' ? 'active' : ''}`}
                onClick={() => setViewMode('compare')}
              >
                <ArrowLeftRight size={18} />
                Compare
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'sectors' ? 'active' : ''}`}
                onClick={() => setViewMode('sectors')}
              >
                <Grid3X3 size={18} />
                Sectors
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
    </div>
  );
}
