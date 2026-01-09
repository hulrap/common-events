import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { venues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createApiClient } from "@/lib/supabase/api";
import { getUserRole } from "@/lib/auth/roles";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Venue ID is required" });
  }

  const supabase = createApiClient(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (req.method === "GET") {
    try {
      const [venue] = await db
        .select()
        .from(venues)
        .where(eq(venues.id, id))
        .limit(1);

      if (!venue) {
        return res.status(404).json({ error: "Venue not found" });
      }

      return res.status(200).json(venue);
    } catch (error) {
      console.error("Error fetching venue:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch venue";
      return res.status(500).json({ error: errorMessage });
    }
  }

  if (req.method === "PUT") {
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const [existingVenue] = await db
        .select()
        .from(venues)
        .where(eq(venues.id, id))
        .limit(1);

      if (!existingVenue) {
        return res.status(404).json({ error: "Venue not found" });
      }

      const { isVenueOwner } = await getUserRole(user.id);
      const isAdmin = false;

      if (existingVenue.ownerId && existingVenue.ownerId !== user.id && !isAdmin) {
        if (!isVenueOwner) {
          return res.status(403).json({ error: "Forbidden - You are not the owner of this venue" });
        }
      }

      const { name, description, website, address, city, country, latitude, longitude, bannerUrl, openingHours, ownerId } = req.body;

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description || null;
      if (website !== undefined) updateData.website = website || null;
      if (address !== undefined) updateData.address = address || null;
      if (city !== undefined) updateData.city = city || null;
      if (country !== undefined) updateData.country = country || null;
      if (latitude !== undefined) updateData.latitude = latitude ? Number(latitude) : null;
      if (longitude !== undefined) updateData.longitude = longitude ? Number(longitude) : null;
      if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl || null;
      if (openingHours !== undefined) updateData.openingHours = openingHours || null;
      if (ownerId !== undefined && isAdmin) updateData.ownerId = ownerId || null;

      // Automatic Geocoding on Update
      // If address is being updated or exists, and coordinates are missing or we want to refresh them
      const addressToGeocode = (updateData.address as string) || existingVenue.address;
      const cityToGeocode = (updateData.city as string) || existingVenue.city;
      const countryToGeocode = (updateData.country as string) || existingVenue.country;

      const hasNewAddress = updateData.address !== undefined || updateData.city !== undefined || updateData.country !== undefined;
      const hasCoordinates = updateData.latitude !== undefined && updateData.longitude !== undefined && updateData.latitude !== null && updateData.longitude !== null;

      if ((hasNewAddress || !existingVenue.latitude || !existingVenue.longitude) && !hasCoordinates && addressToGeocode) {
        try {
          const { geocodeAddress } = await import("@/lib/maps/geocoding");
          const geoResult = await geocodeAddress(addressToGeocode, cityToGeocode || undefined, countryToGeocode || undefined);
          if (geoResult) {
            updateData.latitude = geoResult.lat;
            updateData.longitude = geoResult.lng;
          }
        } catch (geoError) {
          console.error("Failed to geocode venue on update:", geoError);
        }
      }

      const [updatedVenue] = await db
        .update(venues)
        .set(updateData)
        .where(eq(venues.id, id))
        .returning();

      return res.status(200).json(updatedVenue);
    } catch (error) {
      console.error("Error updating venue:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update venue";
      return res.status(500).json({ error: errorMessage });
    }
  }

  if (req.method === "DELETE") {
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const [existingVenue] = await db
        .select()
        .from(venues)
        .where(eq(venues.id, id))
        .limit(1);

      if (!existingVenue) {
        return res.status(404).json({ error: "Venue not found" });
      }

      const isAdmin = false;

      if (existingVenue.ownerId && existingVenue.ownerId !== user.id && !isAdmin) {
        return res.status(403).json({ error: "Forbidden - You are not the owner of this venue" });
      }

      await db.delete(venues).where(eq(venues.id, id));

      return res.status(200).json({ message: "Venue deleted successfully" });
    } catch (error) {
      console.error("Error deleting venue:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete venue";
      return res.status(500).json({ error: errorMessage });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

