import { createServerClient } from "@supabase/ssr";
import type { NextApiRequest } from "next";

export function createApiClient(req: NextApiRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return Object.entries(req.cookies).map(([name, value]) => ({
          name,
          value: value || "",
        }));
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        // In API routes, we can't set cookies directly
        // The client will handle this via headers
      },
    },
  });
}

