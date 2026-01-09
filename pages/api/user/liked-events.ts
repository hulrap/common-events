import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { eventLikes, events, eventTickets, eventRecurrence, users, eventCategories } from "@/db/schema";
import { eq, and, inArray, desc, asc } from "drizzle-orm";
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

  if (req.method === "GET") {
    try {
      const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";

      // Optimized single query approach: Fetch everything in one JOIN query for small datasets
      // This is faster for few events (< 50) because it eliminates multiple round trips
      const eventsData = await db
        .select({
          id: events.id,
          title: events.title,
          shortDescription: events.shortDescription,
          bannerUrl: events.bannerUrl,
          mobileBannerUrl: events.mobileBannerUrl,
          startDate: events.startDate,
          endDate: events.endDate,
          city: events.city,
          country: events.country,
          venueId: events.venueId,
          customLocation: events.customLocation,
          categoryId: events.categoryId,
          tags: events.tags,
          organizerId: events.organizerId,
          sourceUrl: events.sourceUrl,
          isEditorsChoice: events.isEditorsChoice,
          organizerUserId: users.id,
          organizerFullName: users.fullName,
          organizerOrgName: users.organizationName,
        })
        .from(eventLikes)
        .innerJoin(events, eq(eventLikes.eventId, events.id))
        .leftJoin(users, eq(events.organizerId, users.id))
        .where(and(
          eq(eventLikes.userId, user.id),
          eq(events.isPublished, true)
        ))
        .orderBy(sortOrder === "desc" ? desc(events.startDate) : asc(events.startDate))
        .limit(100); // Reasonable limit for liked events

      if (eventsData.length === 0) {
        return res.status(200).json({ events: [] });
      }

      const eventIds = eventsData.map((event) => event.id);

      // Fetch related data in parallel (only if we have events)
      const [allTickets, allRecurrences, allEventCategories] = await Promise.all([
        db
          .select()
          .from(eventTickets)
          .where(and(eq(eventTickets.isActive, true), inArray(eventTickets.eventId, eventIds))),
        db
          .select()
          .from(eventRecurrence)
          .where(inArray(eventRecurrence.eventId, eventIds)),
        db
          .select()
          .from(eventCategories)
          .where(inArray(eventCategories.eventId, eventIds)),
      ]);

      // Create maps for related data

      // Map related data
      const ticketsMap = new Map<string, typeof allTickets>();
      const recurrencesMap = new Map<string, typeof allRecurrences[0]>();
      const categoriesMap = new Map<string, string[]>();

      allTickets.forEach((ticket) => {
        const existing = ticketsMap.get(ticket.eventId) || [];
        existing.push(ticket);
        ticketsMap.set(ticket.eventId, existing);
      });

      allRecurrences.forEach((recurrence) => {
        recurrencesMap.set(recurrence.eventId, recurrence);
      });

      allEventCategories.forEach((ec) => {
        const existing = categoriesMap.get(ec.eventId) || [];
        existing.push(ec.categoryId);
        categoriesMap.set(ec.eventId, existing);
      });

      // Build response - eventsData is already sorted by database
      const responseEvents = eventsData.map((eventData) => ({
        id: eventData.id,
        title: eventData.title,
        shortDescription: eventData.shortDescription,
        bannerUrl: eventData.bannerUrl,
        mobileBannerUrl: eventData.mobileBannerUrl,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        city: eventData.city,
        country: eventData.country,
        venueId: eventData.venueId,
        customLocation: eventData.customLocation,
        categoryId: eventData.categoryId,
        tags: eventData.tags,
        organizerId: eventData.organizerId,
        sourceUrl: eventData.sourceUrl,
        isEditorsChoice: eventData.isEditorsChoice || false,
        tickets: ticketsMap.get(eventData.id) || [],
        recurrence: recurrencesMap.get(eventData.id) || null,
        categories: categoriesMap.get(eventData.id) || [],
        organizer: eventData.organizerUserId ? {
          id: eventData.organizerUserId,
          fullName: eventData.organizerFullName,
          organizationName: eventData.organizerOrgName,
        } : null,
      }));

      return res.status(200).json({ events: responseEvents });
    } catch (error) {
      console.error("Error fetching liked events:", error);
      return res.status(500).json({
        error: "Failed to fetch liked events",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

