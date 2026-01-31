'use client';

import { useState, useEffect } from 'react';
import { Newspaper, RefreshCw, ExternalLink, TrendingUp, TrendingDown, Minus, Sparkles, Loader2 } from 'lucide-react';
import type { NewsArticle, NewsSentiment } from '@/types/news';
import { NEWS_CATEGORIES, SENTIMENT_COLORS } from '@/types/news';

interface NewsPanelProps {
    selectedSymbol?: string | null;
}

export default function NewsPanel({ selectedSymbol }: NewsPanelProps) {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [sentiments, setSentiments] = useState<Record<string, NewsSentiment>>({});

    const fetchNews = async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (selectedCategory && selectedCategory !== 'all') {
                params.set('category', selectedCategory);
            }
            if (selectedSymbol) {
                params.set('symbol', selectedSymbol);
            }

            const response = await fetch(`/api/news?${params}`);
            if (!response.ok) throw new Error('Failed to fetch news');

            const data = await response.json();
            setArticles(data.articles);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load news');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, [selectedCategory, selectedSymbol]);

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
                </div>
                <button className="news-refresh" onClick={fetchNews} disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                </button>
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
                        <button onClick={fetchNews}>Try Again</button>
                    </div>
                ) : articles.length === 0 ? (
                    <div className="news-empty">
                        <Newspaper size={32} className="empty-icon" />
                        <p>No news found for this filter</p>
                    </div>
                ) : (
                    articles.map(article => (
                        <div key={article.id} className="news-card">
                            <div className="news-card-header">
                                <span className="news-source">{article.source}</span>
                                <span className="news-time">{formatTimeAgo(article.publishedAt)}</span>
                            </div>

                            <h3 className="news-card-title">{article.title}</h3>
                            <p className="news-card-desc">{article.description}</p>

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
