import { MARKER_COLORS } from '@/lib/maps/styles';
import { Event } from './types';

export function getMarkerColor(event: Event): string {
    return event.isEditorsChoice ? MARKER_COLORS.editorsChoice : MARKER_COLORS.default;
}

export function getMarkerIcon(event: Event): google.maps.Icon | null {
    if (!globalThis.google?.maps) return null;
    const color = getMarkerColor(event);
    const svg = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/><circle cx="16" cy="16" r="6" fill="white" opacity="0.8"/></svg>`;
    // Use base64 encoding for SVG
    const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
    return {
        url: dataUrl,
        scaledSize: new globalThis.google.maps.Size(32, 32),
        anchor: new globalThis.google.maps.Point(16, 32),
    };
}

export function getClusterIcon(count: number): google.maps.Icon | null {
    if (!globalThis.google?.maps) return null;

    let size = 40;
    let fontSize = '14';
    if (count >= 100) {
        size = 60;
        fontSize = '18';
    } else if (count >= 10) {
        size = 50;
        fontSize = '16';
    }

    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="#ff9800" stroke="white" stroke-width="3"/><text x="${size / 2}" y="${size / 2}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="${fontSize}" font-weight="bold">${count}</text></svg>`;
    const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

    return {
        url: dataUrl,
        scaledSize: new globalThis.google.maps.Size(size, size),
        anchor: new globalThis.google.maps.Point(size / 2, size / 2),
    };
}
