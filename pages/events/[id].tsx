import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

import { ArrowLeft, Share2, Heart, ExternalLink, ImageOff, Euro, Calendar, Menu, User, LogOut, Plus, Building2, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { EventDetailSkeleton } from "@/components/Events/EventDetailSkeleton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MenuCard } from "@/components/Header";
import { Logo } from "@/components/Logo";
import { EventGallery } from "@/components/Events/EventGallery";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

interface EventDetail {
  id: string;
  title: string;
  description: string;
  shortDescription?: string | null;
  bannerUrl?: string | null;
  mobileBannerUrl?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  city: string;
  country: string;
  address?: string | null;
  venueId?: string | null;
  venue?: {
    id: string;
    name: string;
    address?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
  customLocation?: string | null;
  categoryId?: string | null;
  tags?: string[] | null;
  organizerId: string;
  organizer?: {
    id: string;
    email: string;
    fullName?: string | null;
    organizationName?: string | null;
    slug?: string | null;
  };
  sourceUrl?: string | null;
  externalLink?: string | null;
  externalLinkText?: string | null;
  isEditorsChoice?: boolean;
  isLiked?: boolean;
  ageRestriction?: string | null;
  dressCode?: string | null;
  language?: string | null;
  accessibilityNotes?: string | null;
  parkingInfo?: string | null;
  publicTransportInfo?: string | null;
  tickets?: Array<{
    id: string;
    ticketName: string;
    price?: string | null;
    currency: string;
    ticketLink?: string | null;
    description?: string | null;
  }>;
  galleryImages?: Array<{
    id: string;
    url: string;
    caption?: string | null;
  }>;
}

export default function EventDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [mobileImageError, setMobileImageError] = useState(false);
  const [desktopImageError, setDesktopImageError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOrganizer = user?.user_metadata?.role === "organizer";
  const isVenueOwner = user?.user_metadata?.role === "venue_owner";
  const isEditor = user?.user_metadata?.role === "editor" || user?.user_metadata?.role === "admin";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
  };

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { apiFetch } = await import('@/lib/api-client');
      const response = await apiFetch(`/api/events/${id}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
        setIsLiked(data.isLiked || false);
      } else {
        toast.error("Event not found");
        router.push("/");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load event";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user || !event || isLiking) {
      if (!user) {
        router.push("/auth/signin");
      }
      return;
    }

    const previousLiked = isLiked;
    setIsLiked(!isLiked);
    setIsLiking(true);

    try {
      const method = previousLiked ? "DELETE" : "POST";
      const { apiFetch } = await import('@/lib/api-client');
      const response = await apiFetch(`/api/events/${event.id}/like`, {
        method,
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        setIsLiked(previousLiked);
        toast.error("Failed to update like status");
      }
    } catch (error) {
      setIsLiked(previousLiked);
      if (error instanceof Error) {
        toast.error("Failed to update like status");
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (!event) return;

    if (globalThis.navigator?.share) {
      try {
        await globalThis.navigator.share({
          title: event.title,
          text: event.shortDescription || event.description,
          url: globalThis.location.href,
        });
      } catch (error) {
        // User cancelled share or error occurred
        if (process.env.NODE_ENV === "development" && error instanceof Error) {
          // Only log in development, ignore user cancellation
        }
      }
    } else if (globalThis.navigator?.clipboard) {
      // Fallback: copy to clipboard
      try {
        await globalThis.navigator.clipboard.writeText(globalThis.location.href);
        toast.success("Link copied to clipboard!");
      } catch (error) {
        if (error instanceof Error) {
          toast.error("Failed to copy link");
        }
      }
    }
  };

  const handleEdit = () => {
    if (event) {
      router.push(`/events/${event.id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    if (!confirm("Are you sure you want to delete this event? This will also delete the associated photo album. This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const { apiFetch } = await import('@/lib/api-client');
      const response = await apiFetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Event deleted successfully");
        router.push("/");
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to delete event" }));
        toast.error(errorData.error || "Failed to delete event");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete event";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateForICS = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const generateICS = () => {
    if (!event) return;

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
    if (!event) return "";
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${formatDateForICS(startDate)}/${formatDateForICS(endDate)}`,
      details: event.shortDescription || event.description || "",
      location: locationAddress ? `${locationName}, ${locationAddress}` : locationName,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const getOutlookCalendarUrl = (): string => {
    if (!event) return "";
    const params = new URLSearchParams({
      subject: event.title,
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      body: (event.shortDescription || event.description || "").substring(0, 500),
      location: locationAddress ? `${locationName}, ${locationAddress}` : locationName,
    });
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  };

  const getAppleCalendarUrl = (): string => {
    if (!event) return "";
    const params = new URLSearchParams({
      title: event.title,
      st: formatDateForICS(startDate),
      et: formatDateForICS(endDate),
      desc: (event.shortDescription || event.description || "").substring(0, 500),
      loc: locationAddress ? `${locationName}, ${locationAddress}` : locationName,
    });
    return `webcal://calendar.apple.com/event?${params.toString()}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const venue = event.venue;
  const locationName = venue?.name || event.customLocation || `${event.city}, ${event.country}`;
  const locationAddress = venue?.address || event.address || null;
  const hasTickets = event.tickets && event.tickets.length > 0;
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const isEventOrganizer = user?.id === event.organizerId;

  // Show skeleton while loading
  if (loading || !event) {
    return <EventDetailSkeleton />;
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-black">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black p-4 pb-3">
        <Link href="/">
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white transition-colors hover:bg-black/80">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div className="flex items-center gap-2">
          {isEventOrganizer && (
            <>
              <button
                onClick={handleEdit}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white transition-colors hover:bg-black/80"
                aria-label="Edit event"
              >
                <Edit className="h-5 w-5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white transition-colors hover:bg-black/80 ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-label="Delete event"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white transition-colors hover:bg-black/80">
                <Calendar className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={generateICS}
                className="cursor-pointer"
              >
                Download ICS File
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  Google Calendar
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={getOutlookCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  Outlook Calendar
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={getAppleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  Apple Calendar
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={handleShare}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white transition-colors hover:bg-black/80"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all ${isLiked && user
              ? "border-brand-orange/50 bg-brand-orange text-white"
              : "border-white/10 bg-black/50 text-white hover:bg-black/80"
              } ${isLiking ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Heart className={`h-5 w-5 ${isLiked && user ? "fill-white" : ""}`} strokeWidth={2} />
          </button>
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white transition-colors hover:bg-black/80">
                <Menu className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 p-0 bg-transparent border-none shadow-none space-y-0 mt-2 z-[100] overflow-visible"
              sideOffset={0}
            >
              {user ? (
                // Logged In State
                <div className="flex flex-col w-full isolate">
                  {/* User Info Header - Base Card (Lowest Z-Index) */}
                  <div className="relative z-10 bg-white p-6 pb-16 rounded-3xl shadow-xl">
                    <div className="font-bold text-slate-900 text-lg truncate pr-8">
                      {user.email || "User"}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {isOrganizer && (
                        <span className="text-xs font-bold px-2 py-1 bg-brand-grellow text-black rounded-md uppercase">
                          Organizer
                        </span>
                      )}
                      {isVenueOwner && (
                        <span className="text-xs font-bold px-2 py-1 bg-brand-rosand text-black rounded-md uppercase">
                          Venue Owner
                        </span>
                      )}
                      {isEditor && (
                        <span className="text-xs font-bold px-2 py-1 bg-brand-purple text-white rounded-md uppercase">
                          Editor
                        </span>
                      )}
                    </div>
                  </div>

                  <MenuCard
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="bg-brand-blurple text-black"
                    zIndex={20}
                  >
                    Profile
                  </MenuCard>

                  {isOrganizer && (
                    <MenuCard
                      href="/events/create"
                      onClick={() => setMenuOpen(false)}
                      className="bg-brand-grellow text-black"
                      zIndex={30}
                    >
                      Create Event
                    </MenuCard>
                  )}

                  {isVenueOwner && (
                    <MenuCard
                      href="/venues/manage"
                      onClick={() => setMenuOpen(false)}
                      className="bg-brand-rosand text-black"
                      zIndex={40}
                    >
                      Manage Venues
                    </MenuCard>
                  )}

                  {isEditor && (
                    <MenuCard
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="bg-brand-purple text-white"
                      zIndex={45}
                    >
                      Editor Tools
                    </MenuCard>
                  )}

                  <MenuCard
                    onClick={handleSignOut}
                    className="bg-brand-oredge text-black"
                    zIndex={50}
                  >
                    Sign Out
                  </MenuCard>

                  {/* Footer Logo Block (Highest Z-Index) */}
                  <div className="relative z-[60] bg-black p-8 pt-12 pb-12 flex flex-col items-center justify-center rounded-3xl -mt-9 shadow-2xl">
                    <Logo className="h-20 w-auto text-white" />
                  </div>
                </div>
              ) : (
                // Logged Out State
                <div className="flex flex-col w-full isolate">
                  <DropdownMenuItem asChild className="p-0 focus:outline-none border-none outline-none">
                    <Link
                      href="/auth/signin"
                      onClick={() => setMenuOpen(false)}
                      className="relative z-10 flex items-center justify-start px-6 py-6 pb-16 w-full font-display font-black !text-2xl uppercase tracking-tight transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-3xl bg-brand-rosand text-black shadow-xl"
                    >
                      Sign In
                    </Link>
                  </DropdownMenuItem>

                  <MenuCard
                    href="/auth/signin"
                    onClick={() => setMenuOpen(false)}
                    className="bg-brand-blurple text-white"
                    zIndex={40}
                  >
                    Sign Up
                  </MenuCard>

                  {/* Footer Logo Block (Highest Z-Index) */}
                  <div className="relative z-50 bg-black p-8 pt-12 pb-12 flex flex-col items-center justify-center rounded-3xl -mt-9 shadow-2xl">
                    <Logo className="h-20 w-auto text-white" />
                  </div>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-32">
        {/* Hero Banner Section */}
        <div className="w-full flex justify-center px-4 pt-6 max-w-3xl mx-auto">
          {(event.mobileBannerUrl || event.bannerUrl) && !mobileImageError && !desktopImageError ? (
            <>
              <div className={`relative w-full ${event.mobileBannerUrl ? 'aspect-square' : 'aspect-video'} md:hidden rounded-xl overflow-hidden border-2 border-white shadow-xl`}>
                {event.mobileBannerUrl && (
                  <Image
                    src={event.mobileBannerUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    onError={() => setMobileImageError(true)}
                  />
                )}
                {/* Editor's Choice Badge on Mobile Banner */}
                {event.isEditorsChoice && (
                  <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-brand-purple to-brand-blurple text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg backdrop-blur-sm">
                    Editor&apos;s Choice
                  </div>
                )}
              </div>
              <div className="relative hidden w-full aspect-video bg-black md:block rounded-xl overflow-hidden border-2 border-white shadow-xl">
                {(event.bannerUrl || event.mobileBannerUrl) && (
                  <Image
                    src={event.bannerUrl || event.mobileBannerUrl || ""}
                    alt={event.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                    priority
                    onError={() => setDesktopImageError(true)}
                  />
                )}
                {/* Editor's Choice Badge on Desktop Banner */}
                {event.isEditorsChoice && (
                  <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-brand-purple to-brand-blurple text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg backdrop-blur-sm">
                    Editor&apos;s Choice
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="relative w-full aspect-square md:aspect-video md:max-w-3xl md:mx-auto bg-black flex items-center justify-center rounded-xl overflow-hidden border-2 border-white shadow-xl">
              <ImageOff className="h-24 w-24 text-white/30 md:h-32 md:w-32" />
              {/* Editor's Choice Badge on Placeholder */}
              {event.isEditorsChoice && (
                <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-brand-purple to-brand-blurple text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg backdrop-blur-sm">
                  Editor&apos;s Choice
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="px-4 py-6 max-w-3xl mx-auto space-y-5 pt-5">
          {/* Title and Organizer Card */}
          <div className="rounded-xl border-2 border-white bg-black p-5 shadow-xl">
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              {event.organizer?.organizationName && (
                <span>
                  Published by <Link href={`/organizers/${event.organizer.slug || event.organizerId}`} className="font-semibold text-white hover:underline">{event.organizer.organizationName}</Link>
                </span>
              )}
              {event.sourceUrl && (
                <span className="flex items-center gap-1.5">
                  {event.organizer?.organizationName && <span>•</span>}
                  <span>Source:</span>
                  <a
                    href={event.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white hover:underline flex items-center gap-1"
                  >
                    {new URL(event.sourceUrl).hostname.replace("www.", "")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              )}
            </div>
          </div>

          {/* Date & Time Card */}
          <div className="rounded-xl border-2 border-white bg-black p-5 shadow-xl">
            <div className="text-base font-semibold text-white leading-snug mb-1">
              {format(startDate, "EEE, MMMM d, yyyy")}
            </div>
            <div className="text-sm text-white/80">
              {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
            </div>
          </div>

          {/* About Section Card */}
          <div className="rounded-xl border-2 border-white bg-black p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4">About This Event</h2>
            <div
              className="prose prose-invert prose-sm max-w-none text-base leading-relaxed text-white/90"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          </div>

          {/* Tickets Section Card */}
          <div className="rounded-xl border-2 border-white bg-black p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Tickets</h2>
            {hasTickets && event.tickets ? (
              <div className="space-y-3">
                {event.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="rounded-lg border-2 border-white bg-black p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-semibold text-white mb-1">
                          {ticket.ticketName}
                        </div>
                        {ticket.description && (
                          <div className="text-sm text-white/70 mb-3">
                            {ticket.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-white">
                            {ticket.price ? `${Number.parseFloat(ticket.price).toFixed(2)} ${ticket.currency}` : "Free"}
                          </span>
                        </div>
                      </div>
                      {ticket.ticketLink && (
                        <Button
                          asChild
                          className="h-10 shrink-0 rounded-lg bg-brand-orange hover:bg-brand-oredge text-white font-semibold border-0"
                        >
                          <a
                            href={ticket.ticketLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Buy
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-base text-white/70">None</div>
            )}
          </div>

          {/* Location Card */}
          <div className="rounded-xl border-2 border-white bg-black p-5 shadow-xl">
            <div className="space-y-3">
              <div>
                <div className="text-xs text-white/60 mb-1">Venue Name</div>
                <div className="text-base font-semibold text-white">{locationName}</div>
              </div>
              {locationAddress && (
                <div>
                  <div className="text-xs text-white/60 mb-1">Address</div>
                  <div className="text-base text-white/90">{locationAddress}</div>
                </div>
              )}
              {venue && (
                <div>
                  <div className="text-xs text-white/60 mb-1">City, Country</div>
                  <div className="text-base text-white/90">{venue.city}, {venue.country}</div>
                </div>
              )}
              {!venue && (
                <div>
                  <div className="text-xs text-white/60 mb-1">City, Country</div>
                  <div className="text-base text-white/90">{event.city}, {event.country}</div>
                </div>
              )}
            </div>
          </div>

          {/* Gallery Card */}
          <div className="rounded-xl border-2 border-white bg-black p-5 shadow-xl">
            <EventGallery
              eventId={event.id}
              images={event.galleryImages || []}
              isOrganizer={isEventOrganizer}
              onImagesUpdate={fetchEvent}
            />
          </div>

          {/* Additional Information Card */}
          {(event.ageRestriction || event.dressCode || event.language || event.accessibilityNotes || event.parkingInfo || event.publicTransportInfo) && (
            <div className="rounded-xl border-2 border-white bg-black p-5 shadow-xl">
              <h2 className="text-lg font-semibold text-white mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.ageRestriction && (
                  <div>
                    <div className="text-xs text-white/60 mb-1">Age Restriction</div>
                    <div className="text-base text-white/90">{event.ageRestriction}</div>
                  </div>
                )}
                {event.dressCode && (
                  <div>
                    <div className="text-xs text-white/60 mb-1">Dress Code</div>
                    <div className="text-base text-white/90">{event.dressCode}</div>
                  </div>
                )}
                {event.language && (
                  <div>
                    <div className="text-xs text-white/60 mb-1">Language</div>
                    <div className="text-base text-white/90">{event.language}</div>
                  </div>
                )}
                {event.accessibilityNotes && (
                  <div>
                    <div className="text-xs text-white/60 mb-1">Accessibility Notes</div>
                    <div className="text-base text-white/90">{event.accessibilityNotes}</div>
                  </div>
                )}
                {event.parkingInfo && (
                  <div>
                    <div className="text-xs text-white/60 mb-1">Parking Information</div>
                    <div className="text-base text-white/90">{event.parkingInfo}</div>
                  </div>
                )}
                {event.publicTransportInfo && (
                  <div>
                    <div className="text-xs text-white/60 mb-1">Public Transport Information</div>
                    <div className="text-base text-white/90">{event.publicTransportInfo}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* External Link Button */}
          {event.externalLink && (
            <div className="mt-6 flex justify-center">
              <Button
                className="h-12 px-8 rounded-xl bg-brand-orange hover:bg-brand-oredge text-white text-base font-bold border-0 shadow-lg shadow-brand-orange/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => window.open(event.externalLink as string, '_blank')}
              >
                {event.externalLinkText || "Visit Website"}
                <ExternalLink className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
