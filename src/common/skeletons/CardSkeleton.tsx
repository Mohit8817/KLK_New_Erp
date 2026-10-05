
import { SkeletonLine, SkeletonCircle, SkeletonRect, SkeletonRow } from './SkeletonPrimitives';

export interface CardSkeletonProps {
  className?: string;
  hasMedia?: boolean;
}

export function CardSkeleton({ className = '', hasMedia = true }: CardSkeletonProps) {
  return (
    <section className={`ax-card ${className}`} role="region" aria-busy="true">
      <div className="ax-card__header">
        <div className="ax-card__titles">
          <SkeletonLine width={80} height="0.65em" style={{ marginBottom: 6 }} />
          <SkeletonLine width={180} height="1.1em" />
        </div>
      </div>
      <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
        {hasMedia && (
          <SkeletonRect width="100%" height={140} borderRadius="var(--ax-radius-md)" />
        )}
        <SkeletonLine width="90%" height="0.9em" />
        <SkeletonLine width="100%" height="0.75em" />
        <SkeletonLine width="75%" height="0.75em" />
        <SkeletonRow style={{ marginTop: 'var(--ax-space-2)' }}>
          <SkeletonCircle size={28} />
          <SkeletonLine width="40%" height="0.75em" />
        </SkeletonRow>
      </div>
    </section>
  );
}

export interface ListSkeletonProps {
  items?: number;
  className?: string;
}

export function ListSkeleton({ items = 4, className = '' }: ListSkeletonProps) {
  return (
    <div className={`ax-card ${className}`} aria-busy="true">
      <div className="ax-card__header">
        <div className="ax-card__titles">
          <SkeletonLine width={100} height="0.65em" style={{ marginBottom: 6 }} />
          <SkeletonLine width={160} height="1.1em" />
        </div>
      </div>
      <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
        {Array.from({ length: items }).map((_, i) => (
          <SkeletonRow key={i}>
            <SkeletonCircle size={38} />
            <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SkeletonLine width={`${50 + (i % 3) * 15}%`} height="0.9em" />
              <SkeletonLine width={`${65 + (i % 2) * 20}%`} height="0.7em" />
            </div>
            <SkeletonRect width={54} height={22} borderRadius="var(--ax-radius-pill)" />
          </SkeletonRow>
        ))}
      </div>
    </div>
  );
}
