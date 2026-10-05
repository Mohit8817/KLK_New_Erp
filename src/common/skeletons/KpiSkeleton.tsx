
import { SkeletonLine, SkeletonRect } from './SkeletonPrimitives';

export interface KpiSkeletonProps {
  count?: number;
  className?: string;
}

export function KpiSkeleton({ count = 4, className = '' }: KpiSkeletonProps) {
  return (
    <div className={`ax-dash-grid ${className}`} style={{ marginBottom: 'var(--ax-space-6)' }} aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <section
          key={i}
          className="ax-card ax-col--3"
          style={{ padding: 'var(--ax-space-5)' }}
          role="region"
          aria-label="Loading metric"
        >
          <div className="ax-skeleton-stat">
            {/* Top row: Icon box + delta pill */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SkeletonRect width={42} height={42} borderRadius="var(--ax-radius-lg)" />
              <SkeletonRect width={64} height={22} borderRadius="var(--ax-radius-pill)" />
            </div>
            {/* Label */}
            <SkeletonLine width="55%" height="0.85em" style={{ marginTop: 'var(--ax-space-2)' }} />
            {/* Large numeral */}
            <SkeletonLine width="75%" height="1.6em" style={{ marginTop: 'var(--ax-space-1)' }} />
            {/* Progress / sub info line */}
            <SkeletonLine width="90%" height="0.65em" style={{ marginTop: 'var(--ax-space-2)' }} />
          </div>
        </section>
      ))}
    </div>
  );
}
