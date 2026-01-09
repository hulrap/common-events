#!/usr/bin/env tsx

/**
 * Script to apply performance indexes directly to the database
 * This bypasses drizzle migration system to avoid conflicts
 */

import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const sql = postgres(process.env.DATABASE_URL || "");

async function applyIndexes() {
  try {
    const indexPath = path.resolve(__dirname, "../db/migrations/0002_add_performance_indexes.sql");
    const sqlContent = fs.readFileSync(indexPath, "utf-8");
    
    // Split by statement breakpoint and execute each statement
    const statements = sqlContent
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`Applying ${statements.length} index statements...`);

    for (const statement of statements) {
      try {
        await sql.unsafe(statement);
        console.log("✓ Applied:", statement.substring(0, 60) + "...");
      } catch (error: any) {
        // Skip if index already exists (code 42P07)
        if (error.code === "42P07" || error.message?.includes("already exists")) {
          console.log("⊘ Skipped (already exists):", statement.substring(0, 60) + "...");
        } else {
          console.error("✗ Error:", error.message);
          console.error("  Statement:", statement.substring(0, 100));
        }
      }
    }

    console.log("\n✅ Index application complete!");
  } catch (error) {
    console.error("Error applying indexes:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyIndexes();

