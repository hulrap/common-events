import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { userFilterPreferences } from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { createApiClient } from "@/lib/supabase/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createApiClient(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = user.id;

  if (req.method === "GET") {
    try {
      const preferences = await db
        .select()
        .from(userFilterPreferences)
        .where(eq(userFilterPreferences.userId, userId))
        .orderBy(desc(userFilterPreferences.isDefault), asc(userFilterPreferences.createdAt));

      return res.status(200).json(preferences || []);
    } catch (error) {
      console.error("Error fetching filter preferences:", error);
      // Return empty array instead of error to prevent client crashes
      // This allows the app to continue functioning even if preferences fail
      return res.status(200).json([]);
    }
  }

  if (req.method === "POST") {
    try {
      const { name, filterConfig, isDefault } = req.body;

      if (!name || !filterConfig) {
        return res.status(400).json({ error: "Name and filterConfig are required" });
      }

      const existing = await db
        .select()
        .from(userFilterPreferences)
        .where(
          and(
            eq(userFilterPreferences.userId, userId),
            eq(userFilterPreferences.name, name)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return res.status(409).json({ error: "Filter with this name already exists" });
      }

      const filterConfigString = JSON.stringify(filterConfig);
      const allPreferences = await db
        .select()
        .from(userFilterPreferences)
        .where(eq(userFilterPreferences.userId, userId));

      const duplicate = allPreferences.find(
        (pref) => JSON.stringify(pref.filterConfig) === filterConfigString
      );

      if (duplicate) {
        return res.status(409).json({ error: "A filter with identical settings already exists" });
      }

      if (isDefault) {
        await db
          .update(userFilterPreferences)
          .set({ isDefault: false })
          .where(eq(userFilterPreferences.userId, userId));
      }

      const [newPreference] = await db
        .insert(userFilterPreferences)
        .values({
          userId,
          name,
          filterConfig: filterConfig as unknown,
          isDefault: isDefault || false,
        })
        .returning();

      return res.status(201).json(newPreference);
    } catch (error) {
      console.error("Error creating filter preference:", error);
      return res.status(500).json({ error: "Failed to create filter preference" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

