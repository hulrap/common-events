/**
 * Storage upload utilities for MinIO (S3-compatible)
 * Client-side functions that call server API for actual uploads
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Convert image to WebP format for better compression (client-side)
 */
async function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('WebP conversion failed'));
      }, 'image/webp', 0.8);
    };
    img.onerror = (e) => reject(e);
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate file before upload
 */
function validateFile(file: File): void {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds 5MB limit.");
  }
}

/**
 * Get CSRF token for API requests
 */
async function getCsrfToken(): Promise<string> {
  const res = await fetch("/api/auth/csrf");
  if (!res.ok) throw new Error("Failed to get CSRF token");
  const data = await res.json();
  return data.token;
}

/**
 * Upload a banner image via API (desktop or mobile)
 */
export async function uploadBanner(
  file: File,
  eventId: string,
  type: "desktop" | "mobile" = "desktop"
): Promise<string> {
  validateFile(file);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("eventId", eventId);
  formData.append("type", type);

  const csrfToken = await getCsrfToken();

  const response = await fetch("/api/upload/banner", {
    method: "POST",
    headers: {
      "x-csrf-token": csrfToken,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(error.error || "Failed to upload banner");
  }

  const data = await response.json();
  return data.url;
}

/**
 * Delete a banner image via API
 */
export async function deleteBanner(url: string): Promise<void> {
  const csrfToken = await getCsrfToken();

  const response = await fetch("/api/upload/banner", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Delete failed" }));
    throw new Error(error.error || "Failed to delete banner");
  }
}

/**
 * Upload a gallery image via API (with WebP conversion)
 */
export async function uploadGalleryImage(
  file: File,
  eventId: string
): Promise<string> {
  validateFile(file);

  // Convert to WebP for better compression (client-side)
  let uploadFile = file;

  try {
    const webpBlob = await convertToWebP(file);
    uploadFile = new File([webpBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" });
  } catch (e) {
    console.warn("WebP conversion failed, falling back to original format", e);
  }

  const formData = new FormData();
  formData.append("file", uploadFile);
  formData.append("eventId", eventId);
  formData.append("type", "gallery");

  const csrfToken = await getCsrfToken();

  const response = await fetch("/api/upload/banner", {
    method: "POST",
    headers: {
      "x-csrf-token": csrfToken,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(error.error || "Failed to upload gallery image");
  }

  const data = await response.json();
  return data.url;
}

/**
 * Delete a gallery image via API
 */
export async function deleteGalleryImage(url: string): Promise<void> {
  return deleteBanner(url); // Same endpoint handles all image deletions
}
