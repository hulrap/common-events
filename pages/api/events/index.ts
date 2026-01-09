import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { events, eventTickets, eventRecurrence, users, eventCategories, userLocations, eventLikes, organizerFollows, notifications } from "@/db/schema";
import { eq, and, gte, lte, ilike, or, inArray, sql } from "drizzle-orm";
import { getUserRole } from "@/lib/auth/roles";
import { createApiClient } from "@/lib/supabase/api";
import { createEventSchema, eventQuerySchema } from "@/lib/validations/event.schema";

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
    await limiter.check(res, 20, "CACHE_TOKEN"); // 20 requests per minute
  } catch {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  if (req.method === "GET") {
    // Get authenticated user for like status
    const supabase = createApiClient(req);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      const query = eventQuerySchema.parse(req.query);

      const conditions = [eq(events.isPublished, true)];

      if (query.dateRangeStart) {
        conditions.push(gte(events.startDate, query.dateRangeStart));
      }

      if (query.dateRangeEnd) {
        conditions.push(lte(events.endDate, query.dateRangeEnd));
      }

      if (query.categories && query.categories.length > 0) {
        // Use subquery for category filtering (single database query)
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM ${eventCategories}
            WHERE ${eventCategories.eventId} = ${events.id}
            AND ${eventCategories.categoryId} IN (${sql.join(query.categories.map(c => sql`${c}`), sql`, `)})
          )`
        );
      }

      if (query.searchTerm) {
        conditions.push(
          or(
            ilike(events.title, `%${query.searchTerm}%`),
            ilike(events.description, `%${query.searchTerm}%`)
          )!
        );
      }

      if (query.onlineOnly) {
        conditions.push(eq(events.onlineEvent, true));
      }

      if (query.editorsChoiceOnly) {
        conditions.push(eq(events.isEditorsChoice, true));
      }

      if (query.venues && query.venues.length > 0) {
        conditions.push(inArray(events.venueId, query.venues));
      }

      if (query.locationType === "city" && query.locationCityId) {
        const cityMap: Record<string, string> = {
          vienna: "Vienna",
          graz: "Graz",
          linz: "Linz",
          salzburg: "Salzburg",
          innsbruck: "Innsbruck",
          klagenfurt: "Klagenfurt",
          villach: "Villach",
          wels: "Wels",
          "sankt-poelten": "Sankt Pölten",
        };
        const cityName = cityMap[query.locationCityId] || query.locationCityId;
        conditions.push(eq(events.city, cityName));
      } else if (query.locationType === "standort" && query.locationStandortId) {
        const [userLocation] = await db
          .select()
          .from(userLocations)
          .where(eq(userLocations.id, query.locationStandortId))
          .limit(1);

        if (userLocation) {
          if (query.locationMaxDistanceKm) {
            // Use PostGIS ST_DWithin for fast spatial queries with GIST index
            // Note: 'location' column added via migration 0003, not in Drizzle schema
            const point = sql`ST_SetSRID(ST_MakePoint(${userLocation.longitude}, ${userLocation.latitude}), 4326)::geography`;
            const distanceMeters = query.locationMaxDistanceKm * 1000; // Convert km to meters
            conditions.push(
              sql`ST_DWithin(events.location, ${point}, ${distanceMeters})`
            );
          } else {
            // Filter to events with valid locations
            conditions.push(
              sql`events.location IS NOT NULL`
            );
          }
        }
      }

      // Get pagination params first
      const limit = query.limit || 12;
      const offset = query.offset || 0;

      // Determine sort order for database query
      const sortBy = query.sortBy || "date";
      let orderByClause;

      if (sortBy === "title") {
        orderByClause = events.title;
      } else if (sortBy === "newest") {
        orderByClause = sql`${events.createdAt} DESC`;
      } else {
        // Default: sort by start date ascending
        orderByClause = events.startDate;
      }

      // Get total count with same conditions (for pagination metadata)
      const [countResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(events)
        .where(and(...conditions));

      const totalCount = Number(countResult?.count ?? 0);
      const hasMore = offset + limit < totalCount;

      // Fetch paginated results with database-level sorting and limiting
      const paginatedResults = await db
        .select({
          event: events,
          organizer: {
            id: users.id,
            fullName: users.fullName,
          },
        })
        .from(events)
        .leftJoin(users, eq(events.organizerId, users.id))
        .where(and(...conditions))
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);

      if (paginatedResults.length === 0) {
        return res.status(200).json({
          events: [],
          pagination: {
            hasMore: false,
            total: totalCount,
            limit,
            offset,
          },
        });
      }

      const eventIds = paginatedResults.map((r) => r.event.id);

      // Fetch all related data in parallel
      const [allTickets, allRecurrences, allEventCategories] = await Promise.all([
        db.select().from(eventTickets).where(inArray(eventTickets.eventId, eventIds)),
        db.select().from(eventRecurrence).where(inArray(eventRecurrence.eventId, eventIds)),
        db.select().from(eventCategories).where(inArray(eventCategories.eventId, eventIds)),
      ]);

      // Fetch like status separately if user is authenticated
      const likedEventIdsSet = new Set<string>();
      if (user?.id) {
        const likedEvents = await db
          .select({ eventId: eventLikes.eventId })
          .from(eventLikes)
          .where(and(
            eq(eventLikes.userId, user.id),
            inArray(eventLikes.eventId, eventIds)
          ));
        likedEvents.forEach((like) => likedEventIdsSet.add(like.eventId));
      }

      const ticketsMap = new Map<string, typeof allTickets>();
      const recurrencesMap = new Map<string, typeof allRecurrences[0]>();
      const categoriesMap = new Map<string, string[]>();

      allTickets.forEach((ticket) => {
        const existing = ticketsMap.get(ticket.eventId) || [];
        ticketsMap.set(ticket.eventId, [...existing, ticket]);
      });

      allRecurrences.forEach((recurrence) => {
        recurrencesMap.set(recurrence.eventId, recurrence);
      });

      allEventCategories.forEach((ec) => {
        const existing = categoriesMap.get(ec.eventId) || [];
        categoriesMap.set(ec.eventId, [...existing, ec.categoryId]);
      });

      const eventsWithTickets = paginatedResults.map((item) => ({
        ...item.event,
        organizer: item.organizer,
        tickets: ticketsMap.get(item.event.id) || [],
        recurrence: recurrencesMap.get(item.event.id) || null,
        categories: categoriesMap.get(item.event.id) || [],
        isEditorsChoice: item.event.isEditorsChoice || false,
        isLiked: user?.id ? likedEventIdsSet.has(item.event.id) : false, // Include like status
      }));

      return res.status(200).json({
        events: eventsWithTickets,
        pagination: {
          hasMore,
          total: totalCount,
          limit,
          offset,
        },
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "POST") {
    try {
      const supabase = createApiClient(req);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { isOrganizer } = await getUserRole(user.id);


      if (!isOrganizer) {
        console.error("User is not an organizer, blocking creation.");
        return res.status(403).json({ error: "Forbidden - Organizer access required" });
      }

      const validatedData = createEventSchema.parse(req.body);

      // Handle custom venue: combine street and number into address, set customLocation to venue name
      let finalVenueId = validatedData.venueId || null;
      let finalCustomLocation = validatedData.customLocation || null;
      let finalAddress = validatedData.address || null;
      let finalCity = validatedData.city || "Vienna";
      let finalCountry = validatedData.country || "Austria";
      let finalLatitude = validatedData.latitude || null;
      let finalLongitude = validatedData.longitude || null;

      if (validatedData.customVenueName) {
        // Custom venue is provided - clear venueId and set custom location
        finalVenueId = null;
        finalCustomLocation = validatedData.customVenueName;

        // Combine street and number into address
        const streetParts = [validatedData.customVenueStreet, validatedData.customVenueNumber]
          .filter(Boolean)
          .join(" ");
        finalAddress = streetParts || null;

        // Set city and country from custom venue
        finalCity = validatedData.customVenueCity || "Vienna";
        finalCountry = validatedData.country || "Austria";

        // Use provided latitude/longitude if available
        finalLatitude = validatedData.latitude || null;
        finalLongitude = validatedData.longitude || null;

        // If coordinates are missing but address is present, try to geocode
        if ((!finalLatitude || !finalLongitude) && finalAddress) {
          try {
            const { geocodeAddress } = await import("@/lib/maps/geocoding");
            const geoResult = await geocodeAddress(finalAddress, finalCity, finalCountry);
            if (geoResult) {
              finalLatitude = geoResult.lat;
              finalLongitude = geoResult.lng;
              // Optionally update address/city/country with formatted values
              // finalAddress = geoResult.formattedAddress;
            }
          } catch (geoError) {
            console.error("Failed to geocode custom location:", geoError);
            // Continue without coordinates
          }
        }
      }

      const newEvent = await db
        .insert(events)
        .values({
          title: validatedData.title,
          description: validatedData.description,
          bannerUrl: validatedData.bannerUrl || null,
          mobileBannerUrl: validatedData.mobileBannerUrl || null,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          venueId: finalVenueId,
          customLocation: finalCustomLocation,
          address: finalAddress,
          city: finalCity,
          country: finalCountry,
          latitude: finalLatitude,
          longitude: finalLongitude,
          onlineEvent: validatedData.onlineEvent,
          eventUrl: validatedData.eventUrl,
          organizerId: user.id,
          organizerName: validatedData.organizerName,
          organizerContact: validatedData.organizerContact,
          categoryId: validatedData.categoryId,
          tags: validatedData.tags,
          maxAttendees: validatedData.maxAttendees,
          registrationDeadline: validatedData.registrationDeadline,
          ageRestriction: validatedData.ageRestriction,
          dressCode: validatedData.dressCode,
          language: validatedData.language,
          accessibilityNotes: validatedData.accessibilityNotes,
          parkingInfo: validatedData.parkingInfo,
          publicTransportInfo: validatedData.publicTransportInfo,
        })
        .returning();

      const eventId = newEvent[0].id;

      if (validatedData.tickets && validatedData.tickets.length > 0) {
        await db.insert(eventTickets).values(
          validatedData.tickets.map((ticket, index) => ({
            eventId,
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

      if (validatedData.recurrence) {
        await db.insert(eventRecurrence).values({
          eventId,
          recurrenceType: validatedData.recurrence.recurrenceType,
          interval: validatedData.recurrence.interval,
          daysOfWeek: validatedData.recurrence.daysOfWeek,
          recurrenceEndDate: validatedData.recurrence.recurrenceEndDate,
          maxOccurrences: validatedData.recurrence.maxOccurrences,
          exceptionDates: validatedData.recurrence.exceptionDates,
        });
      }

      // Notifications are now manual or scheduled via 'notify' endpoint
      // We do not send automatic notifications on creation anymore.

      return res.status(201).json(newEvent[0]);
    } catch (error) {
      console.error("Error creating event:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
