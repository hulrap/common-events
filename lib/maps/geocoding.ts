import { Client, AddressType, GeocodingAddressComponentType } from '@googlemaps/google-maps-services-js';

const client = new Client({});

export interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  city?: string;
  country?: string;
}

/**
 * Geocode an address using Google Maps Geocoding API
 * @param address - Street address
 * @param city - City name (optional but recommended)
 * @param country - Country name (optional but recommended)
 * @returns Geocoding result with coordinates or null if not found
 */
export async function geocodeAddress(
  address: string,
  city?: string,
  country?: string
): Promise<GeocodingResult | null> {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable is not set');
  }

  try {
    // Build the full address string for better results
    const addressParts = [address, city, country].filter(Boolean);
    const fullAddress = addressParts.join(', ');

    const response = await client.geocode({
      params: {
        address: fullAddress,
        key: googleMapsApiKey,
      },
    });

    if (
      response.data.results &&
      response.data.results.length > 0
    ) {
      const firstResult = response.data.results[0];
      const { lat, lng } = firstResult.geometry.location;

      // Extract city and country from address components
      let extractedCity: string | undefined;
      let extractedCountry: string | undefined;

      firstResult.address_components.forEach(component => {
        if (component.types.includes('locality' as AddressType | GeocodingAddressComponentType)) {
          extractedCity = component.long_name;
        }
        if (component.types.includes('country' as AddressType | GeocodingAddressComponentType)) {
          extractedCountry = component.long_name;
        }
      });

      return {
        lat,
        lng,
        formattedAddress: firstResult.formatted_address,
        city: extractedCity ?? city,
        country: extractedCountry ?? country,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to get address
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Address string or null if not found
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number
): Promise<string | null> {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable is not set');
  }

  try {
    const response = await client.reverseGeocode({
      params: {
        latlng: { lat, lng },
        key: googleMapsApiKey,
      },
    });

    if (
      response.data.results &&
      response.data.results.length > 0
    ) {
      return response.data.results[0].formatted_address;
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}
