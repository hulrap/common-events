import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { users, events, organizerFollows, eventGalleryImages } from "@/db/schema";
import { eq, and, desc, or } from "drizzle-orm";
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
        await limiter.check(res, 30, "CACHE_TOKEN");
    } catch {
        return res.status(429).json({ error: "Rate limit exceeded" });
    }

    const { slug } = req.query;

    if (!slug || typeof slug !== "string") {
        return res.status(400).json({ error: "Organizer slug is required" });
    }

    if (req.method === "GET") {
        try {
            // Get authenticated user for follow status
            const { createApiClient } = await import("@/lib/supabase/api");
            const supabase = createApiClient(req);
            const { data: { user: currentUser } } = await supabase.auth.getUser();

            // Determine if the slug is a UUID
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

            // Fetch organizer by slug
            const organizerResult = await db
                .select({
                    id: users.id,
                    fullName: users.fullName,
                    organizationName: users.organizationName,
                    email: users.email,
                    slug: users.slug,
                    contactEmail: users.contactEmail,
                    contactPhone: users.contactPhone,
                    websiteUrl: users.websiteUrl,
                    socialLinks: users.socialLinks,
                    profileImage: users.profileImage,
                    description: users.description,
                    isOrganizer: users.isOrganizer,
                })
                .from(users)
                .where(isUuid ? or(eq(users.slug, slug), eq(users.id, slug)) : eq(users.slug, slug))
                .limit(1);

            if (!organizerResult[0]) {
                return res.status(404).json({ error: "Organizer not found" });
            }

            const organizer = organizerResult[0];

            if (!organizer.isOrganizer) {
                return res.status(404).json({ error: "User is not an organizer" });
            }

            // Fetch organizer's events
            const organizerEvents = await db
                .select()
                .from(events)
                .where(eq(events.organizerId, organizer.id))
                .orderBy(desc(events.startDate));

            // Fetch gallery images for these events
            // We can fetch all images where eventId is in organizerEvents
            // But for now let's just fetch them per event or all together.
            // To show "Albums", we probably want images grouped by event.
            // Let's fetch all images for events by this organizer.

            // We can do a join or just fetch all images for the events we found
            const eventIds = organizerEvents.map(e => e.id);
            let galleryImagesResult: any[] = [];

            if (eventIds.length > 0) {
                // Drizzle doesn't support "inArray" easily with UUIDs in some versions, but let's try or iterate
                // Actually it does support inArray.
                // But let's use a join to be safe and efficient
                galleryImagesResult = await db
                    .select({
                        image: eventGalleryImages,
                        eventTitle: events.title,
                        eventId: events.id,
                    })
                    .from(eventGalleryImages)
                    .innerJoin(events, eq(eventGalleryImages.eventId, events.id))
                    .where(eq(events.organizerId, organizer.id))
                    .orderBy(desc(eventGalleryImages.createdAt));
            }

            // Check follow status
            let isFollowing = false;
            if (currentUser) {
                const followResult = await db
                    .select()
                    .from(organizerFollows)
                    .where(and(
                        eq(organizerFollows.followerId, currentUser.id),
                        eq(organizerFollows.organizerId, organizer.id)
                    ))
                    .limit(1);
                isFollowing = followResult.length > 0;
            }

            // Get follower count
            const followersCountResult = await db
                .select({ count: organizerFollows.id }) // Just counting rows essentially
                .from(organizerFollows)
                .where(eq(organizerFollows.organizerId, organizer.id));

            const followersCount = followersCountResult.length;

            return res.status(200).json({
                organizer,
                events: organizerEvents,
                galleryImages: galleryImagesResult,
                isFollowing,
                followersCount,
            });

        } catch (error) {
            console.error("Error fetching organizer:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
