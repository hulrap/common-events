import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { venues, venueEventVisibility, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { isVenueOwner } = await getUserRole(user.id);

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

      if (venue.ownerId !== user.id && !isVenueOwner) {
        return res.status(403).json({ error: "Forbidden - You are not the owner of this venue" });
      }

      const venueEvents = await db
        .select({
          event: events,
          visibility: venueEventVisibility,
        })
        .from(events)
        .leftJoin(venueEventVisibility, and(
          eq(venueEventVisibility.eventId, events.id),
          eq(venueEventVisibility.venueId, id)
        ))
        .where(eq(events.venueId, id));

      return res.status(200).json(venueEvents);
    } catch (error) {
      console.error("Error fetching venue events:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch venue events";
      return res.status(500).json({ error: errorMessage });
    }
  }

  if (req.method === "PUT") {
    try {
      const [venue] = await db
        .select()
        .from(venues)
        .where(eq(venues.id, id))
        .limit(1);

      if (!venue) {
        return res.status(404).json({ error: "Venue not found" });
      }

      if (venue.ownerId !== user.id && !isVenueOwner) {
        return res.status(403).json({ error: "Forbidden - You are not the owner of this venue" });
      }

      const { eventId, isVisible } = req.body;

      if (!eventId || typeof eventId !== "string") {
        return res.status(400).json({ error: "Event ID is required" });
      }

      if (typeof isVisible !== "boolean") {
        return res.status(400).json({ error: "isVisible must be a boolean" });
      }

      const [existingVisibility] = await db
        .select()
        .from(venueEventVisibility)
        .where(and(
          eq(venueEventVisibility.venueId, id),
          eq(venueEventVisibility.eventId, eventId)
        ))
        .limit(1);

      if (existingVisibility) {
        const [updated] = await db
          .update(venueEventVisibility)
          .set({ isVisible, updatedAt: new Date() })
          .where(and(
            eq(venueEventVisibility.venueId, id),
            eq(venueEventVisibility.eventId, eventId)
          ))
          .returning();

        return res.status(200).json(updated);
      } else {
        const [created] = await db
          .insert(venueEventVisibility)
          .values({
            venueId: id,
            eventId,
            isVisible,
          })
          .returning();

        return res.status(201).json(created);
      }
    } catch (error) {
      console.error("Error updating venue event visibility:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update venue event visibility";
      return res.status(500).json({ error: errorMessage });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

