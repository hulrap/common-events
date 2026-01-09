import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Heart, ImageOff, MapPin, Calendar, Loader2 } from "lucide-react";
import { useConfig } from "@/hooks/useConfig";
import { apiFetch } from '@/lib/api-client';
import { EventCardSkeleton } from "./EventCardSkeleton";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabaseLoader } from "@/lib/image-optimization";

interface EventCardProps {
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
  readonly isLiked?: boolean; // Legacy prop support
  readonly priority?: boolean;
  readonly forceMobile?: boolean;
}

export function EventCard({ event, isLoading, onEdit, onDelete, isLiked: initialIsLiked, priority = false, forceMobile = false }: EventCardProps) {
  const { user, isEditor } = useAuth();

  // ALL state initialized immediately from props/event data - NO async loading after mount
  // Like status comes from API response (event.isLiked) or initialIsLiked prop
  const [isLiked, setIsLiked] = useState(event?.isLiked ?? initialIsLiked ?? false);
  const [isLiking, setIsLiking] = useState(false);
  const [isEditorsChoice, setIsEditorsChoice] = useState(event?.isEditorsChoice ?? false);
  const [isTogglingEditorChoice, setIsTogglingEditorChoice] = useState(false);
  const [mobileImageError, setMobileImageError] = useState(false);
  const [desktopImageError, setDesktopImageError] = useState(false);
  const [mobileImageLoaded, setMobileImageLoaded] = useState(false);
  const [desktopImageLoaded, setDesktopImageLoaded] = useState(false);
  const { getVenueById } = useConfig();

  // Reset image errors and loading state ONLY when the relevant URL or Event ID changes
  // This prevents flickering when other props (like isLiked) update
  useEffect(() => {
    setMobileImageError(false);
    setMobileImageLoaded(false);
  }, [event?.id, event?.mobileBannerUrl, event?.bannerUrl]);

  useEffect(() => {
    setDesktopImageError(false);
    setDesktopImageLoaded(false);
  }, [event?.id, event?.bannerUrl, event?.mobileBannerUrl]);

  // Sync interaction state from props
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

    // If not logged in, redirect to sign in instead of disabling button
    if (!user) {
      if (globalThis.window) {
        globalThis.window.location.href = "/auth/signin";
      }
      return;
    }

    // Optimistic update - immediately update UI
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
        // Revert on error
        setIsLiked(previousLiked);
      }
    } catch (error) {
      // Revert on error
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
        {/* Banner Image - Optimized with Supabase Loader */}
        <div className={`relative w-full aspect-square ${forceMobile ? '' : 'md:aspect-video'} overflow-hidden bg-black rounded-t-xl`}>

          {/* Mobile Loading Spinner */}
          {(event.mobileBannerUrl || event.bannerUrl) && !mobileImageLoaded && !mobileImageError && (
            <div className={`absolute inset-0 z-20 flex items-center justify-center bg-zinc-900 ${forceMobile ? '' : 'md:hidden'}`}>
              <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
            </div>
          )}

          {/* Desktop Loading Spinner */}
          {(event.bannerUrl || event.mobileBannerUrl) && !desktopImageLoaded && !desktopImageError && (
            <div className={`absolute inset-0 z-20 items-center justify-center bg-zinc-900 ${forceMobile ? 'hidden' : 'hidden md:flex'}`}>
              <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
            </div>
          )}

          {/* Mobile banner (1:1) - shown on mobile OR if forceMobile is true */}
          {(event.mobileBannerUrl || event.bannerUrl) && !mobileImageError ? (
            <Image
              loader={supabaseLoader}
              src={event.mobileBannerUrl || event.bannerUrl || ""}
              alt={event.title}
              fill
              // If forceMobile is true, show this always. If false, show only on mobile (md:hidden).
              // If using desktop fallback (no mobileBannerUrl), use object-contain (letterbox). If has mobile banner, use object-cover.
              className={`${event.mobileBannerUrl ? 'object-cover' : 'object-contain'} ${forceMobile ? '' : 'md:hidden'} ${mobileImageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
              sizes="(max-width: 768px) 100vw, 50vw"
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              priority={priority}
              onLoad={() => setMobileImageLoaded(true)}
              onError={() => setMobileImageError(true)}
            />
          ) : (
            <div className={`w-full h-full relative bg-black flex items-center justify-center ${forceMobile ? '' : 'md:hidden'}`}>
              <ImageOff className="h-16 w-16 text-white/50" />
            </div>
          )}

          {/* Desktop banner (16:9) - shown on desktop ONLY if forceMobile is false */}
          {(event.bannerUrl || event.mobileBannerUrl) && !desktopImageError ? (
            <Image
              loader={supabaseLoader}
              src={event.bannerUrl || event.mobileBannerUrl || ""}
              alt={event.title}
              fill
              // If forceMobile is true, HIDE this always. If false, show only on desktop (hidden md:block).
              className={`object-cover ${forceMobile ? 'hidden' : 'hidden md:block'} ${desktopImageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
              sizes="(max-width: 1024px) 50vw, 33vw"
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              priority={priority}
              onLoad={() => setDesktopImageLoaded(true)}
              onError={() => setDesktopImageError(true)}
            />
          ) : (
            <div className={`w-full h-full relative bg-black items-center justify-center ${forceMobile ? 'hidden' : 'hidden md:flex'}`}>
              <ImageOff className="h-20 w-20 text-white/50" />
            </div>
          )}
        </div>

        {/* Action Buttons - Decoupled: Editor button only for editors, Like button for all */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 justify-end">
          {/* Editor Button - Only rendered for editors, positioned before like button */}
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

          {/* Like Button - Always rendered, always clickable (redirects to sign-in if not logged in) */}
          {(() => {
            // Pre-calculate button styles immediately - no async operations
            // Button is always fully visible and clickable - no disabled state based on auth
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

            // Pre-calculate boxShadow immediately
            let likeButtonBoxShadow: string;
            if (user && isLiked) {
              likeButtonBoxShadow = "0 4px 12px rgba(254, 103, 83, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
            } else {
              likeButtonBoxShadow = "0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 0 rgba(0, 0, 0, 0.1)";
            }

            // Pre-calculate aria-label to avoid nested ternary
            let ariaLabel: string;
            if (isLiked) {
              ariaLabel = "Unlike event";
            } else if (user) {
              ariaLabel = "Like event";
            } else {
              ariaLabel = "Sign in to like event";
            }

            // Pre-calculate Heart className - white when liked (on orange bg), dark when not liked (on white bg)
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
}
