import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { events, notifications, organizerFollows, eventLikes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createApiClient } from "@/lib/supabase/api";
import { getUserRole } from "@/lib/auth/roles";
import { sendPushNotificationToUsers } from "@/lib/notifications";
import { formatDuration, intervalToDuration } from "date-fns";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { id } = req.query;
    const eventId = typeof id === "string" ? id : id?.[0];

    if (!eventId) {
        return res.status(400).json({ error: "Missing event ID" });
    }

    try {
        const supabase = createApiClient(req);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Verify ownership
        const [event] = await db
            .select()
            .from(events)
            .where(eq(events.id, eventId))
            .limit(1);

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        if (event.organizerId !== user.id) {
            // Also allow admins/editors if needed, but strict organizer for now
            return res.status(403).json({ error: "Forbidden - Not your event" });
        }

        const { type } = req.body; // "invitation" | "reminder"

        if (type === "invitation") {
            // 1. Send Invitation to Followers
            if (event.invitationSentAt) {
                // Optional: Could prevent resending, or allow with warning. 
                // User asked "instead of creation", usually implies one-time.
                // Let's return 200 but do existing check to avoid spam if clicked twice accidentally.
                // But if user WANTS to resend... let's block for now to be safe.
                return res.status(400).json({ error: "Invitation already sent", sentAt: event.invitationSentAt });
            }

            const followers = await db
                .select({ userId: organizerFollows.followerId })
                .from(organizerFollows)
                .where(eq(organizerFollows.organizerId, user.id));

            if (followers.length > 0) {
                const notificationValues = followers.map(follower => ({
                    userId: follower.userId,
                    title: "Invitaton: " + event.title,
                    message: `${event.organizerName || "An organizer"} invited you to check out "${event.title}".`,
                    link: `/events/${eventId}`,
                    type: "invitation",
                }));

                await db.insert(notifications).values(notificationValues);

                // Async Push
                sendPushNotificationToUsers(
                    followers.map(f => f.userId),
                    {
                        title: "Invitation: " + event.title,
                        body: `${event.organizerName} invited you to an event.`,
                        url: `/events/${eventId}`,
                    }
                ).catch(console.error);
            }

            // Update Timestamp
            await db
                .update(events)
                .set({ invitationSentAt: new Date() })
                .where(eq(events.id, eventId));

            return res.status(200).json({ success: true, count: followers.length });
        }

        else if (type === "reminder") {
            // 2. Send Reminder to Likes
            if (event.reminderSentAt) {
                return res.status(400).json({ error: "Reminder already sent", sentAt: event.reminderSentAt });
            }

            // Calculate time remaining
            const now = new Date();
            if (now > event.startDate) {
                return res.status(400).json({ error: "Event has already started" });
            }

            const duration = intervalToDuration({ start: now, end: event.startDate });
            let timeString = "";
            if (duration.days && duration.days > 0) timeString += `${duration.days}d `;
            if (duration.hours && duration.hours > 0) timeString += `${duration.hours}h `;
            timeString += `${duration.minutes || 0}m`;

            const likes = await db
                .select({ userId: eventLikes.userId })
                .from(eventLikes)
                .where(eq(eventLikes.eventId, eventId));

            if (likes.length > 0) {
                const notificationValues = likes.map(like => ({
                    userId: like.userId,
                    title: "Reminder: " + event.title,
                    message: `Event starts in ${timeString}.`,
                    link: `/events/${eventId}`,
                    type: "reminder",
                }));

                await db.insert(notifications).values(notificationValues);

                // Async Push
                sendPushNotificationToUsers(
                    likes.map(l => l.userId),
                    {
                        title: "Reminder: " + event.title,
                        body: `Starting in ${timeString}`,
                        url: `/events/${eventId}`,
                    }
                ).catch(console.error);
            }

            // Update Timestamp
            await db
                .update(events)
                .set({ reminderSentAt: new Date() })
                .where(eq(events.id, eventId));

            return res.status(200).json({ success: true, count: likes.length });
        }

        return res.status(400).json({ error: "Invalid notification type" });

    } catch (error) {
        console.error("Notify error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
