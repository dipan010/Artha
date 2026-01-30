import { NextResponse } from 'next/server';
import { getStockQuote } from '@/services/stockService';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ symbol: string }> }
) {
    try {
        const { symbol } = await params;
        const quote = await getStockQuote(symbol);
        return NextResponse.json(quote);
    } catch (error) {
        console.error('Error fetching stock:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stock data' },
            { status: 500 }
        );
    }
}
