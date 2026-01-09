import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { venues } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createApiClient } from "@/lib/supabase/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const { city, ownerId } = req.query;

      const conditions = [];
      if (city && typeof city === "string") {
        conditions.push(eq(venues.city, city));
      }
      if (ownerId && typeof ownerId === "string") {
        conditions.push(eq(venues.ownerId, ownerId));
      }

      let allVenues;
      if (conditions.length > 0) {
        allVenues = await db
          .select()
          .from(venues)
          .where(and(...conditions));
      } else {
        allVenues = await db.select().from(venues);
      }

      return res.status(200).json(allVenues || []);
    } catch (error) {
      console.error("Error fetching venues:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch venues";
      const errorDetails = error instanceof Error ? error.stack : String(error);
      console.error("Venues fetch error details:", errorDetails);
      return res.status(500).json({
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorDetails : undefined
      });
    }
  }

  if (req.method === "POST") {
    const supabase = createApiClient(req);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const { name, description, website, address, city, country, latitude, longitude, bannerUrl, openingHours } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      let finalLatitude = latitude ? Number(latitude) : null;
      let finalLongitude = longitude ? Number(longitude) : null;

      // Automatic Geocoding if coordinates are missing but address is present
      if ((!finalLatitude || !finalLongitude) && address) {
        try {
          const { geocodeAddress } = await import("@/lib/maps/geocoding");
          const geoResult = await geocodeAddress(address, city, country);
          if (geoResult) {
            finalLatitude = geoResult.lat;
            finalLongitude = geoResult.lng;
          }
        } catch (geoError) {
          console.error("Failed to geocode venue:", geoError);
        }
      }

      const [newVenue] = await db
        .insert(venues)
        .values({
          name,
          description: description || null,
          website: website || null,
          address: address || null,
          city: city || null,
          country: country || null,
          latitude: finalLatitude,
          longitude: finalLongitude,
          bannerUrl: bannerUrl || null,
          openingHours: openingHours || null,
          ownerId: null,
        })
        .returning();

      return res.status(201).json(newVenue);
    } catch (error) {
      console.error("Error creating venue:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create venue";
      return res.status(500).json({ error: errorMessage });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

