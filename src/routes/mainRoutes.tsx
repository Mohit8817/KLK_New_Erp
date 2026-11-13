import { lazy, type ReactElement } from 'react';
import { Route } from 'react-router-dom';
import { wrap, guarded, type PageComponent } from './routeHelpers';

// ═══════════════════════════════════════════════════════════════════════════
// AUTH & STANDALONE PAGES
// ═══════════════════════════════════════════════════════════════════════════
const SolarLogin = lazy(() => import('../pages/auth/Login'));
const Error401 = lazy(() => import('../pages/error/Error401'));
const Error403 = lazy(() => import('../pages/error/Error403'));
const Error404 = lazy(() => import('../pages/error/Error404'));
const Error500 = lazy(() => import('../pages/error/Error500'));
const Error503 = lazy(() => import('../pages/error/Error503'));
const PagesComingSoon = lazy(() => import('../pages/pages/ComingSoon'));
const PagesLanding = lazy(() => import('../pages/pages/Landing'));
const PagesLogout = lazy(() => import('../pages/pages/Logout'));

export const standaloneRoutesMap: Record<string, PageComponent> = {
  'login': SolarLogin,
  'pages/login': SolarLogin,
  'auth/login': SolarLogin,
  'auth/solar-login': SolarLogin,
  'auth/sign-in-basic': SolarLogin,
  'auth/sign-in-cover': SolarLogin,
  'auth/coming-soon': PagesComingSoon,
  'auth/create-password-basic': SolarLogin,
  'auth/create-password-cover': SolarLogin,
  'auth/lock-screen-basic': SolarLogin,
  'auth/lock-screen-cover': SolarLogin,
  'auth/maintenance': PagesComingSoon,
  'auth/reset-password-basic': SolarLogin,
  'auth/reset-password-cover': SolarLogin,
  'auth/sign-up-basic': SolarLogin,
  'auth/sign-up-cover': SolarLogin,
  'auth/two-step-basic': SolarLogin,
  'auth/two-step-cover': SolarLogin,
  'error/401': Error401,
  'error/403': Error403,
  'error/404': Error404,
  'error/500': Error500,
  'error/503': Error503,
  'pages/coming-soon': PagesComingSoon,
  'pages/landing': PagesLanding,
  'pages/logout': PagesLogout,
};

export const standaloneRoutes: ReactElement[] = Object.entries(standaloneRoutesMap).map(([slug, C]) => (
  <Route key={slug} path={slug} element={wrap(C)} />
));

// ═══════════════════════════════════════════════════════════════════════════
// FULL-SCREEN APP SHELL (apps/*)
// ═══════════════════════════════════════════════════════════════════════════
const AppsCalendar = lazy(() => import('../pages/apps/Calendar'));
const AppsChat = lazy(() => import('../pages/apps/Chat'));
const AppsContacts = lazy(() => import('../pages/apps/Contacts'));
const AppsEmail = lazy(() => import('../pages/apps/Email'));
const AppsEmailCompose = lazy(() => import('../pages/apps/EmailCompose'));
const AppsEmailSettings = lazy(() => import('../pages/apps/EmailSettings'));
const AppsFileManager = lazy(() => import('../pages/apps/FileManager'));
const AppsGallery = lazy(() => import('../pages/apps/Gallery'));
const AppsKanban = lazy(() => import('../pages/apps/Kanban'));
const AppsMediaPlayer = lazy(() => import('../pages/apps/MediaPlayer'));
const AppsNotes = lazy(() => import('../pages/apps/Notes'));
const AppsTasks = lazy(() => import('../pages/apps/Tasks'));
const AppsTodo = lazy(() => import('../pages/apps/Todo'));

export const appShellRoutesMap: Record<string, PageComponent> = {
  'apps/calendar': AppsCalendar,
  'apps/chat': AppsChat,
  'apps/contacts': AppsContacts,
  'apps/email': AppsEmail,
  'apps/email-compose': AppsEmailCompose,
  'apps/email-settings': AppsEmailSettings,
  'apps/file-manager': AppsFileManager,
  'apps/gallery': AppsGallery,
  'apps/kanban': AppsKanban,
  'apps/media-player': AppsMediaPlayer,
  'apps/notes': AppsNotes,
  'apps/tasks': AppsTasks,
  'apps/todo': AppsTodo,
};

export const appShellRoutes: ReactElement[] = Object.entries(appShellRoutesMap).map(([slug, C]) => (
  <Route key={slug} path={slug} element={wrap(C)} />
));

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ERP PORTAL & DLE PORTAL
// ═══════════════════════════════════════════════════════════════════════════
const ErpMainDashboard = lazy(() => import('../pages/dashboards/ErpMainDashboard'));
const ModulePlaceholder = lazy(() => import('../pages/dashboards/ModulePlaceholder'));
const DashboardsAnalytics = lazy(() => import('../pages/dashboards/Analytics'));
const MapsLeaflet = lazy(() => import('../pages/maps/Leaflet'));

// DLE Portal Modules
const DLEDashboard = lazy(() => import('../components/DLE/DLEDashboard'));
const BiharAMCSSLAssignLight = lazy(() => import('../components/DLE/Bihar/AMC/SSL/BiharAMCSSLAssignLight'));
const BiharAMCSSLViewAssignLight = lazy(() => import('../components/DLE/Bihar/AMC/SSL/BiharAMCSSLViewAssignLight'));
const BiharAMCSSLViewSurveyLight = lazy(() => import('../components/DLE/Bihar/AMC/SSL/BiharAMCSSLViewSurveyLight'));
const BiharAMCSSLSurveyLightDetails = lazy(() => import('../components/DLE/Bihar/AMC/SSL/BiharAMCSSLSurveyLightDetails'));
const BiharULAInstallationDashboard = lazy(() => import('../components/DLE/Bihar/Installation/ULA/BiharULAInstallationDashboard'));
const BiharULAInstallationViewData = lazy(() => import('../components/DLE/Bihar/Installation/ULA/BiharULAInstallationViewData'));
const BiharULAInstallationViewDataDetails = lazy(() => import('../components/DLE/Bihar/Installation/ULA/BiharULAInstallationViewDataDetails'));
const UPAMCSSLAssignLights = lazy(() => import('../components/DLE/UP/AMC/SSL/UPAMCSSLAssignLights'));
const UPAMCSSLViewAssignLight = lazy(() => import('../components/DLE/UP/AMC/SSL/UPAMCSSLViewAssignLight'));
const UPAMCSSLViewSurveyLight = lazy(() => import('../components/DLE/UP/AMC/SSL/UPAMCSSLViewSurveyLight'));
const UPAMCSSLSurveyLightDetails = lazy(() => import('../components/DLE/UP/AMC/SSL/UPAMCSSLSurveyLightDetails'));
const DLEManagementViewData = lazy(() => import('../components/DLE/Management/DLEManagementViewData'));
const DleUserDetail = lazy(() => import('../components/DLE/Management/DleUserDetail'));
const DLEAttendanceViewData = lazy(() => import('../components/DLE/Attendance/DLEAttendanceViewData'));
const DLEAttendanceDetail = lazy(() => import('../components/DLE/Attendance/DLEAttendanceDetail'));

const dleRoutesMap: Record<string, PageComponent> = {
  'dle/dashboard': DLEDashboard,
  'dle/bihar/ssl/amc/create-assign-light': BiharAMCSSLAssignLight,
  'dle/bihar/ssl/amc/view-assign-light': BiharAMCSSLViewAssignLight,
  'dle/bihar/ssl/amc/view-verify-light': BiharAMCSSLViewSurveyLight,
  'dle/bihar/ssl/amc/view-verify-light/:id': BiharAMCSSLSurveyLightDetails,
  'dle/bihar/ula/installation/dashboard': BiharULAInstallationDashboard,
  'dle/bihar/ula/installation/view': BiharULAInstallationViewData,
  'dle/bihar/ula/installation/view/:id': BiharULAInstallationViewDataDetails,
  'dle/up/ssl/amc/create-assign-light': UPAMCSSLAssignLights,
  'dle/up/ssl/amc/view-assign-light': UPAMCSSLViewAssignLight,
  'dle/up/ssl/amc/view-verify-light': UPAMCSSLViewSurveyLight,
  'dle/up/ssl/amc/view-verify-light/:id': UPAMCSSLSurveyLightDetails,
  'dle/users': DLEManagementViewData,
  'dle/users/:id': DleUserDetail,
  'dle/attendance': DLEAttendanceViewData,
  'dle/attendance/:id': DLEAttendanceDetail,
  'attendance': DLEAttendanceViewData,
  'attendance/:id': DLEAttendanceDetail,
};

export const mainPortalRoutes: ReactElement[] = [
  // ERP Main Dashboard
  <Route key="main.index" index element={wrap(ErpMainDashboard)} />,
  <Route key="main.dashboard" path="dashboard" element={wrap(ErpMainDashboard)} />,
  <Route key="main.erp-dashboard" path="erp-dashboard" element={wrap(ErpMainDashboard)} />,

  // ERP General Modules
  <Route key="main.gallery" path="gallery" element={wrap(AppsGallery)} />,
  <Route key="main.complaints" path="complaints" element={wrap(ModulePlaceholder)} />,
  <Route key="main.reports.analytics" path="reports/analytics" element={wrap(DashboardsAnalytics)} />,
  <Route key="main.reports.geo" path="reports/geo-reports" element={wrap(MapsLeaflet)} />,
  <Route key="main.settings" path="settings" element={wrap(ModulePlaceholder)} />,

  // DLE Portal
  ...Object.entries(dleRoutesMap).map(([slug, C]) => (
    <Route key={`dle.${slug}`} path={slug} element={guarded(slug, C)} />
  )),
];

// Unknown → 404
export const notFoundRoute: ReactElement = (
  <Route key="not-found" path="*" element={wrap(Error404)} />
);
