import { useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronsRight, ChevronsLeft, ChevronDown } from 'lucide-react';
import { MapCard } from './MapCard';
import { MapItem, MapPoint } from './hooks/useMapEvents';
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useFilters } from '@/contexts/FilterContext';

interface MapSidebarProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly selectedEvents: any[]; // Events to show
    readonly allEvents: MapItem[]; // For default "Feed" mode
    readonly isLoading: boolean;
}

export function MapSidebar({ isOpen, onClose, selectedEvents, allEvents, isLoading }: MapSidebarProps) {
    const { resetFilters } = useFilters();

    // Mode determination
    const hasSelection = selectedEvents.length > 0;

    // Default Feed: All visible events on map
    // We flatten the items to include single points AND events hidden in dense clusters
    const feedEvents = hasSelection
        ? selectedEvents
        : allEvents.flatMap(item => {
            if (item.type === 'point') return [(item as MapPoint).event];
            // If the cluster carries event data (e.g. coincident points), include them
            if (item.type === 'cluster' && item.events) return item.events;
            // Regular clusters without data don't add to the feed list
            return [];
        });

    const title = hasSelection
        ? (selectedEvents.length > 1 ? `Selected Events (${selectedEvents.length})` : 'Event Details')
        : `Events in View (${feedEvents.length})`;

    // Styling logic
    // Desktop: Left Sidebar (`md:left-0`), top-0 bottom-0
    // Mobile: Full overlay (`inset-0`)
    // Transitions: Desktop translates X, Mobile translates Y
    const containerClasses = `
        absolute 
        inset-0 md:inset-auto
        md:top-0 md:left-0 md:bottom-0 md:w-[450px] md:h-full
        bg-black/95 md:border-r border-t md:border-t-0 border-white/10 
        md:rounded-none rounded-t-none 
        shadow-2xl backdrop-blur-md
        transform transition-transform duration-300 ease-[cubic-bezier(0.2,0.0,0.2,1)]
        z-20 flex flex-col overflow-hidden
        ${isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-[100%] md:translate-y-0 md:-translate-x-full'}
    `;

    return (
        <div className={containerClasses}>
            <style jsx>{`
                .custom-scrollbar {
                    overscroll-behavior: contain;
                    -webkit-overflow-scrolling: touch;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: white;
                    border-radius: 3px;
                }
            `}</style>

            {/* Header Title Removed as per request */}

            {/* Content Feed with top padding to account for the absolute button */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 pt-24 space-y-4 custom-scrollbar scroll-smooth">
                {isLoading && !feedEvents.length ? (
                    <div className="flex items-center justify-center h-full">
                        <LoadingSpinner />
                    </div>
                ) : feedEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/50 space-y-4">
                        <p>No events found.</p>
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    feedEvents.map((event, index) => (
                        <div key={event.id}>
                            <MapCard
                                event={event}
                                isLoading={false}
                                priority={index < 6}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
