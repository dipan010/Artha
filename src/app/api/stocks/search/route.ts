import { NextRequest, NextResponse } from 'next/server';
import { searchStocks } from '@/services/stockService';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');

        if (!query || query.length < 1) {
            return NextResponse.json([]);
        }

        const results = await searchStocks(query);
        return NextResponse.json(results);
    } catch (error) {
        console.error('Error searching stocks:', error);
        return NextResponse.json(
            { error: 'Failed to search stocks' },
            { status: 500 }
        );
    }
}
