import { MapErrorBoundary } from '@/components/ErrorBoundary';
import { Header } from '@/components/Header';
import { MapView } from './MapView';
import { MapDateSelector } from './MapDateSelector';
import { MapFilterLegend } from './MapFilterLegend';
import { UserLocationBtn } from './MapControls/UserLocationBtn';

export function MapContainer() {
    return (
        <div className="w-full h-[100dvh] flex flex-col overflow-hidden">
            <Header />
            <div className="relative flex-1 min-h-0">
                <MapErrorBoundary>
                    <MapView />

                    {/* Floating controls */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-3">
                        <MapDateSelector />
                        <MapFilterLegend />
                        <UserLocationBtn />
                    </div>
                </MapErrorBoundary>
            </div>
        </div>
    );
}
