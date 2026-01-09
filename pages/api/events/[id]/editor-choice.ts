import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createApiClient } from "@/lib/supabase/api";
import { getUserRole } from "@/lib/auth/roles";

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

  // Check if user is an editor
  const { isEditor } = await getUserRole(user.id);
  if (!isEditor) {
    return res.status(403).json({ error: "Forbidden - Editor access required" });
  }

  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid event ID" });
  }

  if (req.method === "POST") {
    try {
      // Set editor's choice to true
      const [updatedEvent] = await db
        .update(events)
        .set({ isEditorsChoice: true, updatedAt: new Date() })
        .where(eq(events.id, id))
        .returning();

      if (!updatedEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      return res.status(200).json({ 
        isEditorsChoice: true, 
        message: "Event marked as Editor's Choice" 
      });
    } catch (error) {
      console.error("Error setting editor's choice:", error);
      return res.status(500).json({ error: "Failed to set editor's choice" });
    }
  }

  if (req.method === "DELETE") {
    try {
      // Set editor's choice to false
      const [updatedEvent] = await db
        .update(events)
        .set({ isEditorsChoice: false, updatedAt: new Date() })
        .where(eq(events.id, id))
        .returning();

      if (!updatedEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      return res.status(200).json({ 
        isEditorsChoice: false, 
        message: "Event unmarked as Editor's Choice" 
      });
    } catch (error) {
      console.error("Error removing editor's choice:", error);
      return res.status(500).json({ error: "Failed to remove editor's choice" });
    }
  }

  if (req.method === "GET") {
    try {
      const [event] = await db
        .select({ isEditorsChoice: events.isEditorsChoice })
        .from(events)
        .where(eq(events.id, id))
        .limit(1);

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      return res.status(200).json({ isEditorsChoice: event.isEditorsChoice || false });
    } catch (error) {
      console.error("Error checking editor's choice status:", error);
      return res.status(500).json({ error: "Failed to check editor's choice status" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

