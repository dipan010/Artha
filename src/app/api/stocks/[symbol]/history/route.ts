import { NextRequest, NextResponse } from 'next/server';
import { getStockHistory } from '@/services/stockService';
import type { TimeRange } from '@/types/stock';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    try {
        const { symbol } = await params;
        const searchParams = request.nextUrl.searchParams;
        const range = (searchParams.get('range') || '1M') as TimeRange;

        const history = await getStockHistory(symbol, range);
        return NextResponse.json(history);
    } catch (error) {
        console.error('Error fetching stock history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch historical data' },
            { status: 500 }
        );
    }
}
