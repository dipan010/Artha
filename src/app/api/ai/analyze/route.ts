import { NextRequest, NextResponse } from 'next/server';
import { getStockQuote, getStockHistory } from '@/services/stockService';
import { analyzeStock } from '@/services/aiService';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { symbol } = body;

        if (!symbol) {
            return NextResponse.json(
                { error: 'Symbol is required' },
                { status: 400 }
            );
        }

        // Fetch quote and history in parallel
        const [quote, history] = await Promise.all([
            getStockQuote(symbol),
            getStockHistory(symbol, '3M'),
        ]);

        // Run AI analysis
        const insight = await analyzeStock(quote, history);

        return NextResponse.json(insight);
    } catch (error) {
        console.error('Error analyzing stock:', error);
        return NextResponse.json(
            { error: 'Failed to analyze stock' },
            { status: 500 }
        );
    }
}
