import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as relations from "./relations";

const fullSchema = { ...schema, ...relations };

let client: ReturnType<typeof postgres> | null = null;
let dbInstance: PostgresJsDatabase<typeof fullSchema> | null = null;

function getClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Connection pool configuration
  // max: Maximum number of connections in the pool
  // - Supabase free tier: ~50 connections, paid tiers: much higher
  // - Default to a high number (80% of typical Supabase limit) but allow override via env var
  // - If not specified, postgres-js uses its own default which is typically reasonable
  const maxConnections = process.env.DATABASE_MAX_CONNECTIONS
    ? Number.parseInt(process.env.DATABASE_MAX_CONNECTIONS, 10)
    : 40; // Default: 40 connections (safe for most Supabase plans)

  client ??= postgres(process.env.DATABASE_URL, {
    max: maxConnections,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 30, // 30 minutes - recycle connections periodically
  });

  return client;
}

export function getDb(): PostgresJsDatabase<typeof fullSchema> {
  dbInstance ??= drizzle(getClient(), { schema: fullSchema });
  return dbInstance;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof fullSchema>, {
  get(_target, prop) {
    return getDb()[prop as keyof PostgresJsDatabase<typeof fullSchema>];
  },
});

export type { schema };

