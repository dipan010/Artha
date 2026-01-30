// Popular Indian stocks with NSE suffix
export const POPULAR_STOCKS = [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services' },
    { symbol: 'INFY.NS', name: 'Infosys' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
    { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever' },
    { symbol: 'SBIN.NS', name: 'State Bank of India' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
    { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank' },
    { symbol: 'ITC.NS', name: 'ITC Limited' },
    { symbol: 'LT.NS', name: 'Larsen & Toubro' },
    { symbol: 'TATAMOTORS.NS', name: 'Tata Motors' },
    { symbol: 'AXISBANK.NS', name: 'Axis Bank' },
    { symbol: 'WIPRO.NS', name: 'Wipro' },
    { symbol: 'HCLTECH.NS', name: 'HCL Technologies' },
    { symbol: 'MARUTI.NS', name: 'Maruti Suzuki' },
    { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance' },
    { symbol: 'ADANIENT.NS', name: 'Adani Enterprises' },
    { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical' },
    { symbol: 'TITAN.NS', name: 'Titan Company' },
];

// Market indices
export const MARKET_INDICES = [
    { symbol: '^NSEI', name: 'NIFTY 50' },
    { symbol: '^BSESN', name: 'SENSEX' },
];

// Time range configurations
export const TIME_RANGES = {
    '1D': { interval: '1m', period: '1d', label: '1 Day' },
    '1W': { interval: '15m', period: '5d', label: '1 Week' },
    '1M': { interval: '1h', period: '1mo', label: '1 Month' },
    '3M': { interval: '1d', period: '3mo', label: '3 Months' },
    '6M': { interval: '1d', period: '6mo', label: '6 Months' },
    '1Y': { interval: '1d', period: '1y', label: '1 Year' },
    '5Y': { interval: '1wk', period: '5y', label: '5 Years' },
};

// Chart colors
export const CHART_COLORS = {
    up: '#22c55e',       // Green
    down: '#ef4444',     // Red
    neutral: '#6b7280',  // Gray
    line: '#3b82f6',     // Blue
    volume: '#6366f1',   // Indigo
    grid: '#1f2937',     // Dark gray
    text: '#9ca3af',     // Light gray
};

// Sentiment colors
export const SENTIMENT_COLORS = {
    bullish: '#22c55e',
    bearish: '#ef4444',
    neutral: '#f59e0b',
};

// AI disclaimer
export const AI_DISCLAIMER =
    'This AI-generated analysis is for informational purposes only and should not be considered as financial advice. ' +
    'Stock market investments are subject to market risks. Please consult a certified financial advisor before making investment decisions.';
