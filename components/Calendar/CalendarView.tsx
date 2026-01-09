import { useMemo, useState } from "react";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, isBefore, isSameMonth } from "date-fns";
import { ChevronRight, ChevronDown, MapPin, Clock, Trash2, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Event {
    id: string;
    title: string;
    startDate: Date | string;
    city: string;
    venueId?: string | null;
    customLocation?: string | null;
}

interface CalendarViewProps {
    events: Event[];
    isLoading?: boolean;
    onRemove?: (eventId: string) => void;
    onSubscribeClick?: () => void;
}

export function CalendarView({ events, isLoading, onRemove, onSubscribeClick }: CalendarViewProps) {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Generate all months for current year  
    const allMonthsOfYear = useMemo(() => {
        return eachMonthOfInterval({
            start: new Date(currentYear, 0, 1), // Jan 1
            end: new Date(currentYear, 11, 31), // Dec 31
        });
    }, [currentYear]);

    // Group events by Month -> Date
    const groupedEvents = useMemo(() => {
        if (!events.length) return {};

        const groups: Record<string, Record<string, Event[]>> = {};

        // Sort events by date
        const sortedEvents = [...events].sort((a, b) => {
            const dateA = new Date(a.startDate).getTime();
            const dateB = new Date(b.startDate).getTime();
            return dateA - dateB;
        });

        sortedEvents.forEach((event) => {
            const date = new Date(event.startDate);
            const monthKey = format(date, "MMMM yyyy");
            const dayKey = format(date, "yyyy-MM-dd");

            if (!groups[monthKey]) {
                groups[monthKey] = {};
            }
            if (!groups[monthKey][dayKey]) {
                groups[monthKey][dayKey] = [];
            }
            groups[monthKey][dayKey].push(event);
        });

        return groups;
    }, [events]);

    // Get all unique months that have events (including past)
    const monthsWithEvents = useMemo(() => {
        const months = new Set<string>();
        events.forEach(event => {
            const date = new Date(event.startDate);
            months.add(format(date, "MMMM yyyy"));
        });
        return months;
    }, [events]);

    // Determine which months are past
    const isPastMonth = (monthDate: Date) => {
        return isBefore(endOfMonth(monthDate), startOfMonth(now));
    };

    // Track collapsed state for each month - past months start collapsed
    const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(() => {
        const collapsed = new Set<string>();
        // Collapse all past months by default
        Object.keys(groupedEvents).forEach(monthKey => {
            const monthDate = new Date(monthKey);
            if (isBefore(endOfMonth(monthDate), startOfMonth(now))) {
                collapsed.add(monthKey);
            }
        });
        return collapsed;
    });

    const toggleMonth = (monthKey: string) => {
        setCollapsedMonths(prev => {
            const next = new Set(prev);
            if (next.has(monthKey)) {
                next.delete(monthKey);
            } else {
                next.add(monthKey);
            }
            return next;
        });
    };

    // Get all months to display (past months with events + current year months)
    const displayMonths = useMemo(() => {
        const months: { date: Date; key: string; hasEvents: boolean; isPast: boolean }[] = [];

        // First, add past months with events (not in current year)
        events.forEach(event => {
            const eventDate = new Date(event.startDate);
            if (eventDate.getFullYear() < currentYear) {
                const monthKey = format(eventDate, "MMMM yyyy");
                if (!months.find(m => m.key === monthKey)) {
                    months.push({
                        date: startOfMonth(eventDate),
                        key: monthKey,
                        hasEvents: true,
                        isPast: true,
                    });
                }
            }
        });

        // Sort past months
        months.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Then add all months of current year
        allMonthsOfYear.forEach(monthDate => {
            const monthKey = format(monthDate, "MMMM yyyy");
            const hasEvents = monthsWithEvents.has(monthKey);
            const isPast = isPastMonth(monthDate);

            months.push({
                date: monthDate,
                key: monthKey,
                hasEvents,
                isPast,
            });
        });

        return months;
    }, [events, allMonthsOfYear, monthsWithEvents, currentYear]);

    if (isLoading) {
        return (
            <div className="w-full max-w-3xl mx-auto p-4 space-y-8 animate-pulse">
                {[1, 2].map((i) => (
                    <div key={i} className="space-y-4">
                        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                        {[1, 2, 3].map((j) => (
                            <div key={j} className="h-16 w-full bg-slate-100 dark:bg-slate-900 rounded-lg" />
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No upcoming events</h3>
                <p className="text-slate-500 max-w-md">
                    You haven&apos;t liked any events yet. Browse the map or feed to find interesting events to add to your calendar.
                </p>
                <Link
                    href="/"
                    className="mt-6 px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium hover:opacity-90 transition-opacity"
                >
                    Browse Events
                </Link>
            </div>
        );
    }

    // Get the first month with events to show as current header
    const currentActiveMonth = displayMonths.find(m => m.hasEvents && !collapsedMonths.has(m.key));

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Fixed Header Container */}
            <div className="sticky top-0 z-30 bg-white dark:bg-black">
                {/* Subscribe Button */}
                {onSubscribeClick && (
                    <div className="py-4 px-4 border-b border-slate-100 dark:border-slate-800">
                        <Button
                            onClick={onSubscribeClick}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-oredge hover:bg-brand-oredge/90 text-white rounded-full text-sm font-bold shadow-lg shadow-brand-oredge/20 transition-all hover:-translate-y-0.5"
                        >
                            <Calendar className="w-4 h-4" />
                            Subscribe to Calendar
                        </Button>
                    </div>
                )}

                {/* Month Navigation Bar */}
                <div className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap gap-2">
                        {displayMonths.map(({ date, key, hasEvents, isPast }) => {
                            const isCurrentMonth = isSameMonth(date, now);
                            const isCollapsed = collapsedMonths.has(key);

                            return (
                                <button
                                    key={key}
                                    onClick={() => hasEvents && toggleMonth(key)}
                                    disabled={!hasEvents}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1",
                                        hasEvents && isPast && "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer",
                                        hasEvents && !isPast && "bg-brand-oredge/20 text-brand-oredge border border-brand-oredge/30 hover:bg-brand-oredge/30 cursor-pointer",
                                        hasEvents && isCurrentMonth && "bg-brand-oredge text-white border-brand-oredge",
                                        !hasEvents && "bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50"
                                    )}
                                >
                                    {isPast && hasEvents && (
                                        isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                    )}
                                    {format(date, "MMM")}
                                    {date.getFullYear() !== currentYear && ` '${String(date.getFullYear()).slice(-2)}`}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Scrollable Events Content */}
            <div className="pb-20">
                {displayMonths.map(({ key, hasEvents, isPast }) => {
                    if (!hasEvents) return null;

                    const days = groupedEvents[key];
                    if (!days) return null;

                    const isCollapsed = collapsedMonths.has(key);

                    return (
                        <div key={key} className="mb-8 last:mb-0">
                            {/* Events - Collapsible for past months */}
                            {!isCollapsed && (
                                <div className="space-y-1">
                                    {Object.entries(days).map(([dayKey, dayEvents]) => {
                                        const date = parseISO(dayKey);
                                        const isToday = isSameDay(date, new Date());

                                        return (
                                            <div key={dayKey} className="group relative">
                                                {/* Day Header - minimalistic */}
                                                <div className="px-4 py-2 flex items-baseline gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                                                    <span className="text-lg font-bold text-brand-oredge tabular-nums">
                                                        {format(date, "dd.MM.")}
                                                    </span>
                                                    <span className="uppercase tracking-wider text-xs">
                                                        {format(date, "EEE")}
                                                    </span>
                                                </div>

                                                {/* Events List */}
                                                <div className="relative pl-12 pr-4 space-y-3 pb-6">
                                                    {/* Vertical line connecting events for the day */}
                                                    <div className="absolute left-[27px] top-2 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />

                                                    {dayEvents.map((event) => (
                                                        <div
                                                            key={event.id}
                                                            className={cn(
                                                                "block relative border rounded-xl transition-all duration-200 group/card",
                                                                isPast
                                                                    ? "bg-slate-100 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-75"
                                                                    : "bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 border-brand-oredge/30 hover:border-brand-oredge"
                                                            )}
                                                        >
                                                            <Link
                                                                href={`/events/${event.id}`}
                                                                className="block p-4 pr-12"
                                                            >
                                                                {/* Orange marker dot */}
                                                                <div className={cn(
                                                                    "absolute -left-[25px] top-6 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-black",
                                                                    isPast ? "bg-slate-400" : "bg-brand-oredge"
                                                                )} />

                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="min-w-0 flex-1">
                                                                        <h3 className="font-semibold text-slate-900 dark:text-white truncate pr-2">
                                                                            {event.title}
                                                                        </h3>
                                                                        <div className="mt-1 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                                                            <div className="flex items-center gap-1">
                                                                                <Clock className="w-3.5 h-3.5" />
                                                                                <span>{format(new Date(event.startDate), "HH:mm")}</span>
                                                                            </div>
                                                                            {(event.venueId || event.customLocation || event.city) && (
                                                                                <div className="flex items-center gap-1 truncate">
                                                                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                                                    <span className="truncate">
                                                                                        {event.customLocation || event.city}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                            {/* Remove Button - Positioned right centered */}
                                                            {onRemove && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        onRemove(event.id);
                                                                    }}
                                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover/card:opacity-100"
                                                                    title="Remove from calendar"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
