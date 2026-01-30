'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, CandlestickSeries, LineSeries, CandlestickData, LineData, Time } from 'lightweight-charts';
import type { HistoricalDataPoint, TimeRange, ChartType } from '@/types/stock';
import { TIME_RANGES, CHART_COLORS } from '@/lib/constants';
import { BarChart2, LineChartIcon, RefreshCw } from 'lucide-react';

interface StockChartProps {
    symbol: string | null;
}

export default function StockChart({ symbol }: StockChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    const [data, setData] = useState<HistoricalDataPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('1M');
    const [chartType, setChartType] = useState<ChartType>('candlestick');

    const fetchData = async () => {
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
    };

    useEffect(() => {
        fetchData();
    }, [symbol, timeRange]);

    useEffect(() => {
        if (!chartContainerRef.current || data.length === 0) return;

        // Clear previous chart
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

        // Process data: sort by time and remove duplicates
        const processedData = data
            .filter(d => d.time && d.open && d.close && d.high && d.low)
            .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
            .reduce((acc: HistoricalDataPoint[], current) => {
                // Remove duplicates by time
                if (acc.length === 0 || acc[acc.length - 1].time !== current.time) {
                    acc.push(current);
                }
                return acc;
            }, []);

        if (processedData.length === 0) {
            setError('No chart data available');
            return;
        }

        // Create new chart
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
            crosshair: {
                mode: 1,
            },
            timeScale: {
                borderColor: CHART_COLORS.grid,
                timeVisible: true,
            },
            rightPriceScale: {
                borderColor: CHART_COLORS.grid,
            },
        });

        chartRef.current = chart;

        if (chartType === 'candlestick') {
            // Using new v5 API: addSeries with CandlestickSeries
            const candlestickSeries = chart.addSeries(CandlestickSeries, {
                upColor: CHART_COLORS.up,
                downColor: CHART_COLORS.down,
                borderUpColor: CHART_COLORS.up,
                borderDownColor: CHART_COLORS.down,
                wickUpColor: CHART_COLORS.up,
                wickDownColor: CHART_COLORS.down,
            });

            const candleData: CandlestickData[] = processedData.map((d) => ({
                time: d.time as Time,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
            }));

            candlestickSeries.setData(candleData);
        } else {
            // Using new v5 API: addSeries with LineSeries
            const lineSeries = chart.addSeries(LineSeries, {
                color: CHART_COLORS.line,
                lineWidth: 2,
            });

            const lineData: LineData[] = processedData.map((d) => ({
                time: d.time as Time,
                value: d.close,
            }));

            lineSeries.setData(lineData);
        }

        chart.timeScale().fitContent();

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [data, chartType]);

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
        </div>
    );
}
