import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "./roles";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user, error: null };
}

export async function requireOrganizer() {
  const { user, error } = await requireAuth();

  if (error) {
    return { user: null, error };
  }

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { isOrganizer } = await getUserRole(user.id);

  if (!isOrganizer) {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden - Organizer access required" }, { status: 403 }),
    };
  }

  return { user, error: null };
}

