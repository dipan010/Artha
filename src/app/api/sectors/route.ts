import { NextResponse } from 'next/server';
import { SECTORS, Sector } from '@/lib/sectors';

interface SectorPerformance {
    id: string;
    name: string;
    icon: string;
    change: number;
    avgChange: number;
    topGainer: { symbol: string; name: string; change: number } | null;
    topLoser: { symbol: string; name: string; change: number } | null;
    stockCount: number;
    stocks: {
        symbol: string;
        name: string;
        price: number;
        change: number;
        changePercent: number;
    }[];
}

async function fetchStockQuote(symbol: string): Promise<{
    price: number;
    change: number;
    changePercent: number;
} | null> {
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!res.ok) return null;

        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;

        if (!meta) return null;

        const price = meta.regularMarketPrice || 0;
        const prevClose = meta.chartPreviousClose || meta.previousClose || price;
        const change = price - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

        return { price, change, changePercent };
    } catch {
        return null;
    }
}

export async function GET() {
    try {
        const sectorPerformances: SectorPerformance[] = [];

        for (const sector of SECTORS) {
            // Fetch quotes for all stocks in sector (in parallel)
            const stockPromises = sector.stocks.map(async (stock) => {
                const quote = await fetchStockQuote(stock.symbol);
                return {
                    ...stock,
                    quote,
                };
            });

            const stockResults = await Promise.all(stockPromises);

            // Calculate weighted average change
            let weightedChange = 0;
            let totalWeight = 0;
            const stocksWithData: SectorPerformance['stocks'] = [];
            let topGainer: SectorPerformance['topGainer'] = null;
            let topLoser: SectorPerformance['topLoser'] = null;

            for (const stock of stockResults) {
                if (stock.quote) {
                    weightedChange += stock.quote.changePercent * stock.weight;
                    totalWeight += stock.weight;

                    stocksWithData.push({
                        symbol: stock.symbol,
                        name: stock.name,
                        price: stock.quote.price,
                        change: stock.quote.change,
                        changePercent: stock.quote.changePercent,
                    });

                    // Track top gainer and loser
                    if (!topGainer || stock.quote.changePercent > topGainer.change) {
                        topGainer = {
                            symbol: stock.symbol,
                            name: stock.name,
                            change: stock.quote.changePercent,
                        };
                    }
                    if (!topLoser || stock.quote.changePercent < topLoser.change) {
                        topLoser = {
                            symbol: stock.symbol,
                            name: stock.name,
                            change: stock.quote.changePercent,
                        };
                    }
                }
            }

            const avgChange = totalWeight > 0 ? weightedChange / totalWeight : 0;

            sectorPerformances.push({
                id: sector.id,
                name: sector.name,
                icon: sector.icon,
                change: avgChange,
                avgChange: avgChange,
                topGainer,
                topLoser,
                stockCount: stocksWithData.length,
                stocks: stocksWithData.sort((a, b) => b.changePercent - a.changePercent),
            });
        }

        // Sort sectors by absolute change for heatmap intensity
        sectorPerformances.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

        return NextResponse.json({
            sectors: sectorPerformances,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error fetching sector data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sector data' },
            { status: 500 }
        );
    }
}
