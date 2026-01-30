'use client';

import { useState } from 'react';
import {
    Activity, ChevronDown, ChevronUp,
    TrendingUp, BarChart3, Waves
} from 'lucide-react';
import { AVAILABLE_INDICATORS, IndicatorType, IndicatorConfig } from '@/utils/technicalIndicators';

interface IndicatorPanelProps {
    enabledIndicators: IndicatorType[];
    onToggleIndicator: (indicator: IndicatorType) => void;
}

export default function IndicatorPanel({
    enabledIndicators,
    onToggleIndicator,
}: IndicatorPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const overlayIndicators = AVAILABLE_INDICATORS.filter(i => i.type === 'overlay');
    const separateIndicators = AVAILABLE_INDICATORS.filter(i => i.type === 'separate');

    const enabledCount = enabledIndicators.length;

    const getIndicatorIcon = (id: IndicatorType) => {
        if (id.startsWith('sma') || id.startsWith('ema')) {
            return <TrendingUp size={14} />;
        }
        if (id === 'rsi' || id === 'macd') {
            return <Activity size={14} />;
        }
        if (id === 'bollinger') {
            return <Waves size={14} />;
        }
        return <BarChart3 size={14} />;
    };

    return (
        <div className="indicator-panel">
            <button
                className="indicator-toggle"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <Activity size={16} />
                <span>Indicators</span>
                {enabledCount > 0 && (
                    <span className="indicator-count">{enabledCount}</span>
                )}
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isExpanded && (
                <div className="indicator-dropdown">
                    <div className="indicator-section">
                        <span className="indicator-section-title">Overlays</span>
                        <div className="indicator-grid">
                            {overlayIndicators.map((indicator) => (
                                <button
                                    key={indicator.id}
                                    className={`indicator-chip ${enabledIndicators.includes(indicator.id) ? 'active' : ''}`}
                                    onClick={() => onToggleIndicator(indicator.id)}
                                    style={{
                                        '--indicator-color': indicator.color
                                    } as React.CSSProperties}
                                >
                                    <span
                                        className="indicator-dot"
                                        style={{ backgroundColor: indicator.color }}
                                    />
                                    {indicator.shortName}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="indicator-section">
                        <span className="indicator-section-title">Oscillators</span>
                        <div className="indicator-grid">
                            {separateIndicators.map((indicator) => (
                                <button
                                    key={indicator.id}
                                    className={`indicator-chip ${enabledIndicators.includes(indicator.id) ? 'active' : ''}`}
                                    onClick={() => onToggleIndicator(indicator.id)}
                                    style={{
                                        '--indicator-color': indicator.color
                                    } as React.CSSProperties}
                                >
                                    {getIndicatorIcon(indicator.id)}
                                    {indicator.shortName}
                                </button>
                            ))}
                        </div>
                    </div>

                    {enabledIndicators.length > 0 && (
                        <button
                            className="clear-indicators"
                            onClick={() => enabledIndicators.forEach(onToggleIndicator)}
                        >
                            Clear All
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
