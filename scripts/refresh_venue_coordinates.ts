
import { config } from "dotenv";
config({ path: ".env.local" });

// Dynamic imports to ensure env vars are loaded first
async function main() {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        console.error("Error: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set in environment.");
        process.exit(1);
    }

    console.log("Starting bulk refresh of venue coordinates...");

    const { db } = await import("@/db");
    const { venues } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const { geocodeAddress } = await import("@/lib/maps/geocoding");

    const allVenues = await db.select().from(venues);
    console.log(`Found ${allVenues.length} venues to process.`);

    let updatedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const venue of allVenues) {
        if (!venue.address) {
            console.log(`Skipping "${venue.name}": No address provided.`);
            skippedCount++;
            continue;
        }

        console.log(`Processing "${venue.name}" (${venue.address}, ${venue.city})...`);

        try {
            // Add a small delay to avoid hitting rate limits too hard
            await new Promise(resolve => setTimeout(resolve, 200));

            const result = await geocodeAddress(venue.address, venue.city || undefined, venue.country || undefined);

            if (result) {
                // Check if coordinates significantly changed (optional, but good for logging)
                const oldLat = venue.latitude;
                const oldLng = venue.longitude;
                const newLat = result.lat;
                const newLng = result.lng;

                // Update DB
                await db
                    .update(venues)
                    .set({
                        latitude: newLat,
                        longitude: newLng,
                        updatedAt: new Date()
                    })
                    .where(eq(venues.id, venue.id));

                console.log(`  -> Updated: (${oldLat}, ${oldLng}) -> (${newLat}, ${newLng})`);
                updatedCount++;
            } else {
                console.log(`  -> Failed: Could not geocode address.`);
                failedCount++;
            }
        } catch (error) {
            console.error(`  -> Error processing venue:`, error);
            failedCount++;
        }
    }

    console.log("\n--- Summary ---");
    console.log(`Total Venues: ${allVenues.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log(`Skipped (No Address): ${skippedCount}`);
}

main().catch(console.error).finally(() => process.exit(0));
