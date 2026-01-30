// Dividend related types for Indian stocks

export interface DividendData {
    symbol: string;
    name: string;
    price: number;
    dividendYield: number | null;
    dividendRate: number | null; // Annual dividend per share
    exDividendDate: string | null;
    paymentDate: string | null;
    dividendHistory: DividendPayment[];
    fiveYearAvgYield: number | null;
}

export interface DividendPayment {
    date: string;
    amount: number;
    type: 'interim' | 'final' | 'special';
}

export interface DividendCalendarEvent {
    symbol: string;
    name: string;
    exDate: string;
    amount: number | null;
    type: 'ex-date' | 'payment';
}

export interface PortfolioDividendSummary {
    totalAnnualDividend: number;
    averageYield: number;
    nextExDate: DividendCalendarEvent | null;
    upcomingPayments: DividendCalendarEvent[];
}
