import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { organizerFollows, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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

    if (req.method !== "POST" && req.method !== "DELETE") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { createApiClient } = await import("@/lib/supabase/api");
        const supabase = createApiClient(req);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { organizerId } = req.body;

        if (!organizerId) {
            return res.status(400).json({ error: "Organizer ID is required" });
        }

        // Verify organizer exists
        const organizerExists = await db
            .select()
            .from(users)
            .where(eq(users.id, organizerId))
            .limit(1);

        if (!organizerExists[0]) {
            return res.status(404).json({ error: "Organizer not found" });
        }

        if (req.method === "POST") {
            // Follow
            // Check if already following
            const existingFollow = await db
                .select()
                .from(organizerFollows)
                .where(and(
                    eq(organizerFollows.followerId, user.id),
                    eq(organizerFollows.organizerId, organizerId)
                ))
                .limit(1);

            if (existingFollow[0]) {
                return res.status(200).json({ message: "Already following" });
            }

            await db.insert(organizerFollows).values({
                followerId: user.id,
                organizerId: organizerId,
            });

            return res.status(200).json({ message: "Followed successfully" });
        } else if (req.method === "DELETE") {
            // Unfollow
            await db
                .delete(organizerFollows)
                .where(and(
                    eq(organizerFollows.followerId, user.id),
                    eq(organizerFollows.organizerId, organizerId)
                ));

            return res.status(200).json({ message: "Unfollowed successfully" });
        }
    } catch (error) {
        console.error("Error updating follow status:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
