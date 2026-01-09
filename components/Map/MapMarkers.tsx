import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { MapItem, MapPoint, MapCluster } from './hooks/useMapEvents';
import { getMarkerColor } from './utils';

interface MapMarkersProps {
    readonly items: MapItem[];
    readonly onSelectEvents: (events: any[]) => void;
}

// Helper to check if item is a cluster
const isCluster = (item: MapItem): item is MapCluster => item.type === 'cluster';

export function MapMarkers({ items, onSelectEvents }: MapMarkersProps) {
    const map = useMap();
    // We store markers that are currently "live" on the map.
    const markersRef = useRef<{ [key: string]: google.maps.marker.AdvancedMarkerElement }>({});

    // Track which items are currently in the process of exiting
    const exitingIdsRef = useRef<Set<string>>(new Set());

    // Update markers logic
    useEffect(() => {
        if (!map) return;

        const currentMarkers = markersRef.current;
        const exitingIds = exitingIdsRef.current;

        // precise mapping of incoming items
        const itemsMap = new Map(items.map(item => [item.id, item]));

        // 1. Identify markers that need to be removed
        Object.keys(currentMarkers).forEach(id => {
            if (!itemsMap.has(id) && !exitingIds.has(id)) {
                // Determine marker to remove
                const marker = currentMarkers[id];
                const element = marker.content as HTMLElement;

                if (element) {
                    // Start Exit Animation
                    exitingIds.add(id);

                    // Force a reflow if needed, then add exit class
                    requestAnimationFrame(() => {
                        element.classList.remove('marker-visible');
                        element.classList.add('marker-exit');
                    });

                    // Wait for transition to finish before removing from map
                    const onTransitionEnd = () => {
                        marker.map = null;
                        delete currentMarkers[id];
                        exitingIds.delete(id);
                    };

                    setTimeout(onTransitionEnd, 600); // 600ms match slowed animation
                } else {
                    marker.map = null;
                    delete currentMarkers[id];
                }
            }
        });

        // 2. Add or Update markers
        items.forEach(item => {
            // Ensure valid coordinates
            const lat = Number(item.lat);
            const lng = Number(item.lng);
            if (isNaN(lat) || isNaN(lng)) return;

            const position = { lat, lng };

            // Update existing
            if (currentMarkers[item.id]) {
                const marker = currentMarkers[item.id];

                // If it was exiting, cancel exit
                if (exitingIds.has(item.id)) {
                    exitingIds.delete(item.id);
                    const element = marker.content as HTMLElement;
                    if (element) {
                        element.classList.remove('marker-exit');
                        element.classList.add('marker-visible');
                    }
                }

                // Update content if it's a cluster and count changed
                if (isCluster(item)) {
                    const element = marker.content as HTMLElement;
                    const countSpan = element.querySelector('.cluster-count');
                    if (countSpan && countSpan.textContent !== String(item.count)) {
                        countSpan.textContent = String(item.count);
                        const count = item.count;
                        const size = count >= 100 ? '60px' : count >= 10 ? '50px' : '40px';
                        element.style.width = size;
                        element.style.height = size;
                        marker.zIndex = Number(google.maps.Marker.MAX_ZINDEX) + count;
                    }
                }

                marker.position = position;
                return;
            }

            // Create NEW Marker
            const content = document.createElement('div');
            // Base classes for animation
            content.classList.add('marker-view', 'marker-enter');

            let zIndex: number;

            if (item.type === 'cluster') {
                // Render Cluster
                const count = item.count;
                const size = count >= 100 ? '60px' : count >= 10 ? '50px' : '40px';

                content.style.cssText = `
                    color: white;
                    background: #ff9800;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    border: 3px solid white;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                    cursor: pointer;
                    width: ${size};
                    height: ${size};
                    font-size: ${count >= 100 ? '18px' : count >= 10 ? '16px' : '14px'};
                    pointer-events: auto;
                `;

                content.classList.add('gmp-clickable');
                content.innerHTML = `<span class="cluster-count">${count}</span>`;
                zIndex = Number(google.maps.Marker.MAX_ZINDEX) + count;
            } else {
                // Render Point
                const color = getMarkerColor(item.event);
                content.innerHTML = `
                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
                      <circle cx="16" cy="16" r="6" fill="white" opacity="0.8"/>
                    </svg>
                `;
                const wrapper = document.createElement('div');
                wrapper.innerHTML = content.innerHTML;

                content.style.cursor = 'pointer';
                content.classList.add('gmp-clickable');
                content.style.pointerEvents = 'auto';
                zIndex = Number(google.maps.Marker.MAX_ZINDEX) + 1;
            }

            const marker = new google.maps.marker.AdvancedMarkerElement({
                map,
                position,
                content,
                zIndex,
                title: item.type === 'point' ? item.event.title : `Cluster of ${item.count}`,
            });

            // Handle Clicks
            const handleClick = (e?: any) => {
                try {
                    e?.stopPropagation?.();
                } catch (err) {
                    // Ignore event errors
                }

                if (item.type === 'cluster') {
                    if (item.events && item.events.length > 0) {
                        onSelectEvents(item.events);
                        map.panTo(position);
                    } else {
                        const currentZoom = map.getZoom() || 0;
                        map.panTo(position);
                        setTimeout(() => {
                            map.setZoom(currentZoom + 2);
                        }, 100);
                    }
                } else {
                    // Point
                    onSelectEvents([item.event]);
                    map.panTo(position);
                }
            };

            marker.addListener('click', handleClick);
            content.addEventListener('click', handleClick);

            currentMarkers[item.id] = marker;

            // Trigger Enter Animation
            requestAnimationFrame(() => {
                content.classList.remove('marker-enter');
                content.classList.add('marker-visible');
            });
        });

    }, [items, map, onSelectEvents]);

    // Cleanup all markers on unmount
    useEffect(() => {
        return () => {
            Object.values(markersRef.current).forEach(marker => {
                marker.map = null;
            });
            markersRef.current = {};
            exitingIdsRef.current.clear();
        };
    }, []);

    // We don't render InfoWindow here anymore
    return null;
}
