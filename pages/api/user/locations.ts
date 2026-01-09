import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { userLocations } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { createApiClient } from "@/lib/supabase/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createApiClient(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = user.id;

  if (req.method === "GET") {
    try {
      const locations = await db
        .select()
        .from(userLocations)
        .where(eq(userLocations.userId, userId))
        .orderBy(desc(userLocations.isDefault), asc(userLocations.createdAt));

      return res.status(200).json(locations);
    } catch (error) {
      console.error("Error fetching user locations:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch locations";
      return res.status(500).json({ error: errorMessage });
    }
  }

  if (req.method === "POST") {
    try {
      const { name, latitude, longitude, address, city, country, isDefault } = req.body;

      if (!name || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: "Name, latitude, and longitude are required" });
      }

      if (isDefault) {
        await db
          .update(userLocations)
          .set({ isDefault: false })
          .where(eq(userLocations.userId, userId));
      }

      const [newLocation] = await db
        .insert(userLocations)
        .values({
          userId,
          name,
          latitude: Number(latitude),
          longitude: Number(longitude),
          address: address || null,
          city: city || null,
          country: country || null,
          isDefault: isDefault || false,
        })
        .returning();

      return res.status(201).json(newLocation);
    } catch (error) {
      console.error("Error creating user location:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create location";
      return res.status(500).json({ error: errorMessage });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

