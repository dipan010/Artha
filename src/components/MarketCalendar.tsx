'use client';

import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, Clock, TrendingUp, Briefcase } from 'lucide-react';
import { isMarketOpen, isWeekend, isMarketHoliday } from '@/lib/holidays';

interface CalendarEvent {
    date: string;
    type: 'holiday' | 'earnings' | 'ipo' | 'dividend';
    title: string;
    description?: string;
    symbol?: string;
}

interface MarketCalendarProps {
    onSelectStock?: (symbol: string) => void;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MarketCalendar({ onSelectStock }: MarketCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [marketStatus, setMarketStatus] = useState({ isOpen: false, statusText: '' });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const fetchCalendarEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/calendar?year=${year}&month=${month}`);
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events);
            }
        } catch (error) {
            console.error('Error fetching calendar:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalendarEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year, month]);

    useEffect(() => {
        const updateMarketStatus = () => {
            const now = new Date();
            const open = isMarketOpen(now);

            if (isWeekend(now)) {
                setMarketStatus({ isOpen: false, statusText: 'Closed (Weekend)' });
            } else if (isMarketHoliday(now)) {
                setMarketStatus({ isOpen: false, statusText: 'Closed (Holiday)' });
            } else if (open) {
                setMarketStatus({ isOpen: true, statusText: 'Market Open' });
            } else {
                const hours = now.getHours();
                if (hours < 9) {
                    setMarketStatus({ isOpen: false, statusText: 'Pre-Market' });
                } else if (hours >= 16) {
                    setMarketStatus({ isOpen: false, statusText: 'After Hours' });
                } else {
                    setMarketStatus({ isOpen: false, statusText: 'Closed' });
                }
            }
        };

        updateMarketStatus();
        const interval = setInterval(updateMarketStatus, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const navigateMonth = (delta: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + delta);
            return newDate;
        });
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Generate calendar grid
    const generateCalendarDays = () => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDay = firstDay.getDay();
        const totalDays = lastDay.getDate();

        const days: (number | null)[] = [];

        // Add empty cells for days before the first of the month
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }

        // Add the days of the month
        for (let i = 1; i <= totalDays; i++) {
            days.push(i);
        }

        return days;
    };

    const getEventsForDay = (day: number): CalendarEvent[] => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => e.date === dateStr);
    };

    const isToday = (day: number): boolean => {
        const today = new Date();
        return day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
    };

    const isDayWeekend = (day: number): boolean => {
        const date = new Date(year, month, day);
        return isWeekend(date);
    };

    const getEventTypeIcon = (type: string) => {
        switch (type) {
            case 'holiday':
                return <Calendar size={10} />;
            case 'earnings':
                return <TrendingUp size={10} />;
            case 'ipo':
                return <Briefcase size={10} />;
            default:
                return null;
        }
    };

    const days = generateCalendarDays();

    return (
        <div className="market-calendar">
            {/* Header */}
            <div className="calendar-header">
                <div className="calendar-title">
                    <Calendar size={20} />
                    <h2>Market Calendar</h2>
                </div>
                <div className={`market-status ${marketStatus.isOpen ? 'open' : 'closed'}`}>
                    <Clock size={14} />
                    <span>{marketStatus.statusText}</span>
                </div>
            </div>

            {/* Navigation */}
            <div className="calendar-nav">
                <button onClick={() => navigateMonth(-1)} className="nav-btn" aria-label="Previous month">
                    <ChevronLeft size={18} />
                </button>
                <div className="current-month">
                    <h3>{MONTHS[month]} {year}</h3>
                    <button onClick={goToToday} className="today-btn">Today</button>
                </div>
                <button onClick={() => navigateMonth(1)} className="nav-btn" aria-label="Next month">
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Weekday Headers */}
            <div className="calendar-weekdays">
                {WEEKDAYS.map(day => (
                    <div key={day} className="weekday">{day}</div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="calendar-grid">
                {loading ? (
                    <div className="calendar-loading">
                        <div className="loading-spinner" />
                    </div>
                ) : (
                    days.map((day, index) => (
                        <div
                            key={index}
                            className={`calendar-day ${day === null ? 'empty' : ''
                                } ${day && isToday(day) ? 'today' : ''
                                } ${day && isDayWeekend(day) ? 'weekend' : ''
                                } ${day && getEventsForDay(day).length > 0 ? 'has-events' : ''
                                }`}
                        >
                            {day !== null && (
                                <>
                                    <span className="day-number">{day}</span>
                                    <div className="day-events">
                                        {getEventsForDay(day).slice(0, 2).map((event, i) => (
                                            <button
                                                key={i}
                                                className={`event-dot ${event.type}`}
                                                onClick={() => event.symbol && onSelectStock?.(event.symbol)}
                                                title={event.title}
                                            >
                                                {getEventTypeIcon(event.type)}
                                            </button>
                                        ))}
                                        {getEventsForDay(day).length > 2 && (
                                            <span className="more-events">+{getEventsForDay(day).length - 2}</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Legend */}
            <div className="calendar-legend">
                <div className="legend-item">
                    <span className="legend-dot holiday" />
                    <span>Holiday</span>
                </div>
                <div className="legend-item">
                    <span className="legend-dot earnings" />
                    <span>Earnings</span>
                </div>
                <div className="legend-item">
                    <span className="legend-dot ipo" />
                    <span>IPO</span>
                </div>
            </div>

            {/* Upcoming Events */}
            <div className="upcoming-events">
                <h4>Upcoming Events This Month</h4>
                {events.length > 0 ? (
                    <div className="events-list">
                        {events.slice(0, 5).map((event, index) => (
                            <button
                                key={index}
                                className={`event-item ${event.type}`}
                                onClick={() => event.symbol && onSelectStock?.(event.symbol)}
                            >
                                <div className="event-date">
                                    {new Date(event.date).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short'
                                    })}
                                </div>
                                <div className="event-info">
                                    <span className="event-title">{event.title}</span>
                                    {event.description && (
                                        <span className="event-desc">{event.description}</span>
                                    )}
                                </div>
                                <span className={`event-badge ${event.type}`}>{event.type}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="no-events">No upcoming events this month</p>
                )}
            </div>
        </div>
    );
}
