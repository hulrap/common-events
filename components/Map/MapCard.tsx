import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Heart, ImageOff, MapPin, Calendar, Loader2 } from "lucide-react";
import { useConfig } from "@/hooks/useConfig";
import { apiFetch } from '@/lib/api-client';
import { EventCardSkeleton } from "@/components/Calendar/EventCardSkeleton";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabaseLoader } from "@/lib/image-optimization";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface MapCardProps {
    readonly event?: {
        id: string;
        title: string;
        shortDescription?: string | null;
        bannerUrl?: string | null;
        mobileBannerUrl?: string | null;
        startDate: Date | string;
        endDate: Date | string;
        city: string;
        country: string;
        venueId?: string | null;
        customLocation?: string | null;
        categoryId?: string | null;
        tags?: string[] | null;
        organizerId: string;
        sourceUrl?: string | null;
        isEditorsChoice?: boolean;
        isLiked?: boolean; // Like status from API
        tickets?: Array<{
            price?: string | null;
            currency: string;
        }>;
    } | null;
    readonly isLoading?: boolean;
    readonly onEdit?: (id: string) => void;
    readonly onDelete?: (id: string) => void;
    readonly isLiked?: boolean;
    readonly priority?: boolean;
}

const MapCardComponent = ({ event, isLoading, onEdit, onDelete, isLiked: initialIsLiked, priority = false }: MapCardProps) => {
    const { user, isEditor } = useAuth();
    const { getVenueById } = useConfig();

    // ALL state initialized immediately from props/event data
    const [isLiked, setIsLiked] = useState(event?.isLiked ?? initialIsLiked ?? false);
    const [isLiking, setIsLiking] = useState(false);
    const [isEditorsChoice, setIsEditorsChoice] = useState(event?.isEditorsChoice ?? false);
    const [isTogglingEditorChoice, setIsTogglingEditorChoice] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Sticky Load State Logic
    const [imageLoaded, setImageLoaded] = useState(false);
    const lastUrlRef = useRef<string | null>(null);
    const currentUrl = event?.mobileBannerUrl || event?.bannerUrl || null;

    useEffect(() => {
        // Helper to strip query params (tokens) for stable comparison
        const getBasePath = (url: string | null) => {
            if (!url) return null;
            return url.split('?')[0];
        };

        const currentPath = getBasePath(currentUrl);
        const lastPath = getBasePath(lastUrlRef.current);

        // Only reset if the ACTUAL image path changes (e.g. different file)
        // Ignoring query param changes (tokens) prevents flickering on re-fetch
        if (currentPath !== lastPath) {
            lastUrlRef.current = currentUrl;
            setImageError(false);
            if (currentUrl) {
                setImageLoaded(false);
            }
        } else if (currentUrl !== lastUrlRef.current) {
            // Update ref but DO NOT reset loading state if only token changed
            lastUrlRef.current = currentUrl;
        }
    }, [currentUrl]);

    // Sync interaction state
    useEffect(() => {
        setIsEditorsChoice(event?.isEditorsChoice ?? false);
        setIsLiked(event?.isLiked ?? initialIsLiked ?? false);
    }, [event?.isEditorsChoice, event?.isLiked, initialIsLiked]);

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!event || isLoading || isLiking) {
            return;
        }

        if (!user) {
            if (globalThis.window) {
                globalThis.window.location.href = "/auth/signin";
            }
            return;
        }

        const previousLiked = isLiked;
        setIsLiked(!isLiked);
        setIsLiking(true);

        try {
            const method = previousLiked ? "DELETE" : "POST";
            const response = await apiFetch(`/api/events/${event.id}/like`, {
                method,
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                setIsLiked(previousLiked);
            }
        } catch (error) {
            setIsLiked(previousLiked);
            if (process.env.NODE_ENV === "development") {
                console.error("Error toggling like:", error);
            }
        } finally {
            setIsLiking(false);
        }
    };

    const handleToggleEditorChoice = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isEditor || !event || isLoading) {
            return;
        }

        setIsTogglingEditorChoice(true);
        try {
            const method = isEditorsChoice ? "DELETE" : "POST";
            const response = await apiFetch(`/api/events/${event.id}/editor-choice`, { method });
            if (response.ok) {
                const data = await response.json();
                setIsEditorsChoice(data.isEditorsChoice || false);
            }
        } catch (error) {
            console.error("Error toggling editor's choice:", error);
        } finally {
            setIsTogglingEditorChoice(false);
        }
    };


    if (isLoading || !event) {
        return <EventCardSkeleton />;
    }

    const venue = event.venueId ? getVenueById(event.venueId) : null;
    const location = venue?.name || event.customLocation || event.city;

    return (
        <Link href={`/events/${event.id}`}>
            <div className={`rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden grain-texture card-glass relative ${isEditorsChoice
                ? "border-brand-purple shadow-brand-purple/20"
                : ""
                } ${isEditorsChoice ? "ring-2 ring-brand-purple/50 ring-offset-2 ring-offset-black" : ""}`}>

                {/* Editor's Choice Badge */}
                {isEditorsChoice && (
                    <div className="absolute top-2 left-2 z-30 bg-gradient-to-r from-brand-purple to-brand-blurple text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                        <span>Editor&apos;s Choice</span>
                    </div>
                )}

                {/* Shining effect overlay for Editor's Choice */}
                {isEditorsChoice && (
                    <div className="absolute inset-0 pointer-events-none z-10 rounded-xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-purple/20 to-transparent -translate-x-full animate-shimmer"></div>
                    </div>
                )}

                {/* Banner Image - ALWAYS SQUARE, FALLBACK TO DESKTOP IF MOBILE MISSING */}
                <div className="relative w-full aspect-square overflow-hidden bg-black rounded-t-xl">

                    {/* Loading Spinner - Overlay only, transparent background */}
                    {currentUrl && !imageLoaded && !imageError && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-900/10 backdrop-blur-[2px]">
                            <LoadingSpinner className="w-8 h-8 text-brand-orange" />
                        </div>
                    )}

                    {/* Mobile Image (or Desktop Fallback) - Strictly 1:1 */}
                    {currentUrl && !imageError ? (
                        <Image
                            loader={supabaseLoader}
                            src={currentUrl}
                            alt={event.title}
                            fill
                            className={`${event.mobileBannerUrl ? 'object-cover' : 'object-contain'} transition-opacity duration-500`}
                            sizes="(max-width: 768px) 100vw, 450px"
                            priority={priority}
                            onLoad={(e) => {
                                // Double check if cached
                                if (e.currentTarget.complete) {
                                    setImageLoaded(true);
                                }
                                setImageLoaded(true);
                            }}
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="w-full h-full relative bg-black flex items-center justify-center">
                            <ImageOff className="h-16 w-16 text-white/50" />
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 justify-end">
                    {/* Editor Button */}
                    {isEditor && user && (
                        <button
                            onClick={handleToggleEditorChoice}
                            disabled={isTogglingEditorChoice}
                            className={`size-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${isEditorsChoice
                                ? "bg-brand-purple hover:bg-brand-blurple text-white"
                                : "bg-white/90 hover:bg-white text-slate-700"
                                } ${isTogglingEditorChoice ? "opacity-50 cursor-not-allowed" : "hover:scale-110"}`}
                            style={{
                                boxShadow: isEditorsChoice
                                    ? "0 4px 12px rgba(104, 112, 238, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                                    : "0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                            }}
                            title={isEditorsChoice ? "Remove Editor's Choice" : "Mark as Editor's Choice"}
                        >
                            <span className={`text-lg font-bold ${isEditorsChoice ? "text-white" : "text-slate-700"}`}>E</span>
                        </button>
                    )}

                    {/* Like Button */}
                    {(() => {
                        let likeButtonClassName = "size-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ";
                        if (isLiked && user) {
                            likeButtonClassName += "bg-brand-orange hover:bg-brand-oredge text-white";
                        } else {
                            likeButtonClassName += "bg-white/90 hover:bg-white text-slate-700";
                        }
                        if (isLiking) {
                            likeButtonClassName += " opacity-50 cursor-not-allowed";
                        } else {
                            likeButtonClassName += " hover:scale-110 cursor-pointer";
                        }

                        let likeButtonBoxShadow: string;
                        if (user && isLiked) {
                            likeButtonBoxShadow = "0 4px 12px rgba(254, 103, 83, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
                        } else {
                            likeButtonBoxShadow = "0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 0 rgba(0, 0, 0, 0.1)";
                        }

                        let ariaLabel: string;
                        if (isLiked) {
                            ariaLabel = "Unlike event";
                        } else if (user) {
                            ariaLabel = "Like event";
                        } else {
                            ariaLabel = "Sign in to like event";
                        }

                        const heartClassName = isLiked && user ? "h-6 w-6 fill-white text-white" : "h-6 w-6 text-slate-700";

                        return (
                            <button
                                onClick={handleLike}
                                disabled={isLiking}
                                className={likeButtonClassName}
                                style={{ boxShadow: likeButtonBoxShadow }}
                                aria-label={ariaLabel}
                            >
                                <Heart
                                    className={heartClassName}
                                    strokeWidth={2}
                                />
                            </button>
                        );
                    })()}
                </div>

                {/* Content */}
                <div className="p-5 rounded-b-xl bg-black/85 backdrop-blur-sm h-[120px] flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2 flex-1 leading-tight">
                            {event.title}
                        </h3>
                    </div>

                    <div className="flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-white/70 shrink-0" />
                            <span className="truncate">{location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-white/70 shrink-0" />
                            <span className="truncate">
                                {(() => {
                                    try {
                                        const date = new Date(event.startDate);
                                        if (isNaN(date.getTime())) throw new Error("Invalid date");
                                        return `${format(date, "EEE, MMM d")} • ${format(date, "h:mm a")}`;
                                    } catch (e) {
                                        return "Date TBD";
                                    }
                                })()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

// MEMOIZATION for Stable Renders
export const MapCard = React.memo(MapCardComponent, (prev, next) => {
    // Return TRUE if props are equal (DO NOT RE-RENDER)

    // 1. Check if ID changed (Different event)
    if (prev.event?.id !== next.event?.id) return false;

    // 2. Check if Priority changed (Might need re-priority of image)
    if (prev.priority !== next.priority) return false;

    // 3. Check if Like/Editor status in EVENT OBJECT changed (Deep compare specific fields)
    if (prev.event?.isLiked !== next.event?.isLiked) return false;
    if (prev.event?.isEditorsChoice !== next.event?.isEditorsChoice) return false;

    // 4. Check if Image URL changed
    if (prev.event?.mobileBannerUrl !== next.event?.mobileBannerUrl) return false;
    if (prev.event?.bannerUrl !== next.event?.bannerUrl) return false;

    // 5. Check isLoading
    if (prev.isLoading !== next.isLoading) return false;

    // Otherwise, assume equal (ignore function reference changes for onEdit etc if they are not used)
    return true;
});

// Re-export specific display name for DevTools
MapCard.displayName = 'MapCard';
