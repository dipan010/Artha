/**
 * Mutual Fund Types
 */

export interface MutualFund {
    id: string;
    name: string;
    category: MutualFundCategory;
    amc: string; // Asset Management Company
    nav: number;
    navDate: Date;
    returns: {
        oneMonth?: number;
        threeMonth?: number;
        sixMonth?: number;
        oneYear?: number;
        threeYear?: number;
        fiveYear?: number;
    };
    aum: number; // Assets Under Management in Cr
    expenseRatio: number;
    riskLevel: 'low' | 'moderate' | 'moderately_high' | 'high' | 'very_high';
    rating?: number; // 1-5 stars
    minInvestment: number;
    exitLoad?: string;
    benchmark?: string;
    fundManager?: string;
    inceptionDate?: Date;
}

export type MutualFundCategory =
    | 'large_cap'
    | 'mid_cap'
    | 'small_cap'
    | 'multi_cap'
    | 'flexi_cap'
    | 'elss'
    | 'index'
    | 'debt'
    | 'hybrid'
    | 'sectoral';

export const CATEGORY_LABELS: Record<MutualFundCategory, string> = {
    large_cap: 'Large Cap',
    mid_cap: 'Mid Cap',
    small_cap: 'Small Cap',
    multi_cap: 'Multi Cap',
    flexi_cap: 'Flexi Cap',
    elss: 'ELSS (Tax Saving)',
    index: 'Index Fund',
    debt: 'Debt Fund',
    hybrid: 'Hybrid',
    sectoral: 'Sectoral/Thematic',
};

export const RISK_COLORS: Record<MutualFund['riskLevel'], string> = {
    low: '#22c55e',
    moderate: '#84cc16',
    moderately_high: '#eab308',
    high: '#f97316',
    very_high: '#ef4444',
};

export const CATEGORY_ICONS: Record<MutualFundCategory, string> = {
    large_cap: '🏢',
    mid_cap: '🏗️',
    small_cap: '🏠',
    multi_cap: '🌐',
    flexi_cap: '🔄',
    elss: '💰',
    index: '📊',
    debt: '🏦',
    hybrid: '⚖️',
    sectoral: '🎯',
};
