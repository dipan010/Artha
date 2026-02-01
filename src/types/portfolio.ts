/**
 * Portfolio Types for Portfolio Tracking
 */

export interface PortfolioHolding {
    id: string;
    symbol: string;
    name: string;
    quantity: number;
    avgBuyPrice: number;
    currentPrice?: number;
    investedValue: number;
    currentValue?: number;
    pnl?: number;
    pnlPercent?: number;
    dayChange?: number;
    dayChangePercent?: number;
    sector?: string;
    lastUpdated?: Date;
}

export interface PortfolioTransaction {
    id: string;
    holdingId: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    date: Date;
    notes?: string;
    fees?: number;
}

export interface Portfolio {
    id: string;
    name: string;
    holdings: PortfolioHolding[];
    transactions: PortfolioTransaction[];
    createdAt: Date;
    updatedAt: Date;
    currency: string;
}

export interface PortfolioSummary {
    totalInvested: number;
    currentValue: number;
    totalPnL: number;
    totalPnLPercent: number;
    dayChange: number;
    dayChangePercent: number;
    topGainer?: PortfolioHolding;
    topLoser?: PortfolioHolding;
    holdingsCount: number;
    sectorsCount: number;
}

export interface SectorAllocation {
    sector: string;
    value: number;
    percentage: number;
    holdings: PortfolioHolding[];
}

export interface PortfolioPerformance {
    date: Date;
    value: number;
    invested: number;
    pnl: number;
    pnlPercent: number;
}

// Predefined sectors for Indian stocks
export const STOCK_SECTORS = [
    'Technology',
    'Banking',
    'Financial Services',
    'Automobile',
    'Pharmaceuticals',
    'FMCG',
    'Energy',
    'Metals & Mining',
    'Infrastructure',
    'Telecom',
    'Real Estate',
    'Consumer Durables',
    'Chemicals',
    'Cement',
    'Media & Entertainment',
    'Other',
] as const;

export type StockSector = typeof STOCK_SECTORS[number];

// Helper function to calculate P&L
export function calculatePnL(holding: PortfolioHolding): { pnl: number; pnlPercent: number } {
    if (!holding.currentPrice) {
        return { pnl: 0, pnlPercent: 0 };
    }

    const currentValue = holding.quantity * holding.currentPrice;
    const pnl = currentValue - holding.investedValue;
    const pnlPercent = (pnl / holding.investedValue) * 100;

    return { pnl, pnlPercent };
}

// Helper function to calculate portfolio summary
export function calculatePortfolioSummary(holdings: PortfolioHolding[]): PortfolioSummary {
    const totalInvested = holdings.reduce((sum, h) => sum + h.investedValue, 0);
    const currentValue = holdings.reduce((sum, h) => sum + (h.currentValue || h.investedValue), 0);
    const dayChange = holdings.reduce((sum, h) => sum + (h.dayChange || 0), 0);

    const totalPnL = currentValue - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const dayChangePercent = currentValue > 0 ? (dayChange / (currentValue - dayChange)) * 100 : 0;

    // Find top gainer and loser
    const sortedByPnL = [...holdings].filter(h => h.pnlPercent !== undefined).sort((a, b) => (b.pnlPercent || 0) - (a.pnlPercent || 0));

    const sectors = new Set(holdings.map(h => h.sector).filter(Boolean));

    return {
        totalInvested,
        currentValue,
        totalPnL,
        totalPnLPercent,
        dayChange,
        dayChangePercent,
        topGainer: sortedByPnL[0],
        topLoser: sortedByPnL[sortedByPnL.length - 1],
        holdingsCount: holdings.length,
        sectorsCount: sectors.size,
    };
}

// Helper function to calculate sector allocation
export function calculateSectorAllocation(holdings: PortfolioHolding[]): SectorAllocation[] {
    const sectorMap = new Map<string, { value: number; holdings: PortfolioHolding[] }>();
    let totalValue = 0;

    for (const holding of holdings) {
        const sector = holding.sector || 'Other';
        const value = holding.currentValue || holding.investedValue;
        totalValue += value;

        if (sectorMap.has(sector)) {
            const existing = sectorMap.get(sector)!;
            existing.value += value;
            existing.holdings.push(holding);
        } else {
            sectorMap.set(sector, { value, holdings: [holding] });
        }
    }

    return Array.from(sectorMap.entries()).map(([sector, data]) => ({
        sector,
        value: data.value,
        percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
        holdings: data.holdings,
    })).sort((a, b) => b.value - a.value);
}
