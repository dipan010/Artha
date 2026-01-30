'use client';

import { useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus, RefreshCw, AlertTriangle, Target, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import type { AIInsight } from '@/types/stock';
import { SENTIMENT_COLORS } from '@/lib/constants';

interface AIInsightsProps {
    symbol: string | null;
}

export default function AIInsights({ symbol }: AIInsightsProps) {
    const [insight, setInsight] = useState<AIInsight | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    const analyzeStock = async () => {
        if (!symbol) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/ai/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol }),
            });

            if (!res.ok) throw new Error('Analysis failed');

            const data = await res.json();
            setInsight(data);
        } catch (err) {
            setError('Failed to analyze stock');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!symbol) {
        return (
            <div className="ai-insights empty">
                <Sparkles size={48} />
                <p>Select a stock to get AI-powered insights</p>
            </div>
        );
    }

    const getSentimentIcon = () => {
        if (!insight) return <Minus size={24} />;
        switch (insight.sentiment) {
            case 'bullish':
                return <TrendingUp size={24} />;
            case 'bearish':
                return <TrendingDown size={24} />;
            default:
                return <Minus size={24} />;
        }
    };

    const getRecommendationLabel = (rec: string) => {
        const labels: Record<string, { text: string; class: string }> = {
            strong_buy: { text: 'Strong Buy', class: 'strong-buy' },
            buy: { text: 'Buy', class: 'buy' },
            hold: { text: 'Hold', class: 'hold' },
            sell: { text: 'Sell', class: 'sell' },
            strong_sell: { text: 'Strong Sell', class: 'strong-sell' },
        };
        return labels[rec] || { text: 'Hold', class: 'hold' };
    };

    return (
        <div className="ai-insights">
            <div className="ai-header">
                <div className="ai-title">
                    <Brain size={20} />
                    <h3>AI Analysis</h3>
                </div>

                <button
                    className="analyze-btn"
                    onClick={analyzeStock}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <RefreshCw size={16} className="spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} />
                            {insight ? 'Re-analyze' : 'Get AI Insights'}
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="ai-error">
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {insight && (
                <div className="ai-content">
                    <div className="sentiment-section">
                        <div
                            className="sentiment-badge"
                            style={{ backgroundColor: SENTIMENT_COLORS[insight.sentiment] }}
                        >
                            {getSentimentIcon()}
                            <span>{insight.sentiment.toUpperCase()}</span>
                        </div>

                        <div className="sentiment-score">
                            <div className="score-bar">
                                <div
                                    className="score-fill"
                                    style={{
                                        width: `${Math.abs(insight.sentimentScore)}%`,
                                        backgroundColor: insight.sentimentScore >= 0 ? SENTIMENT_COLORS.bullish : SENTIMENT_COLORS.bearish,
                                        left: insight.sentimentScore >= 0 ? '50%' : `${50 - Math.abs(insight.sentimentScore)}%`,
                                    }}
                                />
                            </div>
                            <span className="score-value">{insight.sentimentScore > 0 ? '+' : ''}{insight.sentimentScore}</span>
                        </div>
                    </div>

                    <div className="recommendation-section">
                        <div className={`recommendation-badge ${getRecommendationLabel(insight.recommendation).class}`}>
                            {getRecommendationLabel(insight.recommendation).text}
                        </div>
                        <div className="confidence">
                            <span>Confidence:</span>
                            <div className="confidence-bar">
                                <div
                                    className="confidence-fill"
                                    style={{ width: `${insight.confidence}%` }}
                                />
                            </div>
                            <span>{insight.confidence}%</span>
                        </div>
                    </div>

                    {insight.prediction.priceTarget && (
                        <div className="price-targets">
                            <h4>
                                <Target size={16} />
                                Price Targets (1 Month)
                            </h4>
                            <div className="targets-grid">
                                <div className="target bearish">
                                    <span className="target-label">Low</span>
                                    <span className="target-value">₹{insight.prediction.priceTarget.low.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="target neutral">
                                    <span className="target-label">Expected</span>
                                    <span className="target-value">₹{insight.prediction.priceTarget.mid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="target bullish">
                                    <span className="target-label">High</span>
                                    <span className="target-value">₹{insight.prediction.priceTarget.high.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="short-term">
                        <h4>Short-Term Outlook</h4>
                        <p>{insight.prediction.shortTerm}</p>
                    </div>

                    <div className="key-factors">
                        <h4>Key Factors</h4>
                        <ul>
                            {insight.keyFactors.map((factor, index) => (
                                <li key={index}>{factor}</li>
                            ))}
                        </ul>
                    </div>

                    <button
                        className="expand-btn"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? (
                            <>
                                <ChevronUp size={16} />
                                Hide detailed analysis
                            </>
                        ) : (
                            <>
                                <ChevronDown size={16} />
                                Show detailed analysis
                            </>
                        )}
                    </button>

                    {expanded && (
                        <div className="detailed-analysis">
                            <p>{insight.analysis}</p>
                        </div>
                    )}

                    <div className="disclaimer">
                        <AlertTriangle size={14} />
                        <p>{insight.disclaimer}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
