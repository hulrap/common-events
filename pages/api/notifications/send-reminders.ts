import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db';
import { events, eventLikes, pushSubscriptions, notifications } from '@/db/schema';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';
import { sendPushNotification } from '@/lib/notifications';
import { addHours, subMinutes, addMinutes } from 'date-fns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Verify Cron Secret
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.NODE_ENV === 'production') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    try {
        const now = new Date();
        // Target: 10 hours before start (+/- 15 mins window)
        const targetTime = addHours(now, 10);
        const windowStart = subMinutes(targetTime, 15);
        const windowEnd = addMinutes(targetTime, 15);

        // Find events starting in ~10 hours that have auto-reminder enabled AND haven't sent it yet
        const upcomingEvents = await db.query.events.findMany({
            where: and(
                gte(events.startDate, windowStart),
                lte(events.startDate, windowEnd),
                eq(events.isPublished, true),
                eq(events.isAutoReminderEnabled, true),
                isNull(events.reminderSentAt)
            ),
        });

        if (upcomingEvents.length === 0) {
            return res.status(200).json({ message: 'No events found for 10h auto-reminder.' });
        }

        let notificationsSent = 0;

        for (const event of upcomingEvents) {
            // Get users who liked this event
            const likes = await db.query.eventLikes.findMany({
                where: eq(eventLikes.eventId, event.id),
                with: { user: true }
            });

            if (likes.length > 0) {
                const title = 'Event Reminder';
                const body = `"${event.title}" starts in 10 hours!`;
                const link = `/events/${event.id}`;

                // 1. Create In-App Notifications
                const notificationValues = likes.map(like => ({
                    userId: like.userId,
                    title,
                    message: body,
                    link,
                    type: 'reminder',
                }));

                await db.insert(notifications).values(notificationValues);

                // 2. Send Push Notifications
                // We need push subscriptions for these users
                const userIds = likes.map(l => l.userId);
                // We can fetch subscriptions in batch or per user. 
                // Let's use the helper if possible, but we are inside a cron job context where we might want granular logging.
                // Re-using the helper `sendPushNotificationToUsers` (dynamically imported or direct) is cleaner,
                // but this file imports `sendPushNotification` directly.
                // Let's iterate manually to be consistent with previous logic, but simplified.

                for (const like of likes) {
                    const user = like.user;
                    const subscriptions = await db.query.pushSubscriptions.findMany({
                        where: eq(pushSubscriptions.userId, user.id)
                    });

                    for (const sub of subscriptions) {
                        const payload = JSON.stringify({
                            title,
                            body,
                            icon: '/icons/icon-192x192.png',
                            url: link
                        });

                        const success = await sendPushNotification({
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth }
                        }, payload);

                        if (success) notificationsSent++;
                    }
                }
            }

            // Mark event as reminded
            await db.update(events)
                .set({ reminderSentAt: new Date() })
                .where(eq(events.id, event.id));
        }

        return res.status(200).json({
            success: true,
            eventsProcessed: upcomingEvents.length,
            notificationsSent
        });

    } catch (error) {
        console.error('Error sending auto-reminders:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
