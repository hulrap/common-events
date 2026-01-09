import { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from '@/lib/api-client';
import { useRouter } from "next/router";
import { CalendarView } from "@/components/Calendar/CalendarView";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Copy, Check, Calendar, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";

export const getServerSideProps: GetServerSideProps = async () => {
    return { props: {} };
};

interface Event {
    id: string;
    title: string;
    startDate: Date | string;
    endDate: Date | string;
    city: string;
    venueId?: string | null;
    customLocation?: string | null;
}

export default function CalendarPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [showSubscribeModal, setShowSubscribeModal] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/signin");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;

        const fetchLikedEvents = async () => {
            setLoadingEvents(true);
            try {
                // Fetch liked events sorted by start date
                const response = await apiFetch(`/api/user/liked-events?sortOrder=asc`);

                if (response.ok) {
                    const data = await response.json();
                    setEvents(data.events || []);
                }
            } catch (error) {
                console.error("Failed to fetch calendar events:", error);
            } finally {
                setLoadingEvents(false);
            }
        };

        fetchLikedEvents();
    }, [user]);

    const [subscribeUrl, setSubscribeUrl] = useState<string>("");

    useEffect(() => {
        if (typeof window !== 'undefined' && user) {
            // Use environment variable for production URL, fallback to window.location for dev
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
                || process.env.NEXT_PUBLIC_VERCEL_URL
                || null;

            let baseUrl: string;
            if (siteUrl) {
                // Ensure it has https://
                baseUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
            } else {
                // Fallback for local dev
                baseUrl = `${window.location.protocol}//${window.location.host}`;
            }

            setSubscribeUrl(`${baseUrl}/api/calendar/${user.id}.ics`);
        }
    }, [user]);

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(subscribeUrl);
            setCopied(true);
            toast.success("URL copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy URL");
        }
    };

    const handleRemove = async (eventId: string) => {
        // Optimistic update
        const previousEvents = [...events];
        setEvents(events.filter(e => e.id !== eventId));

        try {
            const response = await apiFetch(`/api/events/${eventId}/like`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                throw new Error("Failed to remove event");
            }
        } catch (error) {
            console.error("Error removing event:", error);
            // Revert on error
            setEvents(previousEvents);
        }
    };

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center py-12 min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black pb-20">
            <div className="container mx-auto px-4">
                <CalendarView
                    events={events}
                    isLoading={loadingEvents}
                    onRemove={handleRemove}
                    onSubscribeClick={() => setShowSubscribeModal(true)}
                />
            </div>

            {/* Subscribe Modal */}
            {showSubscribeModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-brand-oredge" />
                                Subscribe to Calendar
                            </h2>
                            <button
                                onClick={() => setShowSubscribeModal(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* URL Copy Section */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Your Calendar Feed URL
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={subscribeUrl}
                                        readOnly
                                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-mono text-slate-600 dark:text-slate-400 truncate"
                                    />
                                    <Button
                                        onClick={handleCopyUrl}
                                        variant="outline"
                                        className="shrink-0 px-4"
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500">
                                    This feed syncs automatically. New liked events will appear in your calendar.
                                </p>
                            </div>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white dark:bg-zinc-900 px-4 text-sm text-slate-500">
                                        How to subscribe
                                    </span>
                                </div>
                            </div>

                            {/* Google Calendar Instructions */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                        <svg viewBox="0 0 24 24" className="w-5 h-5">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Google Calendar</h3>
                                </div>
                                <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-2 ml-10">
                                    <li>1. Open <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="text-brand-oredge hover:underline inline-flex items-center gap-1">Google Calendar <ExternalLink className="w-3 h-3" /></a></li>
                                    <li>2. Click the <strong>+</strong> next to &quot;Other calendars&quot;</li>
                                    <li>3. Select <strong>&quot;From URL&quot;</strong></li>
                                    <li>4. Paste the URL copied above</li>
                                    <li>5. Click <strong>&quot;Add calendar&quot;</strong></li>
                                </ol>
                                <p className="text-xs text-slate-500 ml-10">
                                    ⏱️ Google syncs every 12-24 hours
                                </p>
                            </div>

                            {/* Apple Calendar Instructions */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm">
                                        <Calendar className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Apple Calendar</h3>
                                </div>
                                <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-2 ml-10">
                                    <li>1. Open <strong>Calendar</strong> app on Mac/iPhone/iPad</li>
                                    <li>2. Go to <strong>File → New Calendar Subscription</strong> (Mac) or <strong>Settings → Calendar → Accounts → Add Account → Other → Add Subscribed Calendar</strong> (iOS)</li>
                                    <li>3. Paste the URL copied above</li>
                                    <li>4. Click <strong>&quot;Subscribe&quot;</strong></li>
                                </ol>
                                <p className="text-xs text-slate-500 ml-10">
                                    ⏱️ Apple syncs every 15 minutes to 1 hour
                                </p>
                            </div>

                            {/* Outlook Instructions */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                                        <Calendar className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Outlook</h3>
                                </div>
                                <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-2 ml-10">
                                    <li>1. Open <a href="https://outlook.live.com/calendar" target="_blank" rel="noopener noreferrer" className="text-brand-oredge hover:underline inline-flex items-center gap-1">Outlook Calendar <ExternalLink className="w-3 h-3" /></a></li>
                                    <li>2. Click <strong>&quot;Add calendar&quot;</strong> → <strong>&quot;Subscribe from web&quot;</strong></li>
                                    <li>3. Paste the URL copied above</li>
                                    <li>4. Click <strong>&quot;Import&quot;</strong></li>
                                </ol>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-200 dark:border-slate-800">
                            <Button
                                onClick={() => setShowSubscribeModal(false)}
                                className="w-full bg-brand-oredge hover:bg-brand-oredge/90 text-white"
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
