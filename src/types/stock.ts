// Stock quote data
export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  exchange: string;
}

// Historical OHLCV data point
export interface HistoricalDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Stock search result
export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

// News article
export interface StockNews {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

// AI analysis response
export interface AIInsight {
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number; // -100 to 100
  prediction: {
    shortTerm: string;
    priceTarget?: {
      low: number;
      mid: number;
      high: number;
    };
  };
  keyFactors: string[];
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number; // 0-100
  analysis: string;
  disclaimer: string;
}

// Watchlist item
export interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: string;
}

// Market index
export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

// Time range options
export type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y';

// Chart type
export type ChartType = 'candlestick' | 'line';
