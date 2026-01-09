import type { NextApiRequest, NextApiResponse } from "next";
import { requireOrganizer } from "@/lib/auth/guards";
import { uploadToS3, deleteFromS3, parseStorageUrl } from "@/lib/storage/s3";
import formidable from "formidable";
import { readFile } from "fs/promises";

export const config = {
  api: {
    bodyParser: false, // Disable body parser for file uploads
  },
};

const BUCKET_NAME = "event-banners";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { error: authError } = await requireOrganizer();
    if (authError) {
      return authError;
    }

    if (req.method === "POST") {
      return handleUpload(req, res);
    } else if (req.method === "DELETE") {
      return handleDelete(req, res);
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in banner API:", error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleUpload(req: NextApiRequest, res: NextApiResponse) {
  const form = formidable({
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowEmptyFiles: false,
  });

  const [fields, files] = await form.parse(req);

  const file = files.file?.[0];
  const eventId = fields.eventId?.[0];
  const type = fields.type?.[0] || "desktop";

  if (!file || !eventId) {
    return res.status(400).json({ error: "File and event ID are required" });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.mimetype || "")) {
    return res.status(400).json({ error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." });
  }

  // Read file buffer
  const buffer = await readFile(file.filepath);

  // Generate file path
  const fileExt = file.originalFilename?.split(".").pop() || "jpg";
  const randomId = Math.random().toString(36).substring(2, 15);
  const fileName = `${eventId}-${type}-${Date.now()}-${randomId}.${fileExt}`;
  const filePath = type === "gallery" ? `gallery/${fileName}` : `banners/${fileName}`;

  // Upload to S3/MinIO
  const url = await uploadToS3(BUCKET_NAME, filePath, buffer, file.mimetype || "image/jpeg");

  return res.status(200).json({ url });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  // For DELETE, we need to parse JSON body manually
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  const { url } = JSON.parse(body);

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  const parsed = parseStorageUrl(url);
  if (!parsed) {
    return res.status(400).json({ error: "Invalid storage URL" });
  }

  await deleteFromS3(parsed.bucket, parsed.key);

  return res.status(200).json({ success: true });
}
