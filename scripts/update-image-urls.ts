/**
 * Update Image URLs Script
 * Updates all image URLs in the database from Supabase Storage to MinIO
 * 
 * Usage: npx tsx scripts/update-image-urls.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

const OLD_STORAGE_URL = process.env.OLD_STORAGE_URL || "https://YOUR_PROJECT.supabase.co/storage/v1/object/public";
const NEW_STORAGE_URL = process.env.NEW_STORAGE_URL || process.env.NEXT_PUBLIC_STORAGE_URL;

if (!NEW_STORAGE_URL) {
    console.error("Error: NEW_STORAGE_URL or NEXT_PUBLIC_STORAGE_URL environment variable required");
    process.exit(1);
}

async function updateImageUrls() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("Error: DATABASE_URL environment variable required");
        process.exit(1);
    }

    const client = postgres(connectionString);
    const db = drizzle(client);

    console.log("=== Updating Image URLs ===");
    console.log(`Old URL pattern: ${OLD_STORAGE_URL}`);
    console.log(`New URL pattern: ${NEW_STORAGE_URL}`);
    console.log("");

    try {
        // Update events.banner_url
        const bannerResult = await db.execute(sql`
      UPDATE events 
      SET banner_url = REPLACE(banner_url, ${OLD_STORAGE_URL}, ${NEW_STORAGE_URL})
      WHERE banner_url LIKE ${OLD_STORAGE_URL + '%'}
    `);
        console.log(`✓ Updated events.banner_url`);

        // Update events.mobile_banner_url
        const mobileBannerResult = await db.execute(sql`
      UPDATE events 
      SET mobile_banner_url = REPLACE(mobile_banner_url, ${OLD_STORAGE_URL}, ${NEW_STORAGE_URL})
      WHERE mobile_banner_url LIKE ${OLD_STORAGE_URL + '%'}
    `);
        console.log(`✓ Updated events.mobile_banner_url`);

        // Update venues.banner_url
        const venueBannerResult = await db.execute(sql`
      UPDATE venues 
      SET banner_url = REPLACE(banner_url, ${OLD_STORAGE_URL}, ${NEW_STORAGE_URL})
      WHERE banner_url LIKE ${OLD_STORAGE_URL + '%'}
    `);
        console.log(`✓ Updated venues.banner_url`);

        // Update users.profile_image
        const profileResult = await db.execute(sql`
      UPDATE users 
      SET profile_image = REPLACE(profile_image, ${OLD_STORAGE_URL}, ${NEW_STORAGE_URL})
      WHERE profile_image LIKE ${OLD_STORAGE_URL + '%'}
    `);
        console.log(`✓ Updated users.profile_image`);

        // Update event_gallery_images.url
        const galleryResult = await db.execute(sql`
      UPDATE event_gallery_images 
      SET url = REPLACE(url, ${OLD_STORAGE_URL}, ${NEW_STORAGE_URL})
      WHERE url LIKE ${OLD_STORAGE_URL + '%'}
    `);
        console.log(`✓ Updated event_gallery_images.url`);

        console.log("");
        console.log("=== URL Update Complete ===");

        // Show sample of updated URLs
        const sampleEvents = await db.execute(sql`
      SELECT id, banner_url FROM events WHERE banner_url IS NOT NULL LIMIT 3
    `);
        console.log("\nSample updated event URLs:");
        for (const row of sampleEvents) {
            console.log(`  ${(row as any).banner_url}`);
        }

    } catch (error) {
        console.error("Error updating URLs:", error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

updateImageUrls();
