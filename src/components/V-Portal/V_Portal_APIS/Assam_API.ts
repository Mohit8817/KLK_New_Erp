import { API_BASE_URL } from '../../../services/authService';

// 1. Assigned Installation List
// GET /assam/swp-view-assign-installation-sites
export const ASSAM_SWP_VIEW_ASSIGN_INSTALLATION_SITES_URL = `${API_BASE_URL}/assam/swp-view-assign-installation-sites`;

// 2. Assign Site Detail
// GET /assam/swp-view-assign-installation-detail?id={id}
export const ASSAM_SWP_VIEW_ASSIGN_INSTALLATION_DETAIL_URL = `${API_BASE_URL}/assam/swp-view-assign-installation-detail`;

// 3. Accept Installation
// GET /assam/swp-assign-installation-accept?id={id}
export const ASSAM_SWP_ASSIGN_INSTALLATION_ACCEPT_URL = `${API_BASE_URL}/assam/swp-assign-installation-accept`;

// 4. Installable Sites List
// GET /assam/swp-install-site
export const ASSAM_SWP_INSTALL_SITE_LIST_URL = `${API_BASE_URL}/assam/swp-install-site`;

// 5. Site Install Store
// POST /assam/swp-install-site-store (multipart/form-data)
export const ASSAM_SWP_INSTALL_SITE_STORE_URL = `${API_BASE_URL}/assam/swp-install-site-store`;

// 6. View Installed Sites (Dashboard)
// GET /assam/swp-view-install-site
export const ASSAM_SWP_VIEW_INSTALL_SITE_URL = `${API_BASE_URL}/assam/swp-view-install-site`;

// 7. SWP Installation Dashboard
// GET /assam/swp-installation-dashboard
export const ASSAM_SWP_DASHBOARD_URL = `${API_BASE_URL}/assam/swp-installation-dashboard`;

export const ASSAM_API = {
  VIEW_ASSIGN_SITES: ASSAM_SWP_VIEW_ASSIGN_INSTALLATION_SITES_URL,
  ASSIGN_DETAIL: ASSAM_SWP_VIEW_ASSIGN_INSTALLATION_DETAIL_URL,
  ACCEPT_INSTALLATION: ASSAM_SWP_ASSIGN_INSTALLATION_ACCEPT_URL,
  INSTALLABLE_SITES: ASSAM_SWP_INSTALL_SITE_LIST_URL,
  INSTALL_STORE: ASSAM_SWP_INSTALL_SITE_STORE_URL,
  VIEW_INSTALLED_SITES: ASSAM_SWP_VIEW_INSTALL_SITE_URL,
  SWP_DASHBOARD: ASSAM_SWP_DASHBOARD_URL,
};

export default ASSAM_API;
