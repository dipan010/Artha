'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
    Portfolio,
    PortfolioHolding,
    PortfolioTransaction,
    PortfolioSummary,
    SectorAllocation,
    StockSector,
} from '@/types/portfolio';
import { calculatePnL, calculatePortfolioSummary, calculateSectorAllocation } from '@/types/portfolio';

const STORAGE_KEY = 'artha_portfolio';

interface UsePortfolioReturn {
    portfolio: Portfolio | null;
    summary: PortfolioSummary | null;
    sectorAllocation: SectorAllocation[];
    loading: boolean;
    refreshing: boolean;
    addHolding: (symbol: string, name: string, quantity: number, price: number, sector?: StockSector) => Promise<PortfolioHolding>;
    updateHolding: (holdingId: string, updates: Partial<PortfolioHolding>) => void;
    deleteHolding: (holdingId: string) => void;
    addTransaction: (transaction: Omit<PortfolioTransaction, 'id'>) => void;
    refreshPrices: () => Promise<void>;
    exportPortfolio: () => string;
    importPortfolio: (data: string) => boolean;
    clearPortfolio: () => void;
}

export function usePortfolio(): UsePortfolioReturn {
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [summary, setSummary] = useState<PortfolioSummary | null>(null);
    const [sectorAllocation, setSectorAllocation] = useState<SectorAllocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Load portfolio from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setPortfolio({
                    ...parsed,
                    createdAt: new Date(parsed.createdAt),
                    updatedAt: new Date(parsed.updatedAt),
                    transactions: parsed.transactions.map((t: PortfolioTransaction) => ({
                        ...t,
                        date: new Date(t.date),
                    })),
                    holdings: parsed.holdings.map((h: PortfolioHolding) => ({
                        ...h,
                        lastUpdated: h.lastUpdated ? new Date(h.lastUpdated) : undefined,
                    })),
                });
            } else {
                // Create default empty portfolio
                const newPortfolio: Portfolio = {
                    id: 'default',
                    name: 'My Portfolio',
                    holdings: [],
                    transactions: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    currency: 'INR',
                };
                setPortfolio(newPortfolio);
            }
        } catch (error) {
            console.error('Error loading portfolio:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Save portfolio to localStorage on change
    useEffect(() => {
        if (portfolio) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
            } catch (error) {
                console.error('Error saving portfolio:', error);
            }
        }
    }, [portfolio]);

    // Calculate summary and sector allocation when holdings change
    useEffect(() => {
        if (portfolio?.holdings) {
            const newSummary = calculatePortfolioSummary(portfolio.holdings);
            setSummary(newSummary);
            setSectorAllocation(calculateSectorAllocation(portfolio.holdings));
        }
    }, [portfolio?.holdings]);

    // Refresh prices for all holdings
    const refreshPrices = useCallback(async () => {
        if (!portfolio || portfolio.holdings.length === 0) return;

        setRefreshing(true);

        try {
            const symbols = portfolio.holdings.map(h => h.symbol);
            const pricePromises = symbols.map(async (symbol) => {
                try {
                    const response = await fetch(`/api/stocks/${symbol}`);
                    if (response.ok) {
                        const data = await response.json();
                        return {
                            symbol,
                            currentPrice: data.regularMarketPrice,
                            dayChange: data.regularMarketChange,
                            dayChangePercent: data.regularMarketChangePercent,
                        };
                    }
                } catch {
                    return null;
                }
            });

            const results = await Promise.all(pricePromises);

            setPortfolio(prev => {
                if (!prev) return prev;

                const updatedHoldings = prev.holdings.map(holding => {
                    const priceData = results.find(r => r?.symbol === holding.symbol);
                    if (priceData) {
                        const currentValue = holding.quantity * priceData.currentPrice;
                        const { pnl, pnlPercent } = calculatePnL({
                            ...holding,
                            currentPrice: priceData.currentPrice,
                        });

                        return {
                            ...holding,
                            currentPrice: priceData.currentPrice,
                            currentValue,
                            pnl,
                            pnlPercent,
                            dayChange: priceData.dayChange * holding.quantity,
                            dayChangePercent: priceData.dayChangePercent,
                            lastUpdated: new Date(),
                        };
                    }
                    return holding;
                });

                return {
                    ...prev,
                    holdings: updatedHoldings,
                    updatedAt: new Date(),
                };
            });
        } catch (error) {
            console.error('Error refreshing prices:', error);
        } finally {
            setRefreshing(false);
        }
    }, [portfolio]);

    // Auto-refresh prices every 30 seconds during market hours
    useEffect(() => {
        if (portfolio && portfolio.holdings.length > 0) {
            refreshPrices();

            // Set up interval
            refreshIntervalRef.current = setInterval(() => {
                const now = new Date();
                const hours = now.getHours();
                const minutes = now.getMinutes();
                const day = now.getDay();

                // Only refresh during market hours (9:15 AM to 3:30 PM, Mon-Fri)
                const marketOpen = hours > 9 || (hours === 9 && minutes >= 15);
                const marketClose = hours < 15 || (hours === 15 && minutes <= 30);
                const isWeekday = day >= 1 && day <= 5;

                if (marketOpen && marketClose && isWeekday) {
                    refreshPrices();
                }
            }, 30000);
        }

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [portfolio?.holdings.length, refreshPrices]);

    // Add a new holding
    const addHolding = useCallback(async (
        symbol: string,
        name: string,
        quantity: number,
        price: number,
        sector?: StockSector
    ): Promise<PortfolioHolding> => {
        const holding: PortfolioHolding = {
            id: Date.now().toString(),
            symbol,
            name,
            quantity,
            avgBuyPrice: price,
            investedValue: quantity * price,
            sector,
            lastUpdated: new Date(),
        };

        const transaction: PortfolioTransaction = {
            id: Date.now().toString() + '_tx',
            holdingId: holding.id,
            symbol,
            type: 'BUY',
            quantity,
            price,
            date: new Date(),
        };

        setPortfolio(prev => {
            if (!prev) return prev;

            // Check if holding already exists
            const existingIndex = prev.holdings.findIndex(h => h.symbol === symbol);

            if (existingIndex >= 0) {
                // Update existing holding
                const existing = prev.holdings[existingIndex];
                const newQuantity = existing.quantity + quantity;
                const newInvested = existing.investedValue + (quantity * price);
                const newAvgPrice = newInvested / newQuantity;

                const updatedHolding = {
                    ...existing,
                    quantity: newQuantity,
                    avgBuyPrice: newAvgPrice,
                    investedValue: newInvested,
                };

                const updatedHoldings = [...prev.holdings];
                updatedHoldings[existingIndex] = updatedHolding;

                return {
                    ...prev,
                    holdings: updatedHoldings,
                    transactions: [...prev.transactions, { ...transaction, holdingId: existing.id }],
                    updatedAt: new Date(),
                };
            }

            return {
                ...prev,
                holdings: [...prev.holdings, holding],
                transactions: [...prev.transactions, transaction],
                updatedAt: new Date(),
            };
        });

        return holding;
    }, []);

    // Update a holding
    const updateHolding = useCallback((holdingId: string, updates: Partial<PortfolioHolding>) => {
        setPortfolio(prev => {
            if (!prev) return prev;

            const updatedHoldings = prev.holdings.map(h =>
                h.id === holdingId ? { ...h, ...updates } : h
            );

            return {
                ...prev,
                holdings: updatedHoldings,
                updatedAt: new Date(),
            };
        });
    }, []);

    // Delete a holding
    const deleteHolding = useCallback((holdingId: string) => {
        setPortfolio(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                holdings: prev.holdings.filter(h => h.id !== holdingId),
                transactions: prev.transactions.filter(t => t.holdingId !== holdingId),
                updatedAt: new Date(),
            };
        });
    }, []);

    // Add a transaction
    const addTransaction = useCallback((transaction: Omit<PortfolioTransaction, 'id'>) => {
        const newTransaction: PortfolioTransaction = {
            ...transaction,
            id: Date.now().toString(),
        };

        setPortfolio(prev => {
            if (!prev) return prev;

            // Update the holding based on transaction
            const holdingIndex = prev.holdings.findIndex(h => h.id === transaction.holdingId);

            if (holdingIndex >= 0) {
                const holding = prev.holdings[holdingIndex];
                let updatedHolding: PortfolioHolding;

                if (transaction.type === 'BUY') {
                    const newQuantity = holding.quantity + transaction.quantity;
                    const newInvested = holding.investedValue + (transaction.quantity * transaction.price);
                    updatedHolding = {
                        ...holding,
                        quantity: newQuantity,
                        avgBuyPrice: newInvested / newQuantity,
                        investedValue: newInvested,
                    };
                } else {
                    // SELL
                    const newQuantity = holding.quantity - transaction.quantity;
                    const soldValue = transaction.quantity * holding.avgBuyPrice;
                    updatedHolding = {
                        ...holding,
                        quantity: newQuantity,
                        investedValue: holding.investedValue - soldValue,
                    };
                }

                const updatedHoldings = [...prev.holdings];

                // Remove holding if quantity becomes 0
                if (updatedHolding.quantity <= 0) {
                    updatedHoldings.splice(holdingIndex, 1);
                } else {
                    updatedHoldings[holdingIndex] = updatedHolding;
                }

                return {
                    ...prev,
                    holdings: updatedHoldings,
                    transactions: [...prev.transactions, newTransaction],
                    updatedAt: new Date(),
                };
            }

            return {
                ...prev,
                transactions: [...prev.transactions, newTransaction],
                updatedAt: new Date(),
            };
        });
    }, []);

    // Export portfolio as JSON
    const exportPortfolio = useCallback((): string => {
        return JSON.stringify(portfolio, null, 2);
    }, [portfolio]);

    // Import portfolio from JSON
    const importPortfolio = useCallback((data: string): boolean => {
        try {
            const parsed = JSON.parse(data);
            if (parsed.holdings && parsed.transactions) {
                setPortfolio({
                    ...parsed,
                    id: parsed.id || 'imported',
                    createdAt: new Date(parsed.createdAt || Date.now()),
                    updatedAt: new Date(),
                });
                return true;
            }
        } catch {
            console.error('Invalid portfolio data');
        }
        return false;
    }, []);

    // Clear portfolio
    const clearPortfolio = useCallback(() => {
        const emptyPortfolio: Portfolio = {
            id: 'default',
            name: 'My Portfolio',
            holdings: [],
            transactions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            currency: 'INR',
        };
        setPortfolio(emptyPortfolio);
    }, []);

    return {
        portfolio,
        summary,
        sectorAllocation,
        loading,
        refreshing,
        addHolding,
        updateHolding,
        deleteHolding,
        addTransaction,
        refreshPrices,
        exportPortfolio,
        importPortfolio,
        clearPortfolio,
    };
}
