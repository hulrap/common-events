import type { NextApiRequest, NextApiResponse } from "next";
import { getUserRole } from "@/lib/auth/roles";

/**
 * API endpoint to fetch user roles from the users table.
 * Returns isOrganizer, isVenueOwner, and isEditor flags.
 * Always returns successfully with defaults if user doesn't exist or query fails.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const role = await getUserRole(userId);
    return res.status(200).json(role);
  } catch (error) {
    console.error("Error fetching user role:", error);
    // Always return safe defaults - never fail
    return res.status(200).json({ isOrganizer: false, isVenueOwner: false, isEditor: false });
  }
}

