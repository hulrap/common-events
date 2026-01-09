import { useState, useEffect, useCallback, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Save, X, Plus, Search, ChevronDown, ChevronUp } from "lucide-react";
import { format, startOfToday, startOfTomorrow, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { useConfig } from "@/hooks/useConfig";
import { apiFetch } from '@/lib/api-client';
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/router";
import { toast } from "sonner";

interface EventFiltersProps {
  readonly onFilterChange: (filters: FilterState) => void;
  readonly initialFilters?: FilterState;
  readonly onUpdateSearch?: () => void;
}

export interface FilterState {
  searchTerm: string;
  categories: string[];
  tags: string[];
  priceRange: "all" | "free" | "paid";
  dateRange: {
    preset?: "today" | "tomorrow" | "weekend" | "week" | "month" | "custom";
    start?: Date;
    end?: Date;
  };
  location: {
    type: "city" | "standort" | "all";
    cityId?: string;
    standortId?: string;
    maxDistanceKm?: number;
  };
  venues: string[];
  onlineOnly: boolean;
  editorsChoiceOnly: boolean;
  sortBy: "date" | "title" | "newest";
}

interface FilterPreference {
  id: string;
  name: string;
  filterConfig: FilterState;
  isDefault: boolean;
}

const DATE_PRESETS = {
  today: { label: "Today", getRange: () => ({ start: startOfToday(), end: addDays(startOfToday(), 1) }) },
  tomorrow: { label: "Tomorrow", getRange: () => ({ start: startOfTomorrow(), end: addDays(startOfTomorrow(), 1) }) },
  weekend: { label: "This Weekend", getRange: () => ({ start: startOfWeek(startOfToday(), { weekStartsOn: 6 }), end: endOfWeek(startOfToday(), { weekStartsOn: 6 }) }) },
  week: { label: "This Week", getRange: () => ({ start: startOfWeek(startOfToday()), end: endOfWeek(startOfToday()) }) },
  month: { label: "This Month", getRange: () => ({ start: startOfMonth(startOfToday()), end: endOfMonth(startOfToday()) }) },
  custom: { label: "Custom", getRange: () => undefined },
} as const;

const DEFAULT_FILTERS: FilterState = {
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
};

function isDefaultFilters(filters: FilterState): boolean {
  const hasCategories = filters.categories?.length > 0;
  const hasDateRange = !!filters.dateRange?.preset;
  const hasLocationFilter = filters.location?.type !== "all";
  const hasVenues = filters.venues?.length > 0;
  const hasOnlineOnly = filters.onlineOnly;
  const hasEditorsChoiceOnly = filters.editorsChoiceOnly;
  const hasSearchTerm = filters.searchTerm !== "";
  const hasPriceRange = filters.priceRange !== "all";

  return !hasCategories && !hasDateRange && !hasLocationFilter && !hasVenues && !hasOnlineOnly && !hasEditorsChoiceOnly && !hasSearchTerm && !hasPriceRange;
}

export function EventFilters({ onFilterChange, initialFilters, onUpdateSearch }: EventFiltersProps) {
  const { cities } = useConfig();
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Array<{ id: string; name: string; color?: string }>>([]);
  const [venues, setVenues] = useState<Array<{ id: string; name: string }>>([]);
  const [userLocations, setUserLocations] = useState<Array<{ id: string; name: string; latitude: number; longitude: number }>>([]);
  const [filterPreferences, setFilterPreferences] = useState<FilterPreference[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState("");
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [showVenueSelector, setShowVenueSelector] = useState(false);
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [venueSearch, setVenueSearch] = useState("");
  const [defaultFilterEnabled, setDefaultFilterEnabled] = useState(() => {
    if (globalThis.window !== undefined) {
      return localStorage.getItem("defaultFilterDisabled") !== "true";
    }
    return true;
  });

  // Mobile filter bar - user-controlled collapse/expand for additional filters
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const normalizeFilters = (filters: Partial<FilterState>): FilterState => {
    // Parse date strings to Date objects (for saved filters from DB)
    let normalizedDateRange = filters.dateRange || {};
    if (normalizedDateRange.start && typeof normalizedDateRange.start === 'string') {
      normalizedDateRange = { ...normalizedDateRange, start: new Date(normalizedDateRange.start) };
    }
    if (normalizedDateRange.end && typeof normalizedDateRange.end === 'string') {
      normalizedDateRange = { ...normalizedDateRange, end: new Date(normalizedDateRange.end) };
    }

    return {
      searchTerm: filters.searchTerm || "",
      categories: filters.categories || [],
      tags: filters.tags || [],
      priceRange: filters.priceRange || "all",
      dateRange: normalizedDateRange,
      location: filters.location || { type: "all" },
      venues: filters.venues || [],
      onlineOnly: filters.onlineOnly || false,
      editorsChoiceOnly: filters.editorsChoiceOnly || false,
      sortBy: filters.sortBy || "date",
    };
  };

  const [filters, setFilters] = useState<FilterState>(() =>
    normalizeFilters(initialFilters || DEFAULT_FILTERS)
  );
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(() =>
    normalizeFilters(initialFilters || DEFAULT_FILTERS)
  );

  // Apply initial filters immediately on mount - don't wait for auth
  useEffect(() => {
    const savedFilters = localStorage.getItem("pendingFilterSave");
    if (savedFilters && user) {
      try {
        const parsedFilters = JSON.parse(savedFilters);
        const normalized = normalizeFilters(parsedFilters);
        setFilters(normalized);
        setAppliedFilters(normalized);
        localStorage.removeItem("pendingFilterSave");
        setShowSaveDialog(true);
        onFilterChangeRef.current(normalized);
      } catch {
        localStorage.removeItem("pendingFilterSave");
      }
    } else if (initialFilters) {
      const normalized = normalizeFilters(initialFilters);
      setFilters(normalized);
      setAppliedFilters(normalized);
      onFilterChangeRef.current(normalized);
    } else if (!hasAppliedDefaultFilterRef.current) {
      // No initial filters and no default applied yet - apply defaults immediately
      // This ensures events load right away without waiting for auth/preferences
      const defaultFilters = normalizeFilters(DEFAULT_FILTERS);
      hasAppliedDefaultFilterRef.current = true;
      setFilters(defaultFilters);
      setAppliedFilters(defaultFilters);
      onFilterChangeRef.current(defaultFilters);
    }
  }, [initialFilters, user]); // Removed onFilterChange to prevent infinite loop

  const fetchCategories = useCallback(async () => {
    // Ensure we're in browser environment
    if (globalThis.window === undefined) return;

    try {
      const response = await apiFetch("/api/categories", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        // Non-200 responses - set empty array but don't throw
        setCategories([]);
      }
    } catch (error) {
      // Network errors or other fetch failures - silently handle
      // Only log in development to avoid cluttering console
      if (process.env.NODE_ENV === "development") {
        console.warn("Categories fetch failed (non-critical):", error);
      }
      setCategories([]);
    }
  }, []);

  const fetchVenues = useCallback(async () => {
    // Ensure we're in browser environment
    if (globalThis.window === undefined) return;

    try {
      const response = await apiFetch("/api/venues", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVenues(data);
      } else {
        // Non-200 responses - set empty array but don't throw
        setVenues([]);
      }
    } catch (error) {
      // Network errors or other fetch failures - silently handle
      // Only log in development to avoid cluttering console
      if (process.env.NODE_ENV === "development") {
        console.warn("Venues fetch failed (non-critical):", error);
      }
      setVenues([]);
    }
  }, []);

  const fetchUserLocations = useCallback(async () => {
    if (!user) return;
    // Ensure we're in browser environment
    if (globalThis.window === undefined) return;

    try {
      const response = await apiFetch("/api/user/locations", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserLocations(data);
      } else if (response.status === 401) {
        // User not authenticated, silently fail
        setUserLocations([]);
      } else {
        // Other errors - set empty array but don't throw
        setUserLocations([]);
      }
    } catch (error) {
      // Network error or other fetch failures - silently handle
      // Only log in development to avoid cluttering console
      if (process.env.NODE_ENV === "development") {
        console.warn("User locations fetch failed (non-critical):", error);
      }
      setUserLocations([]);
    }
  }, [user]);

  const hasAppliedDefaultFilterRef = useRef(false);
  const hasFetchedPreferencesRef = useRef(false);
  const onFilterChangeRef = useRef(onFilterChange);

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  }, [onFilterChange]);

  const fetchFilterPreferences = useCallback(async () => {
    if (!user) return;
    // Ensure we're in browser environment
    if (globalThis.window === undefined) return;
    // Prevent fetching preferences multiple times
    if (hasFetchedPreferencesRef.current) return;

    try {
      const response = await apiFetch("/api/user/filter-preferences", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        hasFetchedPreferencesRef.current = true;
        const data = await response.json();
        setFilterPreferences(data);
        const defaultPref = data.find((p: FilterPreference) => p.isDefault);
        const defaultFilterDisabled = localStorage.getItem("defaultFilterDisabled") === "true";

        // Only apply default filter if:
        // 1. Default preference exists
        // 2. No initial filters were provided
        // 3. Default filter is not disabled
        // 4. We haven't already applied it
        if (defaultPref && !initialFilters && !defaultFilterDisabled && !hasAppliedDefaultFilterRef.current) {
          const normalized = normalizeFilters(defaultPref.filterConfig);
          hasAppliedDefaultFilterRef.current = true;
          // Use setTimeout to defer the state update and filter change to next tick
          // This prevents blocking the main thread
          setTimeout(() => {
            setFilters(normalized);
            setAppliedFilters(normalized);
            // Trigger search automatically when default filter is applied
            // Only call onFilterChange - the parent's useEffect will handle fetching
            onFilterChangeRef.current(normalized);
            setDefaultFilterEnabled(true);
          }, 0);
        } else if (defaultPref) {
          setDefaultFilterEnabled(!defaultFilterDisabled);
        } else if (!initialFilters && !hasAppliedDefaultFilterRef.current) {
          // No default filter exists - filters should already be set by mount useEffect
          // Just mark as applied to prevent duplicate application
          hasAppliedDefaultFilterRef.current = true;
        }
      } else if (response.status === 401) {
        // User not authenticated, silently fail
        setFilterPreferences([]);
      } else {
        // Other errors - set empty array but don't throw
        setFilterPreferences([]);
      }
    } catch (error) {
      // Network error or other fetch failures - silently handle
      // Only log in development to avoid cluttering console
      if (process.env.NODE_ENV === "development") {
        console.warn("Filter preferences fetch failed (non-critical):", error);
      }
      setFilterPreferences([]);
    }
  }, [user, initialFilters]); // Removed onFilterChange to prevent infinite loop

  useEffect(() => {
    // Defer fetches to avoid blocking initial render and ensure API routes are ready
    const timeoutId = setTimeout(() => {
      fetchCategories();
      fetchVenues();
      if (user) {
        fetchUserLocations();
        fetchFilterPreferences();
      } else {
        // Reset refs when user logs out so preferences can be fetched again on next login
        hasAppliedDefaultFilterRef.current = false;
        hasFetchedPreferencesRef.current = false;
      }
    }, 0);

    return () => {
    };
  }, [user, fetchCategories, fetchVenues, fetchUserLocations, fetchFilterPreferences]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleUpdateSearch = () => {
    setAppliedFilters(filters);
    onFilterChange(filters);
    if (onUpdateSearch) {
      onUpdateSearch();
    }
  };

  const hasFilterChanges = JSON.stringify(filters) !== JSON.stringify(appliedFilters);

  const handleDatePreset = (preset: keyof typeof DATE_PRESETS) => {
    let newDateRange: FilterState["dateRange"];
    if (preset === "custom") {
      newDateRange = { preset: "custom" };
    } else {
      const range = DATE_PRESETS[preset].getRange();
      if (range) {
        newDateRange = { preset, start: range.start, end: range.end };
      } else {
        return;
      }
    }
    const newFilters = { ...filters, dateRange: newDateRange };
    setFilters(newFilters);
    setAppliedFilters(newFilters);
    onFilterChange(newFilters);
    if (onUpdateSearch) {
      onUpdateSearch();
    }
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    let newDateRange: FilterState["dateRange"];
    if (range?.from && range?.to) {
      newDateRange = { preset: "custom", start: range.from, end: range.to };
    } else if (range?.from) {
      newDateRange = { preset: "custom", start: range.from };
    } else {
      return;
    }
    const newFilters = { ...filters, dateRange: newDateRange };
    setFilters(newFilters);
    setAppliedFilters(newFilters);
    onFilterChange(newFilters);
    if (onUpdateSearch) {
      onUpdateSearch();
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((id) => id !== categoryId)
      : [...filters.categories, categoryId];
    updateFilter("categories", newCategories);
  };

  const selectAllCategories = () => {
    const allCategoryIds = categories.map((c) => c.id);
    updateFilter("categories", allCategoryIds);
  };

  const deselectAllCategories = () => {
    updateFilter("categories", []);
  };

  const toggleVenue = (venueId: string) => {
    const currentVenues = filters.venues || [];
    const newVenues = currentVenues.includes(venueId)
      ? currentVenues.filter((id) => id !== venueId)
      : [...currentVenues, venueId];
    updateFilter("venues", newVenues);
  };

  const selectAllVenues = () => {
    const allVenueIds = venues.map((v) => v.id);
    updateFilter("venues", allVenueIds);
  };

  const deselectAllVenues = () => {
    updateFilter("venues", []);
  };

  const handleSaveFilterClick = () => {
    if (!user) {
      localStorage.setItem("pendingFilterSave", JSON.stringify(filters));
      router.push(`/auth/signin?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }
    setShowSaveDialog(true);
  };

  const handleSaveFilter = async () => {
    if (!user) {
      toast.error("Please sign in to save filters");
      return;
    }
    if (!saveFilterName.trim()) {
      toast.error("Please enter a filter name");
      return;
    }

    try {
      const response = await apiFetch("/api/user/filter-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: saveFilterName,
          filterConfig: filters,
        }),
      });

      if (response.ok) {
        toast.success("Filter saved successfully");
        setShowSaveDialog(false);
        setSaveFilterName("");
        fetchFilterPreferences();
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        toast.error(errorData.error || "Failed to save filter");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save filter";
      console.error("Error saving filter:", error);
      toast.error(errorMessage);
    }
  };

  const handleLoadFilter = (pref: FilterPreference) => {
    const normalized = normalizeFilters(pref.filterConfig);
    setFilters(normalized);
    setAppliedFilters(normalized);
    onFilterChange(normalized);
    toast.success(`Loaded filter: ${pref.name}`);
  };

  const handleDeleteFilter = async (id: string) => {
    if (!user) return;
    try {
      const response = await apiFetch(`/api/user/filter-preferences/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Filter deleted");
        fetchFilterPreferences();
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        toast.error(errorData.error || "Failed to delete filter");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete filter";
      console.error("Error deleting filter:", error);
      toast.error(errorMessage);
    }
  };

  const selectedCategories = categories.filter((c) => filters.categories.includes(c.id));
  const selectedCity = cities.find((c) => c.id === filters.location.cityId) || cities[0];
  const selectedStandort = userLocations.find((l) => l.id === filters.location.standortId);

  const getDateRangeDisplay = (): string => {
    if (!filters.dateRange.preset) {
      return "All Dates";
    }

    if (filters.dateRange.preset === "custom" && filters.dateRange.start) {
      const startFormatted = format(filters.dateRange.start, "MMM d");
      const endFormatted = filters.dateRange.end ? format(filters.dateRange.end, "MMM d") : null;
      return endFormatted ? `${startFormatted} - ${endFormatted}` : `${startFormatted} +`;
    }

    return DATE_PRESETS[filters.dateRange.preset]?.label || "All Dates";
  };

  const dateRangeDisplay = getDateRangeDisplay();

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredVenues = venues.filter((venue) =>
    venue.name.toLowerCase().includes(venueSearch.toLowerCase())
  );

  const selectedVenues = venues.filter((v) => (filters.venues || []).includes(v.id));

  const getLocationDisplay = (): string => {
    if (filters.location.type === "standort" && selectedStandort) {
      const distanceText = filters.location.maxDistanceKm
        ? ` (${filters.location.maxDistanceKm}km)`
        : "";
      return `${selectedStandort.name}${distanceText}`;
    }
    if (filters.location.type === "city") {
      return selectedCity.name;
    }
    return "All Locations";
  };

  return (
    <div className="sticky top-0 z-40 bg-black">
      {/* Main Filter Row - Always visible, sticky on mobile */}
      <div className="flex flex-col gap-3 p-4">
        {/* Primary filter buttons row */}
        <div className="flex flex-wrap md:flex-nowrap gap-2 md:overflow-x-auto md:whitespace-nowrap scrollbar-hide">
          <Popover open={showDateSelector} onOpenChange={setShowDateSelector}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex h-10 shrink items-center gap-x-1 md:gap-x-2 rounded-full bg-black px-3 md:pl-4 md:pr-4 text-slate-200 border border-white/10 grain-texture header-glass text-xs md:text-sm"
              >
                <span className="text-xs md:text-sm font-medium">{dateRangeDisplay}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3">
                <div className="space-y-2 mb-4">
                  <Label>Quick Presets</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(DATE_PRESETS).map(([key, preset]) => (
                      <Button
                        key={key}
                        variant={filters.dateRange.preset === key ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          handleDatePreset(key as keyof typeof DATE_PRESETS);
                          if (key !== "custom") setShowDateSelector(false);
                        }}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
                {filters.dateRange.preset === "custom" && (
                  <div className="space-y-2">
                    <Label>Select Date Range</Label>
                    <Calendar
                      mode="range"
                      selected={{
                        from: filters.dateRange.start,
                        to: filters.dateRange.end,
                      }}
                      onSelect={handleDateRangeSelect}
                      numberOfMonths={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setShowDateSelector(false)}>
                        Done
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newFilters = { ...filters, dateRange: {} };
                          setFilters(newFilters);
                          setAppliedFilters(newFilters);
                          onFilterChange(newFilters);
                          if (onUpdateSearch) {
                            onUpdateSearch();
                          }
                          setShowDateSelector(false);
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            className="flex h-10 shrink items-center gap-x-1 md:gap-x-2 rounded-full bg-black px-3 md:pl-4 md:pr-4 text-slate-200 border border-white/10 grain-texture header-glass text-xs md:text-sm"
            onClick={() => setShowCategorySelector(!showCategorySelector)}
          >
            <span className="text-xs md:text-sm font-medium">
              {selectedCategories.length > 0 ? `${selectedCategories.length} selected` : "All Categories"}
            </span>
          </Button>

          <Button
            variant="outline"
            className="flex h-10 shrink items-center gap-x-1 md:gap-x-2 rounded-full bg-black px-3 md:pl-4 md:pr-4 text-slate-200 border border-white/10 grain-texture header-glass text-xs md:text-sm"
            onClick={() => setShowLocationSelector(!showLocationSelector)}
          >
            <span className="text-xs md:text-sm font-medium">{getLocationDisplay()}</span>
          </Button>

          {/* Mobile: Toggle button to show/hide more filters */}
          <button
            type="button"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="md:hidden flex h-10 shrink items-center gap-1 rounded-full bg-black px-3 text-slate-200 border border-white/10 grain-texture header-glass text-xs"
            aria-label={showMoreFilters ? "Hide more filters" : "Show more filters"}
          >
            <span className="text-xs font-medium">More</span>
            {showMoreFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Secondary filters - always visible on desktop, toggleable on mobile */}
          <div className={`flex flex-wrap gap-2 ${showMoreFilters ? 'flex' : 'hidden'} md:flex`}>
            <Button
              variant="outline"
              className="flex h-10 shrink items-center gap-x-1 md:gap-x-2 rounded-full bg-black px-3 md:pl-4 md:pr-4 text-slate-200 border border-white/10 grain-texture header-glass text-xs md:text-sm"
              onClick={() => setShowVenueSelector(!showVenueSelector)}
            >
              <span className="text-xs md:text-sm font-medium">
                {selectedVenues.length > 0 ? `${selectedVenues.length} selected` : "All Venues"}
              </span>
            </Button>

            <button
              type="button"
              onClick={() => {
                const newValue = !filters.editorsChoiceOnly;
                const newFilters = { ...filters, editorsChoiceOnly: newValue };
                setFilters(newFilters);
                setAppliedFilters(newFilters);
                onFilterChange(newFilters);
                if (onUpdateSearch) {
                  onUpdateSearch();
                }
              }}
              className={`flex h-10 shrink items-center gap-x-1 md:gap-x-2 rounded-full px-3 md:pl-4 md:pr-4 text-xs md:text-sm font-medium transition-colors ${filters.editorsChoiceOnly
                ? "bg-brand-purple text-white hover:bg-brand-blurple border border-brand-purple/50"
                : "bg-black text-slate-200 hover:bg-black/80 border border-white/10 grain-texture header-glass"
                }`}
            >
              <span>Editor&apos;s Choice</span>
            </button>

            {user && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex h-10 shrink items-center gap-x-1 md:gap-x-2 rounded-full bg-black px-3 md:pl-4 md:pr-4 text-slate-200 border border-white/10 grain-texture header-glass text-xs md:text-sm">
                    <span className="text-xs md:text-sm font-medium">Saved Filters</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="start">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Saved Filters</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowSaveDialog(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    </div>
                    {filterPreferences.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No saved filters</div>
                    ) : (
                      <div className="space-y-2">
                        {filterPreferences.map((pref) => (
                          <div key={pref.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{pref.name}</div>
                              {pref.isDefault && <span className="text-xs text-muted-foreground">(Default)</span>}
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleLoadFilter(pref)}>
                                Load
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteFilter(pref.id)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {!isDefaultFilters(filters) && (
              <Button
                variant="outline"
                onClick={handleSaveFilterClick}
                className="flex h-10 shrink items-center gap-1 md:gap-2 rounded-full bg-black px-3 md:pl-4 md:pr-4 text-slate-200 border border-white/10 grain-texture header-glass text-xs md:text-sm"
              >
                <Save className="h-3 w-3 md:h-4 md:w-4" />
                <span className="text-xs md:text-sm font-medium">Save Filter</span>
              </Button>
            )}

            <div className="flex items-center gap-2">
              {!isDefaultFilters(filters) && (
                <Button
                  onClick={() => {
                    const normalized = normalizeFilters(DEFAULT_FILTERS);
                    setFilters(normalized);
                    setAppliedFilters(normalized);
                    onFilterChange(normalized);
                    if (onUpdateSearch) {
                      onUpdateSearch();
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-xs bg-black text-slate-200 border border-white/10 grain-texture header-glass hover:bg-black/80"
                >
                  Clear Filters
                </Button>
              )}
              {user && filterPreferences.find((p) => p.isDefault) && (
                <Button
                  onClick={() => {
                    const newState = !defaultFilterEnabled;
                    setDefaultFilterEnabled(newState);
                    localStorage.setItem("defaultFilterDisabled", newState ? "false" : "true");
                    if (newState) {
                      const defaultPref = filterPreferences.find((p) => p.isDefault);
                      if (defaultPref) {
                        const normalized = normalizeFilters(defaultPref.filterConfig);
                        setFilters(normalized);
                        setAppliedFilters(normalized);
                        onFilterChange(normalized);
                        if (onUpdateSearch) {
                          onUpdateSearch();
                        }
                      }
                    } else {
                      const normalized = normalizeFilters(DEFAULT_FILTERS);
                      setFilters(normalized);
                      setAppliedFilters(normalized);
                      onFilterChange(normalized);
                      if (onUpdateSearch) {
                        onUpdateSearch();
                      }
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-xs"
                >
                  {defaultFilterEnabled ? "Disable" : "Enable"} Default Filter
                </Button>
              )}
              <Button
                onClick={handleUpdateSearch}
                disabled={!hasFilterChanges}
                variant="outline"
                className={`flex h-10 shrink items-center gap-1 md:gap-2 rounded-full px-3 md:pl-4 md:pr-4 border text-xs md:text-sm font-medium transition-colors ${hasFilterChanges
                  ? "bg-brand-green text-black border-brand-green hover:bg-brand-green/90 animate-pulse"
                  : "bg-black/50 text-slate-400 border-white/5 cursor-not-allowed opacity-50"
                  }`}
              >
                Update Search
              </Button>

            </div>
          </div>
          {/* End of secondary filters wrapper */}
        </div>

        {showCategorySelector && (
          <div className="w-full p-4 bg-slate-900 rounded-lg border border-slate-700 grain-texture">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Select Categories</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectAllCategories}
                  className="h-6 text-xs"
                >
                  Select All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={deselectAllCategories}
                  className="h-6 text-xs"
                >
                  Deselect All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6"
                  onClick={() => {
                    setShowCategorySelector(false);
                    setCategorySearch("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="pl-8 h-8"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[200px]">
              {filteredCategories.length === 0 ? (
                <div className="text-sm text-muted-foreground w-full text-center py-4">
                  No categories found
                </div>
              ) : (
                (() => {
                  const sortedCategories = [...filteredCategories].sort((a, b) => a.name.localeCompare(b.name));
                  return sortedCategories.map((category) => {
                    const isSelected = filters.categories.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className={`h-9 px-4 rounded-full text-sm font-medium transition-colors border flex items-center justify-center ${isSelected
                          ? "bg-brand-green text-slate-900 border-brand-green hover:opacity-90"
                          : "bg-black text-slate-200 border-white/10 hover:bg-white/10"
                          }`}
                      >
                        {category.name}
                      </button>
                    );
                  });
                })()
              )}
            </div>
          </div>
        )}

        {showLocationSelector && (
          <div className="w-full p-4 bg-slate-900 rounded-lg border border-slate-700 grain-texture">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Location Filter</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6"
                onClick={() => {
                  setShowLocationSelector(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Location Type</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateFilter("location", { type: "all", cityId: undefined, standortId: undefined, maxDistanceKm: undefined });
                    }}
                    className={`h-9 px-4 rounded-full text-sm font-medium transition-colors border flex items-center justify-center ${filters.location.type === "all"
                      ? "bg-brand-green text-slate-900 border-brand-green hover:opacity-90"
                      : "bg-black text-slate-200 border-white/10 hover:bg-white/10"
                      }`}
                  >
                    All Locations
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateFilter("location", { type: "city", cityId: "vienna", standortId: undefined, maxDistanceKm: undefined });
                    }}
                    className={`h-9 px-4 rounded-full text-sm font-medium transition-colors border flex items-center justify-center ${filters.location.type === "city"
                      ? "bg-brand-green text-slate-900 border-brand-green hover:opacity-90"
                      : "bg-black text-slate-200 border-white/10 hover:bg-white/10"
                      }`}
                  >
                    City
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateFilter("location", { type: "standort", cityId: undefined, standortId: undefined, maxDistanceKm: undefined });
                    }}
                    className={`h-9 px-4 rounded-full text-sm font-medium transition-colors border flex items-center justify-center ${filters.location.type === "standort"
                      ? "bg-brand-green text-slate-900 border-brand-green hover:opacity-90"
                      : "bg-black text-slate-200 border-white/10 hover:bg-white/10"
                      }`}
                  >
                    My Location (Standort)
                  </button>
                </div>
              </div>

              {filters.location.type === "city" && (
                <div className="space-y-2">
                  <Label>Select City</Label>
                  <div className="flex flex-wrap gap-2">
                    {cities.map((city) => {
                      const isSelected = filters.location.cityId === city.id;
                      return (
                        <button
                          key={city.id}
                          type="button"
                          onClick={() => updateFilter("location", { ...filters.location, cityId: city.id })}
                          className={`h-9 px-4 rounded-full text-sm font-medium transition-colors border flex items-center justify-center ${isSelected
                            ? "bg-brand-green text-slate-900 border-brand-green hover:opacity-90"
                            : "bg-black text-slate-200 border-white/10 hover:bg-white/10"
                            }`}
                        >
                          {city.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {filters.location.type === "standort" && (
                <div className="space-y-4">
                  {userLocations.length > 0 ? (
                    <div className="space-y-2">
                      <Label>My Location (Standort)</Label>
                      <div className="flex flex-wrap gap-2">
                        {userLocations.map((loc) => {
                          const isSelected = filters.location.standortId === loc.id;
                          return (
                            <button
                              key={loc.id}
                              type="button"
                              onClick={() => updateFilter("location", { ...filters.location, standortId: loc.id })}
                              className={`h-9 px-4 rounded-full text-sm font-medium transition-colors border flex items-center justify-center ${isSelected
                                ? "bg-brand-green text-slate-900 border-brand-green hover:opacity-90"
                                : "bg-black text-slate-200 border-white/10 hover:bg-white/10"
                                }`}
                            >
                              {loc.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No locations saved.{" "}
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => {
                          navigator.geolocation.getCurrentPosition(
                            async (position) => {
                              try {
                                const response = await apiFetch("/api/user/locations", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    name: "My Location",
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude,
                                    isDefault: true,
                                  }),
                                });
                                if (response.ok) {
                                  toast.success("Location saved!");
                                  fetchUserLocations();
                                } else {
                                  let errorMessage = "Failed to save location";
                                  try {
                                    const errorData = await response.json();
                                    errorMessage = errorData.error || errorMessage;
                                  } catch {
                                    errorMessage = "Failed to save location";
                                  }
                                  toast.error(errorMessage);
                                }
                              } catch (error) {
                                const errorMessage = error instanceof Error ? error.message : "Failed to save location";
                                console.error("Error saving location:", error);
                                toast.error(errorMessage);
                              }
                            },
                            (error) => {
                              const errorMessage = error instanceof Error ? error.message : "Could not get your location";
                              console.error("Geolocation error:", error);
                              toast.error(`${errorMessage}. Please enable location access.`);
                            }
                          );
                        }}
                      >
                        Add location
                      </Button>
                    </div>
                  )}
                  {filters.location.standortId && (
                    <div className="space-y-2">
                      <Label>Max Distance (km)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="1000"
                        value={filters.location.maxDistanceKm || ""}
                        onChange={(e) =>
                          updateFilter("location", {
                            ...filters.location,
                            maxDistanceKm: e.target.value ? Number.parseInt(e.target.value, 10) : undefined,
                          })
                        }
                        placeholder="e.g. 50"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {showVenueSelector && (
          <div className="w-full p-4 bg-slate-900 rounded-lg border border-slate-700 grain-texture">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Select Venues</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectAllVenues}
                  className="h-6 text-xs"
                >
                  Select All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={deselectAllVenues}
                  className="h-6 text-xs"
                >
                  Deselect All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6"
                  onClick={() => {
                    setShowVenueSelector(false);
                    setVenueSearch("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search venues..."
                  value={venueSearch}
                  onChange={(e) => setVenueSearch(e.target.value)}
                  className="pl-8 h-8"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[200px]">
              {filteredVenues.length === 0 ? (
                <div className="text-sm text-muted-foreground w-full text-center py-4">
                  No venues found
                </div>
              ) : (
                (() => {
                  const sortedVenues = [...filteredVenues].sort((a, b) => a.name.localeCompare(b.name));
                  return sortedVenues.map((venue) => {
                    const isSelected = (filters.venues || []).includes(venue.id);
                    return (
                      <button
                        key={venue.id}
                        type="button"
                        onClick={() => toggleVenue(venue.id)}
                        className={`h-9 px-4 rounded-full text-sm font-medium transition-colors border flex items-center justify-center ${isSelected
                          ? "bg-brand-green text-slate-900 border-brand-green hover:opacity-90"
                          : "bg-black text-slate-200 border-white/10 hover:bg-white/10"
                          }`}
                      >
                        {venue.name}
                      </button>
                    );
                  });
                })()
              )}
            </div>
          </div>
        )}



        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg w-96">
              <h3 className="text-lg font-semibold mb-4">Save Filter</h3>
              <div className="space-y-4">
                <div>
                  <Label>Filter Name</Label>
                  <Input
                    value={saveFilterName}
                    onChange={(e) => setSaveFilterName(e.target.value)}
                    placeholder="e.g., Weekend Events in Vienna"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveFilter}>Save</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-1 px-2 py-1 bg-primary/20 rounded-full text-sm"
              >
                <span>{category.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={() => toggleCategory(category.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
