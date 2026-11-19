interface SkeletonRowProps {
  className?: string;
}

/**
 * Loading placeholder matching an approval / activity row exactly:
 * rounded-xl bordered row, p-4, title + two meta lines + badge.
 * Same dimensions as the real row, so content never shifts when it loads.
 */
export default function SkeletonRow({ className = '' }: SkeletonRowProps) {
  return (
    <div
      className={`rounded-xl border border-line bg-bg p-4 ${className}`}
      aria-label="Memuat…"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="skeleton-shimmer h-4 w-2/5 rounded-lg" />
          <div className="skeleton-shimmer mt-2 h-3 w-4/5 rounded-lg" />
          <div className="skeleton-shimmer mt-2 h-3 w-1/3 rounded-lg" />
        </div>
        <div className="skeleton-shimmer h-6 w-16 shrink-0 rounded-full" />
      </div>
    </div>
  );
}
