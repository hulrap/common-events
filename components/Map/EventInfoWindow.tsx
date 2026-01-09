import Link from 'next/link';
import { ArrowRight, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { useConfig } from '@/hooks/useConfig';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EventType {
  id: string;
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  bannerUrl?: string | null;
  startDate: Date | string;
  endDate?: Date | string;
  customLocation?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  venueId?: string | null;
  venueName?: string | null;
  isEditorsChoice?: boolean;
  categoryId?: string | null;
  isLiked?: boolean;
}

interface EventInfoWindowProps {
  readonly event: EventType;
  readonly onViewDetails: () => void;
}

export function EventInfoWindow({
  event,
  onViewDetails,
}: EventInfoWindowProps) {
  const { getVenueById, getCategoryById } = useConfig();
  const { user } = useAuth();

  const [isLiked, setIsLiked] = useState(event.isLiked ?? false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    setIsLiked(event.isLiked ?? false);
  }, [event.isLiked]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLiking) return;

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
      console.error("Error toggling like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  // Get venue info if available
  const venue = event.venueId ? getVenueById(event.venueId) : null;
  const category = event.categoryId ? getCategoryById(event.categoryId) : null;

  // Build location display - venue name, address, city, country
  const locationName = event.venueName || venue?.name || event.customLocation || null;
  const locationAddress = event.address || venue?.address || null;
  const locationCity = event.city || venue?.city || 'Vienna';
  const locationCountry = event.country || venue?.country || 'Austria';

  // Use description if available, otherwise shortDescription
  const displayDescription = event.description || event.shortDescription;

  // Calendar Helpers
  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

  const formatDateForICS = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const generateICS = () => {
    const start = formatDateForICS(startDate);
    const end = formatDateForICS(endDate);
    const now = formatDateForICS(new Date());
    const description = (event.shortDescription || event.description || "").replace(/\n/g, String.raw`\n`);
    const location = locationAddress ? `${locationName}, ${locationAddress}` : locationName;
    const url = globalThis.location.href;

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Common Events//Event Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${event.id}@commonevents.app`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      `URL:${url}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.replace(/[^a-z0-9]/gi, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    toast.success("Calendar file downloaded!");
  };

  const getGoogleCalendarUrl = (): string => {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${formatDateForICS(startDate)}/${formatDateForICS(endDate)}`,
      details: event.shortDescription || event.description || "",
      location: locationAddress ? `${locationName}, ${locationAddress}` : (locationName || ""),
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const getAppleCalendarUrl = (): string => {
    const params = new URLSearchParams({
      title: event.title,
      st: formatDateForICS(startDate),
      et: formatDateForICS(endDate),
      desc: (event.shortDescription || event.description || "").substring(0, 500),
      loc: locationAddress ? `${locationName}, ${locationAddress}` : (locationName || ""),
    });
    return `webcal://calendar.apple.com/event?${params.toString()}`;
  };

  // Google Maps URL
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    (locationName ? locationName + " " : "") + (locationAddress || "") + " " + locationCity
  )}`;

  // Like Button Component
  const LikeButton = () => {
    let likeButtonClassName = "size-10 rounded-full flex items-center justify-center transition-colors transition-transform duration-200 shadow-lg flex-shrink-0 ";
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

    const heartClassName = isLiked && user ? "h-5 w-5 fill-white text-white" : "h-5 w-5 text-slate-700";

    return (
      <button
        onClick={handleLike}
        disabled={isLiking}
        className={likeButtonClassName}
        style={{ boxShadow: likeButtonBoxShadow }}
        aria-label={isLiked ? "Unlike event" : "Like event"}
      >
        <Heart className={heartClassName} strokeWidth={2} />
      </button>
    );
  };

  return (
    <div
      className="w-[400px] max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-120px)] bg-black border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative transform-gpu"
      style={{ width: 'min(400px, calc(100vw - 32px))', boxSizing: 'border-box' }}
    >
      {/* Banner */}
      {event.bannerUrl && (
        <div className="relative w-full h-36 flex-shrink-0 overflow-hidden bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

          {/* Editor's Choice Badge */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
            {event.isEditorsChoice && (
              <div className="px-2.5 py-1 bg-brand-purple text-white text-xs font-normal rounded-full shadow-lg border border-white/10 flex items-center gap-1">
                Editor&apos;s Choice
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-5 flex flex-col gap-4 items-start">
        {/* Title Card (Green - Solid - Black Text) */}
        <div className="inline-flex items-start px-4 py-3 rounded-xl bg-brand-green text-black shadow-sm w-fit max-w-full">
          <h3 className="text-xl font-bold leading-tight">
            {event.title}
          </h3>
        </div>

        {/* Category Card (White - Solid - Black Text) */}
        {category && (
          <div className="inline-flex items-center px-4 py-3 rounded-xl bg-white text-black shadow-sm w-fit max-w-full">
            <span className="text-sm font-normal truncate">{category.name}</span>
          </div>
        )}

        {/* Date Card (Oredge - Solid - Black Text) - Clickable Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center px-4 py-3 rounded-xl bg-brand-oredge text-black shadow-sm w-fit max-w-full hover:brightness-110 transition-colors active:scale-[0.98] text-left">
              <span className="text-sm font-normal whitespace-nowrap">
                {format(startDate, 'EEE, MMM d')} • {format(startDate, 'h:mm a')}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={generateICS} className="cursor-pointer">
              Download ICS File
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={getGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                Google Calendar
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={getAppleCalendarUrl()} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                Apple Calendar
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Location Card (Blurple - Solid - Black Text) - Clickable Link */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-start px-4 py-3 rounded-xl bg-brand-blurple text-black shadow-sm w-fit max-w-full hover:brightness-110 transition-colors active:scale-[0.98]"
        >
          <div className="flex-1 min-w-0">
            {locationName && (
              <div className="font-normal text-sm mb-0.5 truncate">
                {locationName}
              </div>
            )}
            {locationAddress && (
              <div className="text-black/80 text-xs leading-relaxed font-normal truncate">
                {locationAddress}
              </div>
            )}
            {!locationName && !locationAddress && (
              <div className="text-black/80 text-sm italic">Location TBA</div>
            )}
          </div>
        </a>

        {/* Description Card (Rosand - Solid - Black Text - below location) */}
        {displayDescription && (
          <div className="inline-flex items-start px-4 py-3 rounded-xl bg-brand-rosand text-black shadow-sm w-fit max-w-full">
            <div className="text-sm font-normal leading-relaxed line-clamp-3">
              {displayDescription}
            </div>
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="p-4 bg-black border-t border-white/10 flex-shrink-0 z-20 flex items-center justify-between gap-3">
        <Link
          href={`/events/${event.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          className="flex-shrink-0"
        >
          <button
            className="py-2.5 px-6 bg-white text-black font-normal text-sm rounded-xl hover:bg-slate-200 transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
            type="button"
          >
            <span>Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>

        <LikeButton />
      </div>
    </div>
  );
}
