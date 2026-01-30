'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, CandlestickSeries, LineSeries, CandlestickData, LineData, Time, HistogramSeries, ISeriesApi } from 'lightweight-charts';
import type { HistoricalDataPoint, TimeRange, ChartType } from '@/types/stock';
import { TIME_RANGES, CHART_COLORS } from '@/lib/constants';
import { BarChart2, LineChartIcon, RefreshCw } from 'lucide-react';
import IndicatorPanel from './IndicatorPanel';
import {
    IndicatorType,
    AVAILABLE_INDICATORS,
    calculateSMA,
    calculateEMA,
    calculateRSI,
    calculateMACD,
    calculateBollingerBands,
    calculateVWAP,
} from '@/utils/technicalIndicators';

interface StockChartProps {
    symbol: string | null;
}

export default function StockChart({ symbol }: StockChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const rsiContainerRef = useRef<HTMLDivElement>(null);
    const macdContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const rsiChartRef = useRef<IChartApi | null>(null);
    const macdChartRef = useRef<IChartApi | null>(null);

    const [data, setData] = useState<HistoricalDataPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('1M');
    const [chartType, setChartType] = useState<ChartType>('candlestick');
    const [enabledIndicators, setEnabledIndicators] = useState<IndicatorType[]>([]);

    const fetchData = useCallback(async () => {
        if (!symbol) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/stocks/${encodeURIComponent(symbol)}/history?range=${timeRange}`);
            if (!res.ok) throw new Error('Failed to fetch data');
            const history = await res.json();
            setData(history);
        } catch (err) {
            setError('Failed to load chart data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [symbol, timeRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleIndicator = (indicator: IndicatorType) => {
        setEnabledIndicators(prev =>
            prev.includes(indicator)
                ? prev.filter(i => i !== indicator)
                : [...prev, indicator]
        );
    };

    useEffect(() => {
        if (!chartContainerRef.current || data.length === 0) return;

        // Clear previous charts
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }
        if (rsiChartRef.current) {
            rsiChartRef.current.remove();
            rsiChartRef.current = null;
        }
        if (macdChartRef.current) {
            macdChartRef.current.remove();
            macdChartRef.current = null;
        }

        // Process data
        const processedData = data
            .filter(d => d.time && d.open && d.close && d.high && d.low)
            .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
            .reduce((acc: HistoricalDataPoint[], current) => {
                if (acc.length === 0 || acc[acc.length - 1].time !== current.time) {
                    acc.push(current);
                }
                return acc;
            }, []);

        if (processedData.length === 0) {
            setError('No chart data available');
            return;
        }

        const closePrices = processedData.map(d => d.close);
        const times = processedData.map(d => d.time as Time);

        // Create main chart
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: 'transparent' },
                textColor: CHART_COLORS.text,
            },
            grid: {
                vertLines: { color: CHART_COLORS.grid },
                horzLines: { color: CHART_COLORS.grid },
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            crosshair: { mode: 1 },
            timeScale: { borderColor: CHART_COLORS.grid, timeVisible: true },
            rightPriceScale: { borderColor: CHART_COLORS.grid },
        });

        chartRef.current = chart;

        // Add main series
        if (chartType === 'candlestick') {
            const candlestickSeries = chart.addSeries(CandlestickSeries, {
                upColor: CHART_COLORS.up,
                downColor: CHART_COLORS.down,
                borderUpColor: CHART_COLORS.up,
                borderDownColor: CHART_COLORS.down,
                wickUpColor: CHART_COLORS.up,
                wickDownColor: CHART_COLORS.down,
            });

            const candleData: CandlestickData[] = processedData.map(d => ({
                time: d.time as Time,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
            }));

            candlestickSeries.setData(candleData);
        } else {
            const lineSeries = chart.addSeries(LineSeries, {
                color: CHART_COLORS.line,
                lineWidth: 2,
            });

            const lineData: LineData[] = processedData.map(d => ({
                time: d.time as Time,
                value: d.close,
            }));

            lineSeries.setData(lineData);
        }

        // Add overlay indicators
        enabledIndicators.forEach(indicator => {
            const config = AVAILABLE_INDICATORS.find(i => i.id === indicator);
            if (!config || config.type !== 'overlay') return;

            let indicatorData: (number | null)[] = [];

            switch (indicator) {
                case 'sma_20':
                    indicatorData = calculateSMA(closePrices, 20);
                    break;
                case 'sma_50':
                    indicatorData = calculateSMA(closePrices, 50);
                    break;
                case 'sma_200':
                    indicatorData = calculateSMA(closePrices, 200);
                    break;
                case 'ema_12':
                    indicatorData = calculateEMA(closePrices, 12);
                    break;
                case 'ema_26':
                    indicatorData = calculateEMA(closePrices, 26);
                    break;
                case 'vwap':
                    indicatorData = calculateVWAP(processedData);
                    break;
                case 'bollinger': {
                    const bb = calculateBollingerBands(closePrices, 20, 2);

                    // Upper band
                    const upperSeries = chart.addSeries(LineSeries, {
                        color: config.color,
                        lineWidth: 1,
                        lineStyle: 2, // Dashed
                    });
                    upperSeries.setData(
                        bb.upper.map((v, i) => v !== null ? { time: times[i], value: v } : null)
                            .filter((d): d is LineData => d !== null)
                    );

                    // Lower band
                    const lowerSeries = chart.addSeries(LineSeries, {
                        color: config.color,
                        lineWidth: 1,
                        lineStyle: 2,
                    });
                    lowerSeries.setData(
                        bb.lower.map((v, i) => v !== null ? { time: times[i], value: v } : null)
                            .filter((d): d is LineData => d !== null)
                    );

                    // Middle band (SMA)
                    const middleSeries = chart.addSeries(LineSeries, {
                        color: config.color,
                        lineWidth: 1,
                    });
                    middleSeries.setData(
                        bb.middle.map((v, i) => v !== null ? { time: times[i], value: v } : null)
                            .filter((d): d is LineData => d !== null)
                    );
                    return; // Bollinger is already added
                }
            }

            if (indicatorData.length > 0) {
                const series = chart.addSeries(LineSeries, {
                    color: config.color,
                    lineWidth: 2,
                });

                series.setData(
                    indicatorData.map((v, i) => v !== null ? { time: times[i], value: v } : null)
                        .filter((d): d is LineData => d !== null)
                );
            }
        });

        chart.timeScale().fitContent();

        // Create RSI chart if enabled
        if (enabledIndicators.includes('rsi') && rsiContainerRef.current) {
            const rsiChart = createChart(rsiContainerRef.current, {
                layout: {
                    background: { color: 'transparent' },
                    textColor: CHART_COLORS.text,
                },
                grid: {
                    vertLines: { color: CHART_COLORS.grid },
                    horzLines: { color: CHART_COLORS.grid },
                },
                width: rsiContainerRef.current.clientWidth,
                height: 120,
                crosshair: { mode: 1 },
                timeScale: { borderColor: CHART_COLORS.grid, visible: false },
                rightPriceScale: { borderColor: CHART_COLORS.grid },
            });

            rsiChartRef.current = rsiChart;

            const rsiData = calculateRSI(closePrices, 14);
            const rsiSeries = rsiChart.addSeries(LineSeries, {
                color: '#8b5cf6',
                lineWidth: 2,
            });

            rsiSeries.setData(
                rsiData.map((v, i) => v !== null ? { time: times[i], value: v } : null)
                    .filter((d): d is LineData => d !== null)
            );

            // Add overbought/oversold lines
            const overboughtSeries = rsiChart.addSeries(LineSeries, {
                color: '#ef4444',
                lineWidth: 1,
                lineStyle: 2,
            });
            overboughtSeries.setData(times.map(t => ({ time: t, value: 70 })));

            const oversoldSeries = rsiChart.addSeries(LineSeries, {
                color: '#22c55e',
                lineWidth: 1,
                lineStyle: 2,
            });
            oversoldSeries.setData(times.map(t => ({ time: t, value: 30 })));

            rsiChart.timeScale().fitContent();

            // Sync timescales
            chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
                if (range) rsiChart.timeScale().setVisibleLogicalRange(range);
            });
        }

        // Create MACD chart if enabled
        if (enabledIndicators.includes('macd') && macdContainerRef.current) {
            const macdChart = createChart(macdContainerRef.current, {
                layout: {
                    background: { color: 'transparent' },
                    textColor: CHART_COLORS.text,
                },
                grid: {
                    vertLines: { color: CHART_COLORS.grid },
                    horzLines: { color: CHART_COLORS.grid },
                },
                width: macdContainerRef.current.clientWidth,
                height: 120,
                crosshair: { mode: 1 },
                timeScale: { borderColor: CHART_COLORS.grid, visible: false },
                rightPriceScale: { borderColor: CHART_COLORS.grid },
            });

            macdChartRef.current = macdChart;

            const macdData = calculateMACD(closePrices);

            // MACD Line
            const macdLineSeries = macdChart.addSeries(LineSeries, {
                color: '#3b82f6',
                lineWidth: 2,
            });
            macdLineSeries.setData(
                macdData.macdLine.map((v, i) => v !== null ? { time: times[i], value: v } : null)
                    .filter((d): d is LineData => d !== null)
            );

            // Signal Line
            const signalSeries = macdChart.addSeries(LineSeries, {
                color: '#f59e0b',
                lineWidth: 1,
            });
            signalSeries.setData(
                macdData.signalLine.map((v, i) => v !== null ? { time: times[i], value: v } : null)
                    .filter((d): d is LineData => d !== null)
            );

            // Histogram
            const histogramSeries = macdChart.addSeries(HistogramSeries, {
                color: '#22c55e',
            });
            histogramSeries.setData(
                macdData.histogram.map((v, i) => {
                    if (v === null) return null;
                    return {
                        time: times[i],
                        value: v,
                        color: v >= 0 ? '#22c55e' : '#ef4444',
                    };
                }).filter((d): d is { time: Time; value: number; color: string } => d !== null)
            );

            macdChart.timeScale().fitContent();

            // Sync timescales
            chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
                if (range) macdChart.timeScale().setVisibleLogicalRange(range);
            });
        }

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
            if (rsiContainerRef.current && rsiChartRef.current) {
                rsiChartRef.current.applyOptions({ width: rsiContainerRef.current.clientWidth });
            }
            if (macdContainerRef.current && macdChartRef.current) {
                macdChartRef.current.applyOptions({ width: macdContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
            if (rsiChartRef.current) {
                rsiChartRef.current.remove();
                rsiChartRef.current = null;
            }
            if (macdChartRef.current) {
                macdChartRef.current.remove();
                macdChartRef.current = null;
            }
        };
    }, [data, chartType, enabledIndicators]);

    if (!symbol) {
        return (
            <div className="chart-placeholder">
                <BarChart2 size={64} />
                <p>Select a stock to view chart</p>
            </div>
        );
    }

    return (
        <div className="stock-chart">
            <div className="chart-controls">
                <div className="time-ranges">
                    {(Object.keys(TIME_RANGES) as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            className={`range-btn ${timeRange === range ? 'active' : ''}`}
                            onClick={() => setTimeRange(range)}
                        >
                            {range}
                        </button>
                    ))}
                </div>

                <IndicatorPanel
                    enabledIndicators={enabledIndicators}
                    onToggleIndicator={toggleIndicator}
                />

                <div className="chart-type-toggle">
                    <button
                        className={`type-btn ${chartType === 'candlestick' ? 'active' : ''}`}
                        onClick={() => setChartType('candlestick')}
                        title="Candlestick"
                    >
                        <BarChart2 size={18} />
                    </button>
                    <button
                        className={`type-btn ${chartType === 'line' ? 'active' : ''}`}
                        onClick={() => setChartType('line')}
                        title="Line"
                    >
                        <LineChartIcon size={18} />
                    </button>
                </div>
            </div>

            <div className="chart-container">
                {loading && (
                    <div className="chart-loading">
                        <RefreshCw size={24} className="spin" />
                        <span>Loading chart...</span>
                    </div>
                )}
                {error && (
                    <div className="chart-error">
                        <span>{error}</span>
                        <button onClick={fetchData}>Retry</button>
                    </div>
                )}
                <div ref={chartContainerRef} className="chart-canvas" />
            </div>

            {/* RSI Sub-chart */}
            {enabledIndicators.includes('rsi') && (
                <div className="indicator-subchart">
                    <span className="subchart-label">RSI (14)</span>
                    <div ref={rsiContainerRef} className="subchart-canvas" />
                </div>
            )}

            {/* MACD Sub-chart */}
            {enabledIndicators.includes('macd') && (
                <div className="indicator-subchart">
                    <span className="subchart-label">MACD (12,26,9)</span>
                    <div ref={macdContainerRef} className="subchart-canvas" />
                </div>
            )}
        </div>
    );
}
