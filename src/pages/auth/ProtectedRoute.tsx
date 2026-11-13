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

  // Strict Role Separation:
  const isVendor =
    user?.role === 'vendor' ||
    !!user?.vendor_id ||
    (user?.user_type && String(user.user_type).toLowerCase() === 'vendor');

  // 1. External Vendor: Restricted strictly to V-Portal
  if (isVendor) {
    const isVPortalPath =
      location.pathname === '/v' || location.pathname === '/v/' || location.pathname === '/v-dashboard' ||
      location.pathname.startsWith('/v/') ||
      location.pathname.startsWith('/v-') ||
      location.pathname === '/vendor' ||
      location.pathname === '/vendor/dashboard';

    // If vendor tries to access Super Admin dashboard or DLE or Vendor Management
    if (!isVPortalPath) {
      return <Navigate to="/v-dashboard" replace />;
    }
  }

  // 2. Super Admin / User: Keep inside Super Admin ecosystem
  if (!isVendor) {
    if (location.pathname === '/v-dashboard') {
      return <Navigate to="/vendor-management" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute;
