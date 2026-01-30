// Indian stock market sector definitions with representative stocks

export interface SectorStock {
    symbol: string;
    name: string;
    weight: number; // Market cap weight within sector (0-1)
}

export interface Sector {
    id: string;
    name: string;
    icon: string;
    stocks: SectorStock[];
}

export const SECTORS: Sector[] = [
    {
        id: 'it',
        name: 'Information Technology',
        icon: '💻',
        stocks: [
            { symbol: 'TCS.NS', name: 'TCS', weight: 0.35 },
            { symbol: 'INFY.NS', name: 'Infosys', weight: 0.25 },
            { symbol: 'HCLTECH.NS', name: 'HCL Tech', weight: 0.15 },
            { symbol: 'WIPRO.NS', name: 'Wipro', weight: 0.12 },
            { symbol: 'TECHM.NS', name: 'Tech Mahindra', weight: 0.08 },
            { symbol: 'LTIM.NS', name: 'LTIMindtree', weight: 0.05 },
        ],
    },
    {
        id: 'banking',
        name: 'Banking',
        icon: '🏦',
        stocks: [
            { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', weight: 0.30 },
            { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', weight: 0.25 },
            { symbol: 'SBIN.NS', name: 'SBI', weight: 0.20 },
            { symbol: 'KOTAKBANK.NS', name: 'Kotak Bank', weight: 0.12 },
            { symbol: 'AXISBANK.NS', name: 'Axis Bank', weight: 0.08 },
            { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank', weight: 0.05 },
        ],
    },
    {
        id: 'pharma',
        name: 'Pharmaceuticals',
        icon: '💊',
        stocks: [
            { symbol: 'SUNPHARMA.NS', name: 'Sun Pharma', weight: 0.30 },
            { symbol: 'DRREDDY.NS', name: 'Dr Reddys', weight: 0.20 },
            { symbol: 'CIPLA.NS', name: 'Cipla', weight: 0.18 },
            { symbol: 'DIVISLAB.NS', name: 'Divis Labs', weight: 0.15 },
            { symbol: 'APOLLOHOSP.NS', name: 'Apollo Hospitals', weight: 0.10 },
            { symbol: 'BIOCON.NS', name: 'Biocon', weight: 0.07 },
        ],
    },
    {
        id: 'auto',
        name: 'Automobile',
        icon: '🚗',
        stocks: [
            { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', weight: 0.25 },
            { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', weight: 0.22 },
            { symbol: 'M&M.NS', name: 'Mahindra', weight: 0.20 },
            { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto', weight: 0.15 },
            { symbol: 'EICHERMOT.NS', name: 'Eicher Motors', weight: 0.10 },
            { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp', weight: 0.08 },
        ],
    },
    {
        id: 'energy',
        name: 'Energy',
        icon: '⚡',
        stocks: [
            { symbol: 'RELIANCE.NS', name: 'Reliance', weight: 0.40 },
            { symbol: 'ONGC.NS', name: 'ONGC', weight: 0.18 },
            { symbol: 'NTPC.NS', name: 'NTPC', weight: 0.15 },
            { symbol: 'POWERGRID.NS', name: 'Power Grid', weight: 0.12 },
            { symbol: 'ADANIGREEN.NS', name: 'Adani Green', weight: 0.08 },
            { symbol: 'TATAPOWER.NS', name: 'Tata Power', weight: 0.07 },
        ],
    },
    {
        id: 'fmcg',
        name: 'FMCG',
        icon: '🛒',
        stocks: [
            { symbol: 'HINDUNILVR.NS', name: 'HUL', weight: 0.30 },
            { symbol: 'ITC.NS', name: 'ITC', weight: 0.25 },
            { symbol: 'NESTLEIND.NS', name: 'Nestle India', weight: 0.18 },
            { symbol: 'BRITANNIA.NS', name: 'Britannia', weight: 0.12 },
            { symbol: 'DABUR.NS', name: 'Dabur', weight: 0.08 },
            { symbol: 'GODREJCP.NS', name: 'Godrej CP', weight: 0.07 },
        ],
    },
    {
        id: 'metals',
        name: 'Metals & Mining',
        icon: '⛏️',
        stocks: [
            { symbol: 'TATASTEEL.NS', name: 'Tata Steel', weight: 0.28 },
            { symbol: 'HINDALCO.NS', name: 'Hindalco', weight: 0.22 },
            { symbol: 'JSWSTEEL.NS', name: 'JSW Steel', weight: 0.20 },
            { symbol: 'COALINDIA.NS', name: 'Coal India', weight: 0.15 },
            { symbol: 'VEDL.NS', name: 'Vedanta', weight: 0.10 },
            { symbol: 'NMDC.NS', name: 'NMDC', weight: 0.05 },
        ],
    },
    {
        id: 'realty',
        name: 'Real Estate',
        icon: '🏢',
        stocks: [
            { symbol: 'DLF.NS', name: 'DLF', weight: 0.30 },
            { symbol: 'GODREJPROP.NS', name: 'Godrej Properties', weight: 0.22 },
            { symbol: 'OBEROIRLTY.NS', name: 'Oberoi Realty', weight: 0.18 },
            { symbol: 'PHOENIXLTD.NS', name: 'Phoenix Mills', weight: 0.15 },
            { symbol: 'PRESTIGE.NS', name: 'Prestige Estates', weight: 0.10 },
            { symbol: 'BRIGADE.NS', name: 'Brigade Enterprises', weight: 0.05 },
        ],
    },
    {
        id: 'infra',
        name: 'Infrastructure',
        icon: '🏗️',
        stocks: [
            { symbol: 'LT.NS', name: 'L&T', weight: 0.35 },
            { symbol: 'ADANIPORTS.NS', name: 'Adani Ports', weight: 0.20 },
            { symbol: 'ULTRACEMCO.NS', name: 'UltraTech', weight: 0.18 },
            { symbol: 'GRASIM.NS', name: 'Grasim', weight: 0.12 },
            { symbol: 'SHREECEM.NS', name: 'Shree Cement', weight: 0.08 },
            { symbol: 'ACC.NS', name: 'ACC', weight: 0.07 },
        ],
    },
    {
        id: 'telecom',
        name: 'Telecom',
        icon: '📱',
        stocks: [
            { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', weight: 0.50 },
            { symbol: 'IDEA.NS', name: 'Vodafone Idea', weight: 0.25 },
            { symbol: 'INDUSTOWER.NS', name: 'Indus Towers', weight: 0.15 },
            { symbol: 'TATACOMM.NS', name: 'Tata Comm', weight: 0.10 },
        ],
    },
    {
        id: 'finance',
        name: 'Financial Services',
        icon: '💰',
        stocks: [
            { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', weight: 0.30 },
            { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv', weight: 0.20 },
            { symbol: 'SBILIFE.NS', name: 'SBI Life', weight: 0.15 },
            { symbol: 'HDFCLIFE.NS', name: 'HDFC Life', weight: 0.15 },
            { symbol: 'ICICIGI.NS', name: 'ICICI Lombard', weight: 0.10 },
            { symbol: 'MUTHOOTFIN.NS', name: 'Muthoot Finance', weight: 0.10 },
        ],
    },
    {
        id: 'consumer',
        name: 'Consumer Durables',
        icon: '📺',
        stocks: [
            { symbol: 'TITAN.NS', name: 'Titan', weight: 0.35 },
            { symbol: 'HAVELLS.NS', name: 'Havells', weight: 0.20 },
            { symbol: 'VOLTAS.NS', name: 'Voltas', weight: 0.15 },
            { symbol: 'BLUESTARCO.NS', name: 'Blue Star', weight: 0.10 },
            { symbol: 'CROMPTON.NS', name: 'Crompton', weight: 0.10 },
            { symbol: 'DIXON.NS', name: 'Dixon Tech', weight: 0.10 },
        ],
    },
];

export function getSectorById(id: string): Sector | undefined {
    return SECTORS.find(s => s.id === id);
}

export function getAllSectorIds(): string[] {
    return SECTORS.map(s => s.id);
}
