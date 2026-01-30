/* eslint-disable @typescript-eslint/no-explicit-any */
import YahooFinance from 'yahoo-finance2';
import type { StockQuote, HistoricalDataPoint, StockSearchResult, MarketIndex, TimeRange } from '@/types/stock';
import { TIME_RANGES, MARKET_INDICES } from '@/lib/constants';

// Initialize Yahoo Finance instance (required for v3)
const yahooFinance = new YahooFinance();

/**
 * Get current stock quote data
 */
export async function getStockQuote(symbol: string): Promise<StockQuote> {
    try {
        const quote: any = await yahooFinance.quote(symbol);

        return {
            symbol: quote.symbol,
            name: quote.shortName || quote.longName || symbol,
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            open: quote.regularMarketOpen || 0,
            high: quote.regularMarketDayHigh || 0,
            low: quote.regularMarketDayLow || 0,
            previousClose: quote.regularMarketPreviousClose || 0,
            volume: quote.regularMarketVolume || 0,
            marketCap: quote.marketCap,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
            exchange: quote.exchange || 'NSE',
        };
    } catch (error) {
        console.error(`Error fetching quote for ${symbol}:`, error);
        throw new Error(`Failed to fetch stock data for ${symbol}`);
    }
}

/**
 * Get historical price data
 */
export async function getStockHistory(
    symbol: string,
    range: TimeRange = '1M'
): Promise<HistoricalDataPoint[]> {
    try {
        const config = TIME_RANGES[range];
        const endDate = new Date();
        const startDate = new Date();

        // Calculate start date based on range
        switch (range) {
            case '1D':
                startDate.setDate(startDate.getDate() - 1);
                break;
            case '1W':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '1M':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case '3M':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            case '6M':
                startDate.setMonth(startDate.getMonth() - 6);
                break;
            case '1Y':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            case '5Y':
                startDate.setFullYear(startDate.getFullYear() - 5);
                break;
        }

        const result: any = await yahooFinance.chart(symbol, {
            period1: startDate,
            period2: endDate,
            interval: config.interval as '1m' | '15m' | '1h' | '1d' | '1wk',
        });

        if (!result.quotes || result.quotes.length === 0) {
            return [];
        }

        return result.quotes
            .filter((q: any) => q.open !== null && q.close !== null)
            .map((q: any) => ({
                time: new Date(q.date).toISOString().split('T')[0],
                open: q.open || 0,
                high: q.high || 0,
                low: q.low || 0,
                close: q.close || 0,
                volume: q.volume || 0,
            }));
    } catch (error) {
        console.error(`Error fetching history for ${symbol}:`, error);
        throw new Error(`Failed to fetch historical data for ${symbol}`);
    }
}

/**
 * Search for stocks
 */
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
    try {
        const results: any = await yahooFinance.search(query);

        return results.quotes
            .filter((q: any) => q.quoteType === 'EQUITY')
            .slice(0, 10)
            .map((q: any) => ({
                symbol: q.symbol,
                name: q.shortname || q.longname || q.symbol,
                exchange: q.exchange || 'Unknown',
                type: q.quoteType || 'EQUITY',
            }));
    } catch (error) {
        console.error(`Error searching for ${query}:`, error);
        return [];
    }
}

/**
 * Get market indices (NIFTY 50, SENSEX)
 */
export async function getMarketIndices(): Promise<MarketIndex[]> {
    try {
        const indices = await Promise.all(
            MARKET_INDICES.map(async (index) => {
                try {
                    const quote: any = await yahooFinance.quote(index.symbol);
                    return {
                        symbol: index.symbol,
                        name: index.name,
                        value: quote.regularMarketPrice || 0,
                        change: quote.regularMarketChange || 0,
                        changePercent: quote.regularMarketChangePercent || 0,
                    };
                } catch {
                    return {
                        symbol: index.symbol,
                        name: index.name,
                        value: 0,
                        change: 0,
                        changePercent: 0,
                    };
                }
            })
        );

        return indices;
    } catch (error) {
        console.error('Error fetching market indices:', error);
        return [];
    }
}
