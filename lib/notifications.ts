import webPush from 'web-push';
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

// Configure web-push with VAPID keys
// These should be set in your .env.local file
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const subject = 'mailto:events@commoncause.cc'; // Replace with your support email

if (publicVapidKey && privateVapidKey) {
    webPush.setVapidDetails(subject, publicVapidKey, privateVapidKey);
}

export interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export async function sendPushNotification(subscription: PushSubscription, payload: string) {
    if (!publicVapidKey || !privateVapidKey) {
        console.warn('VAPID keys are missing. Push notification skipped.');
        return;
    }

    try {
        await webPush.sendNotification(subscription, payload);
        return true;
    } catch (error) {
        console.error('Error sending push notification:', error);
        return false;
    }
}

export async function sendPushNotificationToUsers(userIds: string[], payload: { title: string; body: string; url?: string }) {
    if (!userIds.length) return;

    try {
        const subscriptions = await db
            .select()
            .from(pushSubscriptions)
            .where(inArray(pushSubscriptions.userId, userIds));

        const notifications = subscriptions.map(sub => {
            const subscription: PushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };
            return sendPushNotification(subscription, JSON.stringify(payload));
        });

        await Promise.allSettled(notifications);
    } catch (error) {
        console.error("Error sending bulk push notifications:", error);
    }
}
