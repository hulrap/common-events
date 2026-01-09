import { useState, useMemo } from "react";
import { GetServerSideProps } from "next";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { EventCalendar } from "@/components/Calendar/EventCalendar";
import { EditEventModal } from "@/components/Events/EditEventModal";
import type { FilterState } from "@/components/Calendar/EventFilters";
import { toast } from "sonner";
import { EventListErrorBoundary } from "@/components/ErrorBoundary";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

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
  sourceUrl?: string | null;
  isEditorsChoice?: boolean;
  isLiked?: boolean; // Like status included in initial response
  tickets?: Array<{
    price?: string | null;
    currency: string;
  }>;
}

interface EventsResponse {
  events: Event[];
  pagination: {
    hasMore: boolean;
    total: number;
    limit: number;
    offset: number;
  };
}

const BATCH_SIZE = 18;

// Helper function to build URL params from filters
function buildFilterParams(filters: FilterState, offset: number): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.dateRange.start) {
    params.append("dateRangeStart", filters.dateRange.start.toISOString());
  }
  if (filters.dateRange.end) {
    params.append("dateRangeEnd", filters.dateRange.end.toISOString());
  }
  if (filters.categories.length > 0) {
    params.append("categories", filters.categories.join(","));
  }
  if (filters.tags.length > 0) {
    params.append("tags", filters.tags.join(","));
  }
  if (filters.location.type && filters.location.type !== "all") {
    params.append("locationType", filters.location.type);
    if (filters.location.cityId) {
      params.append("locationCityId", filters.location.cityId);
    }
    if (filters.location.standortId) {
      params.append("locationStandortId", filters.location.standortId);
    }
    if (filters.location.maxDistanceKm) {
      params.append(
        "locationMaxDistanceKm",
        filters.location.maxDistanceKm.toString()
      );
    }
  }
  if (filters.venues.length > 0) {
    params.append("venues", filters.venues.join(","));
  }
  if (filters.onlineOnly) {
    params.append("onlineOnly", "true");
  }
  if (filters.editorsChoiceOnly) {
    params.append("editorsChoiceOnly", "true");
  }
  if (filters.searchTerm) {
    params.append("searchTerm", filters.searchTerm);
  }
  if (filters.sortBy) {
    params.append("sortBy", filters.sortBy);
  }

  params.append("limit", BATCH_SIZE.toString());
  params.append("offset", offset.toString());

  return params;
}

// Fetch function for React Query
async function fetchEvents(
  filters: FilterState,
  pageParam: number
): Promise<EventsResponse> {
  const params = buildFilterParams(filters, pageParam);
  const { apiFetch } = await import('@/lib/api-client');
  const response = await apiFetch(`/api/events?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status}`);
  }

  return response.json();
}

export default function Home() {
  const queryClient = useQueryClient();
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    categories: [],
    tags: [],
    priceRange: "all",
    dateRange: {},
    location: { type: "all" },
    venues: [],
    onlineOnly: false,
    editorsChoiceOnly: false,
    sortBy: "date",
  });

  // Use React Query's useInfiniteQuery for automatic caching and pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["events", filters],
    queryFn: ({ pageParam = 0 }) => fetchEvents(filters, pageParam),
    getNextPageParam: (lastPage) => {
      // Return next offset if there are more pages
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.offset + lastPage.pagination.limit;
      }
      return undefined;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Flatten all pages into a single array of events
  const events = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.events);
  }, [data?.pages]);

  // Show error toast if query fails
  if (isError) {
    const message = error instanceof Error ? error.message : "Failed to load events";
    toast.error(message);
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // No need to manually refetch - React Query does it automatically when queryKey changes
  };

  const handleUpdateSearch = () => {
    // Invalidate and refetch when user explicitly updates search
    queryClient.invalidateQueries({ queryKey: ["events", filters] });
  };

  const handleEdit = (id: string) => {
    setEditingEventId(id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      const { apiFetch } = await import('@/lib/api-client');
      const response = await apiFetch(`/api/events/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Event deleted successfully");
        // Invalidate queries to refetch events
        queryClient.invalidateQueries({ queryKey: ["events"] });
      } else {
        toast.error("Failed to delete event");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete event";
      toast.error(message);
    }
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <>
      <EventListErrorBoundary>
        <EventCalendar
          events={events}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onFilterChange={handleFilterChange}
          onUpdateSearch={handleUpdateSearch}
          onLoadMore={handleLoadMore}
          hasMore={hasNextPage ?? false}
          loadingMore={isFetchingNextPage}
        />
      </EventListErrorBoundary>
      {editingEventId && (
        <EditEventModal
          open={!!editingEventId}
          onOpenChange={(open) => !open && setEditingEventId(null)}
          eventId={editingEventId}
        />
      )}
    </>
  );
}
