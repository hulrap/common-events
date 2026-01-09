import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft } from "lucide-react";

export default function NotificationsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { notifications, markAsRead, hasUnread } = useNotifications();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/signin");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && hasUnread) {
            markAsRead(undefined);
        }
    }, [user, hasUnread, markAsRead]);

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Mobile Header for this page */}
            <div className="sticky top-0 z-50 flex items-center p-4 bg-black/95 backdrop-blur-md border-b border-white/10">
                <button onClick={() => router.back()} className="mr-4">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Notifications</h1>
            </div>

            <div className="p-4">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {notifications.map((notif: any) => (
                            <Link
                                key={notif.id}
                                href={notif.link || '#'}
                                onClick={() => markAsRead(notif.id)}
                                className={`p-4 rounded-2xl border transition-colors block ${!notif.isRead ? 'bg-white/10 border-brand-oredge/50' : 'bg-white/5 border-white/5'}`}
                            >
                                <div className="font-semibold text-base mb-1">{notif.title}</div>
                                <div className="text-sm text-slate-300">{notif.message}</div>
                                <div className="text-xs text-slate-500 mt-2">
                                    {new Date(notif.createdAt).toLocaleDateString()}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
