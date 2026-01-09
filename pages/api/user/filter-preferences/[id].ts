import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { userFilterPreferences } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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
  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid filter ID" });
  }

  if (req.method === "PUT") {
    try {
      const { name, filterConfig, isDefault } = req.body;

      if (isDefault) {
        await db
          .update(userFilterPreferences)
          .set({ isDefault: false })
          .where(eq(userFilterPreferences.userId, userId));
      }

      const updateData: {
        name?: string;
        filterConfig?: unknown;
        isDefault?: boolean;
        updatedAt: Date;
      } = {
        updatedAt: new Date(),
      };

      if (name) {
        updateData.name = name;
      }

      if (filterConfig) {
        updateData.filterConfig = filterConfig;
      }

      if (isDefault !== undefined) {
        updateData.isDefault = isDefault;
      }

      const [updated] = await db
        .update(userFilterPreferences)
        .set(updateData)
        .where(
          and(
            eq(userFilterPreferences.id, id),
            eq(userFilterPreferences.userId, userId)
          )
        )
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Filter preference not found" });
      }

      return res.status(200).json(updated);
    } catch (error) {
      console.error("Error updating filter preference:", error);
      return res.status(500).json({ error: "Failed to update filter preference" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const [deleted] = await db
        .delete(userFilterPreferences)
        .where(
          and(
            eq(userFilterPreferences.id, id),
            eq(userFilterPreferences.userId, userId)
          )
        )
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Filter preference not found" });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting filter preference:", error);
      return res.status(500).json({ error: "Failed to delete filter preference" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

