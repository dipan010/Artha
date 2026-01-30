// Enhanced watchlist types for advanced features

// Watchlist category for organizing stocks
export interface WatchlistCategory {
    id: string;
    name: string;
    color: string;
    icon?: string;
    createdAt: string;
}

// Enhanced watchlist item with additional metadata
export interface EnhancedWatchlistItem {
    symbol: string;
    name: string;
    addedAt: string;
    categoryId?: string;
    notes?: string;
    purchasePrice?: number;
    purchaseQuantity?: number;
    targetPrice?: number;
    stopLoss?: number;
}

// Performance data for a watchlist item
export interface WatchlistPerformance {
    symbol: string;
    currentPrice: number;
    change: number;
    changePercent: number;
    purchasePrice?: number;
    gainLoss?: number;
    gainLossPercent?: number;
}

// Complete watchlist state
export interface WatchlistState {
    categories: WatchlistCategory[];
    items: EnhancedWatchlistItem[];
    activeCategory: string | null; // null means "All"
}

// Default categories
export const DEFAULT_CATEGORIES: WatchlistCategory[] = [
    {
        id: 'default',
        name: 'General',
        color: '#6366f1',
        createdAt: new Date().toISOString(),
    },
];

// Color options for categories
export const CATEGORY_COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#ef4444', // Red
    '#f59e0b', // Amber
    '#22c55e', // Green
    '#14b8a6', // Teal
    '#3b82f6', // Blue
    '#6b7280', // Gray
];
