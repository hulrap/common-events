import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Fetches user role information from the users table.
 * Returns safe defaults if user doesn't exist or query fails.
 */
export async function getUserRole(userId: string): Promise<{ isOrganizer: boolean; isVenueOwner: boolean; isEditor: boolean }> {
  try {
  const user = await db
    .select({
      isOrganizer: users.isOrganizer,
      isVenueOwner: users.isVenueOwner,
      isEditor: users.isEditor,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user[0]) {
      // User doesn't exist in database yet - return default values
    return { isOrganizer: false, isVenueOwner: false, isEditor: false };
  }

    return { 
      isOrganizer: user[0].isOrganizer || false, 
      isVenueOwner: user[0].isVenueOwner || false,
      isEditor: user[0].isEditor || false
    };
  } catch (error) {
    // Database error - log but return safe defaults
    console.error("Error fetching user role:", error);
    return { isOrganizer: false, isVenueOwner: false, isEditor: false };
  }
}

