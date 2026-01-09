/**
 * S3-compatible storage client for MinIO
 * Used for self-hosted file storage (replaces Supabase Storage)
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand, CreateBucketCommand } from "@aws-sdk/client-s3";

// Singleton client instance
let s3Client: S3Client | null = null;

/**
 * Get or create the S3 client instance
 */
export function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  const endpoint = process.env.MINIO_ENDPOINT;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;

  if (!endpoint || !accessKey || !secretKey) {
    throw new Error("Missing MinIO/S3 environment variables (MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY)");
  }

  s3Client = new S3Client({
    endpoint,
    region: "us-east-1", // MinIO doesn't use regions but SDK requires it
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle: true, // Required for MinIO
  });

  return s3Client;
}

/**
 * Ensure a bucket exists, creating it if necessary
 */
export async function ensureBucketExists(bucketName: string): Promise<void> {
  const client = getS3Client();
  
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      await client.send(new CreateBucketCommand({ Bucket: bucketName }));
      console.log(`Created bucket: ${bucketName}`);
    } else {
      throw error;
    }
  }
}

/**
 * Upload a file to S3/MinIO
 */
export async function uploadToS3(
  bucketName: string,
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const client = getS3Client();
  
  await ensureBucketExists(bucketName);
  
  await client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: "public-read",
    CacheControl: "public, max-age=31536000", // 1 year cache
  }));

  // Return the public URL
  const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || process.env.MINIO_ENDPOINT;
  return `${storageUrl}/${bucketName}/${key}`;
}

/**
 * Delete a file from S3/MinIO
 */
export async function deleteFromS3(bucketName: string, key: string): Promise<void> {
  const client = getS3Client();
  
  await client.send(new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  }));
}

/**
 * Extract bucket and key from a storage URL
 */
export function parseStorageUrl(url: string): { bucket: string; key: string } | null {
  try {
    // Handle URLs like: https://domain.com/storage/bucket-name/path/to/file.jpg
    // Or: http://minio:9000/bucket-name/path/to/file.jpg
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // Remove 'storage' prefix if present (from Caddy routing)
    if (pathParts[0] === 'storage') {
      pathParts.shift();
    }
    
    if (pathParts.length < 2) return null;
    
    const bucket = pathParts[0];
    const key = pathParts.slice(1).join('/');
    
    return { bucket, key };
  } catch {
    return null;
  }
}
