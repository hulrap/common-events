import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import type { FilterState } from '@/components/Calendar/EventFilters';

interface FilterContextValue {
  filters: FilterState;
  updateFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setFilters: (filters: FilterState) => void;
  isInitialized: boolean;
}

const DEFAULT_FILTERS: FilterState = {
  searchTerm: '',
  categories: [],
  tags: [],
  priceRange: 'all',
  dateRange: {
    preset: undefined,
    start: undefined,
    end: undefined,
  },
  location: {
    type: 'all',
  },
  venues: [],
  onlineOnly: false,
  editorsChoiceOnly: false,
  sortBy: 'date',
};

const FilterContext = createContext<FilterContextValue | undefined>(
  undefined
);

export function FilterProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load filters from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('eventFilters');
        if (stored) {
          const parsed = JSON.parse(stored) as FilterState;

          // If there's a preset, recalculate the dates based on current date
          if (parsed.dateRange?.preset && parsed.dateRange.preset !== 'custom') {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            switch (parsed.dateRange.preset) {
              case 'today': {
                parsed.dateRange.start = today;
                parsed.dateRange.start.setHours(0, 0, 0, 0);
                parsed.dateRange.end = today;
                parsed.dateRange.end.setHours(23, 59, 59, 999);
                break;
              }
              case 'tomorrow': {
                parsed.dateRange.start = tomorrow;
                parsed.dateRange.start.setHours(0, 0, 0, 0);
                parsed.dateRange.end = tomorrow;
                parsed.dateRange.end.setHours(23, 59, 59, 999);
                break;
              }
              case 'week': {
                parsed.dateRange.start = today;
                parsed.dateRange.start.setHours(0, 0, 0, 0);
                const weekEnd = new Date(today);
                weekEnd.setDate(weekEnd.getDate() + 7);
                parsed.dateRange.end = weekEnd;
                parsed.dateRange.end.setHours(23, 59, 59, 999);
                break;
              }
              case 'month': {
                parsed.dateRange.start = today;
                parsed.dateRange.start.setHours(0, 0, 0, 0);
                const monthEnd = new Date(today);
                monthEnd.setMonth(monthEnd.getMonth() + 1);
                parsed.dateRange.end = monthEnd;
                parsed.dateRange.end.setHours(23, 59, 59, 999);
                break;
              }
            }
          } else {
            // For custom dates, convert date strings back to Date objects
            if (parsed.dateRange?.start) {
              parsed.dateRange.start = new Date(parsed.dateRange.start);
            }
            if (parsed.dateRange?.end) {
              parsed.dateRange.end = new Date(parsed.dateRange.end);
            }
          }
          setFilters(parsed);
        }
      } catch (error) {
        console.error('Error loading filters from localStorage:', error);
      }
      setIsInitialized(true);
    }
  }, []);

  // Persist filters to localStorage
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem('eventFilters', JSON.stringify(filters));
      } catch (error) {
        console.error('Error saving filters to localStorage:', error);
      }
    }
  }, [filters, isInitialized]);

  const updateFilters = useCallback(
    (partialFilters: Partial<FilterState>) => {
      setFilters(prevFilters => ({
        ...prevFilters,
        ...partialFilters,
      }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const value: FilterContextValue = {
    filters,
    updateFilters,
    resetFilters,
    setFilters,
    isInitialized,
  };

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error(
      'useFilters must be used within a FilterProvider'
    );
  }
  return context;
}
