// Dark monochrome map styling for minimalist look
// Black and white only - NO LABELS, NO POIs, DARK BASE, VISIBLE ROADS

export const mapDarkMonochromeStyle: Array<Record<string, any>> = [
  {
    "featureType": "all",
    "elementType": "labels",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "all",
    "elementType": "geometry",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "poi",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#404040" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#707070" }, { "weight": 1 }]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "transit",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#000000" }]
  }
] as const;

// Vienna city center coordinates
export const VIENNA_CENTER = {
  lat: 48.2082,
  lng: 16.3738,
};

// Default map zoom levels
export const MAP_ZOOM_LEVELS = {
  default: 12,
  city: 11,
  district: 13,
  street: 15,
} as const;

// Custom marker icon colors
export const MARKER_COLORS = {
  default: '#ff9800', // Orange for regular events
  editorsChoice: '#9c27b0', // Purple for editor's choice
} as const;
