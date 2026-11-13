

import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
const API_ROOT = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;

export const BASE_URL = API_ROOT;
export const ADMIN_BASE_URL = `${API_ROOT}/admin`;
export const ROOT_URL = RAW_BASE.replace(/\/api\/?$/, '');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ARUNACHAL PRADESH - V-PORTAL (EXTERNAL VENDOR) APIS
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const ARUNACHAL_VENDOR_API = {
  SHL_DASHBOARD: `${BASE_URL}/v/arunachal/shl/dashboard`,
  SHL_VIEW_ASSIGNED: `${BASE_URL}/v/arunachal/shl/installation-request`,
  SHL_VIEW_INSTALLED: `${BASE_URL}/v/arunachal/shl/view-installation`,
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ARUNACHAL PRADESH SHL INSTALLATION - SUPER ADMIN PORTAL APIS
 * Controller: ArunachalShlInstallationController
 * 15 Endpoints with dual support for `/admin/...` and root `/...` prefixes
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const ARUNACHAL_ADMIN_SHL_API = {
  // ── Dropdown & Assignment Cascade ──
  // 1. GET /assign (vendors with arunachal_shl.installation permission & volumes)
  ASSIGN_FORM_DATA: `${ADMIN_BASE_URL}/arunachal/shl/installation/assign`,
  ASSIGN_FORM_DATA_ROOT: `${BASE_URL}/arunachal/shl/installation/assign`,

  // 2. GET /fetch-district?volume=...
  FETCH_DISTRICT: (volume: string | number) =>
    `${ADMIN_BASE_URL}/arunachal/shl/installation/fetch-district?volume=${encodeURIComponent(String(volume).trim())}`,
  FETCH_DISTRICT_ROOT: (volume: string | number) =>
    `${BASE_URL}/arunachal/shl/installation/fetch-district?volume=${encodeURIComponent(String(volume).trim())}`,

  // 3. GET /fetch-block?volume=...&district=...
  FETCH_BLOCK: (volume: string | number, district: string) =>
    `${ADMIN_BASE_URL}/arunachal/shl/installation/fetch-block?volume=${encodeURIComponent(String(volume).trim())}&district=${encodeURIComponent(district.trim())}`,
  FETCH_BLOCK_ROOT: (volume: string | number, district: string) =>
    `${BASE_URL}/arunachal/shl/installation/fetch-block?volume=${encodeURIComponent(String(volume).trim())}&district=${encodeURIComponent(district.trim())}`,

  // 4. GET /fetch-panchayat?volume=...&district=...&block=... (returns panchayats with unassigned light count)
  FETCH_PANCHAYAT: (volume: string | number, district: string, block: string) =>
    `${ADMIN_BASE_URL}/arunachal/shl/installation/fetch-panchayat?volume=${encodeURIComponent(String(volume).trim())}&district=${encodeURIComponent(district.trim())}&block=${encodeURIComponent(block.trim())}`,
  FETCH_PANCHAYAT_ROOT: (volume: string | number, district: string, block: string) =>
    `${BASE_URL}/arunachal/shl/installation/fetch-panchayat?volume=${encodeURIComponent(String(volume).trim())}&district=${encodeURIComponent(district.trim())}&block=${encodeURIComponent(block.trim())}`,

  // ── Assignment CRUD & Actions ──
  // 5. POST /store-assign (vendor, state, volume, district, block, panchayat[], ldate, remark)
  STORE_ASSIGN: `${ADMIN_BASE_URL}/arunachal/shl/installation/store-assign`,
  STORE_ASSIGN_ROOT: `${BASE_URL}/arunachal/shl/installation/store-assign`,

  // 6. GET /edit-assign/{id}
  EDIT_ASSIGN: (id: string | number) =>
    `${ADMIN_BASE_URL}/arunachal/shl/installation/edit-assign/${encodeURIComponent(id)}`,
  EDIT_ASSIGN_ROOT: (id: string | number) =>
    `${BASE_URL}/arunachal/shl/installation/edit-assign/${encodeURIComponent(id)}`,

  // 7. POST /update-assign
  UPDATE_ASSIGN: `${ADMIN_BASE_URL}/arunachal/shl/installation/update-assign`,
  UPDATE_ASSIGN_ROOT: `${BASE_URL}/arunachal/shl/installation/update-assign`,
  UPDATE_ASSIGN_WITH_ID: (id: string | number) =>
    `${ADMIN_BASE_URL}/arunachal/shl/installation/update-assign/${encodeURIComponent(id)}`,
  UPDATE_ASSIGN_WITH_ID_ROOT: (id: string | number) =>
    `${BASE_URL}/arunachal/shl/installation/update-assign/${encodeURIComponent(id)}`,

  // 8. GET /view-assign (dashboard counts + assigned list)
  VIEW_ASSIGN: `${ADMIN_BASE_URL}/arunachal/shl/installation/view-assign`,
  VIEW_ASSIGN_ROOT: `${BASE_URL}/arunachal/shl/installation/view-assign`,

  // 9. POST /approvel-assign/{id} (status = 1 + triggers WhatsApp / SMS notification)
  APPROVE_ASSIGN: (id: string | number) =>
    `${ADMIN_BASE_URL}/arunachal/shl/installation/approvel-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_ROOT: (id: string | number) =>
    `${BASE_URL}/arunachal/shl/installation/approvel-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_ALT: (id: string | number) =>
    `${ADMIN_BASE_URL}/arunachal/shl/installation/approval-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_ALT_ROOT: (id: string | number) =>
    `${BASE_URL}/arunachal/shl/installation/approval-assign/${encodeURIComponent(id)}`,

  // ── Installation Verification ──
  // 10. GET /view-installation (?page=1)
  VIEW_INSTALLATION: (page?: number) =>
    `${ADMIN_BASE_URL}/arunachal/shl/installation/view-installation${page ? `?page=${page}` : ''}`,
  VIEW_INSTALLATION_ROOT: (page?: number) =>
    `${BASE_URL}/arunachal/shl/installation/view-installation${page ? `?page=${page}` : ''}`,

  // 11. POST /verify-installation-status (id, status: 1=Approved, 2=Rejected)
  VERIFY_INSTALLATION_STATUS: `${ADMIN_BASE_URL}/arunachal/shl/installation/verify-installation-status`,
  VERIFY_INSTALLATION_STATUS_ROOT: `${BASE_URL}/arunachal/shl/installation/verify-installation-status`,

  // ── Dashboard & Drilldown APIs ──
  // 12. GET /dashboard
  DASHBOARD: `${ADMIN_BASE_URL}/arunachal/shl/installation/dashboard`,
  DASHBOARD_ROOT: `${BASE_URL}/arunachal/shl/installation/dashboard`,

  // 13. GET /view-dashboard/{status}
  VIEW_DASHBOARD: (status: string) =>
    `${ADMIN_BASE_URL}/arunachal/shl/installation/view-dashboard/${encodeURIComponent(status)}`,
  VIEW_DASHBOARD_ROOT: (status: string) =>
    `${BASE_URL}/arunachal/shl/installation/view-dashboard/${encodeURIComponent(status)}`,

  // 14. GET /vendorwise-data/{status}/{vendor} (with fallback for route typo vendorwise-data{status}/{vendor})
  VENDORWISE_DATA: (status: string, vendor: string | number) =>
    `${ADMIN_BASE_URL}/arunachal/shl/installation/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`,
  VENDORWISE_DATA_ROOT: (status: string, vendor: string | number) =>
    `${BASE_URL}/arunachal/shl/installation/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`,
  VENDORWISE_DATA_TYPO: (status: string, vendor: string | number) =>
    `${ADMIN_BASE_URL}/arunachal/shl/installation/vendorwise-data${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`,
  VENDORWISE_DATA_TYPO_ROOT: (status: string, vendor: string | number) =>
    `${BASE_URL}/arunachal/shl/installation/vendorwise-data${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`,

  // 15. GET /districtwise-data/{status}/{district}
  DISTRICTWISE_DATA: (status: string, district: string) =>
    `${ADMIN_BASE_URL}/arunachal/shl/installation/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
  DISTRICTWISE_DATA_ROOT: (status: string, district: string) =>
    `${BASE_URL}/arunachal/shl/installation/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
};

export default ARUNACHAL_ADMIN_SHL_API;
<<<<<<< HEAD

=======
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
