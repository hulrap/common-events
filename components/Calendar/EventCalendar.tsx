import { useEffect, useRef } from "react";
import { EventCard } from "./EventCard";
import { EventFilters } from "./EventFilters";

interface Event {
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
  isEditorsChoice?: boolean;
  isLiked?: boolean; // Like status from API
  tickets?: Array<{
    price?: string | null;
    currency: string;
  }>;
}

interface EventCalendarProps {
  readonly events: readonly Event[];
  readonly isLoading?: boolean;
  readonly onEdit?: (id: string) => void;
  readonly onDelete?: (id: string) => void;
  readonly onFilterChange?: (filters: any) => void;
  readonly onUpdateSearch?: () => void;
  readonly onLoadMore?: () => void;
  readonly hasMore?: boolean;
  readonly loadingMore?: boolean;
}

export function EventCalendar({
  events,
  isLoading = false,
  onEdit,
  onDelete,
  onFilterChange,
  onUpdateSearch,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}: EventCalendarProps) {
  const observerTarget = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // No virtual scrolling - all events render at once to prevent layout shifts and wobble

  // Intersection observer for loading more - only when we have more to load
  useEffect(() => {
    // Don't create observer if there's no more data, already loading, or no callback
    if (!hasMore || loadingMore || !onLoadMore) {
      return;
    }

    const currentTarget = observerTarget.current;
    if (!currentTarget) {
      return;
    }

    let loadingTriggered = false;
    const observer = new IntersectionObserver(
      (entries) => {
        // Only trigger once per intersection and only if conditions are met
        if (entries[0]?.isIntersecting && hasMore && !loadingMore && !loadingTriggered && onLoadMore) {
          loadingTriggered = true;
          onLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px" // Reduced from 200px to prevent premature loading
      }
    );

    observer.observe(currentTarget);

    return () => {
      observer.unobserve(currentTarget);
      observer.disconnect();
    };
  }, [hasMore, loadingMore, onLoadMore]);

  // No placeholders needed since we're showing all events

  // Always maintain stable skeleton slots to prevent layout shifts
  // Use a fixed count that matches typical initial load
  const STABLE_SLOT_COUNT = 12;



  return (
    <>
      <EventFilters onFilterChange={onFilterChange || (() => { })} onUpdateSearch={onUpdateSearch} />
      <div
        ref={containerRef}
        className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-5 px-4 pb-4 bg-brand-black"
      >
        {/* Render Events */}
        {events.map((event, index) => (
          <EventCard
            key={`event-${event.id}`}
            event={event}
            isLoading={false}
            onEdit={onEdit}
            onDelete={onDelete}
            isLiked={event.isLiked}
            priority={index === 0}
          />
        ))}

        {/* Loading Skeletons - Initial Load */}
        {isLoading && Array.from({ length: STABLE_SLOT_COUNT }).map((_, i) => (
          <EventCard
            key={`skeleton-initial-${i}`}
            isLoading={true}
          />
        ))}

        {/* Loading Skeletons - Loading More */}
        {loadingMore && Array.from({ length: 3 }).map((_, i) => (
          <EventCard
            key={`skeleton-more-${i}`}
            isLoading={true}
          />
        ))}



        {/* Empty state - only show when not loading and no events at all (after initial load) */}
        {!isLoading && events.length === 0 && !loadingMore && (
          <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400" style={{ minHeight: "200px" }}>
            No events found
          </div>
        )}

        {/* Observer target and end marker - stable height to prevent wobble */}
        {!isLoading && events.length > 0 && (
          <div className="col-span-full">
            {/* Observer target - only visible when hasMore, but always in DOM for stability */}
            <div
              ref={observerTarget}
              style={{
                minHeight: hasMore ? "16px" : "1px",
                height: hasMore ? "16px" : "1px",
                visibility: hasMore ? "visible" : "hidden"
              }}
              aria-hidden="true"
            />

          </div>
        )}
        {/* No more events message - fixed height to prevent layout shift */}
        {!hasMore && (
          <div className="col-span-full text-center py-8 text-slate-500 dark:text-slate-400 text-sm" style={{ minHeight: "64px" }}>
            No more events to load
          </div>
        )}
      </div>
    </>
  );
}
