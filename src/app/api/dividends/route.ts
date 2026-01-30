import { NextRequest, NextResponse } from 'next/server';

interface DividendInfo {
    symbol: string;
    name: string;
    price: number;
    dividendYield: number | null;
    dividendRate: number | null;
    exDividendDate: string | null;
    fiveYearAvgYield: number | null;
    lastDividend: number | null;
}

async function fetchDividendData(symbol: string): Promise<DividendInfo | null> {
    try {
        // Fetch quote data for price
        const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
        const chartRes = await fetch(chartUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!chartRes.ok) return null;
        const chartData = await chartRes.json();
        const meta = chartData.chart?.result?.[0]?.meta;
        if (!meta) return null;

        // Fetch dividend info from summary endpoint
        const summaryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=summaryDetail,calendarEvents,defaultKeyStatistics`;
        const summaryRes = await fetch(summaryUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        let dividendYield = null;
        let dividendRate = null;
        let exDividendDate = null;
        let fiveYearAvgYield = null;
        let lastDividend = null;

        if (summaryRes.ok) {
            const summaryData = await summaryRes.json();
            const summary = summaryData.quoteSummary?.result?.[0];

            if (summary?.summaryDetail) {
                dividendYield = summary.summaryDetail.dividendYield?.raw * 100 || null;
                dividendRate = summary.summaryDetail.dividendRate?.raw || null;
                fiveYearAvgYield = summary.summaryDetail.fiveYearAvgDividendYield?.raw || null;
            }

            if (summary?.calendarEvents?.exDividendDate?.raw) {
                const exDate = new Date(summary.calendarEvents.exDividendDate.raw * 1000);
                exDividendDate = exDate.toISOString().split('T')[0];
            }

            if (summary?.defaultKeyStatistics?.lastDividendValue?.raw) {
                lastDividend = summary.defaultKeyStatistics.lastDividendValue.raw;
            }
        }

        return {
            symbol: meta.symbol,
            name: meta.shortName || meta.symbol,
            price: meta.regularMarketPrice,
            dividendYield,
            dividendRate,
            exDividendDate,
            fiveYearAvgYield,
            lastDividend,
        };
    } catch (error) {
        console.error(`Error fetching dividend data for ${symbol}:`, error);
        return null;
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbolsParam = searchParams.get('symbols');

    if (!symbolsParam) {
        return NextResponse.json({ error: 'Symbols parameter required' }, { status: 400 });
    }

    const symbols = symbolsParam.split(',').slice(0, 10); // Max 10 stocks

    try {
        const dividendPromises = symbols.map(symbol => fetchDividendData(symbol));
        const results = await Promise.all(dividendPromises);

        const validResults = results.filter((r): r is DividendInfo => r !== null);

        // Sort by dividend yield (highest first)
        validResults.sort((a, b) => (b.dividendYield || 0) - (a.dividendYield || 0));

        // Calculate summary stats
        const yieldingStocks = validResults.filter(r => r.dividendYield && r.dividendYield > 0);
        const avgYield = yieldingStocks.length > 0
            ? yieldingStocks.reduce((sum, r) => sum + (r.dividendYield || 0), 0) / yieldingStocks.length
            : 0;

        // Find next ex-date
        const upcomingExDates = validResults
            .filter(r => r.exDividendDate && new Date(r.exDividendDate) >= new Date())
            .sort((a, b) => new Date(a.exDividendDate!).getTime() - new Date(b.exDividendDate!).getTime());

        return NextResponse.json({
            stocks: validResults,
            summary: {
                totalStocks: validResults.length,
                yieldingStocks: yieldingStocks.length,
                averageYield: avgYield,
                nextExDate: upcomingExDates[0] || null,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error in dividends API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dividend data' },
            { status: 500 }
        );
    }
}
