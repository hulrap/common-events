export function EventDetailSkeleton() {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-black">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/95 p-4 pb-3 backdrop-blur-sm grain-texture header-glass">
        <div className="h-10 w-10 skeleton-shimmer rounded-full" />
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 skeleton-shimmer rounded-full" />
          <div className="h-10 w-10 skeleton-shimmer rounded-full" />
          <div className="h-10 w-10 skeleton-shimmer rounded-full" />
          <div className="h-10 w-10 skeleton-shimmer rounded-full" />
        </div>
      </div>

      {/* Banner Skeleton */}
      <div className="relative w-full aspect-square md:aspect-video bg-black">
        <div className="w-full h-full skeleton-shimmer bg-white/5" />
      </div>

      {/* Content Skeleton */}
      <main className="flex-1 pb-32">
        <div className="px-4 py-6 space-y-5">
          {/* Title Card Skeleton */}
          <div className="rounded-xl border border-white/10 bg-white/15 backdrop-blur-sm grain-texture card-glass p-5">
            <div className="h-8 skeleton-shimmer rounded w-3/4 mb-3" />
            <div className="h-4 skeleton-shimmer rounded w-1/2" />
          </div>

          {/* Date Card Skeleton */}
          <div className="rounded-xl border border-white/10 bg-white/15 backdrop-blur-sm grain-texture card-glass p-5">
            <div className="h-6 skeleton-shimmer rounded w-2/3 mb-2" />
            <div className="h-4 skeleton-shimmer rounded w-1/3" />
          </div>

          {/* Description Card Skeleton */}
          <div className="rounded-xl border border-white/10 bg-white/15 backdrop-blur-sm grain-texture card-glass p-5">
            <div className="h-6 skeleton-shimmer rounded w-1/4 mb-4" />
            <div className="space-y-2">
              <div className="h-4 skeleton-shimmer rounded w-full" />
              <div className="h-4 skeleton-shimmer rounded w-full" />
              <div className="h-4 skeleton-shimmer rounded w-5/6" />
              <div className="h-4 skeleton-shimmer rounded w-4/5" />
            </div>
          </div>

          {/* Tickets Card Skeleton */}
          <div className="rounded-xl border border-white/10 bg-white/15 backdrop-blur-sm grain-texture card-glass p-5">
            <div className="h-6 skeleton-shimmer rounded w-1/4 mb-4" />
            <div className="rounded-lg border border-white/10 bg-black/40 p-4">
              <div className="h-5 skeleton-shimmer rounded w-1/3 mb-2" />
              <div className="h-4 skeleton-shimmer rounded w-1/4" />
            </div>
          </div>

          {/* Location Card Skeleton */}
          <div className="rounded-xl border border-white/10 bg-white/15 backdrop-blur-sm grain-texture card-glass p-5">
            <div className="h-6 skeleton-shimmer rounded w-1/4 mb-4" />
            <div className="space-y-3">
              <div className="h-5 skeleton-shimmer rounded w-1/2" />
              <div className="h-4 skeleton-shimmer rounded w-2/3" />
              <div className="h-4 skeleton-shimmer rounded w-1/3" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

