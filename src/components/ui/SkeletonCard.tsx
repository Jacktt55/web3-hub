interface SkeletonCardProps {
  /** Number of shimmer lines in the body. */
  lines?: number;
  className?: string;
}

/** Loading placeholder — shown while a feature fetches live data. */
export default function SkeletonCard({
  lines = 3,
  className = '',
}: SkeletonCardProps) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface p-6 ${className}`}
      aria-label="Memuat…"
    >
      <div className="skeleton-shimmer mb-4 h-5 w-1/3 rounded-lg" />
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="skeleton-shimmer mb-2.5 h-3.5 rounded-lg"
          style={{ width: `${92 - i * 14}%` }}
        />
      ))}
    </div>
  );
}
