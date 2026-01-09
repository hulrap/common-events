import { db } from "../db";
import { sql } from "drizzle-orm";

async function checkSchema() {
    try {
        console.log("Checking for 'mobile_push_notifications_24h_reminder' in 'users'...");
        const usersCols = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'mobile_push_notifications_24h_reminder';
    `);
        console.log("Users column exists:", usersCols.length > 0);

        console.log("Checking for 'push_subscriptions' table...");
        const pushTable = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'push_subscriptions';
    `);
        console.log("Push Subscriptions table exists:", pushTable.length > 0);

        console.log("Checking for 'notifications' table...");
        const notifTable = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'notifications';
    `);
        console.log("Notifications table exists:", notifTable.length > 0);

        process.exit(0);
    } catch (error) {
        console.error("Error checking schema:", error);
        process.exit(1);
    }
}

checkSchema();
