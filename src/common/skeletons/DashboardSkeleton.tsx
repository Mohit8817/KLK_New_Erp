
import { SkeletonLine, SkeletonCircle, SkeletonRect, SkeletonRow } from './SkeletonPrimitives';

export function DashboardSkeleton() {
  return (
    <div className="ax-dashboard-skeleton min-h-screen w-full p-4 sm:p-6 lg:p-8" aria-busy="true" aria-label="Loading dashboard...">
      {/* 1. Header Skeleton: Eyebrow + Page Title + Action Pill */}
      <div
        className="ax-dash-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/60 dark:border-slate-800/60"
        style={{ marginBottom: 'var(--ax-space-6)' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonLine width={140} height="0.75em" />
          <SkeletonLine width={280} height="1.6em" />
          <SkeletonLine width={380} height="0.85em" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SkeletonRect width={110} height={38} borderRadius="var(--ax-radius-pill)" />
          <SkeletonRect width={130} height={38} borderRadius="var(--ax-radius-pill)" />
        </div>
      </div>

      {/* 2. Top 4 KPI Metrics Shimmer Cards */}
      <div className="ax-dash-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 'var(--ax-space-6)' }}>
        {[0, 1, 2, 3].map((i) => (
          <section key={i} className="ax-card p-5" role="region" aria-label="Loading metric">
            <div className="ax-skeleton-stat flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <SkeletonRect width={44} height={44} borderRadius="var(--ax-radius-lg)" />
                <SkeletonRect width={68} height={24} borderRadius="var(--ax-radius-pill)" />
              </div>
              <SkeletonLine width="60%" height="0.85em" style={{ marginTop: 6 }} />
              <SkeletonLine width="80%" height="1.6em" style={{ marginTop: 2 }} />
              <div className="flex items-center gap-2 mt-2">
                <SkeletonLine width="40%" height="0.7em" />
                <SkeletonLine width="30%" height="0.7em" />
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* 3. Middle Grid: 2 Analytical Cards / Charts */}
      <div className="ax-dash-grid grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ marginBottom: 'var(--ax-space-6)' }}>
        {/* Large Analytics / Chart Placeholder (8 cols) */}
        <section className="ax-card lg:col-span-8 p-5" role="region" aria-label="Loading analytics">
          <div className="ax-card__header flex justify-between items-center mb-4">
            <div className="flex flex-col gap-1.5">
              <SkeletonLine width={100} height="0.7em" />
              <SkeletonLine width={220} height="1.1em" />
            </div>
            <div className="flex gap-2">
              <SkeletonRect width={70} height={28} borderRadius="var(--ax-radius-pill)" />
              <SkeletonRect width={70} height={28} borderRadius="var(--ax-radius-pill)" />
            </div>
          </div>
          <div className="py-2">
            <SkeletonRect width="100%" height={260} borderRadius="var(--ax-radius-md)" />
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
            <SkeletonLine width={120} height="0.8em" />
            <SkeletonLine width={180} height="0.8em" />
          </div>
        </section>

        {/* Status / Breakdown Card (4 cols) */}
        <section className="ax-card lg:col-span-4 p-5" role="region" aria-label="Loading breakdown">
          <div className="ax-card__header flex justify-between items-center mb-4">
            <div className="flex flex-col gap-1.5">
              <SkeletonLine width={90} height="0.7em" />
              <SkeletonLine width={160} height="1.1em" />
            </div>
            <SkeletonCircle size={28} />
          </div>
          <div className="flex flex-col gap-4 py-2">
            {[0, 1, 2].map((n) => (
              <div key={n} className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <SkeletonLine width="45%" height="0.85em" />
                  <SkeletonLine width="20%" height="0.85em" />
                </div>
                <SkeletonRect width="100%" height={8} borderRadius="var(--ax-radius-pill)" />
              </div>
            ))}
            <div className="pt-2">
              <SkeletonRect width="100%" height={90} borderRadius="var(--ax-radius-md)" />
            </div>
          </div>
        </section>
      </div>

      {/* 4. Bottom Table: Material & Equipment Tracking Table Skeleton */}
      <section className="ax-card p-5" role="region" aria-label="Loading data table">
        <div className="ax-card__header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex flex-col gap-1.5">
            <SkeletonLine width={130} height="0.7em" />
            <SkeletonLine width={260} height="1.2em" />
            <SkeletonLine width={340} height="0.8em" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SkeletonRect width={180} height={34} borderRadius="var(--ax-radius-md)" />
            <SkeletonRect width={140} height={34} borderRadius="var(--ax-radius-md)" />
            <SkeletonRect width={120} height={34} borderRadius="var(--ax-radius-md)" />
          </div>
        </div>

        <div className="ax-table-wrap overflow-x-auto">
          <table className="ax-table ax-table--hover w-full">
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col"><SkeletonLine width={160} height="0.85em" /></th>
                <th className="ax-table__th" scope="col"><SkeletonLine width={100} height="0.85em" /></th>
                <th className="ax-table__th" scope="col"><SkeletonLine width={80} height="0.85em" /></th>
                <th className="ax-table__th" scope="col"><SkeletonLine width={80} height="0.85em" /></th>
                <th className="ax-table__th" scope="col"><SkeletonLine width={80} height="0.85em" /></th>
                <th className="ax-table__th" scope="col"><SkeletonLine width={90} height="0.85em" /></th>
              </tr>
            </thead>
            <tbody>
              {[120, 140, 110, 150, 130].map((w, idx) => (
                <tr key={idx} className="ax-table__row">
                  <td className="ax-table__td">
                    <SkeletonRow>
                      <SkeletonCircle size={30} />
                      <div className="flex flex-col gap-1.5 flex-1">
                        <SkeletonLine width={w} height="0.9em" />
                        <SkeletonLine width={w * 0.7} height="0.65em" />
                      </div>
                    </SkeletonRow>
                  </td>
                  <td className="ax-table__td"><SkeletonLine width={80} height="0.85em" /></td>
                  <td className="ax-table__td"><SkeletonLine width={60} height="0.85em" /></td>
                  <td className="ax-table__td"><SkeletonLine width={60} height="0.85em" /></td>
                  <td className="ax-table__td"><SkeletonLine width={60} height="0.85em" /></td>
                  <td className="ax-table__td">
                    <SkeletonRect width={75} height={22} borderRadius="var(--ax-radius-pill)" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
          <SkeletonLine width={160} height="0.8em" />
          <SkeletonRect width={220} height={30} borderRadius="var(--ax-radius-md)" />
        </div>
      </section>
    </div>
  );
}

export default DashboardSkeleton;
