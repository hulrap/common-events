import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { events, eventTickets, eventRecurrence, users, eventLikes, venues, eventGalleryImages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateEventSchema } from "@/lib/validations/event.schema";

import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await limiter.check(res, 30, "CACHE_TOKEN"); // 30 requests per minute
  } catch {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Event ID is required" });
  }

  if (req.method === "GET") {
    try {
      // Get authenticated user for like status
      const { createApiClient } = await import("@/lib/supabase/api");
      const supabase = createApiClient(req);
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch all event data in parallel for maximum performance
      const [eventDataResult, ticketsResult, recurrenceResult, likeStatusResult, galleryImagesResult] = await Promise.all([
        // Main event data with organizer and venue
        db
          .select({
            event: events,
            organizer: {
              id: users.id,
              fullName: users.fullName,
              organizationName: users.organizationName,
              slug: users.slug,
            },
            venue: venues,
          })
          .from(events)
          .leftJoin(users, eq(events.organizerId, users.id))
          .leftJoin(venues, eq(events.venueId, venues.id))
          .where(eq(events.id, id))
          .limit(1),
        // Tickets
        db
          .select()
          .from(eventTickets)
          .where(eq(eventTickets.eventId, id))
          .orderBy(eventTickets.sortOrder),
        // Recurrence
        db
          .select()
          .from(eventRecurrence)
          .where(eq(eventRecurrence.eventId, id))
          .limit(1),
        // Like status (if user is authenticated)
        user?.id ? db
          .select({ eventId: eventLikes.eventId })
          .from(eventLikes)
          .where(and(
            eq(eventLikes.eventId, id),
            eq(eventLikes.userId, user.id)
          ))
          .limit(1)
          .then((result) => result.length > 0) : Promise.resolve(false),
        // Gallery Images
        db
          .select()
          .from(eventGalleryImages)
          .where(eq(eventGalleryImages.eventId, id))
          .orderBy(eventGalleryImages.sortOrder),
      ]);

      if (!eventDataResult[0]) {
        return res.status(404).json({ error: "Event not found" });
      }

      return res.status(200).json({
        ...eventDataResult[0].event,
        organizer: eventDataResult[0].organizer,
        venue: eventDataResult[0].venue,
        tickets: ticketsResult,
        recurrence: recurrenceResult[0] || null,
        isLiked: likeStatusResult || false,
        galleryImages: galleryImagesResult,
      });
    } catch (error) {
      console.error("Error fetching event:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { createApiClient } = await import("@/lib/supabase/api");
      const supabase = createApiClient(req);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const eventData = await db
        .select()
        .from(events)
        .where(eq(events.id, id))
        .limit(1);

      if (!eventData[0]) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (eventData[0].organizerId !== user.id) {
        return res.status(403).json({ error: "Forbidden - Not your event" });
      }

      const validatedData = updateEventSchema.parse(req.body);

      // Map customVenueName to customLocation for DB storage
      if (validatedData.customVenueName !== undefined) {
        (validatedData as any).customLocation = validatedData.customVenueName;
        delete validatedData.customVenueName;
      }

      // Automatic Geocoding for Custom Locations
      // If we have a custom location and address, but no coordinates (or we want to refresh them), geocode it.
      // Note: validatedData might be partial, so we need to be careful.
      // If customLocation is being set/updated, we should check address.
      if ((validatedData as any).customLocation || validatedData.address) {
        const addressToGeocode = validatedData.address || eventData[0].address;
        const cityToGeocode = validatedData.city || eventData[0].city;
        const countryToGeocode = validatedData.country || eventData[0].country;

        // Only geocode if we have an address and (no coords provided OR address changed)
        // For simplicity, if address is present, we try to geocode if coords are missing in payload
        if (addressToGeocode && (!validatedData.latitude || !validatedData.longitude)) {
          try {
            const { geocodeAddress } = await import("@/lib/maps/geocoding");
            const geoResult = await geocodeAddress(addressToGeocode, cityToGeocode, countryToGeocode);
            if (geoResult) {
              validatedData.latitude = geoResult.lat;
              validatedData.longitude = geoResult.lng;
            }
          } catch (geoError) {
            console.error("Failed to geocode custom location on update:", geoError);
          }
        }
      }

      const updatedEvent = await db
        .update(events)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(events.id, id))
        .returning();

      if (validatedData.tickets) {
        await db.delete(eventTickets).where(eq(eventTickets.eventId, id));
        await db.insert(eventTickets).values(
          validatedData.tickets.map((ticket: any, index: number) => ({
            eventId: id,
            ticketName: ticket.ticketName,
            price: ticket.price?.toString(),
            currency: ticket.currency || "EUR",
            ticketLink: ticket.ticketLink,
            description: ticket.description,
            quantityAvailable: ticket.quantityAvailable,
            sortOrder: index,
          }))
        );
      }

      if (validatedData.recurrence !== undefined) {
        await db.delete(eventRecurrence).where(eq(eventRecurrence.eventId, id));
        if (validatedData.recurrence) {
          await db.insert(eventRecurrence).values({
            eventId: id,
            recurrenceType: validatedData.recurrence.recurrenceType,
            interval: validatedData.recurrence.interval,
            daysOfWeek: validatedData.recurrence.daysOfWeek,
            recurrenceEndDate: validatedData.recurrence.recurrenceEndDate,
            maxOccurrences: validatedData.recurrence.maxOccurrences,
            exceptionDates: validatedData.recurrence.exceptionDates,
          });
        }
      }

      return res.status(200).json(updatedEvent[0]);
    } catch (error) {
      console.error("Error updating event:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { createApiClient } = await import("@/lib/supabase/api");
      const supabase = createApiClient(req);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const eventData = await db
        .select()
        .from(events)
        .where(eq(events.id, id))
        .limit(1);

      if (!eventData[0]) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (eventData[0].organizerId !== user.id) {
        return res.status(403).json({ error: "Forbidden - Not your event" });
      }

      // Delete gallery images from storage
      const galleryImagesList = await db
        .select()
        .from(eventGalleryImages)
        .where(eq(eventGalleryImages.eventId, id));

      if (galleryImagesList.length > 0) {
        const pathsToDelete = galleryImagesList
          .map((img) => {
            const parts = img.url.split("/event-banners/");
            const path = parts.length > 1 ? parts[1] : null;

            // EXTRA SAFETY CHECK: Ensure the file path contains the event ID
            // Our upload logic uses: `${eventId}-gallery-...`
            if (path && typeof id === 'string' && path.includes(id)) {
              return path;
            }
            return null;
          })
          .filter((path): path is string => path !== null);

        if (pathsToDelete.length > 0) {
          // Use Service Role client to bypass RLS for deletion
          const { createServiceRoleClient } = await import("@/lib/supabase/service-role");
          const adminSupabase = createServiceRoleClient();

          const { error: storageError } = await adminSupabase.storage
            .from("event-banners")
            .remove(pathsToDelete);

          if (storageError) {
            console.error("Failed to delete gallery images from storage:", storageError);
          }
        }
      }

      await db.delete(events).where(eq(events.id, id));

      return res.status(204).end();
    } catch (error) {
      console.error("Error deleting event:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

