export default function SiteCardSkeleton({ delayMs = 0 }: { delayMs?: number }) {
  return (
    <div className="select-none" aria-hidden>
      <div
        className="skeleton-shimmer aspect-square rounded-md border border-hairline"
        style={{ ["--skeleton-delay" as string]: `${delayMs}ms` }}
      />
      <div className="px-0.5 pt-2 space-y-2">
        <div
          className="skeleton-shimmer h-3.5 w-[78%] rounded-full"
          style={{ ["--skeleton-delay" as string]: `${delayMs + 80}ms` }}
        />
        <div
          className="skeleton-shimmer h-3 w-[52%] rounded-full"
          style={{ ["--skeleton-delay" as string]: `${delayMs + 140}ms` }}
        />
      </div>
    </div>
  );
}

export function PinGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="pin-masonry" role="status" aria-label="Loading pins">
      {Array.from({ length: count }).map((_, i) => (
        <SiteCardSkeleton key={i} delayMs={i * 90} />
      ))}
    </div>
  );
}
