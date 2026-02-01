import { NextRequest, NextResponse } from 'next/server';
import type { MutualFund, MutualFundCategory } from '@/types/mutualFunds';

// Mock mutual fund data for Indian market
const MOCK_MUTUAL_FUNDS: MutualFund[] = [
    {
        id: '1',
        name: 'SBI Bluechip Fund - Direct Growth',
        category: 'large_cap',
        amc: 'SBI Mutual Fund',
        nav: 82.45,
        navDate: new Date(),
        returns: {
            oneMonth: 2.5,
            threeMonth: 5.8,
            sixMonth: 12.3,
            oneYear: 18.5,
            threeYear: 14.2,
            fiveYear: 12.8,
        },
        aum: 45823,
        expenseRatio: 0.92,
        riskLevel: 'moderately_high',
        rating: 4,
        minInvestment: 500,
        exitLoad: '1% if redeemed within 1 year',
        benchmark: 'S&P BSE 100',
    },
    {
        id: '2',
        name: 'HDFC Mid-Cap Opportunities - Direct Growth',
        category: 'mid_cap',
        amc: 'HDFC Mutual Fund',
        nav: 134.67,
        navDate: new Date(),
        returns: {
            oneMonth: 3.2,
            threeMonth: 8.4,
            sixMonth: 18.7,
            oneYear: 28.3,
            threeYear: 22.5,
            fiveYear: 18.9,
        },
        aum: 52341,
        expenseRatio: 1.05,
        riskLevel: 'high',
        rating: 5,
        minInvestment: 500,
        exitLoad: '1% if redeemed within 1 year',
        benchmark: 'NIFTY Midcap 100',
    },
    {
        id: '3',
        name: 'Axis Small Cap Fund - Direct Growth',
        category: 'small_cap',
        amc: 'Axis Mutual Fund',
        nav: 95.23,
        navDate: new Date(),
        returns: {
            oneMonth: 4.1,
            threeMonth: 12.3,
            sixMonth: 24.5,
            oneYear: 35.2,
            threeYear: 28.4,
            fiveYear: 22.1,
        },
        aum: 18456,
        expenseRatio: 0.89,
        riskLevel: 'very_high',
        rating: 5,
        minInvestment: 500,
        exitLoad: '1% if redeemed within 1 year',
        benchmark: 'NIFTY Smallcap 100',
    },
    {
        id: '4',
        name: 'Mirae Asset ELSS Tax Saver - Direct Growth',
        category: 'elss',
        amc: 'Mirae Asset',
        nav: 42.56,
        navDate: new Date(),
        returns: {
            oneMonth: 2.8,
            threeMonth: 7.2,
            sixMonth: 15.4,
            oneYear: 24.1,
            threeYear: 18.6,
            fiveYear: 16.3,
        },
        aum: 22789,
        expenseRatio: 0.55,
        riskLevel: 'moderately_high',
        rating: 5,
        minInvestment: 500,
        exitLoad: 'Nil (3-year lock-in)',
        benchmark: 'NIFTY 200',
    },
    {
        id: '5',
        name: 'UTI Nifty 50 Index Fund - Direct Growth',
        category: 'index',
        amc: 'UTI Mutual Fund',
        nav: 156.78,
        navDate: new Date(),
        returns: {
            oneMonth: 2.2,
            threeMonth: 5.5,
            sixMonth: 10.8,
            oneYear: 16.4,
            threeYear: 12.8,
            fiveYear: 11.5,
        },
        aum: 15234,
        expenseRatio: 0.10,
        riskLevel: 'moderately_high',
        rating: 4,
        minInvestment: 100,
        exitLoad: 'Nil',
        benchmark: 'NIFTY 50',
    },
    {
        id: '6',
        name: 'ICICI Pru Balanced Advantage - Direct Growth',
        category: 'hybrid',
        amc: 'ICICI Prudential',
        nav: 61.34,
        navDate: new Date(),
        returns: {
            oneMonth: 1.8,
            threeMonth: 4.2,
            sixMonth: 8.5,
            oneYear: 12.7,
            threeYear: 10.4,
            fiveYear: 9.8,
        },
        aum: 62145,
        expenseRatio: 0.98,
        riskLevel: 'moderate',
        rating: 4,
        minInvestment: 500,
        exitLoad: '1% if redeemed within 1 year',
        benchmark: 'NIFTY 50 Hybrid Composite Debt 65:35',
    },
    {
        id: '7',
        name: 'Kotak Debt Hybrid Fund - Direct Growth',
        category: 'debt',
        amc: 'Kotak Mutual Fund',
        nav: 48.92,
        navDate: new Date(),
        returns: {
            oneMonth: 0.8,
            threeMonth: 2.4,
            sixMonth: 5.1,
            oneYear: 8.2,
            threeYear: 7.5,
            fiveYear: 7.1,
        },
        aum: 8456,
        expenseRatio: 0.65,
        riskLevel: 'low',
        rating: 3,
        minInvestment: 500,
        exitLoad: 'Nil',
        benchmark: 'CRISIL Hybrid 75+25',
    },
    {
        id: '8',
        name: 'Nippon India Pharma Fund - Direct Growth',
        category: 'sectoral',
        amc: 'Nippon India',
        nav: 315.67,
        navDate: new Date(),
        returns: {
            oneMonth: 5.2,
            threeMonth: 15.4,
            sixMonth: 28.3,
            oneYear: 42.1,
            threeYear: 18.2,
            fiveYear: 14.6,
        },
        aum: 7823,
        expenseRatio: 1.12,
        riskLevel: 'very_high',
        rating: 4,
        minInvestment: 500,
        exitLoad: '1% if redeemed within 30 days',
        benchmark: 'S&P BSE Healthcare',
    },
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') as MutualFundCategory | null;
        const sortBy = searchParams.get('sortBy') || 'oneYear';
        const riskLevel = searchParams.get('riskLevel');

        let filteredFunds = [...MOCK_MUTUAL_FUNDS];

        // Filter by category
        if (category) {
            filteredFunds = filteredFunds.filter(fund => fund.category === category);
        }

        // Filter by risk level
        if (riskLevel) {
            filteredFunds = filteredFunds.filter(fund => fund.riskLevel === riskLevel);
        }

        // Sort by returns
        filteredFunds.sort((a, b) => {
            const returnPeriod = sortBy as keyof MutualFund['returns'];
            const aReturn = a.returns[returnPeriod] || 0;
            const bReturn = b.returns[returnPeriod] || 0;
            return bReturn - aReturn;
        });

        return NextResponse.json({
            funds: filteredFunds,
            total: filteredFunds.length,
            lastUpdated: new Date(),
        });
    } catch (error) {
        console.error('Mutual funds API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch mutual funds' },
            { status: 500 }
        );
    }
}
