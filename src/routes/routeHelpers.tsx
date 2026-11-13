import { lazy, Suspense, type ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { canAccessSlug } from '../services/stateAccess';
import { DashboardSkeleton } from '../common/skeletons';

export type PageComponent = ReturnType<typeof lazy>;

export const wrap = (C: PageComponent): ReactElement => (
  <Suspense fallback={<DashboardSkeleton />}>
    <C />
  </Suspense>
);

export function RequireAccess({ slug, children }: { slug: string; children: ReactElement }) {
  if (!canAccessSlug(slug)) {
    const isVPortal = slug.startsWith('v/') || slug.startsWith('v-') || slug.includes('v-portal');
    return <Navigate to={isVPortal ? "/v-dashboard" : "/dle/dashboard"} replace />;
  }
  return children;
}

export const guarded = (slug: string, C: PageComponent): ReactElement => (
  <RequireAccess slug={slug}>{wrap(C)}</RequireAccess>
);
