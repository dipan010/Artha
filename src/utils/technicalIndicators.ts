// Technical Indicators Calculation Utilities
import type { HistoricalDataPoint } from '@/types/stock';

/**
 * Simple Moving Average (SMA)
 * Average of closing prices over a specified period
 */
export function calculateSMA(data: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(null);
        } else {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
    }

    return result;
}

/**
 * Exponential Moving Average (EMA)
 * Weighted average giving more importance to recent prices
 */
export function calculateEMA(data: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];
    const multiplier = 2 / (period + 1);

    // Start with SMA for the first EMA value
    let ema: number | null = null;

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(null);
        } else if (i === period - 1) {
            // First EMA is the SMA
            ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
            result.push(ema);
        } else {
            // EMA = (Close - Previous EMA) * multiplier + Previous EMA
            ema = (data[i] - ema!) * multiplier + ema!;
            result.push(ema);
        }
    }

    return result;
}

/**
 * Relative Strength Index (RSI)
 * Momentum oscillator measuring speed and change of price movements
 * Returns values between 0-100
 */
export function calculateRSI(data: number[], period: number = 14): (number | null)[] {
    const result: (number | null)[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    // Calculate price changes
    for (let i = 1; i < data.length; i++) {
        const change = data[i] - data[i - 1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // First value is always null
    result.push(null);

    for (let i = 0; i < gains.length; i++) {
        if (i < period - 1) {
            result.push(null);
        } else if (i === period - 1) {
            // First RSI uses simple average
            const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
            const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

            if (avgLoss === 0) {
                result.push(100);
            } else {
                const rs = avgGain / avgLoss;
                result.push(100 - (100 / (1 + rs)));
            }
        } else {
            // Subsequent RSI uses smoothed average
            const prevRSI = result[result.length - 1];
            if (prevRSI === null) {
                result.push(null);
                continue;
            }

            // Calculate smoothed averages
            const prevAvgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
            const prevAvgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;

            const smoothedAvgGain = (prevAvgGain * (period - 1) + gains[i]) / period;
            const smoothedAvgLoss = (prevAvgLoss * (period - 1) + losses[i]) / period;

            if (smoothedAvgLoss === 0) {
                result.push(100);
            } else {
                const rs = smoothedAvgGain / smoothedAvgLoss;
                result.push(100 - (100 / (1 + rs)));
            }
        }
    }

    return result;
}

export interface MACDResult {
    macdLine: (number | null)[];
    signalLine: (number | null)[];
    histogram: (number | null)[];
}

/**
 * Moving Average Convergence Divergence (MACD)
 * Trend-following momentum indicator
 * Default: 12-period EMA, 26-period EMA, 9-period signal
 */
export function calculateMACD(
    data: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
): MACDResult {
    const fastEMA = calculateEMA(data, fastPeriod);
    const slowEMA = calculateEMA(data, slowPeriod);

    // MACD Line = Fast EMA - Slow EMA
    const macdLine: (number | null)[] = fastEMA.map((fast, i) => {
        const slow = slowEMA[i];
        if (fast === null || slow === null) return null;
        return fast - slow;
    });

    // Extract non-null MACD values for signal line calculation
    const macdValues = macdLine.filter((v): v is number => v !== null);
    const signalEMA = calculateEMA(macdValues, signalPeriod);

    // Map signal line back to full length
    const signalLine: (number | null)[] = [];
    let signalIdx = 0;
    for (let i = 0; i < macdLine.length; i++) {
        if (macdLine[i] === null) {
            signalLine.push(null);
        } else {
            signalLine.push(signalEMA[signalIdx]);
            signalIdx++;
        }
    }

    // Histogram = MACD Line - Signal Line
    const histogram: (number | null)[] = macdLine.map((macd, i) => {
        const signal = signalLine[i];
        if (macd === null || signal === null) return null;
        return macd - signal;
    });

    return { macdLine, signalLine, histogram };
}

export interface BollingerBandsResult {
    upper: (number | null)[];
    middle: (number | null)[];
    lower: (number | null)[];
}

/**
 * Bollinger Bands
 * Volatility indicator using standard deviation
 */
export function calculateBollingerBands(
    data: number[],
    period: number = 20,
    stdDevMultiplier: number = 2
): BollingerBandsResult {
    const middle = calculateSMA(data, period);
    const upper: (number | null)[] = [];
    const lower: (number | null)[] = [];

    for (let i = 0; i < data.length; i++) {
        if (middle[i] === null) {
            upper.push(null);
            lower.push(null);
        } else {
            // Calculate standard deviation
            const slice = data.slice(i - period + 1, i + 1);
            const mean = middle[i]!;
            const squaredDiffs = slice.map(v => Math.pow(v - mean, 2));
            const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
            const stdDev = Math.sqrt(variance);

            upper.push(mean + stdDevMultiplier * stdDev);
            lower.push(mean - stdDevMultiplier * stdDev);
        }
    }

    return { upper, middle, lower };
}

export interface SupportResistanceLevel {
    price: number;
    type: 'support' | 'resistance';
    strength: number; // 1-3, higher is stronger
}

/**
 * Detect Support and Resistance Levels
 * Uses local minima/maxima detection
 */
export function detectSupportResistance(
    data: HistoricalDataPoint[],
    lookback: number = 5,
    threshold: number = 0.02 // 2% price clustering
): SupportResistanceLevel[] {
    const levels: SupportResistanceLevel[] = [];
    const prices: number[] = data.map(d => d.close);

    // Find local minima (support) and maxima (resistance)
    for (let i = lookback; i < prices.length - lookback; i++) {
        const current = prices[i];
        const leftSlice = prices.slice(i - lookback, i);
        const rightSlice = prices.slice(i + 1, i + lookback + 1);

        const isLocalMin = leftSlice.every(p => p >= current) && rightSlice.every(p => p >= current);
        const isLocalMax = leftSlice.every(p => p <= current) && rightSlice.every(p => p <= current);

        if (isLocalMin) {
            levels.push({ price: current, type: 'support', strength: 1 });
        }
        if (isLocalMax) {
            levels.push({ price: current, type: 'resistance', strength: 1 });
        }
    }

    // Cluster nearby levels to increase strength
    const clusteredLevels: SupportResistanceLevel[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < levels.length; i++) {
        if (processed.has(i)) continue;

        let cluster = [levels[i]];
        processed.add(i);

        for (let j = i + 1; j < levels.length; j++) {
            if (processed.has(j)) continue;

            const priceDiff = Math.abs(levels[i].price - levels[j].price) / levels[i].price;
            if (priceDiff < threshold && levels[i].type === levels[j].type) {
                cluster.push(levels[j]);
                processed.add(j);
            }
        }

        // Average the cluster
        const avgPrice = cluster.reduce((sum, l) => sum + l.price, 0) / cluster.length;
        const strength = Math.min(3, cluster.length);

        clusteredLevels.push({
            price: avgPrice,
            type: levels[i].type,
            strength,
        });
    }

    // Sort by price descending
    return clusteredLevels.sort((a, b) => b.price - a.price);
}

/**
 * Volume Weighted Average Price (VWAP)
 * Intraday indicator
 */
export function calculateVWAP(data: HistoricalDataPoint[]): (number | null)[] {
    let cumulativeTPV = 0; // Typical Price * Volume
    let cumulativeVolume = 0;

    return data.map((point) => {
        const typicalPrice = (point.high + point.low + point.close) / 3;
        cumulativeTPV += typicalPrice * point.volume;
        cumulativeVolume += point.volume;

        if (cumulativeVolume === 0) return null;
        return cumulativeTPV / cumulativeVolume;
    });
}

// Available indicator types
export type IndicatorType =
    | 'sma_20'
    | 'sma_50'
    | 'sma_200'
    | 'ema_12'
    | 'ema_26'
    | 'rsi'
    | 'macd'
    | 'bollinger'
    | 'vwap';

export interface IndicatorConfig {
    id: IndicatorType;
    name: string;
    shortName: string;
    color: string;
    type: 'overlay' | 'separate'; // overlay = on price chart, separate = own panel
    defaultEnabled: boolean;
}

export const AVAILABLE_INDICATORS: IndicatorConfig[] = [
    { id: 'sma_20', name: 'SMA (20)', shortName: 'SMA20', color: '#f59e0b', type: 'overlay', defaultEnabled: false },
    { id: 'sma_50', name: 'SMA (50)', shortName: 'SMA50', color: '#3b82f6', type: 'overlay', defaultEnabled: false },
    { id: 'sma_200', name: 'SMA (200)', shortName: 'SMA200', color: '#8b5cf6', type: 'overlay', defaultEnabled: false },
    { id: 'ema_12', name: 'EMA (12)', shortName: 'EMA12', color: '#22c55e', type: 'overlay', defaultEnabled: false },
    { id: 'ema_26', name: 'EMA (26)', shortName: 'EMA26', color: '#ef4444', type: 'overlay', defaultEnabled: false },
    { id: 'bollinger', name: 'Bollinger Bands', shortName: 'BB', color: '#6366f1', type: 'overlay', defaultEnabled: false },
    { id: 'vwap', name: 'VWAP', shortName: 'VWAP', color: '#ec4899', type: 'overlay', defaultEnabled: false },
    { id: 'rsi', name: 'RSI (14)', shortName: 'RSI', color: '#8b5cf6', type: 'separate', defaultEnabled: false },
    { id: 'macd', name: 'MACD (12,26,9)', shortName: 'MACD', color: '#3b82f6', type: 'separate', defaultEnabled: false },
];
