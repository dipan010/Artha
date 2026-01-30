import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIInsight, StockQuote, HistoricalDataPoint } from '@/types/stock';
import { AI_DISCLAIMER } from '@/lib/constants';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Analyze stock using AI
 */
export async function analyzeStock(
    quote: StockQuote,
    history: HistoricalDataPoint[]
): Promise<AIInsight> {
    try {
        // Using gemini-2.0-flash which is the current available model
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `You are a financial analyst AI. Analyze the following Indian stock data and provide a structured analysis.

Stock: ${quote.name} (${quote.symbol})
Current Price: ₹${quote.price.toFixed(2)}
Change: ${quote.change >= 0 ? '+' : ''}${quote.change.toFixed(2)} (${quote.changePercent.toFixed(2)}%)
Day Range: ₹${quote.low.toFixed(2)} - ₹${quote.high.toFixed(2)}
52-Week Range: ₹${quote.fiftyTwoWeekLow?.toFixed(2) || 'N/A'} - ₹${quote.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}
Volume: ${(quote.volume / 1000000).toFixed(2)}M
Market Cap: ₹${quote.marketCap ? (quote.marketCap / 10000000).toFixed(2) + ' Cr' : 'N/A'}

Recent Price History (last ${Math.min(30, history.length)} days):
${history.slice(-30).map(h => `${h.time}: Open ₹${h.open.toFixed(2)}, Close ₹${h.close.toFixed(2)}`).join('\n')}

Provide your analysis in the following JSON format ONLY (no markdown, no extra text):
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "sentimentScore": number between -100 (most bearish) to 100 (most bullish),
  "shortTermPrediction": "brief 1-2 sentence prediction for next 1-2 weeks",
  "priceTargetLow": number (pessimistic 1-month target),
  "priceTargetMid": number (expected 1-month target),
  "priceTargetHigh": number (optimistic 1-month target),
  "keyFactors": ["factor1", "factor2", "factor3"] (3-5 key factors),
  "recommendation": "strong_buy" | "buy" | "hold" | "sell" | "strong_sell",
  "confidence": number between 0-100,
  "analysis": "2-3 paragraph detailed analysis"
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse AI response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            symbol: quote.symbol,
            sentiment: parsed.sentiment,
            sentimentScore: parsed.sentimentScore,
            prediction: {
                shortTerm: parsed.shortTermPrediction,
                priceTarget: {
                    low: parsed.priceTargetLow,
                    mid: parsed.priceTargetMid,
                    high: parsed.priceTargetHigh,
                },
            },
            keyFactors: parsed.keyFactors,
            recommendation: parsed.recommendation,
            confidence: parsed.confidence,
            analysis: parsed.analysis,
            disclaimer: AI_DISCLAIMER,
        };
    } catch (error) {
        console.error('Error analyzing stock with AI:', error);

        // Return a fallback analysis if AI fails
        const isPositive = quote.changePercent >= 0;
        return {
            symbol: quote.symbol,
            sentiment: isPositive ? 'bullish' : 'bearish',
            sentimentScore: quote.changePercent * 10,
            prediction: {
                shortTerm: 'AI analysis temporarily unavailable. Please try again later.',
                priceTarget: {
                    low: quote.price * 0.95,
                    mid: quote.price,
                    high: quote.price * 1.05,
                },
            },
            keyFactors: [
                'Current market trend',
                'Recent price movement',
                'Trading volume patterns',
            ],
            recommendation: 'hold',
            confidence: 30,
            analysis: 'AI analysis is temporarily unavailable. The stock is currently ' +
                (isPositive ? 'trending upward' : 'trending downward') +
                ' with a change of ' + quote.changePercent.toFixed(2) + '%. ' +
                'Please check back later for a detailed AI-powered analysis.',
            disclaimer: AI_DISCLAIMER,
        };
    }
}
