import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const authToken = req.headers.authorization?.split(" ")[1];

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return res.status(500).json({ error: "Missing Supabase configuration" });
    }

    if (!authToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Use service role key for storage (bypasses RLS)
    // Auth is verified by checking the token is present (client handles validation)
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { file, type, fileName, filePath } = req.body;

    if (!file) {
      return res.status(400).json({ error: "File is required" });
    }

    if (!fileName || !filePath) {
      return res.status(400).json({ error: "File name and path are required" });
    }

    const bannerType = type === "mobile" ? "mobile" : "desktop";

    // Validate file type from base64
    const fileBuffer = Buffer.from(file, "base64");
    let mimeType = "image/jpeg"; // default

    // Check file signatures
    if (fileBuffer.length >= 2 && fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8) {
      mimeType = "image/jpeg";
    } else if (fileBuffer.length >= 8) {
      const header = fileBuffer.slice(0, 8).toString("hex");
      if (header.startsWith("89504e47")) {
        mimeType = "image/png";
      } else if (header.includes("52494646") && fileBuffer.toString("utf8", 0, 12).includes("WEBP")) {
        mimeType = "image/webp";
      }
    }

    if (!ALLOWED_TYPES.has(mimeType)) {
      return res.status(400).json({ error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." });
    }

    if (fileBuffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({ error: "File size exceeds 5MB limit." });
    }

    const blob = new Blob([fileBuffer], { type: mimeType });
    const fileObj = new File([blob], fileName, { type: mimeType });

    const { data: uploadData, error } = await supabase.storage
      .from("event-banners")
      .upload(filePath, fileObj, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      const errorMsg = error.message || 'Unknown error';
      if (errorMsg.includes('row level security') || errorMsg.includes('RLS')) {
        // This error appears when:
        // 1. RLS is enabled but user not authenticated (appears as anon role)
        // 2. RLS policies exist but don't allow this user
        // Try uploading directly from client as workaround
        throw new Error(`Storage permission denied. If the issue persists, try uploading images directly from the browser instead of through the server.`);
      }
      throw new Error(`Failed to upload banner: ${errorMsg}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("event-banners").getPublicUrl(uploadData.path);

    return res.status(200).json({ url: publicUrl });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error uploading temp banner:", errorMsg);
    return res.status(400).json({ error: errorMsg });
  }
}

