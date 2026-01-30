import { NextResponse } from 'next/server';

interface CompareStock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    marketCap: number | null;
    pe: number | null;
    volume: number;
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
    history: { time: string; close: number; normalizedClose: number }[];
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    const range = searchParams.get('range') || '1mo';

    if (!symbolsParam) {
        return NextResponse.json({ error: 'Symbols parameter required' }, { status: 400 });
    }

    const symbols = symbolsParam.split(',').slice(0, 4); // Max 4 stocks

    try {
        const stocksData: CompareStock[] = [];

        for (const symbol of symbols) {
            // Fetch quote data
            const quoteUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;
            const quoteRes = await fetch(quoteUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
            });

            if (!quoteRes.ok) {
                console.error(`Failed to fetch ${symbol}`);
                continue;
            }

            const quoteData = await quoteRes.json();
            const result = quoteData.chart?.result?.[0];

            if (!result) continue;

            const meta = result.meta;
            const timestamps = result.timestamp || [];
            const closes = result.indicators?.quote?.[0]?.close || [];

            // Get first valid close price for normalization
            let basePrice = closes.find((c: number | null) => c !== null) || meta.chartPreviousClose;

            // Build normalized history
            const history = timestamps.map((ts: number, i: number) => {
                const close = closes[i];
                if (close === null) return null;
                return {
                    time: new Date(ts * 1000).toISOString().split('T')[0],
                    close: close,
                    normalizedClose: ((close - basePrice) / basePrice) * 100, // % change from start
                };
            }).filter(Boolean);

            // Fetch additional info for P/E ratio
            let pe = null;
            try {
                const summaryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=summaryDetail,defaultKeyStatistics`;
                const summaryRes = await fetch(summaryUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    },
                });
                if (summaryRes.ok) {
                    const summaryData = await summaryRes.json();
                    pe = summaryData.quoteSummary?.result?.[0]?.summaryDetail?.trailingPE?.raw || null;
                }
            } catch {
                // P/E fetch failed, continue without it
            }

            stocksData.push({
                symbol: meta.symbol,
                name: meta.shortName || meta.symbol,
                price: meta.regularMarketPrice,
                change: meta.regularMarketPrice - meta.chartPreviousClose,
                changePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
                marketCap: meta.marketCap || null,
                pe: pe,
                volume: meta.regularMarketVolume || 0,
                fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || null,
                fiftyTwoWeekLow: meta.fiftyTwoWeekLow || null,
                history: history,
            });
        }

        return NextResponse.json({ stocks: stocksData });
    } catch (error) {
        console.error('Error in compare API:', error);
        return NextResponse.json({ error: 'Failed to fetch comparison data' }, { status: 500 });
    }
}
