'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    TrendingUp, TrendingDown, X, Star, Plus, Edit2,
    Check, FolderOpen, StickyNote, Target, ChevronDown
} from 'lucide-react';
import type { StockQuote } from '@/types/stock';
import type {
    EnhancedWatchlistItem,
    WatchlistCategory,
    WatchlistState,
    DEFAULT_CATEGORIES,
    CATEGORY_COLORS
} from '@/types/watchlist';

const WATCHLIST_STORAGE_KEY = 'artha-watchlist-v2';

interface WatchlistManagerProps {
    selectedSymbol: string | null;
    onSelectStock: (symbol: string) => void;
    onAddToWatchlist?: (item: EnhancedWatchlistItem) => void;
}

interface WatchlistItemWithPrice extends EnhancedWatchlistItem {
    price?: number;
    change?: number;
    changePercent?: number;
}

const defaultState: WatchlistState = {
    categories: [
        {
            id: 'default',
            name: 'General',
            color: '#6366f1',
            createdAt: new Date().toISOString(),
        },
    ],
    items: [],
    activeCategory: null,
};

const categoryColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f59e0b', '#22c55e', '#14b8a6', '#3b82f6', '#6b7280',
];

export default function WatchlistManager({
    selectedSymbol,
    onSelectStock,
}: WatchlistManagerProps) {
    const [state, setState] = useState<WatchlistState>(defaultState);
    const [itemsWithPrices, setItemsWithPrices] = useState<WatchlistItemWithPrice[]>([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState<string | null>(null);
    const [editingCategory, setEditingCategory] = useState<WatchlistCategory | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState(categoryColors[0]);
    const [noteText, setNoteText] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState<string | null>(null);

    // Load state from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setState(parsed);
            } catch (e) {
                console.error('Failed to parse watchlist:', e);
            }
        }
    }, []);

    // Listen for storage changes (from useWatchlistManager hook)
    useEffect(() => {
        const handleStorageChange = () => {
            const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setState(parsed);
                } catch (e) {
                    console.error('Failed to parse watchlist:', e);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Save state to localStorage
    useEffect(() => {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    // Fetch prices for all items
    const fetchPrices = useCallback(async () => {
        if (state.items.length === 0) {
            setItemsWithPrices([]);
            return;
        }

        const updatedItems = await Promise.all(
            state.items.map(async (item) => {
                try {
                    const res = await fetch(`/api/stocks/${encodeURIComponent(item.symbol)}`);
                    if (!res.ok) return item;
                    const data: StockQuote = await res.json();
                    return {
                        ...item,
                        price: data.price,
                        change: data.change,
                        changePercent: data.changePercent,
                    };
                } catch {
                    return item;
                }
            })
        );
        setItemsWithPrices(updatedItems);
    }, [state.items]);

    useEffect(() => {
        fetchPrices();
        const interval = setInterval(fetchPrices, 30000);
        return () => clearInterval(interval);
    }, [fetchPrices]);

    // Filter items by active category
    const filteredItems = state.activeCategory
        ? itemsWithPrices.filter(item => item.categoryId === state.activeCategory)
        : itemsWithPrices;

    // Add new category
    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;

        const newCategory: WatchlistCategory = {
            id: `cat_${Date.now()}`,
            name: newCategoryName.trim(),
            color: newCategoryColor,
            createdAt: new Date().toISOString(),
        };

        setState(prev => ({
            ...prev,
            categories: [...prev.categories, newCategory],
        }));

        setNewCategoryName('');
        setNewCategoryColor(categoryColors[0]);
        setShowCategoryModal(false);
    };

    // Delete category
    const handleDeleteCategory = (categoryId: string) => {
        if (categoryId === 'default') return;

        setState(prev => ({
            ...prev,
            categories: prev.categories.filter(c => c.id !== categoryId),
            items: prev.items.map(item =>
                item.categoryId === categoryId
                    ? { ...item, categoryId: 'default' }
                    : item
            ),
            activeCategory: prev.activeCategory === categoryId ? null : prev.activeCategory,
        }));
    };

    // Move item to category
    const handleMoveToCategory = (symbol: string, categoryId: string) => {
        setState(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.symbol === symbol ? { ...item, categoryId } : item
            ),
        }));
        setShowCategoryDropdown(null);
    };

    // Remove item from watchlist
    const handleRemoveItem = (symbol: string) => {
        setState(prev => ({
            ...prev,
            items: prev.items.filter(item => item.symbol !== symbol),
        }));
    };

    // Save note for item
    const handleSaveNote = (symbol: string) => {
        setState(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.symbol === symbol ? { ...item, notes: noteText } : item
            ),
        }));
        setShowNoteModal(null);
        setNoteText('');
    };

    // Get category by id
    const getCategoryById = (id?: string) => {
        return state.categories.find(c => c.id === id) || state.categories[0];
    };

    // Calculate portfolio performance
    const calculatePortfolioPerformance = () => {
        let totalGain = 0;
        let totalGainPercent = 0;
        let count = 0;

        itemsWithPrices.forEach(item => {
            if (item.changePercent !== undefined) {
                totalGainPercent += item.changePercent;
                count++;
            }
        });

        const avgGainPercent = count > 0 ? totalGainPercent / count : 0;
        return { totalGain, avgGainPercent, count };
    };

    const performance = calculatePortfolioPerformance();

    return (
        <div className="watchlist-manager">
            {/* Header */}
            <div className="watchlist-header">
                <Star size={18} />
                <h3>Watchlist</h3>
                <span className="count">{state.items.length}</span>
            </div>

            {/* Category Tabs */}
            <div className="category-tabs">
                <button
                    className={`category-tab ${state.activeCategory === null ? 'active' : ''}`}
                    onClick={() => setState(prev => ({ ...prev, activeCategory: null }))}
                >
                    All
                </button>
                {state.categories.map(category => (
                    <button
                        key={category.id}
                        className={`category-tab ${state.activeCategory === category.id ? 'active' : ''}`}
                        style={{ '--category-color': category.color } as React.CSSProperties}
                        onClick={() => setState(prev => ({ ...prev, activeCategory: category.id }))}
                    >
                        <span
                            className="category-dot"
                            style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                        {category.id !== 'default' && (
                            <button
                                className="category-delete"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCategory(category.id);
                                }}
                            >
                                <X size={10} />
                            </button>
                        )}
                    </button>
                ))}
                <button
                    className="category-tab add-category"
                    onClick={() => setShowCategoryModal(true)}
                >
                    <Plus size={14} />
                </button>
            </div>

            {/* Performance Summary */}
            {itemsWithPrices.length > 0 && (
                <div className="watchlist-performance">
                    <span className="perf-label">Avg. Change Today:</span>
                    <span className={`perf-value ${performance.avgGainPercent >= 0 ? 'positive' : 'negative'}`}>
                        {performance.avgGainPercent >= 0 ? '+' : ''}
                        {performance.avgGainPercent.toFixed(2)}%
                    </span>
                </div>
            )}

            {/* Items List */}
            {filteredItems.length === 0 ? (
                <div className="watchlist-empty">
                    <FolderOpen size={32} />
                    <p>No stocks in {state.activeCategory ? 'this category' : 'watchlist'}</p>
                    <span>Search and add stocks to track them here</span>
                </div>
            ) : (
                <div className="watchlist-items">
                    {filteredItems.map((item) => {
                        const isPositive = (item.change || 0) >= 0;
                        const isSelected = item.symbol === selectedSymbol;
                        const category = getCategoryById(item.categoryId);

                        return (
                            <div
                                key={item.symbol}
                                className={`watchlist-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => onSelectStock(item.symbol)}
                            >
                                <div
                                    className="item-category-indicator"
                                    style={{ backgroundColor: category.color }}
                                />

                                <div className="item-info">
                                    <div className="item-header">
                                        <span className="item-symbol">
                                            {item.symbol.replace('.NS', '').replace('.BO', '')}
                                        </span>
                                        {item.notes && (
                                            <StickyNote size={12} className="note-indicator" />
                                        )}
                                    </div>
                                    <span className="item-name">{item.name}</span>
                                </div>

                                <div className="item-price">
                                    {item.price !== undefined ? (
                                        <>
                                            <span className="price">
                                                ₹{item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                            </span>
                                            <span className={`change ${isPositive ? 'positive' : 'negative'}`}>
                                                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                {item.changePercent?.toFixed(2)}%
                                            </span>
                                        </>
                                    ) : (
                                        <span className="loading">...</span>
                                    )}
                                </div>

                                <div className="item-actions">
                                    {/* Category dropdown */}
                                    <div className="category-dropdown-container">
                                        <button
                                            className="action-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowCategoryDropdown(
                                                    showCategoryDropdown === item.symbol ? null : item.symbol
                                                );
                                            }}
                                            title="Move to category"
                                        >
                                            <FolderOpen size={14} />
                                            <ChevronDown size={10} />
                                        </button>
                                        {showCategoryDropdown === item.symbol && (
                                            <div className="category-dropdown" onClick={e => e.stopPropagation()}>
                                                {state.categories.map(cat => (
                                                    <button
                                                        key={cat.id}
                                                        className={`dropdown-item ${item.categoryId === cat.id ? 'active' : ''}`}
                                                        onClick={() => handleMoveToCategory(item.symbol, cat.id)}
                                                    >
                                                        <span
                                                            className="category-dot"
                                                            style={{ backgroundColor: cat.color }}
                                                        />
                                                        {cat.name}
                                                        {item.categoryId === cat.id && <Check size={12} />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Note button */}
                                    <button
                                        className="action-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setNoteText(item.notes || '');
                                            setShowNoteModal(item.symbol);
                                        }}
                                        title="Add note"
                                    >
                                        <StickyNote size={14} />
                                    </button>

                                    {/* Remove button */}
                                    <button
                                        className="remove-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveItem(item.symbol);
                                        }}
                                        title="Remove from watchlist"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Category Modal */}
            {showCategoryModal && (
                <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h4>Add Category</h4>
                            <button className="modal-close" onClick={() => setShowCategoryModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-content">
                            <label>
                                Category Name
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="e.g., Tech Stocks"
                                    autoFocus
                                />
                            </label>
                            <label>
                                Color
                                <div className="color-picker">
                                    {categoryColors.map(color => (
                                        <button
                                            key={color}
                                            className={`color-option ${newCategoryColor === color ? 'active' : ''}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setNewCategoryColor(color)}
                                        />
                                    ))}
                                </div>
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowCategoryModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleAddCategory}>
                                Add Category
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Note Modal */}
            {showNoteModal && (
                <div className="modal-overlay" onClick={() => setShowNoteModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h4>Note for {showNoteModal.replace('.NS', '').replace('.BO', '')}</h4>
                            <button className="modal-close" onClick={() => setShowNoteModal(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-content">
                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Add your notes about this stock..."
                                rows={4}
                                autoFocus
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowNoteModal(null)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={() => handleSaveNote(showNoteModal)}>
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Export a function to add items to watchlist from outside
export function useWatchlistManager() {
    const addToWatchlist = (symbol: string, name: string) => {
        const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
        let state: WatchlistState = defaultState;

        if (saved) {
            try {
                state = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse watchlist:', e);
            }
        }

        if (state.items.some(item => item.symbol === symbol)) {
            return false; // Already exists
        }

        const newItem: EnhancedWatchlistItem = {
            symbol,
            name,
            addedAt: new Date().toISOString(),
            categoryId: 'default',
        };

        state.items.push(newItem);
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(state));

        // Trigger storage event for other components
        window.dispatchEvent(new Event('storage'));

        return true;
    };

    const isInWatchlist = (symbol: string): boolean => {
        const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
        if (!saved) return false;

        try {
            const state: WatchlistState = JSON.parse(saved);
            return state.items.some(item => item.symbol === symbol);
        } catch {
            return false;
        }
    };

    return { addToWatchlist, isInWatchlist };
}
