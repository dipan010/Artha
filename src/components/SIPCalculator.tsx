'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Calculator, TrendingUp, Calendar, Target, RefreshCw,
    IndianRupee, Percent, ArrowRight, BarChart3, PieChart
} from 'lucide-react';
import { createChart, IChartApi, AreaSeries, LineSeries } from 'lightweight-charts';

interface SIPResult {
    totalInvestment: number;
    expectedReturns: number;
    futureValue: number;
    monthlyData: Array<{
        month: number;
        date: Date;
        invested: number;
        value: number;
    }>;
}

interface StepUpSIPResult extends SIPResult {
    stepUpAmount: number;
}

// SIP calculation function
function calculateSIP(
    monthlyInvestment: number,
    annualRate: number,
    years: number
): SIPResult {
    const monthlyRate = annualRate / 100 / 12;
    const months = years * 12;
    const monthlyData: SIPResult['monthlyData'] = [];

    let totalValue = 0;
    let totalInvestment = 0;

    for (let i = 1; i <= months; i++) {
        totalInvestment += monthlyInvestment;
        totalValue = (totalValue + monthlyInvestment) * (1 + monthlyRate);

        const date = new Date();
        date.setMonth(date.getMonth() + i);

        monthlyData.push({
            month: i,
            date,
            invested: totalInvestment,
            value: totalValue,
        });
    }

    return {
        totalInvestment,
        expectedReturns: totalValue - totalInvestment,
        futureValue: totalValue,
        monthlyData,
    };
}

// Step-up SIP calculation (annual increase in SIP amount)
function calculateStepUpSIP(
    monthlyInvestment: number,
    annualRate: number,
    years: number,
    stepUpPercent: number
): StepUpSIPResult {
    const monthlyRate = annualRate / 100 / 12;
    const months = years * 12;
    const monthlyData: SIPResult['monthlyData'] = [];

    let totalValue = 0;
    let totalInvestment = 0;
    let currentSIP = monthlyInvestment;

    for (let i = 1; i <= months; i++) {
        // Increase SIP at the start of each year
        if (i > 1 && (i - 1) % 12 === 0) {
            currentSIP = currentSIP * (1 + stepUpPercent / 100);
        }

        totalInvestment += currentSIP;
        totalValue = (totalValue + currentSIP) * (1 + monthlyRate);

        const date = new Date();
        date.setMonth(date.getMonth() + i);

        monthlyData.push({
            month: i,
            date,
            invested: totalInvestment,
            value: totalValue,
        });
    }

    return {
        totalInvestment,
        expectedReturns: totalValue - totalInvestment,
        futureValue: totalValue,
        monthlyData,
        stepUpAmount: currentSIP - monthlyInvestment,
    };
}

// Lumpsum calculation for comparison
function calculateLumpsum(
    principalAmount: number,
    annualRate: number,
    years: number
): { futureValue: number; returns: number } {
    const futureValue = principalAmount * Math.pow(1 + annualRate / 100, years);
    return {
        futureValue,
        returns: futureValue - principalAmount,
    };
}

// Goal-based calculation (required SIP for target)
function calculateRequiredSIP(
    targetAmount: number,
    annualRate: number,
    years: number
): number {
    const monthlyRate = annualRate / 100 / 12;
    const months = years * 12;

    // Formula: PMT = FV / [((1 + r)^n - 1) / r * (1 + r)]
    const factor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate * (1 + monthlyRate);
    return targetAmount / factor;
}

export default function SIPCalculator() {
    // Input state
    const [monthlyAmount, setMonthlyAmount] = useState(10000);
    const [expectedReturn, setExpectedReturn] = useState(12);
    const [duration, setDuration] = useState(10);
    const [stepUpPercent, setStepUpPercent] = useState(10);
    const [enableStepUp, setEnableStepUp] = useState(false);
    const [mode, setMode] = useState<'calculator' | 'goal'>('calculator');
    const [targetAmount, setTargetAmount] = useState(1000000);

    // Results
    const [sipResult, setSipResult] = useState<SIPResult | null>(null);
    const [stepUpResult, setStepUpResult] = useState<StepUpSIPResult | null>(null);
    const [lumpsumComparison, setLumpsumComparison] = useState<{ futureValue: number; returns: number } | null>(null);
    const [requiredSIP, setRequiredSIP] = useState<number | null>(null);

    // Chart
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    // Calculate results
    useEffect(() => {
        if (mode === 'calculator') {
            const result = calculateSIP(monthlyAmount, expectedReturn, duration);
            setSipResult(result);

            if (enableStepUp) {
                const stepUpRes = calculateStepUpSIP(monthlyAmount, expectedReturn, duration, stepUpPercent);
                setStepUpResult(stepUpRes);
            } else {
                setStepUpResult(null);
            }

            // Calculate lumpsum equivalent
            const totalInvested = monthlyAmount * duration * 12;
            const lumpsum = calculateLumpsum(totalInvested, expectedReturn, duration);
            setLumpsumComparison(lumpsum);
        } else {
            // Goal mode - calculate required SIP
            const required = calculateRequiredSIP(targetAmount, expectedReturn, duration);
            setRequiredSIP(required);

            const result = calculateSIP(required, expectedReturn, duration);
            setSipResult(result);
        }
    }, [monthlyAmount, expectedReturn, duration, stepUpPercent, enableStepUp, mode, targetAmount]);

    // Create/update chart
    useEffect(() => {
        if (!chartContainerRef.current || !sipResult) return;

        // Cleanup previous chart
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: 'transparent' },
                textColor: '#9ca3af',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 300,
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
        });

        chartRef.current = chart;

        // Add value line
        const valueSeries = chart.addSeries(AreaSeries, {
            lineColor: '#22c55e',
            topColor: 'rgba(34, 197, 94, 0.4)',
            bottomColor: 'rgba(34, 197, 94, 0.0)',
            lineWidth: 2,
        });

        // Add invested line
        const investedSeries = chart.addSeries(LineSeries, {
            color: '#6366f1',
            lineWidth: 2,
            lineStyle: 2, // Dashed
        });

        // Prepare data
        const valueData = sipResult.monthlyData.map(d => ({
            time: d.date.toISOString().split('T')[0],
            value: d.value,
        }));

        const investedData = sipResult.monthlyData.map(d => ({
            time: d.date.toISOString().split('T')[0],
            value: d.invested,
        }));

        valueSeries.setData(valueData as any);
        investedSeries.setData(investedData as any);

        // Add step-up line if enabled
        if (enableStepUp && stepUpResult) {
            const stepUpSeries = chart.addSeries(LineSeries, {
                color: '#f59e0b',
                lineWidth: 2,
            });

            const stepUpData = stepUpResult.monthlyData.map(d => ({
                time: d.date.toISOString().split('T')[0],
                value: d.value,
            }));

            stepUpSeries.setData(stepUpData as any);
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
    }, [sipResult, enableStepUp, stepUpResult]);

    // Format currency
    const formatCurrency = (value: number) => {
        if (value >= 10000000) {
            return `₹${(value / 10000000).toFixed(2)} Cr`;
        }
        if (value >= 100000) {
            return `₹${(value / 100000).toFixed(2)} L`;
        }
        return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    };

    return (
        <div className="sip-calculator">
            {/* Header */}
            <div className="sip-header">
                <div className="sip-title">
                    <Calculator size={20} />
                    <h2>SIP Calculator</h2>
                </div>
                <div className="sip-mode-toggle">
                    <button
                        className={mode === 'calculator' ? 'active' : ''}
                        onClick={() => setMode('calculator')}
                    >
                        <Calculator size={14} />
                        Calculator
                    </button>
                    <button
                        className={mode === 'goal' ? 'active' : ''}
                        onClick={() => setMode('goal')}
                    >
                        <Target size={14} />
                        Goal Planner
                    </button>
                </div>
            </div>

            <div className="sip-content">
                {/* Input Section */}
                <div className="sip-inputs">
                    {mode === 'calculator' ? (
                        <div className="input-group">
                            <label>
                                <IndianRupee size={14} />
                                Monthly Investment
                            </label>
                            <div className="input-with-slider">
                                <input
                                    type="number"
                                    value={monthlyAmount}
                                    onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                                    min={500}
                                    max={1000000}
                                />
                                <input
                                    type="range"
                                    value={monthlyAmount}
                                    onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                                    min={500}
                                    max={100000}
                                    step={500}
                                />
                            </div>
                            <span className="input-value">{formatCurrency(monthlyAmount)}</span>
                        </div>
                    ) : (
                        <div className="input-group">
                            <label>
                                <Target size={14} />
                                Target Amount
                            </label>
                            <div className="input-with-slider">
                                <input
                                    type="number"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                                    min={100000}
                                    max={100000000}
                                />
                                <input
                                    type="range"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                                    min={100000}
                                    max={10000000}
                                    step={100000}
                                />
                            </div>
                            <span className="input-value">{formatCurrency(targetAmount)}</span>
                        </div>
                    )}

                    <div className="input-group">
                        <label>
                            <Percent size={14} />
                            Expected Return (p.a.)
                        </label>
                        <div className="input-with-slider">
                            <input
                                type="number"
                                value={expectedReturn}
                                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                                min={1}
                                max={30}
                                step={0.5}
                            />
                            <input
                                type="range"
                                value={expectedReturn}
                                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                                min={1}
                                max={30}
                                step={0.5}
                            />
                        </div>
                        <span className="input-value">{expectedReturn}%</span>
                    </div>

                    <div className="input-group">
                        <label>
                            <Calendar size={14} />
                            Investment Duration
                        </label>
                        <div className="input-with-slider">
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                min={1}
                                max={40}
                            />
                            <input
                                type="range"
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                min={1}
                                max={40}
                            />
                        </div>
                        <span className="input-value">{duration} years</span>
                    </div>

                    {mode === 'calculator' && (
                        <div className="input-group step-up">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={enableStepUp}
                                    onChange={(e) => setEnableStepUp(e.target.checked)}
                                />
                                Enable Step-Up SIP
                            </label>
                            {enableStepUp && (
                                <div className="step-up-slider">
                                    <span>Annual Increase: {stepUpPercent}%</span>
                                    <input
                                        type="range"
                                        value={stepUpPercent}
                                        onChange={(e) => setStepUpPercent(Number(e.target.value))}
                                        min={5}
                                        max={25}
                                        step={1}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Results Section */}
                {sipResult && (
                    <div className="sip-results">
                        {mode === 'goal' && requiredSIP && (
                            <div className="goal-result">
                                <div className="goal-banner">
                                    <Target size={24} />
                                    <div>
                                        <span>Required Monthly SIP</span>
                                        <strong>{formatCurrency(requiredSIP)}</strong>
                                    </div>
                                </div>
                                <p>
                                    To reach your goal of {formatCurrency(targetAmount)} in {duration} years,
                                    invest {formatCurrency(requiredSIP)} monthly.
                                </p>
                            </div>
                        )}

                        <div className="result-cards">
                            <div className="result-card invested">
                                <span className="result-label">Total Investment</span>
                                <span className="result-value">{formatCurrency(sipResult.totalInvestment)}</span>
                            </div>
                            <div className="result-card returns">
                                <span className="result-label">Expected Returns</span>
                                <span className="result-value positive">{formatCurrency(sipResult.expectedReturns)}</span>
                            </div>
                            <div className="result-card future">
                                <span className="result-label">Future Value</span>
                                <span className="result-value">{formatCurrency(sipResult.futureValue)}</span>
                            </div>
                        </div>

                        {enableStepUp && stepUpResult && (
                            <div className="step-up-comparison">
                                <h4>
                                    <TrendingUp size={16} />
                                    With Step-Up SIP
                                </h4>
                                <div className="comparison-row">
                                    <span>Future Value:</span>
                                    <span className="positive">{formatCurrency(stepUpResult.futureValue)}</span>
                                </div>
                                <div className="comparison-row highlight">
                                    <span>Extra Wealth:</span>
                                    <span className="positive">
                                        +{formatCurrency(stepUpResult.futureValue - sipResult.futureValue)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {lumpsumComparison && mode === 'calculator' && (
                            <div className="lumpsum-comparison">
                                <h4>
                                    <BarChart3 size={16} />
                                    vs Lumpsum Investment
                                </h4>
                                <p className="comparison-note">
                                    If you invest {formatCurrency(sipResult.totalInvestment)} as lumpsum today:
                                </p>
                                <div className="comparison-row">
                                    <span>Lumpsum Future Value:</span>
                                    <span>{formatCurrency(lumpsumComparison.futureValue)}</span>
                                </div>
                                <div className="comparison-row">
                                    <span>Difference:</span>
                                    <span className={lumpsumComparison.futureValue > sipResult.futureValue ? 'positive' : 'negative'}>
                                        {lumpsumComparison.futureValue > sipResult.futureValue ? '+' : ''}
                                        {formatCurrency(lumpsumComparison.futureValue - sipResult.futureValue)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Chart */}
                        <div className="sip-chart">
                            <h4>
                                <BarChart3 size={16} />
                                Growth Projection
                            </h4>
                            <div className="chart-legend">
                                <span className="legend-item">
                                    <span className="legend-color invested"></span>
                                    Invested
                                </span>
                                <span className="legend-item">
                                    <span className="legend-color value"></span>
                                    Total Value
                                </span>
                                {enableStepUp && (
                                    <span className="legend-item">
                                        <span className="legend-color stepup"></span>
                                        Step-Up SIP
                                    </span>
                                )}
                            </div>
                            <div ref={chartContainerRef} className="chart-container" />
                        </div>

                        {/* Breakdown */}
                        <div className="sip-breakdown">
                            <h4>Year-wise Breakdown</h4>
                            <div className="breakdown-table">
                                <div className="breakdown-header">
                                    <span>Year</span>
                                    <span>Invested</span>
                                    <span>Value</span>
                                    <span>Returns</span>
                                </div>
                                {[...Array(duration)].map((_, i) => {
                                    const yearData = sipResult.monthlyData[(i + 1) * 12 - 1];
                                    if (!yearData) return null;
                                    return (
                                        <div key={i} className="breakdown-row">
                                            <span>Year {i + 1}</span>
                                            <span>{formatCurrency(yearData.invested)}</span>
                                            <span>{formatCurrency(yearData.value)}</span>
                                            <span className="positive">
                                                {formatCurrency(yearData.value - yearData.invested)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
