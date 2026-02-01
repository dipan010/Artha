import { NextRequest, NextResponse } from 'next/server';
import type { NewsArticle, NewsResponse } from '@/types/news';

// RSS Feed URLs for Indian Market News
const RSS_FEEDS = {
    market: 'https://news.google.com/rss/search?q=indian+stock+market+sensex+nifty&hl=en-IN&gl=IN&ceid=IN:en',
    economy: 'https://news.google.com/rss/search?q=india+economy+RBI&hl=en-IN&gl=IN&ceid=IN:en',
    stock: 'https://news.google.com/rss/search?q=indian+stocks+BSE+NSE&hl=en-IN&gl=IN&ceid=IN:en',
    sector: 'https://news.google.com/rss/search?q=india+sector+banking+IT+pharma&hl=en-IN&gl=IN&ceid=IN:en',
    global: 'https://news.google.com/rss/search?q=global+markets+forex&hl=en-IN&gl=IN&ceid=IN:en',
};

// Stock-specific search
const getStockFeedUrl = (symbol: string) => {
    const stockName = symbol.replace('.NS', '').replace('.BO', '');
    return `https://news.google.com/rss/search?q=${encodeURIComponent(stockName)}+stock+india&hl=en-IN&gl=IN&ceid=IN:en`;
};

// Cache to reduce API calls
const newsCache = new Map<string, { data: NewsArticle[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Parse RSS XML to extract articles
function parseRSSFeed(xml: string, category: NewsArticle['category']): NewsArticle[] {
    const articles: NewsArticle[] = [];

    // Extract items using regex (works server-side without DOM parser)
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let id = 0;

    while ((match = itemRegex.exec(xml)) !== null && id < 15) {
        const item = match[1];

        const title = extractTag(item, 'title');
        const link = extractTag(item, 'link');
        const pubDate = extractTag(item, 'pubDate');
        const source = extractTag(item, 'source');
        const description = extractTag(item, 'description') || '';

        if (title && link) {
            articles.push({
                id: `${category}-${id++}`,
                title: decodeHTMLEntities(title),
                description: cleanDescription(description),
                source: source || 'Google News',
                url: link,
                publishedAt: pubDate ? new Date(pubDate) : new Date(),
                category,
            });
        }
    }

    return articles;
}

function extractTag(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? (match[1] || match[2] || '').trim() : '';
}

function decodeHTMLEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

function cleanDescription(desc: string): string {
    // Remove HTML tags and decode entities
    return decodeHTMLEntities(desc.replace(/<[^>]*>/g, '').substring(0, 300));
}

async function fetchRSSFeed(url: string, category: NewsArticle['category']): Promise<NewsArticle[]> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ArthaAI/1.0)',
            },
            next: { revalidate: 300 }, // Next.js cache for 5 minutes
        });

        if (!response.ok) {
            throw new Error(`RSS fetch failed: ${response.status}`);
        }

        const xml = await response.text();
        return parseRSSFeed(xml, category);
    } catch (error) {
        console.error(`Error fetching RSS feed for ${category}:`, error);
        return [];
    }
}

// Fallback mock data in case RSS fails
const FALLBACK_NEWS: NewsArticle[] = [
    {
        id: 'fallback-1',
        title: 'Sensex hits record high as IT stocks rally',
        description: 'Indian benchmark indices reached new highs driven by strong performance in IT and banking sectors.',
        source: 'Economic Times',
        url: 'https://economictimes.com',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        category: 'market',
        relatedSymbols: ['TCS.NS', 'INFY.NS', 'WIPRO.NS'],
    },
    {
        id: 'fallback-2',
        title: 'RBI monetary policy update',
        description: 'The Reserve Bank of India maintained its key lending rate citing inflation concerns.',
        source: 'Mint',
        url: 'https://livemint.com',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        category: 'economy',
    },
    {
        id: 'fallback-3',
        title: 'Banking sector shows strong quarterly results',
        description: 'Major banks report robust growth in net interest income and asset quality improvement.',
        source: 'Business Standard',
        url: 'https://business-standard.com',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        category: 'sector',
        relatedSymbols: ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS'],
    },
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') || 'market';
        const symbol = searchParams.get('symbol');
        const refresh = searchParams.get('refresh') === 'true';

        // Check cache first (unless refresh is requested)
        const cacheKey = symbol || category;
        const cached = newsCache.get(cacheKey);

        if (!refresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return NextResponse.json({
                articles: cached.data,
                lastUpdated: new Date(cached.timestamp),
                category,
                symbol: symbol || undefined,
                cached: true,
            });
        }

        let articles: NewsArticle[] = [];

        if (symbol) {
            // Fetch stock-specific news
            const feedUrl = getStockFeedUrl(symbol);
            articles = await fetchRSSFeed(feedUrl, 'stock');

            // Add related symbols to articles
            articles = articles.map(article => ({
                ...article,
                relatedSymbols: [symbol],
            }));
        } else if (category === 'all') {
            // Fetch from all categories
            const allCategories = Object.keys(RSS_FEEDS) as Array<keyof typeof RSS_FEEDS>;
            const promises = allCategories.map(cat =>
                fetchRSSFeed(RSS_FEEDS[cat], cat as NewsArticle['category'])
            );
            const results = await Promise.all(promises);
            articles = results.flat();
        } else {
            // Fetch specific category
            const feedUrl = RSS_FEEDS[category as keyof typeof RSS_FEEDS] || RSS_FEEDS.market;
            articles = await fetchRSSFeed(feedUrl, category as NewsArticle['category']);
        }

        // If no articles fetched, use fallback
        if (articles.length === 0) {
            articles = FALLBACK_NEWS.filter(
                news => category === 'all' || news.category === category
            );
        }

        // Sort by date (newest first)
        articles.sort((a, b) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );

        // Limit to 20 articles
        articles = articles.slice(0, 20);

        // Update cache
        newsCache.set(cacheKey, {
            data: articles,
            timestamp: Date.now(),
        });

        const response: NewsResponse = {
            articles,
            lastUpdated: new Date(),
            category,
            symbol: symbol || undefined,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('News API error:', error);

        // Return fallback data on error
        return NextResponse.json({
            articles: FALLBACK_NEWS,
            lastUpdated: new Date(),
            error: 'Using fallback data',
        });
    }
}
