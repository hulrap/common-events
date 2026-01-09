import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const run = async () => {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not found');
        process.exit(1);
    }

    console.log('Connecting to database...');
    const client = postgres(process.env.DATABASE_URL);

    console.log('Running manual migration...');
    try {
        await client`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "external_link" text;`;
        console.log('Added external_link column');

        await client`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "external_link_text" text;`;
        console.log('Added external_link_text column');

        console.log('Migration successful');
    } catch (e) {
        console.error('Migration failed', e);
    }

    await client.end();
};

run();
