/**
 * Utility functions for optimizing images using Supabase Storage transformations
 *
 * Supabase Storage supports on-the-fly image transformations via URL parameters:
 * - format: webp (90% smaller than JPEG with same visual quality)
 * - width: responsive sizing
 * - quality: 90-95 for near-lossless quality
 */

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'origin';
}

/**
 * Get optimized image URL with Supabase transformations
 *
 * @param originalUrl - Original image URL from Supabase Storage
 * @param width - Desired width in pixels
 * @param quality - Quality level (1-100), default 95 for high quality
 * @returns Optimized image URL with transformation parameters
 */
export function getOptimizedImageUrl(
  originalUrl: string | null | undefined,
  width: number,
  quality: number = 95
): string | null {
  if (!originalUrl) return null;

  // Check if URL is from Supabase Storage
  if (!originalUrl.includes('supabase.co')) {
    return originalUrl; // Return as-is for non-Supabase URLs
  }

  // Build transformation parameters
  const params = new URLSearchParams();
  params.set('width', width.toString());
  params.set('quality', quality.toString());
  params.set('format', 'webp');

  return `${originalUrl}?${params.toString()}`;
}

/**
 * Get responsive image srcset for different screen sizes
 *
 * @param originalUrl - Original image URL from Supabase Storage
 * @param sizes - Array of widths for responsive images
 * @param quality - Quality level (1-100), default 95
 * @returns srcSet string for <img> or <Image> components
 */
export function getResponsiveSrcSet(
  originalUrl: string | null | undefined,
  sizes: number[] = [400, 800, 1200, 1600],
  quality: number = 95
): string | null {
  if (!originalUrl) return null;

  const srcSetItems = sizes.map(width => {
    const url = getOptimizedImageUrl(originalUrl, width, quality);
    return `${url} ${width}w`;
  });

  return srcSetItems.join(', ');
}

/**
 * Get optimized banner URLs for event cards
 *
 * @param bannerUrl - Desktop banner URL (16:9)
 * @param mobileBannerUrl - Mobile banner URL (1:1)
 * @param quality - Quality level, default 95
 * @returns Object with optimized URLs for different viewports
 */
export function getEventBannerUrls(
  bannerUrl: string | null | undefined,
  mobileBannerUrl: string | null | undefined,
  quality: number = 95
) {
  return {
    // Mobile (1:1 aspect ratio)
    mobile: {
      src: getOptimizedImageUrl(mobileBannerUrl ?? bannerUrl, 800, quality),
      srcSet: getResponsiveSrcSet(mobileBannerUrl ?? bannerUrl, [400, 800, 1200], quality),
      sizes: '(max-width: 768px) 100vw, 50vw',
    },
    // Desktop (16:9 aspect ratio)
    desktop: {
      src: getOptimizedImageUrl(bannerUrl ?? mobileBannerUrl, 1200, quality),
      srcSet: getResponsiveSrcSet(bannerUrl ?? mobileBannerUrl, [800, 1200, 1600], quality),
      sizes: '(max-width: 1024px) 50vw, 33vw',
    },
  };
}

/**
 * Supabase Image Loader for Next.js Image component
 * 
 * Usage:
 * <Image
 *   loader={supabaseLoader}
 *   src={imageUrl}
 *   width={800}
 *   height={600}
 *   ...
 * />
 */
export function supabaseLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  return getOptimizedImageUrl(src, width, quality || 75) || src;
}
