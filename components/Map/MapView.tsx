import { Map } from '@vis.gl/react-google-maps';
import { VIENNA_CENTER, MAP_ZOOM_LEVELS } from '@/lib/maps/styles';
import { MapMarkers } from './MapMarkers';
import { useMapEvents } from './hooks/useMapEvents';
import { ChevronsRight, ChevronUp, ChevronsLeft, ChevronDown } from 'lucide-react'; // Added imports

import { useLoading } from '@/contexts/LoadingContext';
import { useEffect, useState, useCallback } from 'react';
import { MapSidebar } from './MapSidebar';

const HEADER_HEIGHT = 80; // ~5rem in pixels

export function MapView() {
    const { items, loading } = useMapEvents();
    const { addLoadingHold, removeLoadingHold } = useLoading();

    const [selectedEvents, setSelectedEvents] = useState<any[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open (Feed mode)

    // Close sidebar on mobile mount
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            }
        };
        // Initial check
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, []);

    useEffect(() => {
        addLoadingHold('map-view');
        return () => removeLoadingHold('map-view');
    }, [addLoadingHold, removeLoadingHold]);

    // Handler when user clicks a marker or cluster
    const handleSelectParams = useCallback((events: any[]) => {
        setSelectedEvents(events);
        setIsSidebarOpen(true);
    }, []);

    // Handler to close/reset selection
    const handleCloseSidebar = useCallback(() => {
        if (selectedEvents.length > 0) {
            // Clear selection but close sidebar as per "toggle" behavior expectations
            setSelectedEvents([]);
            setIsSidebarOpen(false);
        } else {
            // Already showing feed, so close
            setIsSidebarOpen(false);
        }
    }, [selectedEvents]);

    return (
        <>
            <Map
                mapId="f5469ea04368810b25fd913c"
                defaultCenter={VIENNA_CENTER}
                defaultZoom={MAP_ZOOM_LEVELS.default}
                gestureHandling={'greedy'}
                colorScheme={'DARK'}
                disableDefaultUI={false}
                zoomControl={false}
                mapTypeControl={false}
                scaleControl={false}
                streetViewControl={false}
                rotateControl={false}
                fullscreenControl={false}
                clickableIcons={false}
                minZoom={3}
                maxZoom={20}
                onTilesLoaded={() => removeLoadingHold('map-view')}
                className="w-full h-full"
                style={{ width: '100%', height: '100%' }}
                onClick={() => {
                    // Clicking map background clears selection
                    setSelectedEvents([]);
                }}
            >
                <MapMarkers
                    items={items}
                    onSelectEvents={handleSelectParams}
                />
            </Map>

            {/* Stable Sidebar */}
            <MapSidebar
                isOpen={isSidebarOpen}
                onClose={handleCloseSidebar}
                selectedEvents={selectedEvents}
                allEvents={items}
                isLoading={loading}
            />

            {/* Persistent Toggle Button */}
            <button
                onClick={() => isSidebarOpen ? handleCloseSidebar() : setIsSidebarOpen(true)}
                className="absolute z-30 flex items-center justify-center w-14 h-14 bg-brand-orange border border-black/10 rounded-full shadow-xl hover:bg-brand-orange/90 transition-transform active:scale-95 text-black top-4 left-4"
                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
                {/* Desktop Icons */}
                {isSidebarOpen ? (
                    <ChevronsLeft size={32} className="hidden md:block" />
                ) : (
                    <ChevronsRight size={32} className="hidden md:block" />
                )}

                {/* Mobile Icons */}
                {isSidebarOpen ? (
                    <ChevronDown size={32} className="block md:hidden" />
                ) : (
                    <ChevronUp size={32} className="block md:hidden" />
                )}
            </button>
        </>
    );
}
