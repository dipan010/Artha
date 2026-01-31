import { NextRequest, NextResponse } from 'next/server';
import type { NewsArticle, NewsResponse } from '@/types/news';

// Mock news data for Indian stock market
// In production, this would fetch from RSS feeds or news APIs
const MOCK_NEWS: NewsArticle[] = [
    {
        id: '1',
        title: 'Sensex hits record high as IT stocks rally',
        description: 'Indian benchmark indices reached new highs driven by strong performance in IT and banking sectors. TCS and Infosys led the gains.',
        source: 'Economic Times',
        url: 'https://economictimes.com',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        category: 'market',
        relatedSymbols: ['TCS.NS', 'INFY.NS', 'WIPRO.NS'],
    },
    {
        id: '2',
        title: 'RBI keeps repo rate unchanged at 6.5%',
        description: 'The Reserve Bank of India maintained its key lending rate citing inflation concerns while keeping growth outlook positive.',
        source: 'Mint',
        url: 'https://livemint.com',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        category: 'economy',
    },
    {
        id: '3',
        title: 'Reliance Industries expands into green energy',
        description: 'Reliance Industries announced major investments in renewable energy including solar and hydrogen projects.',
        source: 'Business Standard',
        url: 'https://business-standard.com',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        category: 'stock',
        relatedSymbols: ['RELIANCE.NS'],
    },
    {
        id: '4',
        title: 'Auto sector sees strong Q3 numbers',
        description: 'Major automakers report double-digit growth in quarterly sales. Tata Motors and Maruti Suzuki lead the pack.',
        source: 'CNBC-TV18',
        url: 'https://cnbctv18.com',
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        category: 'sector',
        relatedSymbols: ['TATAMOTORS.NS', 'MARUTI.NS', 'M&M.NS'],
    },
    {
        id: '5',
        title: 'Global markets rally on Fed rate cut hopes',
        description: 'Asian markets follow Wall Street higher as investors anticipate potential interest rate cuts by the Federal Reserve.',
        source: 'Reuters',
        url: 'https://reuters.com',
        publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
        category: 'global',
    },
    {
        id: '6',
        title: 'HDFC Bank reports 20% profit growth',
        description: 'HDFC Bank announces strong quarterly results with net profit rising 20% year-on-year on robust loan growth.',
        source: 'Financial Express',
        url: 'https://financialexpress.com',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        category: 'stock',
        relatedSymbols: ['HDFCBANK.NS'],
    },
    {
        id: '7',
        title: 'Pharma stocks gain on export optimism',
        description: 'Indian pharmaceutical companies see gains as US FDA approvals boost export outlook for the sector.',
        source: 'Moneycontrol',
        url: 'https://moneycontrol.com',
        publishedAt: new Date(Date.now() - 14 * 60 * 60 * 1000),
        category: 'sector',
        relatedSymbols: ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS'],
    },
    {
        id: '8',
        title: 'Nifty IT index outperforms broader market',
        description: 'Technology stocks continue to lead market gains with strong earnings outlook and dollar appreciation.',
        source: 'Bloomberg Quint',
        url: 'https://bloombergquint.com',
        publishedAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
        category: 'market',
        relatedSymbols: ['TCS.NS', 'INFY.NS', 'HCLTECH.NS'],
    },
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const symbol = searchParams.get('symbol');

        let filteredNews = [...MOCK_NEWS];

        // Filter by category
        if (category && category !== 'all') {
            filteredNews = filteredNews.filter(news => news.category === category);
        }

        // Filter by symbol
        if (symbol) {
            filteredNews = filteredNews.filter(
                news => news.relatedSymbols?.includes(symbol)
            );
        }

        // Sort by date (newest first)
        filteredNews.sort((a, b) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );

        const response: NewsResponse = {
            articles: filteredNews,
            lastUpdated: new Date(),
            category: category || 'all',
            symbol: symbol || undefined,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('News API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch news' },
            { status: 500 }
        );
    }
}
