import { NextResponse } from 'next/server';
import { getMarketIndices } from '@/services/stockService';

export async function GET() {
    try {
        const indices = await getMarketIndices();
        return NextResponse.json(indices);
    } catch (error) {
        console.error('Error fetching indices:', error);
        return NextResponse.json(
            { error: 'Failed to fetch market indices' },
            { status: 500 }
        );
    }
}
