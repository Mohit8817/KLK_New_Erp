import { lazy, Suspense, type ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/shell/Layout';
import { CustomizerProvider } from './context/CustomizerContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './pages/auth/ProtectedRoute';
import { DocumentTitle } from './hooks/useDocumentTitle';
import { DashboardSkeleton } from './common/skeletons';

type PageComponent = ReturnType<typeof lazy>;

// ── Core ERP Portal Pages ──
// Assam SWP Installation Portal
const AssamDashboard = lazy(() => import('./components/V-Portal/assam/Installation/Swp/AssamDashboard'));
const AssamInstallation = lazy(() => import('./components/V-Portal/assam/Installation/Swp/Installation'));
const AssamInstallationRequest = lazy(() => import('./components/V-Portal/assam/Installation/Swp/InstallationRequest'));
const AssamInstallationSite = lazy(() => import('./components/V-Portal/assam/Installation/Swp/InstallationSite'));
const AssamViewInstallation = lazy(() => import('./components/V-Portal/assam/Installation/Swp/ViewInstallation'));
const AssamViewPayment = lazy(() => import('./components/V-Portal/assam/Installation/Swp/ViewPayment'));

// Jammu Operations Portal
const JammuDashboard = lazy(() => import('./components/V-Portal/jammu/JammuDashboard'));
const JammuAddSRT70MW = lazy(() => import('./components/V-Portal/jammu/AddJammuSRT70MW'));
const JammuAddSRT70MWSingleCard = lazy(() => import('./components/V-Portal/jammu/AddJammuSRT70MWSingleCard'));
const JammuViewData = lazy(() => import('./components/V-Portal/jammu/ViewData'));












const DLEDashboard = lazy(() => import('./components/DLE/DLEDashboard'));
const BiharAMCSSLAssignLight = lazy(() => import('./components/DLE/Bihar/AMC/SSL/BiharAMCSSLAssignLight'));
const BiharAMCSSLViewAssignLight = lazy(() => import('./components/DLE/Bihar/AMC/SSL/BiharAMCSSLViewAssignLight'));
const BiharAMCSSLViewSurveyLight = lazy(() => import('./components/DLE/Bihar/AMC/SSL/BiharAMCSSLViewSurveyLight'));
const BiharULAInstallationDashboard = lazy(() => import('./components/DLE/Bihar/Installation/ULA/BiharULAInstallationDashboard'));
const BiharULAInstallationViewData = lazy(() => import('./components/DLE/Bihar/Installation/ULA/BiharULAInstallationViewData'));
const UPAMCSSLAssignLights = lazy(() => import('./components/DLE/UP/AMC/SSL/UPAMCSSLAssignLights'));
const UPAMCSSLViewAssignLight = lazy(() => import('./components/DLE/UP/AMC/SSL/UPAMCSSLViewAssignLight'));
const UPAMCSSLViewSurveyLight = lazy(() => import('./components/DLE/UP/AMC/SSL/UPAMCSSLViewSurveyLight'));
const DLEManagementViewData = lazy(() => import('./components/DLE/Management/DLEManagementViewData'));


// ── Auth & System Pages ──
const SolarLogin = lazy(() => import('./pages/auth/Login'));
const PagesLogout = lazy(() => import('./pages/pages/Logout'));
const Error401 = lazy(() => import('./pages/error/Error401'));
const Error403 = lazy(() => import('./pages/error/Error403'));
const Error404 = lazy(() => import('./pages/error/Error404'));
const Error500 = lazy(() => import('./pages/error/Error500'));
const Error503 = lazy(() => import('./pages/error/Error503'));

// Standalone routes (no dashboard shell)
const standalone: Record<string, PageComponent> = {
  'login': SolarLogin,
  'pages/logout': PagesLogout,
  'logout': PagesLogout,
  'error/401': Error401,
  'error/403': Error403,
  'error/404': Error404,
  'error/500': Error500,
  'error/503': Error503,
};

// Dashboard routes (inside sidebar & header shell)
const erpRoutes: Record<string, PageComponent> = {
  // Assam SWP Installation
  'assam/swp/dashboard': AssamDashboard,
  'assam/dashboard': AssamDashboard,
  'assam/installation': AssamInstallation,
  'assam/swp/installation-request': AssamInstallationRequest,
  'assam/installation-requests': AssamInstallationRequest,
  'assam/swp/installation-site': AssamInstallationSite,
  'assam/installation-site': AssamInstallationSite,
  'assam/swp/view-installation': AssamViewInstallation,
  'assam/view-installation': AssamViewInstallation,
  'assam/swp/view-payment': AssamViewPayment,
  'assam/view-payment': AssamViewPayment,

  // Jammu Operations
  'jammu/dashboard': JammuDashboard,
  'jammu/add-srt-70mw': JammuAddSRT70MW,
  'jammu/add-srt-new': JammuAddSRT70MWSingleCard,
  'jammu/add-srt-70mw-single': JammuAddSRT70MWSingleCard,
  'jammu/viewdata': JammuViewData,




  // DlE

  'dle/dashboard': DLEDashboard,
  'dle/bihar/ssl/amc/create-assign-light': BiharAMCSSLAssignLight,
  'dle/bihar/ssl/amc/view-assign-light': BiharAMCSSLViewAssignLight,
  'dle/bihar/ssl/amc/view-verify-light': BiharAMCSSLViewSurveyLight,
  'dle/bihar/ula/installation/dashboard': BiharULAInstallationDashboard,
  'dle/bihar/ula/installation/view': BiharULAInstallationViewData,
  'dle/up/ssl/amc/create-assign-light': UPAMCSSLAssignLights,
  'dle/up/ssl/amc/view-assign-light': UPAMCSSLViewAssignLight,
  'dle/up/ssl/amc/view-verify-light': UPAMCSSLViewSurveyLight,
  'dle/users': DLEManagementViewData,
};

const wrap = (C: PageComponent): ReactElement => (
  <Suspense fallback={<DashboardSkeleton />}>
    <C />
  </Suspense>
);

export function App() {
  return (
    <AuthProvider>
      <CustomizerProvider>
        <ToastProvider>
          <BrowserRouter>
            <DocumentTitle />
            <Routes>
              {/* Standalone Authentication and System Error Routes */}
              {Object.entries(standalone).map(([slug, C]) => (
                <Route key={slug} path={slug} element={wrap(C)} />
              ))}

              {/* Protected ERP Dashboard Layout */}
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                {/* Default root redirects to Assam SWP Dashboard */}
                <Route index element={<Navigate to="/assam/swp/dashboard" replace />} />

                {Object.entries(erpRoutes).map(([slug, C]) => (
                  <Route key={slug} path={slug} element={wrap(C)} />
                ))}
              </Route>

              {/* 404 Fallback */}
              <Route path="*" element={wrap(Error404)} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </CustomizerProvider>
    </AuthProvider>
  );
}

export default App;
