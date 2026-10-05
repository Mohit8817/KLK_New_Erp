
import { SkeletonLine, SkeletonRect } from './SkeletonPrimitives';

export function PageSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto" aria-busy="true">
      <div className="flex flex-col gap-2 mb-6">
        <SkeletonLine width={120} height="0.7em" />
        <SkeletonLine width={240} height="1.5em" />
        <SkeletonLine width={360} height="0.85em" />
      </div>
      <div className="ax-card p-6 mb-6">
        <div className="flex flex-col gap-4">
          <SkeletonRect width="100%" height={160} borderRadius="var(--ax-radius-lg)" />
          <SkeletonLine width="80%" height="1em" />
          <SkeletonLine width="60%" height="0.85em" />
        </div>
      </div>
    </div>
  );
}

export default PageSkeleton;
