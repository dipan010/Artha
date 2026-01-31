import { NextResponse } from 'next/server';
import { getHolidaysForMonth, getUpcomingHolidays, MarketHoliday } from '@/lib/holidays';

interface CalendarEvent {
    date: string;
    type: 'holiday' | 'earnings' | 'ipo' | 'dividend';
    title: string;
    description?: string;
    symbol?: string;
}

// Mock earnings dates (in real app, fetch from an earnings API)
const MOCK_EARNINGS: CalendarEvent[] = [
    { date: '2026-02-05', type: 'earnings', title: 'TCS Q3 Results', symbol: 'TCS.NS' },
    { date: '2026-02-08', type: 'earnings', title: 'Infosys Q3 Results', symbol: 'INFY.NS' },
    { date: '2026-02-12', type: 'earnings', title: 'HDFC Bank Q3 Results', symbol: 'HDFCBANK.NS' },
    { date: '2026-02-15', type: 'earnings', title: 'Reliance Q3 Results', symbol: 'RELIANCE.NS' },
    { date: '2026-02-18', type: 'earnings', title: 'ICICI Bank Q3 Results', symbol: 'ICICIBANK.NS' },
];

// Mock IPO calendar
const MOCK_IPOS: CalendarEvent[] = [
    { date: '2026-02-10', type: 'ipo', title: 'Tech Startup Ltd. IPO', description: 'Price Band: ₹350-380' },
    { date: '2026-02-20', type: 'ipo', title: 'Green Energy Corp. IPO', description: 'Price Band: ₹500-525' },
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    const mode = searchParams.get('mode') || 'month'; // 'month' or 'upcoming'

    try {
        const events: CalendarEvent[] = [];

        if (mode === 'upcoming') {
            // Get upcoming holidays
            const upcomingHolidays = getUpcomingHolidays(10);
            upcomingHolidays.forEach(h => {
                events.push({
                    date: h.date,
                    type: 'holiday',
                    title: h.name,
                    description: `Market closed - ${h.markets.join(' & ')}`,
                });
            });

            // Add mock earnings and IPOs that are upcoming
            const today = new Date().toISOString().split('T')[0];
            MOCK_EARNINGS.filter(e => e.date >= today).forEach(e => events.push(e));
            MOCK_IPOS.filter(e => e.date >= today).forEach(e => events.push(e));
        } else {
            // Get events for specific month
            const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
            const month = monthParam ? parseInt(monthParam) : new Date().getMonth();

            // Add holidays
            const monthHolidays = getHolidaysForMonth(year, month);
            monthHolidays.forEach(h => {
                events.push({
                    date: h.date,
                    type: 'holiday',
                    title: h.name,
                    description: `Market closed - ${h.markets.join(' & ')}`,
                });
            });

            // Add mock earnings for the month
            const monthStr = String(month + 1).padStart(2, '0');
            MOCK_EARNINGS
                .filter(e => {
                    const [eYear, eMonth] = e.date.split('-');
                    return parseInt(eYear) === year && eMonth === monthStr;
                })
                .forEach(e => events.push(e));

            // Add mock IPOs for the month
            MOCK_IPOS
                .filter(e => {
                    const [eYear, eMonth] = e.date.split('-');
                    return parseInt(eYear) === year && eMonth === monthStr;
                })
                .forEach(e => events.push(e));
        }

        // Sort by date
        events.sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
            events,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error in calendar API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch calendar data' },
            { status: 500 }
        );
    }
}
