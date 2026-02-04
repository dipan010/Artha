'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Newspaper, RefreshCw, ExternalLink, TrendingUp, TrendingDown, Minus, Sparkles, Loader2, Zap, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import type { NewsArticle, NewsSentiment } from '@/types/news';
import { NEWS_CATEGORIES, SENTIMENT_COLORS } from '@/types/news';

interface NewsPanelProps {
    selectedSymbol?: string | null;
}

const AUTO_REFRESH_INTERVALS = [
    { value: 0, label: 'Off' },
    { value: 60, label: '1 min' },
    { value: 300, label: '5 min' },
    { value: 600, label: '10 min' },
];

// Utility to strip HTML tags from text
const stripHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

export default function NewsPanel({ selectedSymbol }: NewsPanelProps) {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [sentiments, setSentiments] = useState<Record<string, NewsSentiment>>({});
    const [autoRefresh, setAutoRefresh] = useState(300); // 5 min default
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isLive, setIsLive] = useState(true);
    const [newArticlesCount, setNewArticlesCount] = useState(0);
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const previousArticlesRef = useRef<string[]>([]);

    const fetchNews = useCallback(async (showLoading = true, isAutoRefresh = false) => {
        if (showLoading) setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (selectedCategory && selectedCategory !== 'all') {
                params.set('category', selectedCategory);
            }
            if (selectedSymbol) {
                params.set('symbol', selectedSymbol);
            }
            if (isAutoRefresh) {
                params.set('refresh', 'true');
            }

            const response = await fetch(`/api/news?${params}`);
            if (!response.ok) throw new Error('Failed to fetch news');

            const data = await response.json();

            // Check for new articles
            const newIds = data.articles.map((a: NewsArticle) => a.id);
            const previousIds = previousArticlesRef.current;

            if (isAutoRefresh && previousIds.length > 0) {
                const newCount = newIds.filter((id: string) => !previousIds.includes(id)).length;
                if (newCount > 0) {
                    setNewArticlesCount(prev => prev + newCount);
                }
            }

            previousArticlesRef.current = newIds;
            setArticles(data.articles);
            setLastUpdated(new Date(data.lastUpdated));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load news');
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, selectedSymbol]);

    // Initial fetch
    useEffect(() => {
        fetchNews();
        previousArticlesRef.current = [];
        setNewArticlesCount(0);
    }, [selectedCategory, selectedSymbol, fetchNews]);

    // Auto-refresh timer
    useEffect(() => {
        if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current);
        }

        if (autoRefresh > 0 && isLive) {
            refreshTimerRef.current = setInterval(() => {
                fetchNews(false, true);
            }, autoRefresh * 1000);
        }

        return () => {
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
            }
        };
    }, [autoRefresh, isLive, fetchNews]);

    const handleManualRefresh = () => {
        setNewArticlesCount(0);
        fetchNews(true, true);
    };

    const analyzeArticle = async (article: NewsArticle) => {
        setAnalyzingId(article.id);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Analyze this news headline for stock market sentiment. Return ONLY a JSON object with: sentiment (-100 to 100), label (very_negative/negative/neutral/positive/very_positive), confidence (0-100), impactPrediction (one sentence), keyTakeaways (array of 2-3 points). 
          
          Headline: "${article.title}"
          Description: "${article.description}"
          Related stocks: ${article.relatedSymbols?.join(', ') || 'N/A'}`,
                    history: [],
                    context: {},
                }),
            });

            if (!response.ok) throw new Error('Analysis failed');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') break;
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.text) {
                                    fullContent += parsed.text;
                                }
                            } catch {
                                // Ignore parse errors
                            }
                        }
                    }
                }
            }

            // Extract JSON from response
            const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const sentiment = JSON.parse(jsonMatch[0]) as NewsSentiment;
                setSentiments(prev => ({
                    ...prev,
                    [article.id]: {
                        score: sentiment.score || 0,
                        label: sentiment.label || 'neutral',
                        confidence: sentiment.confidence || 50,
                        impactPrediction: sentiment.impactPrediction,
                        keyTakeaways: sentiment.keyTakeaways,
                    },
                }));
            }
        } catch (err) {
            console.error('Analysis error:', err);
        } finally {
            setAnalyzingId(null);
        }
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));

        if (hours > 24) {
            return `${Math.floor(hours / 24)}d ago`;
        } else if (hours > 0) {
            return `${hours}h ago`;
        } else {
            return `${minutes}m ago`;
        }
    };

    const isBreakingNews = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        return diff < 30 * 60 * 1000; // Less than 30 minutes
    };

    const getSentimentIcon = (label: NewsSentiment['label']) => {
        switch (label) {
            case 'very_positive':
            case 'positive':
                return <TrendingUp size={14} />;
            case 'very_negative':
            case 'negative':
                return <TrendingDown size={14} />;
            default:
                return <Minus size={14} />;
        }
    };

    return (
        <div className="news-panel">
            {/* Header */}
            <div className="news-header">
                <div className="news-title">
                    <Newspaper size={20} />
                    <h2>Market News</h2>
                    {isLive && autoRefresh > 0 && (
                        <span className="live-indicator">
                            <span className="live-dot"></span>
                            LIVE
                        </span>
                    )}
                </div>
                <div className="news-actions">
                    {newArticlesCount > 0 && (
                        <button className="new-articles-badge" onClick={handleManualRefresh}>
                            <Zap size={14} />
                            {newArticlesCount} new
                        </button>
                    )}
                    <button className="news-refresh" onClick={handleManualRefresh} disabled={loading}>
                        <RefreshCw size={16} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Auto-refresh Controls */}
            <div className="news-controls">
                <div className="auto-refresh-toggle">
                    <button
                        className={`live-toggle ${isLive ? 'active' : ''}`}
                        onClick={() => setIsLive(!isLive)}
                    >
                        {isLive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        Auto-refresh
                    </button>
                    {isLive && (
                        <div className="refresh-intervals">
                            {AUTO_REFRESH_INTERVALS.map(interval => (
                                <button
                                    key={interval.value}
                                    className={`interval-btn ${autoRefresh === interval.value ? 'active' : ''}`}
                                    onClick={() => setAutoRefresh(interval.value)}
                                >
                                    {interval.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {lastUpdated && (
                    <div className="last-updated">
                        <Clock size={12} />
                        Updated {formatTimeAgo(lastUpdated)}
                    </div>
                )}
            </div>

            {/* Category Filter */}
            <div className="news-categories">
                <button
                    className={`news-category ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('all')}
                >
                    All
                </button>
                {NEWS_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        className={`news-category ${selectedCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat.id)}
                    >
                        <span>{cat.icon}</span>
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* News List */}
            <div className="news-list">
                {loading ? (
                    <div className="news-loading">
                        <Loader2 size={24} className="spin" />
                        <span>Loading news...</span>
                    </div>
                ) : error ? (
                    <div className="news-error">
                        <p>{error}</p>
                        <button onClick={() => fetchNews()}>Try Again</button>
                    </div>
                ) : articles.length === 0 ? (
                    <div className="news-empty">
                        <Newspaper size={32} className="empty-icon" />
                        <p>No news found for this filter</p>
                    </div>
                ) : (
                    articles.map(article => (
                        <div key={article.id} className={`news-card ${isBreakingNews(article.publishedAt) ? 'breaking' : ''}`}>
                            <div className="news-card-header">
                                <div className="news-meta">
                                    {isBreakingNews(article.publishedAt) && (
                                        <span className="breaking-badge">
                                            <Zap size={10} />
                                            BREAKING
                                        </span>
                                    )}
                                    <span className="news-source">{article.source}</span>
                                </div>
                                <span className="news-time">{formatTimeAgo(article.publishedAt)}</span>
                            </div>

                            <h3 className="news-card-title">{article.title}</h3>
                            <p className="news-card-desc">{stripHtml(article.description || '')}</p>

                            {article.relatedSymbols && article.relatedSymbols.length > 0 && (
                                <div className="news-symbols">
                                    {article.relatedSymbols.map(symbol => (
                                        <span key={symbol} className="news-symbol-tag">
                                            {symbol.replace('.NS', '')}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Sentiment Analysis */}
                            {sentiments[article.id] ? (
                                <div
                                    className="news-sentiment"
                                    style={{ borderColor: SENTIMENT_COLORS[sentiments[article.id].label] }}
                                >
                                    <div className="sentiment-header">
                                        <span
                                            className="sentiment-badge"
                                            style={{
                                                background: SENTIMENT_COLORS[sentiments[article.id].label],
                                                color: 'white'
                                            }}
                                        >
                                            {getSentimentIcon(sentiments[article.id].label)}
                                            {sentiments[article.id].label.replace('_', ' ')}
                                        </span>
                                        <span className="sentiment-score">
                                            Score: {sentiments[article.id].score}
                                        </span>
                                    </div>
                                    {sentiments[article.id].impactPrediction && (
                                        <p className="sentiment-prediction">
                                            {sentiments[article.id].impactPrediction}
                                        </p>
                                    )}
                                    {sentiments[article.id].keyTakeaways && (
                                        <ul className="sentiment-takeaways">
                                            {sentiments[article.id].keyTakeaways?.map((takeaway, i) => (
                                                <li key={i}>{takeaway}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ) : (
                                <button
                                    className="news-analyze-btn"
                                    onClick={() => analyzeArticle(article)}
                                    disabled={analyzingId === article.id}
                                >
                                    {analyzingId === article.id ? (
                                        <>
                                            <Loader2 size={14} className="spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={14} />
                                            AI Sentiment Analysis
                                        </>
                                    )}
                                </button>
                            )}

                            <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="news-link"
                            >
                                Read more <ExternalLink size={12} />
                            </a>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
