import { API_BASE_URL } from '../../../services/authService';

/**
 * Base URLs for Karnataka SWP API Endpoints
 * VendorKarnatakaSwpInstallationController routes are grouped under /karnataka/swp/...
 * API routes must ALWAYS be prefixed with /api (e.g. https://klkerp.com/api/karnataka/swp/...)
 */
const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const API_PREFIX = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;
export const BASE_URL = API_PREFIX;
export const ROOT_URL = API_PREFIX.replace(/\/api\/?$/, '');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KARNATAKA SWP (Solar Water Pump) INSTALLATION APIS (Vendor Portal)
 * Exact Live Routes on Backend
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const KARNATAKA_SWP_API = {
  // 1. Assign Installation site: GET /api/karnataka-view-swp-assign-installation-sites
  ASSIGNED_SITES: `${BASE_URL}/karnataka-view-swp-assign-installation-sites`,

  // 2. Assign Site: GET /api/karnataka-swp-view-assigned-site-details?id=6
  ASSIGN_SITE_DETAIL: (id: number | string) =>
    `${BASE_URL}/karnataka-swp-view-assigned-site-details?id=${encodeURIComponent(id)}`,

  // 3. Accept Installation: GET /api/karnataka-accept-swp-installation?id=8
  ACCEPT_INSTALLATION: (id: number | string) =>
    `${BASE_URL}/karnataka-accept-swp-installation?id=${encodeURIComponent(id)}`,

  // 4. Dropdown pending installable site names: GET /api/karnataka-install-swp-site
  FETCH_SITE_NAMES: `${BASE_URL}/karnataka-install-swp-site`,
  INSTALL_SITE_NAME_LIST: `${BASE_URL}/karnataka-install-swp-site`,

  // 5. Fetch Site Details for installation form: GET /api/karnataka-fetch-swp-site?site_id=2
  FETCH_SITE_DETAILS: (siteId: number | string) =>
    `${BASE_URL}/karnataka-fetch-swp-site?site_id=${encodeURIComponent(siteId)}`,

  // 6. Install Site Store: POST /api/karnataka-install-swp-site-store (multipart/form-data)
  INSTALL_SITE_STORE: `${BASE_URL}/karnataka-install-swp-site-store`,

  // 7. View Installed Sites: GET /api/karnataka-view-swp-install-site
  VIEW_INSTALL_SITE: `${BASE_URL}/karnataka-view-swp-install-site`,

  // 8. Update Install Site (Fetch): GET /api/karnataka-update-install-swp-site?id=2
  UPDATE_INSTALL_SITE_FETCH: (id: number | string) =>
    `${BASE_URL}/karnataka-update-install-swp-site?id=${encodeURIComponent(id)}`,

  // 9. Update Site Store: POST /api/karnataka-update-install-swp-site-store?id=26 (multipart/form-data)
  UPDATE_INSTALL_SITE_STORE: (id?: number | string) =>
    id !== undefined && id !== null && id !== ''
      ? `${BASE_URL}/karnataka-update-install-swp-site-store?id=${encodeURIComponent(id)}`
      : `${BASE_URL}/karnataka-update-install-swp-site-store`,

  // 10. Billing Document (PDF): GET /api/karnataka-swp-billing-document/{id}
  BILLING_DOCUMENT: (id: number | string) =>
    `${BASE_URL}/karnataka/billing-document/${encodeURIComponent(id)}`,

  // 11. Doc Installation Store: POST /api/karnataka-swp-installation-doc-store (multipart/form-data)
  DOC_STORE: `${BASE_URL}/karnataka-swp-installation-doc-store`,

  // 12. Installation Claim (View claims list): GET /api/karnataka-swp-installation-claim
  VIEW_CLAIM: `${BASE_URL}/karnataka-swp-installation-claim`,

  // 13. Installation Add Claim: POST /api/karnataka-swp-installation-add-claim (multipart/form-data)
  ADD_CLAIM: `${BASE_URL}/karnataka-swp-installation-add-claim`,

  // 14. Update Claim: POST /api/karnataka-swp-installation-update-claim (multipart/form-data)
  UPDATE_CLAIM: `${BASE_URL}/karnataka-swp-installation-update-claim`,

  // 15. Fetch Claim: GET /api/karnataka-swp-fetch-claim?id=19
  FETCH_CLAIM: (id?: number | string) =>
    id !== undefined && id !== null && id !== ''
      ? `${BASE_URL}/karnataka-swp-fetch-claim?id=${encodeURIComponent(id)}`
      : `${BASE_URL}/karnataka-swp-fetch-claim`,

  // 16. Dashboard: GET /api/karnataka/swp/dashboard OR GET /api/karnataka-swp-dashboard
  DASHBOARD: `${BASE_URL}/karnataka/swp/dashboard`,
  DASHBOARD_ALT: `${BASE_URL}/karnataka-swp-dashboard`,

  // 17. View Dashboard Data (status-wise): GET /api/karnataka/swp/installation/view-dashboard-data/{status}
  VIEW_DASHBOARD_DATA: (status: string) =>
    `${BASE_URL}/karnataka/swp/installation/view-dashboard-data/${encodeURIComponent(status)}`,
  VIEW_DASHBOARD_DATA_ALT: (status: string) =>
    `${BASE_URL}/karnataka-swp-view-dashboard-data/${encodeURIComponent(status)}`,

  // 18. District-wise Dashboard Data: GET /api/karnataka/swp/installation/view-dashboard-districtwise/{status}/{district}
  VIEW_DASHBOARD_DISTRICTWISE: (status: string, district: string) =>
    `${BASE_URL}/karnataka/swp/installation/view-dashboard-districtwise/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
  VIEW_DASHBOARD_DISTRICTWISE_ALT: (status: string, district: string) =>
    `${BASE_URL}/karnataka-swp-view-dashboard-districtwise/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
};

export const KARNATAKA_API = {
  SWP_DASHBOARD: KARNATAKA_SWP_API.DASHBOARD,
  SWP: KARNATAKA_SWP_API,
  ROOT_URL,
  BASE_URL,
};

export default KARNATAKA_API;
