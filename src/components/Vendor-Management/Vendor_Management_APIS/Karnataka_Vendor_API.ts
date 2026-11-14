import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
<<<<<<< HEAD
export const API_ROOT = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;
export const BASE_URL = `${API_ROOT}/admin`;
export const ROOT_URL = RAW_BASE.replace(/\/api\/?$/, '');


export const KARNATAKA_ADMIN_SWP_API = {
  // ── A. Assignment APIs ──
  // 1. GET karnataka/swp/installation/assign
  ASSIGN_FORM_DATA: `${BASE_URL}/karnataka/swp/installation/assign`,
  ASSIGN_FORM_DATA_ALT: `${API_ROOT}/karnataka/swp/installation/assign`,

  // 2. GET /karnataka/swp/installation/fetch-district?volume=...
  FETCH_DISTRICTS: (volume: string | number) =>
    `${BASE_URL}/karnataka/swp/installation/fetch-district?volume=${encodeURIComponent(String(volume).trim())}`,
  FETCH_DISTRICTS_ALT: (volume: string | number) =>
    `${API_ROOT}/karnataka/swp/installation/fetch-district?volume=${encodeURIComponent(String(volume).trim())}`,

  // 3. GET /karnataka/swp/installation/fetch-applicants?district=...&volume=...
  FETCH_APPLICANTS: (district: string, volume: string | number) =>
    `${BASE_URL}/karnataka/swp/installation/fetch-applicants?district=${encodeURIComponent(String(district).trim())}&volume=${encodeURIComponent(String(volume).trim())}`,
  FETCH_APPLICANTS_ALT: (district: string, volume: string | number) =>
    `${API_ROOT}/karnataka/swp/installation/fetch-applicants?district=${encodeURIComponent(String(district).trim())}&volume=${encodeURIComponent(String(volume).trim())}`,

  // 4. POST /karnataka/swp/installation/store-assign (multipart/form-data)
  STORE_ASSIGN: `${BASE_URL}/karnataka/swp/installation/store-assign`,
  STORE_ASSIGN_ALT: `${API_ROOT}/karnataka/swp/installation/store-assign`,

  // 5. GET /karnataka/swp/installation/edit-assign/{id}
  EDIT_ASSIGN: (id: string | number) =>
    `${BASE_URL}/karnataka/swp/installation/edit-assign/${encodeURIComponent(id)}`,
  EDIT_ASSIGN_ALT: (id: string | number) =>
    `${API_ROOT}/karnataka/swp/installation/edit-assign/${encodeURIComponent(id)}`,

  // 6. POST /karnataka/swp/installation/update-assign/{id}
  UPDATE_ASSIGN: (id: string | number) =>
    `${BASE_URL}/karnataka/swp/installation/update-assign/${encodeURIComponent(id)}`,
  UPDATE_ASSIGN_ALT: (id: string | number) =>
    `${API_ROOT}/karnataka/swp/installation/update-assign/${encodeURIComponent(id)}`,

  // 7. GET /karnataka/swp/installation/view-assign
  VIEW_ASSIGN: `${BASE_URL}/karnataka/swp/installation/view-assign`,
  VIEW_ASSIGN_ALT: `${API_ROOT}/karnataka/swp/installation/view-assign`,

  // 8. ANY /karnataka/swp/installation/approvel-assign/{id}
  APPROVE_ASSIGN: (id: string | number) =>
    `${API_ROOT}/karnataka/swp/installation/approvel-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_ADMIN: (id: string | number) =>
    `${BASE_URL}/karnataka/swp/installation/approvel-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_ALT: (id: string | number) =>
    `${BASE_URL}/karnataka/swp/installation/approvel-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_REST: (id: string | number) =>
    `${BASE_URL}/karnataka/swp/installation/approval-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_APPROVAL: (id: string | number) =>
    `${API_ROOT}/karnataka/swp/installation/approval-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_DIRECT: (id: string | number) =>
    `${ROOT_URL}/karnataka/swp/installation/approvel-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_DIRECT_APPROVAL: (id: string | number) =>
    `${ROOT_URL}/karnataka/swp/installation/approval-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_DIRECT_ADMIN: (id: string | number) =>
    `${ROOT_URL}/admin/karnataka/swp/installation/approvel-assign/${encodeURIComponent(id)}`,

  // ── B. Installation and Document Verification ──
  // 9. ANY /karnataka/swp/installation/view-installation
  VIEW_INSTALLATION: `${BASE_URL}/karnataka/swp/installation/view-installation`,
  VIEW_INSTALLATION_ALT: `${API_ROOT}/karnataka/swp/installation/view-installation`,

  // 10. ANY /karnataka/swp/installation/verify-installation-status
  VERIFY_INSTALLATION_STATUS: `${BASE_URL}/karnataka/swp/installation/verify-installation-status`,
  VERIFY_INSTALLATION_STATUS_ALT: `${API_ROOT}/karnataka/swp/installation/verify-installation-status`,

  // 11. GET /karnataka/swp/installation/view-installation-document
  VIEW_INSTALLATION_DOCUMENT: `${BASE_URL}/karnataka/swp/installation/view-installation-document`,
  VIEW_INSTALLATION_DOCUMENT_ALT: `${API_ROOT}/karnataka/swp/installation/view-installation-document`,

  // 12. POST /karnataka/swp/installation/verify-installation-doc-status
  VERIFY_INSTALLATION_DOC_STATUS: `${BASE_URL}/karnataka/swp/installation/verify-installation-doc-status`,
  VERIFY_INSTALLATION_DOC_STATUS_ALT: `${API_ROOT}/karnataka/swp/installation/verify-installation-doc-status`,

  // ── C. Claims and Payments ──
  // 13. GET /karnataka/swp/installation/view-claim
  VIEW_CLAIM: `${BASE_URL}/karnataka/swp/installation/view-claim`,
  VIEW_CLAIM_ALT: `${API_ROOT}/karnataka/swp/installation/view-claim`,

  // 14. POST /karnataka/swp/installation/claim-status-update
  CLAIM_STATUS_UPDATE: `${BASE_URL}/karnataka/swp/installation/claim-status-update`,
  CLAIM_STATUS_UPDATE_ALT: `${API_ROOT}/karnataka/swp/installation/claim-status-update`,

  // 15. ANY /karnataka/swp/installation/payment-view
=======
const API_ROOT = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;
export const BASE_URL = `${API_ROOT}/admin`;
export const ROOT_URL = RAW_BASE.replace(/\/api\/?$/, '');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KARNATAKA SWP INSTALLATION - SUPER ADMIN PORTAL APIS
 * Controller: KarnatakaSwpInstallationController
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const KARNATAKA_ADMIN_SWP_API = {
  // ── A. Assign Installation ──
  ASSIGN_FORM_DATA: `${BASE_URL}/karnataka/swp/installation/assign`,
  FETCH_DISTRICTS: (volume: string | number) =>
    `${BASE_URL}/karnataka/swp/installation/fetch-district?volume=${encodeURIComponent(String(volume).trim())}`,
  FETCH_FARMERS: (district: string) =>
    `${BASE_URL}/karnataka/swp/installation/fetch-farmer?district=${encodeURIComponent(String(district).trim())}`,
  STORE_ASSIGN: `${BASE_URL}/karnataka/swp/installation/store-assign`,
  VIEW_ASSIGN: `${BASE_URL}/karnataka/swp/installation/view-assign`,
  APPROVE_ASSIGN: (id: string | number) =>
    `${BASE_URL}/karnataka/swp/installation/approval-assign/${encodeURIComponent(id)}`,
  EDIT_ASSIGN: (id: string | number) =>
    `${BASE_URL}/karnataka/swp/installation/edit-assign/${encodeURIComponent(id)}`,
  UPDATE_ASSIGN: (id: string | number) =>
    `${BASE_URL}/karnataka/swp/installation/update-assign/${encodeURIComponent(id)}`,

  // ── B. Installation Verify ──
  VIEW_INSTALLATION: `${BASE_URL}/karnataka/swp/installation/view-installation`,
  VERIFY_INSTALLATION_STATUS: `${BASE_URL}/karnataka/swp/installation/verify-installation-status`,
  VIEW_INSTALLATION_DOCUMENT: `${BASE_URL}/karnataka/swp/installation/view-installation-document`,
  VERIFY_INSTALLATION_DOC_STATUS: `${BASE_URL}/karnataka/swp/installation/verify-installation-doc-status`,

  // ── C. Claim & Payment ──
  VIEW_CLAIM: `${BASE_URL}/karnataka/swp/installation/view-claim`,
  APPROVE_CLAIM: `${BASE_URL}/karnataka/swp/installation/approval-claim`,
>>>>>>> 1734fe6c6a1a76ca36492f9e29deed599b8f9488
  PAYMENT_VIEW: (params?: { from_date?: string; to_date?: string; vendor?: string | number; status?: string | number }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All') q.append('vendor', String(params.vendor));
    if (params?.status !== undefined && params.status !== '' && params.status !== 'All') q.append('status', String(params.status));
    const qs = q.toString();
    return `${BASE_URL}/karnataka/swp/installation/payment-view${qs ? `?${qs}` : ''}`;
  },
<<<<<<< HEAD
  PAYMENT_VIEW_ALT: (params?: { from_date?: string; to_date?: string; vendor?: string | number; status?: string | number }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All') q.append('vendor', String(params.vendor));
    if (params?.status !== undefined && params.status !== '' && params.status !== 'All') q.append('status', String(params.status));
    const qs = q.toString();
    return `${API_ROOT}/karnataka/swp/installation/payment-view${qs ? `?${qs}` : ''}`;
  },

  // 16. POST /karnataka/swp/installation/payment-update
  PAYMENT_UPDATE: `${BASE_URL}/karnataka/swp/installation/payment-update`,
  PAYMENT_UPDATE_ALT: `${API_ROOT}/karnataka/swp/installation/payment-update`,

  // ── D. Dashboard & Drilldowns ──
  // 17. GET /karnataka/swp/installation/dashboard
  DASHBOARD: `${BASE_URL}/karnataka/swp/installation/dashboard`,
  DASHBOARD_ALT: `${API_ROOT}/karnataka/swp/installation/dashboard`,

  // 18. GET /karnataka/swp/installation/view-dashboard/{status?}
  VIEW_DASHBOARD: (status?: string) =>
    status
      ? `${BASE_URL}/karnataka/swp/installation/view-dashboard/${encodeURIComponent(status)}`
      : `${BASE_URL}/karnataka/swp/installation/view-dashboard`,
  VIEW_DASHBOARD_ALT: (status?: string) =>
    status
      ? `${API_ROOT}/karnataka/swp/installation/view-dashboard/${encodeURIComponent(status)}`
      : `${API_ROOT}/karnataka/swp/installation/view-dashboard`,

  // 19. GET /vendorwise-data/{status}/{vendor}
  VENDOR_WISE_DATA: (status: string, vendor: string | number) =>
    `${BASE_URL}/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`,
  VENDOR_WISE_DATA_ALT: (status: string, vendor: string | number) =>
    `${API_ROOT}/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`,
  VENDOR_WISE_DATA_SCOPE: (status: string, vendor: string | number) =>
    `${BASE_URL}/karnataka/swp/installation/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`,

  // 20. GET /karnataka/swp/installation/districtwise-data/{status}/{district}
  DISTRICT_WISE_DATA: (status: string, district: string) =>
    `${BASE_URL}/karnataka/swp/installation/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
  DISTRICT_WISE_DATA_ALT: (status: string, district: string) =>
    `${API_ROOT}/karnataka/swp/installation/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,

  // ── E. Material Dispatch APIs ──
  // 21. GET /karnataka/swp/installation/view-material-dispatch
  VIEW_MATERIAL_DISPATCH: `${BASE_URL}/karnataka/swp/installation/view-material-dispatch`,
  VIEW_MATERIAL_DISPATCH_ALT: `${API_ROOT}/karnataka/swp/installation/view-material-dispatch`,
  VIEW_MATERIAL_DISPATCH_SCOPE: `${BASE_URL}/karnataka/swp/installation/view-material-dispatch`,
  VIEW_MATERIAL_DISPATCH_SCOPE_ALT: `${API_ROOT}/karnataka/swp/installation/view-material-dispatch`,
  VIEW_MATERIAL_DISPATCH_LEGACY: `${BASE_URL}/view-material-dispatch`,
  VIEW_MATERIAL_DISPATCH_LEGACY_ALT: `${API_ROOT}/view-material-dispatch`,

  // 22. GET /karnataka/swp/installation/material-dispatch
  MATERIAL_DISPATCH_FORM: `${BASE_URL}/karnataka/swp/installation/material-dispatch`,
  MATERIAL_DISPATCH_FORM_ALT: `${API_ROOT}/karnataka/swp/installation/material-dispatch`,

  // 23. POST /karnataka/swp/installation/material-dispatch-store
  MATERIAL_DISPATCH_STORE: `${BASE_URL}/karnataka/swp/installation/material-dispatch-store`,
  MATERIAL_DISPATCH_STORE_ALT: `${API_ROOT}/karnataka/swp/installation/material-dispatch-store`,

  // 24. GET /karnataka/swp/installation/update-material-dispatch/{id}
  UPDATE_MATERIAL_DISPATCH_GET: (id: string | number) =>
    `${BASE_URL}/karnataka/swp/installation/update-material-dispatch/${encodeURIComponent(id)}`,
  UPDATE_MATERIAL_DISPATCH_GET_ALT: (id: string | number) =>
    `${API_ROOT}/karnataka/swp/installation/update-material-dispatch/${encodeURIComponent(id)}`,

  // 25. ANY /karnataka/swp/installation/update-material-dispatch-store/{id}
  UPDATE_MATERIAL_DISPATCH_STORE: (id: string | number) =>
    `${BASE_URL}/karnataka/swp/installation/update-material-dispatch-store/${encodeURIComponent(id)}`,
  UPDATE_MATERIAL_DISPATCH_STORE_ALT: (id: string | number) =>
    `${API_ROOT}/karnataka/swp/installation/update-material-dispatch-store/${encodeURIComponent(id)}`,
};

export const KARNATAKA_VENDOR_API = {
=======
  PAYMENT_UPDATE: `${BASE_URL}/karnataka/swp/installation/payment-update`,

  // ── D. Dashboard & Drilldowns ──
  DASHBOARD: `${BASE_URL}/karnataka/swp/installation/dashboard`,
  DASHBOARD_VIEW_DATA: (status: string) =>
    `${BASE_URL}/karnataka/swp/installation/dashboard-view-data/${encodeURIComponent(String(status).toLowerCase().trim())}`,
  DISTRICT_WISE_VIEW_DATA: (status: string, district: string) =>
    `${BASE_URL}/karnataka/swp/installation/district-wise-view-data/${encodeURIComponent(String(status).toLowerCase().trim())}/${encodeURIComponent(String(district).trim())}`,

  // ── E. Material System ──
  DISPATCH_MATERIAL_STORE: `${BASE_URL}/karnataka/material/swp/dispatch-store`,
  VIEW_DISPATCH_MATERIAL: `${BASE_URL}/karnataka/material/swp/view-dispatch`,
  FETCH_DISPATCH_DETAILS: (id: string | number) =>
    `${BASE_URL}/karnataka/material/swp/dispatch-details/${encodeURIComponent(id)}`,
};

export const KARNATAKA_VENDOR_API = {
  ...KARNATAKA_ADMIN_SWP_API,
>>>>>>> 1734fe6c6a1a76ca36492f9e29deed599b8f9488
  SWP_DASHBOARD: `${API_ROOT}/v/karnataka/swp/dashboard`,
  SWP_VIEW_ASSIGNED: `${API_ROOT}/v/karnataka/swp/installation-request`,
  SWP_VIEW_INSTALLED: `${API_ROOT}/v/karnataka/swp/view-installation`,
  SWP_VERIFY_PAYMENT: `${API_ROOT}/v/karnataka/swp/view-payment`,
<<<<<<< HEAD
  ...KARNATAKA_ADMIN_SWP_API,
=======
>>>>>>> 1734fe6c6a1a76ca36492f9e29deed599b8f9488
};

export default KARNATAKA_VENDOR_API;
