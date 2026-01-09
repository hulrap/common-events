import { useState, useEffect, useCallback, useRef } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { useMap } from '@vis.gl/react-google-maps';

// Types matching the API response
export interface MapPoint {
    type: 'point';
    id: string;
    lat: number;
    lng: number;
    event: any;
}

export interface MapCluster {
    type: 'cluster';
    id: string;
    lat: number;
    lng: number;
    count: number;
    events?: any[];
}

export type MapItem = MapPoint | MapCluster;

interface UseMapEventsResult {
    items: MapItem[];
    loading: boolean;
    error: Error | null;
}

export function useMapEvents(): UseMapEventsResult {
    const { filters, isInitialized } = useFilters();
    const map = useMap();
    const [items, setItems] = useState<MapItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const fetchMapItems = useCallback(async () => {
        if (!map || !isInitialized) return;

        try {
            setLoading(true);
            setError(null);

            const zoom = map.getZoom() || 12;
            const bounds = map.getBounds();

            // Build query params
            const params = new URLSearchParams();
            params.append('zoom', zoom.toString());

            if (bounds) {
                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();
                params.append('minLat', sw.lat().toString());
                params.append('maxLat', ne.lat().toString());
                params.append('minLng', sw.lng().toString());
                params.append('maxLng', ne.lng().toString());
            }

            // Add filters
            if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
            if (filters.categories.length > 0) params.append('categories', filters.categories.join(','));
            if (filters.tags.length > 0) params.append('tags', filters.tags.join(','));
            if (filters.dateRange.start) params.append('dateRangeStart', filters.dateRange.start instanceof Date ? filters.dateRange.start.toISOString() : filters.dateRange.start);
            if (filters.dateRange.end) params.append('dateRangeEnd', filters.dateRange.end instanceof Date ? filters.dateRange.end.toISOString() : filters.dateRange.end);
            if (filters.onlineOnly) params.append('onlineOnly', 'true');
            if (filters.editorsChoiceOnly) params.append('editorsChoiceOnly', 'true');
            if (filters.venues.length > 0) params.append('venues', filters.venues.join(','));

            console.log('[useMapEvents] Fetching map items:', `/api/events/map?${params.toString()}`);
            const response = await fetch(`/api/events/map?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch map items');

            const data = await response.json();
            console.log(`[useMapEvents] Fetched ${data.items.length} items`);
            setItems(data.items);
        } catch (err) {
            console.error('[useMapEvents] Error:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
            setItems([]); // Clear items on error to prevent stale data
        } finally {
            setLoading(false);
        }
    }, [map, filters, isInitialized]);

    // Initial fetch and filter changes
    useEffect(() => {
        fetchMapItems();
    }, [fetchMapItems]);

    // Map idle listener (pan/zoom)
    useEffect(() => {
        if (!map) return;

        const listener = map.addListener('idle', () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(fetchMapItems, 300);
        });

        return () => {
            if (listener) listener.remove();
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [map, fetchMapItems]);

    return { items, loading, error };
}
