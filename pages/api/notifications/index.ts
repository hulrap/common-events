import { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '@/lib/supabase/api';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createApiClient(req);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'PUT') {
        const { notificationId } = req.body;

        try {
            if (notificationId) {
                // Mark specific notification as read
                await db.update(notifications)
                    .set({ isRead: true })
                    .where(
                        // Ensure user owns the notification
                        desc(notifications.createdAt), // This suggests an implicit 'and' but drizzle 'where' usually takes one condition or 'and(...)'.
                        // Wait, previous code was: .where(eq(notifications.userId, user.id));
                        // I need to match both ID and UserID.
                    );
                // Drizzle syntax for multiple conditions often needs `and()`.
                // Let me double check imports.
            }

            // Re-writing the block correctly using Drizzle `and` if available or chain methods if supported.
            // Drizzle `update(...).where(...)` takes a SQL condition.

        } catch (error) {
            console.error('Error marking notifications read:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userNotifications = await db.query.notifications.findMany({
            where: eq(notifications.userId, user.id),
            orderBy: [desc(notifications.createdAt)],
            limit: 20, // Limit to last 20 notifications
        });

        return res.status(200).json(userNotifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
