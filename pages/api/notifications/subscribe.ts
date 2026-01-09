import { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '@/lib/supabase/api';
import { db } from '@/db';
import { pushSubscriptions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabase = createApiClient(req);

    // Verify authentication
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ error: 'Invalid subscription object' });
    }

    try {
        // Check if subscription already exists for this user
        const existing = await db.query.pushSubscriptions.findFirst({
            where: and(
                eq(pushSubscriptions.userId, user.id),
                eq(pushSubscriptions.endpoint, subscription.endpoint)
            ),
        });

        if (existing) {
            // Update keys if they changed (unlikely for same endpoint, but good practice)
            await db
                .update(pushSubscriptions)
                .set({
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                    updatedAt: new Date(),
                })
                .where(eq(pushSubscriptions.id, existing.id));
        } else {
            // Insert new subscription
            await db.insert(pushSubscriptions).values({
                userId: user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error saving subscription:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
