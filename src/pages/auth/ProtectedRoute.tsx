import type { ReactNode } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardSkeleton } from '../../common/skeletons/DashboardSkeleton';

interface ProtectedRouteProps {
  children?: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show full dashboard skeleton instead of any spinner while verifying session
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a vendor visits DLE routes, redirect directly to /v-dashboard
  const isVendor =
    user?.role === 'vendor' ||
    !!user?.vendor_id ||
    (user?.user_type && String(user.user_type).toLowerCase() === 'vendor');

  if (isVendor && location.pathname.startsWith('/dle')) {
    return <Navigate to="/v-dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute;
