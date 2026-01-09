import { APIProvider } from '@vis.gl/react-google-maps';
import { ReactNode } from 'react';

const GOOGLE_MAPS_LIBRARIES: Array<'places' | 'geometry' | 'marker'> = ['places', 'geometry', 'marker'];

interface MapProviderProps {
    readonly children: ReactNode;
}

export function MapProvider({ children }: MapProviderProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Map features will not work.');
        return <>{children}</>;
    }

    return (
        <APIProvider
            apiKey={apiKey}
            libraries={GOOGLE_MAPS_LIBRARIES}
        >
            {children}
        </APIProvider>
    );
}
