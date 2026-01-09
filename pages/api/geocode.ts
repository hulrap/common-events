import type { NextApiRequest, NextApiResponse } from 'next';
import { geocodeAddress } from '@/lib/maps/geocoding';
import { z } from 'zod';

const geocodeRequestSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().optional(),
  country: z.string().optional(),
});

interface GeocodeResponse {
  success: boolean;
  coordinates?: { lat: number; lng: number };
  formattedAddress?: string;
  city?: string;
  country?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeocodeResponse>
) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const body = geocodeRequestSchema.parse(req.body);

    // Call geocoding utility
    const result = await geocodeAddress(
      body.address,
      body.city,
      body.country
    );

    if (!result) {
      return res.status(200).json({
        success: false,
        error:
          'Address not found. Please check the spelling and try again.',
      });
    }

    return res.status(200).json({
      success: true,
      coordinates: { lat: result.lat, lng: result.lng },
      formattedAddress: result.formattedAddress,
      city: result.city,
      country: result.country,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0]?.message ?? 'Invalid request',
      });
    }

    console.error('Geocoding error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to geocode address',
    });
  }
}
