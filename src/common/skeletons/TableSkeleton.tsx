import { SkeletonLine, SkeletonCircle, SkeletonRect, SkeletonRow } from './SkeletonPrimitives';

export interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  showHeader?: boolean;
  showCard?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function TableSkeleton({
  columns = 5,
  rows = 5,
  showHeader = true,
  showCard = true,
  title,
  subtitle,
  className = '',
}: TableSkeletonProps) {
  const content = (
    <div className="ax-table-wrap" aria-busy="true" aria-label="Loading table content">
      <table className="ax-table ax-table--hover">
        {showHeader && (
          <thead className="ax-table__head">
            <tr>
              {Array.from({ length: columns }).map((_, c) => (
                <th key={c} className="ax-table__th" scope="col">
                  <SkeletonLine width={`${55 + (c % 3) * 15}%`} height="0.85em" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="ax-table__row">
              {Array.from({ length: columns }).map((_, c) => {
                if (c === 0) {
                  return (
                    <td key={c} className="ax-table__td">
                      <SkeletonRow>
                        <SkeletonCircle size={28} />
                        <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <SkeletonLine width={`${70 + (r % 3) * 10}%`} height="0.9em" />
                          <SkeletonLine width="45%" height="0.65em" />
                        </div>
                      </SkeletonRow>
                    </td>
                  );
                }
                if (c === columns - 1) {
                  return (
                    <td key={c} className="ax-table__td">
                      <SkeletonRect width={74} height={24} borderRadius="var(--ax-radius-pill)" />
                    </td>
                  );
                }
                return (
                  <td key={c} className="ax-table__td">
                    <SkeletonLine width={`${50 + ((r + c) % 4) * 12}%`} height="0.85em" />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!showCard) {
    return <div className={className}>{content}</div>;
  }

  return (
    <section className={`ax-card ${className}`} role="region" aria-busy="true">
      <div className="ax-card__header">
        <div className="ax-card__titles">
          <SkeletonLine width={120} height="0.7em" style={{ marginBottom: 6 }} />
          <h2 className="ax-card__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {title ? <span>{title}</span> : <SkeletonLine width={220} height="1.1em" />}
          </h2>
          {subtitle !== undefined ? (
            <p className="ax-card__subtitle">{subtitle}</p>
          ) : (
            <SkeletonLine width={340} height="0.8em" style={{ marginTop: 6 }} />
          )}
        </div>
        <div className="ax-card__actions">
          <SkeletonRect width={160} height={32} borderRadius="var(--ax-radius-md)" />
        </div>
      </div>
      {content}
      <div className="ax-card__footer" style={{ justifyContent: 'space-between', padding: 'var(--ax-space-3) var(--ax-space-4)' }}>
        <SkeletonLine width={180} height="0.8em" />
        <SkeletonRect width={220} height={28} borderRadius="var(--ax-radius-md)" />
      </div>
    </section>
  );
}
