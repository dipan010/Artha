/**
 * News Types for News Integration
 */

export interface NewsArticle {
    id: string;
    title: string;
    description: string;
    source: string;
    url: string;
    publishedAt: Date;
    imageUrl?: string;
    category: 'market' | 'stock' | 'sector' | 'economy' | 'global';
    relatedSymbols?: string[];
    sentiment?: NewsSentiment;
}

export interface NewsSentiment {
    score: number; // -100 to 100
    label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
    confidence: number; // 0 to 100
    impactPrediction?: string;
    keyTakeaways?: string[];
}

export interface NewsResponse {
    articles: NewsArticle[];
    lastUpdated: Date;
    category?: string;
    symbol?: string;
}

export const SENTIMENT_COLORS: Record<NewsSentiment['label'], string> = {
    very_negative: '#ef4444',
    negative: '#f97316',
    neutral: '#6b7280',
    positive: '#22c55e',
    very_positive: '#10b981',
};

export const SENTIMENT_ICONS: Record<NewsSentiment['label'], string> = {
    very_negative: '📉',
    negative: '⬇️',
    neutral: '➡️',
    positive: '⬆️',
    very_positive: '🚀',
};

export const NEWS_CATEGORIES = [
    { id: 'market', label: 'Market', icon: '📊' },
    { id: 'stock', label: 'Stock News', icon: '📈' },
    { id: 'sector', label: 'Sector', icon: '🏢' },
    { id: 'economy', label: 'Economy', icon: '💰' },
    { id: 'global', label: 'Global', icon: '🌍' },
] as const;
