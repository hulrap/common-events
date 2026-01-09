export function EventCardSkeleton() {
  return (
    <div className="rounded-xl shadow-sm overflow-hidden grain-texture card-glass">
      {/* Banner Image Skeleton */}
      <div className="relative w-full aspect-square md:aspect-video overflow-hidden bg-black">
        <div className="w-full h-full skeleton-shimmer" />
      </div>

      {/* Content Skeleton */}
      <div className="p-5 relative h-[120px] flex flex-col justify-between bg-black/85 backdrop-blur-sm">
        {/* Title Skeleton */}
        <div className="w-full">
          <div className="h-5 skeleton-shimmer rounded w-3/4" />
        </div>

        {/* Metadata Skeleton */}
        <div className="flex flex-col gap-2">
          <div className="h-4 skeleton-shimmer rounded w-2/3" />
          <div className="h-4 skeleton-shimmer rounded w-1/2" />
        </div>
      </div>

      {/* Like Button Skeleton - Most users are not editors, so only show like button */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className="size-12 skeleton-shimmer rounded-full" />
      </div>
    </div>
  );
}

