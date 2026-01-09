import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { eventLikes } from "@/db/schema";
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

  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid event ID" });
  }

  if (req.method === "POST") {
    try {
      // Check if already liked
      const existing = await db
        .select()
        .from(eventLikes)
        .where(and(eq(eventLikes.userId, user.id), eq(eventLikes.eventId, id)))
        .limit(1);

      if (existing.length > 0) {
        return res.status(200).json({ liked: true, message: "Already liked" });
      }

      // Add like
      await db.insert(eventLikes).values({
        userId: user.id,
        eventId: id,
      });

      return res.status(200).json({ liked: true, message: "Event liked" });
    } catch (error) {
      console.error("Error liking event:", error);
      return res.status(500).json({ error: "Failed to like event" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await db
        .delete(eventLikes)
        .where(and(eq(eventLikes.userId, user.id), eq(eventLikes.eventId, id)));

      return res.status(200).json({ liked: false, message: "Event unliked" });
    } catch (error) {
      console.error("Error unliking event:", error);
      return res.status(500).json({ error: "Failed to unlike event" });
    }
  }

  if (req.method === "GET") {
    try {
      const existing = await db
        .select()
        .from(eventLikes)
        .where(and(eq(eventLikes.userId, user.id), eq(eventLikes.eventId, id)))
        .limit(1);

      return res.status(200).json({ liked: existing.length > 0 });
    } catch (error) {
      console.error("Error checking like status:", error);
      return res.status(500).json({ error: "Failed to check like status" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

