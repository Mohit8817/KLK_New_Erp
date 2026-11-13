import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/shell/Layout';
import { AppLayout } from './components/shell/AppLayout';
import { CustomizerProvider } from './context/CustomizerContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './pages/auth/ProtectedRoute';
import { DocumentTitle } from './hooks/useDocumentTitle';
import {
  standaloneRoutes,
  appShellRoutes,
  mainPortalRoutes,
  vPortalRoutes,
  vendorManagementRoutes,
  templateRoutes,
  notFoundRoute,
} from './routes';

export function App() {
  return (
    <AuthProvider>
      <CustomizerProvider>
        <BrowserRouter>
          <DocumentTitle />
          <Routes>
            {/* Standalone pages outside shell (auth, errors, coming soon, etc.) */}
            {standaloneRoutes}

            {/* Full-screen app shell (/apps/*) */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {appShellRoutes}
            </Route>

            {/* Main Shell (ERP Portal, DLE Portal, V-Portal, Super Admin Vendor Management, Templates) */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {mainPortalRoutes}
              {vPortalRoutes}
              {vendorManagementRoutes}
              {templateRoutes}
            </Route>

            {/* Catch-all 404 Route */}
            {notFoundRoute}
          </Routes>
        </BrowserRouter>
      </CustomizerProvider>
    </AuthProvider>
  );
}

export default App;
