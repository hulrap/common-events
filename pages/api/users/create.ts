import type { NextApiRequest, NextApiResponse } from "next";
import { createApiClient } from "@/lib/supabase/api";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createApiClient(req);
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId, email, organizationName } = req.body;

    // Verify the userId matches the authenticated user
    if (userId !== authUser.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Check if user already exists (trigger may have created it)
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length > 0) {
      // Update organization_name if provided and different
      if (organizationName && existingUser[0].organizationName !== organizationName) {
        const [updatedUser] = await db
          .update(users)
          .set({ organizationName })
          .where(eq(users.id, userId))
          .returning();
        return res.status(200).json({ message: "User updated", user: updatedUser });
      }
      return res.status(200).json({ message: "User already exists", user: existingUser[0] });
    }

    // Create user record (fallback if trigger didn't fire)
    const [newUser] = await db
      .insert(users)
      .values({
        id: userId,
        email: email || authUser.email!,
        fullName: authUser.user_metadata?.full_name || null,
        organizationName: organizationName || authUser.user_metadata?.organization_name || null,
        isOrganizer: false,
        isVenueOwner: false,
        isEditor: false,
        emailNotifications: true,
        eventReminder24h: false,
      })
      .returning();

    return res.status(201).json({ user: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

