import { useState, useCallback } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { VIENNA_CENTER, MAP_ZOOM_LEVELS } from '@/lib/maps/styles';

export function UserLocationBtn() {
    const map = useMap();
    const [isLocating, setIsLocating] = useState(false);
    const [useUserLocation, setUseUserLocation] = useState(false);

    const handleUserLocation = useCallback(() => {
        if (!map) return;

        if (useUserLocation) {
            // Pan back to Vienna
            map.panTo(VIENNA_CENTER);
            map.setZoom(MAP_ZOOM_LEVELS.default);
            setUseUserLocation(false);
        } else {
            setIsLocating(true);
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        const { latitude, longitude } = position.coords;
                        const userLocation = { lat: latitude, lng: longitude };

                        map.panTo(userLocation);
                        map.setZoom(MAP_ZOOM_LEVELS.city);
                        setUseUserLocation(true);
                        setIsLocating(false);
                    },
                    () => {
                        setIsLocating(false);
                        // Could add toast error here
                    }
                );
            } else {
                setIsLocating(false);
            }
        }
    }, [map, useUserLocation]);

    return (
        <button
            onClick={handleUserLocation}
            disabled={isLocating}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black border border-white/10 grain-texture header-glass text-slate-200 hover:bg-black/80 transition-colors disabled:opacity-50"
            title={useUserLocation ? 'Center on Vienna' : 'Center on your location'}
        >
            {isLocating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
            )}
        </button>
    );
}
