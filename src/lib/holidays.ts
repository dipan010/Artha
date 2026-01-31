// NSE/BSE Trading Holidays for 2024-2026

export interface MarketHoliday {
    date: string; // YYYY-MM-DD format
    name: string;
    type: 'national' | 'exchange';
    markets: ('NSE' | 'BSE')[];
}

// 2024 Holidays (for reference)
export const HOLIDAYS_2024: MarketHoliday[] = [
    { date: '2024-01-26', name: 'Republic Day', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2024-03-08', name: 'Maha Shivaratri', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2024-03-25', name: 'Holi', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2024-03-29', name: 'Good Friday', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2024-04-11', name: 'Id-Ul-Fitr (Ramadan)', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2024-04-14', name: 'Dr. Ambedkar Jayanti', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2024-04-17', name: 'Ram Navami', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2024-04-21', name: 'Mahavir Jayanti', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2024-05-01', name: 'Maharashtra Day', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2024-05-23', name: 'Buddha Purnima', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2024-06-17', name: 'Bakri Id', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2024-07-17', name: 'Muharram', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2024-08-15', name: 'Independence Day', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2024-10-02', name: 'Mahatma Gandhi Jayanti', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2024-11-01', name: 'Diwali Laxmi Puja', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2024-11-15', name: 'Guru Nanak Jayanti', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2024-12-25', name: 'Christmas', type: 'national', markets: ['NSE', 'BSE'] },
];

// 2025 Holidays
export const HOLIDAYS_2025: MarketHoliday[] = [
    { date: '2025-01-26', name: 'Republic Day', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-02-26', name: 'Maha Shivaratri', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-03-14', name: 'Holi', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-03-31', name: 'Id-Ul-Fitr (Ramadan)', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-04-06', name: 'Ram Navami', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-04-10', name: 'Mahavir Jayanti', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-04-14', name: 'Dr. Ambedkar Jayanti', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-04-18', name: 'Good Friday', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-05-01', name: 'Maharashtra Day', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-05-12', name: 'Buddha Purnima', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-06-07', name: 'Bakri Id', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-07-06', name: 'Muharram', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-08-15', name: 'Independence Day', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-08-16', name: 'Parsi New Year', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-09-05', name: 'Milad-Un-Nabi', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-10-02', name: 'Mahatma Gandhi Jayanti / Dussehra', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-10-21', name: 'Diwali Laxmi Puja', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-10-22', name: 'Diwali Balipratipada', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-11-05', name: 'Guru Nanak Jayanti', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2025-12-25', name: 'Christmas', type: 'national', markets: ['NSE', 'BSE'] },
];

// 2026 Holidays
export const HOLIDAYS_2026: MarketHoliday[] = [
    { date: '2026-01-26', name: 'Republic Day', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2026-02-17', name: 'Maha Shivaratri', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2026-03-03', name: 'Holi', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2026-03-20', name: 'Id-Ul-Fitr (Ramadan)', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2026-03-26', name: 'Ram Navami', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2026-03-31', name: 'Mahavir Jayanti', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2026-04-03', name: 'Good Friday', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2026-04-14', name: 'Dr. Ambedkar Jayanti', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2026-05-01', name: 'Maharashtra Day / Buddha Purnima', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2026-05-27', name: 'Bakri Id', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2026-06-25', name: 'Muharram', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2026-08-15', name: 'Independence Day', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2026-08-25', name: 'Milad-Un-Nabi', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2026-10-02', name: 'Mahatma Gandhi Jayanti', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2026-10-20', name: 'Dussehra', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2026-11-09', name: 'Diwali Laxmi Puja', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2026-11-10', name: 'Diwali Balipratipada', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2026-11-24', name: 'Guru Nanak Jayanti', type: 'national', markets: ['NSE', 'BSE'] },
    { date: '2026-12-25', name: 'Christmas', type: 'national', markets: ['NSE', 'BSE'] },
];

// All holidays combined
export const ALL_HOLIDAYS: MarketHoliday[] = [
    ...HOLIDAYS_2024,
    ...HOLIDAYS_2025,
    ...HOLIDAYS_2026,
];

export function getHolidaysForMonth(year: number, month: number): MarketHoliday[] {
    const monthStr = String(month + 1).padStart(2, '0');
    return ALL_HOLIDAYS.filter(h => {
        const [hYear, hMonth] = h.date.split('-');
        return parseInt(hYear) === year && hMonth === monthStr;
    });
}

export function getUpcomingHolidays(limit: number = 5): MarketHoliday[] {
    const today = new Date().toISOString().split('T')[0];
    return ALL_HOLIDAYS
        .filter(h => h.date >= today)
        .slice(0, limit);
}

export function isMarketHoliday(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0];
    return ALL_HOLIDAYS.some(h => h.date === dateStr);
}

export function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
}

export function isMarketOpen(date: Date = new Date()): boolean {
    if (isWeekend(date)) return false;
    if (isMarketHoliday(date)) return false;

    // Check market hours (9:15 AM - 3:30 PM IST)
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    const marketOpen = 9 * 60 + 15;  // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM

    return totalMinutes >= marketOpen && totalMinutes <= marketClose;
}
