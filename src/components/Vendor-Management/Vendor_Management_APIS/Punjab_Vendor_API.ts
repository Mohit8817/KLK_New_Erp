import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
const API_ROOT = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;

export const BASE_URL = API_ROOT;
export const ADMIN_BASE_URL = `${API_ROOT}/admin`;
export const ROOT_URL = RAW_BASE.replace(/\/api\/?$/, '');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PUNJAB - V-PORTAL (EXTERNAL VENDOR) APIS
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const PUNJAB_VENDOR_API = {
  SSL_DASHBOARD: `${BASE_URL}/v/punjab/ssl/dashboard`,
  SSL_VIEW_ASSIGNED: `${BASE_URL}/v/punjab/ssl/installation-request`,
  SSL_VIEW_INSTALLED: `${BASE_URL}/v/punjab/ssl/view-installation`,
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PUNJAB SSL INSTALLATION - SUPER ADMIN PORTAL APIS
 * Controller: PunjabSslInstallationController
 * Prefix: /admin/punjab/ssl/installation/
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const PUNJAB_ADMIN_SSL_API = {
  // ── 1. Assign page (Vendors & Volumes metadata) ──
  // GET /admin/punjab/ssl/installation/assign
  ASSIGN_FORM_DATA: `${ADMIN_BASE_URL}/punjab/ssl/installation/assign`,
  ASSIGN_FORM_DATA_ROOT: `${BASE_URL}/punjab/ssl/installation/assign`,

  // ── 2. Districts by volume ──
  // GET /admin/punjab/ssl/installation/fetch-district/{volume}
  FETCH_DISTRICT: (volume: string | number) =>
    `${ADMIN_BASE_URL}/punjab/ssl/installation/fetch-district/${encodeURIComponent(String(volume).trim())}?volume=${encodeURIComponent(String(volume).trim())}&state=punjab`,
  FETCH_DISTRICT_PATH_ONLY: (volume: string | number) =>
    `${ADMIN_BASE_URL}/punjab/ssl/installation/fetch-district/${encodeURIComponent(String(volume).trim())}`,
  FETCH_DISTRICT_ROOT: (volume: string | number) =>
    `${BASE_URL}/punjab/ssl/installation/fetch-district/${encodeURIComponent(String(volume).trim())}?volume=${encodeURIComponent(String(volume).trim())}&state=punjab`,
  FETCH_DISTRICT_QUERY: (volume: string | number) =>
    `${ADMIN_BASE_URL}/punjab/ssl/installation/fetch-district?volume=${encodeURIComponent(String(volume).trim())}&state=punjab`,

  // ── 3. Blocks by district ──
  // GET /admin/punjab/ssl/installation/fetch-block/{district}
  // Must preserve {district} path segment to prevent 404 from Laravel route matcher
  FETCH_BLOCK: (district: string, volume?: string | number) => {
    const cleanDist = encodeURIComponent(String(district).trim());
    const queryPart = volume
      ? `?volume=${encodeURIComponent(String(volume).trim())}&district=${cleanDist}&state=punjab`
      : `?district=${cleanDist}&state=punjab`;
    return `${ADMIN_BASE_URL}/punjab/ssl/installation/fetch-block/${cleanDist}${queryPart}`;
  },
  FETCH_BLOCK_PATH_ONLY: (district: string) =>
    `${ADMIN_BASE_URL}/punjab/ssl/installation/fetch-block/${encodeURIComponent(String(district).trim())}`,
  FETCH_BLOCK_TWO_PARAMS: (volume: string | number, district: string) =>
    `${ADMIN_BASE_URL}/punjab/ssl/installation/fetch-block/${encodeURIComponent(String(volume).trim())}/${encodeURIComponent(String(district).trim())}`,
  FETCH_BLOCK_ROOT: (district: string, volume?: string | number) => {
    const cleanDist = encodeURIComponent(String(district).trim());
    const queryPart = volume
      ? `?volume=${encodeURIComponent(String(volume).trim())}&district=${cleanDist}&state=punjab`
      : `?district=${cleanDist}&state=punjab`;
    return `${BASE_URL}/punjab/ssl/installation/fetch-block/${cleanDist}${queryPart}`;
  },
  FETCH_BLOCK_QUERY: (volume: string | number, district: string) =>
    `${ADMIN_BASE_URL}/punjab/ssl/installation/fetch-block/${encodeURIComponent(district.trim())}?volume=${encodeURIComponent(String(volume).trim())}`,

  // ── 4. Panchayats by block ──
  // GET /admin/punjab/ssl/installation/fetch-panchayat/{block}
  FETCH_PANCHAYAT: (block: string, volume?: string | number, district?: string) => {
    const cleanBlk = encodeURIComponent(String(block).trim());
    const q = new URLSearchParams();
    if (volume) q.set('volume', String(volume).trim());
    if (district) q.set('district', String(district).trim());
    q.set('block', String(block).trim());
    q.set('state', 'punjab');
    return `${ADMIN_BASE_URL}/punjab/ssl/installation/fetch-panchayat/${cleanBlk}?${q.toString()}`;
  },
  FETCH_PANCHAYAT_PATH_ONLY: (block: string) =>
    `${ADMIN_BASE_URL}/punjab/ssl/installation/fetch-panchayat/${encodeURIComponent(String(block).trim())}`,
  FETCH_PANCHAYAT_TWO_PARAMS: (district: string, block: string) =>
    `${ADMIN_BASE_URL}/punjab/ssl/installation/fetch-panchayat/${encodeURIComponent(String(district).trim())}/${encodeURIComponent(String(block).trim())}`,
  FETCH_PANCHAYAT_ROOT: (block: string, volume?: string | number, district?: string) => {
    const cleanBlk = encodeURIComponent(String(block).trim());
    const q = new URLSearchParams();
    if (volume) q.set('volume', String(volume).trim());
    if (district) q.set('district', String(district).trim());
    q.set('block', String(block).trim());
    q.set('state', 'punjab');
    return `${BASE_URL}/punjab/ssl/installation/fetch-panchayat/${cleanBlk}?${q.toString()}`;
  },
  FETCH_PANCHAYAT_QUERY: (volume: string | number, district: string, block: string) =>
    `${ADMIN_BASE_URL}/punjab/ssl/installation/fetch-panchayat/${encodeURIComponent(block.trim())}?volume=${encodeURIComponent(String(volume).trim())}&district=${encodeURIComponent(district.trim())}`,

  // ── 5. Save assignment ──
  // POST /admin/punjab/ssl/installation/store-assign
  STORE_ASSIGN: `${ADMIN_BASE_URL}/punjab/ssl/installation/store-assign`,
  STORE_ASSIGN_ROOT: `${BASE_URL}/punjab/ssl/installation/store-assign`,

  // ── 6. Edit form ──
  // GET /admin/punjab/ssl/installation/edit-assign/{id}
  EDIT_ASSIGN: (id: string | number) =>
    `${ADMIN_BASE_URL}/punjab/ssl/installation/edit-assign/${encodeURIComponent(id)}`,
  EDIT_ASSIGN_ROOT: (id: string | number) =>
    `${BASE_URL}/punjab/ssl/installation/edit-assign/${encodeURIComponent(id)}`,

  // ── 7. Update assignment ──
  // POST /admin/punjab/ssl/installation/update-assign/{id}
  UPDATE_ASSIGN: (id: string | number) =>
    `${ADMIN_BASE_URL}/punjab/ssl/installation/update-assign/${encodeURIComponent(id)}`,
  UPDATE_ASSIGN_ROOT: (id: string | number) =>
    `${BASE_URL}/punjab/ssl/installation/update-assign/${encodeURIComponent(id)}`,
  UPDATE_ASSIGN_BASE: `${ADMIN_BASE_URL}/punjab/ssl/installation/update-assign`,
  UPDATE_ASSIGN_WITH_ID: (id: string | number) =>
    `${ADMIN_BASE_URL}/punjab/ssl/installation/update-assign/${encodeURIComponent(id)}`,
  UPDATE_ASSIGN_WITH_ID_ROOT: (id: string | number) =>
    `${BASE_URL}/punjab/ssl/installation/update-assign/${encodeURIComponent(id)}`,

  // ── 8. List assignments ──
  // GET /admin/punjab/ssl/installation/view-assign
  VIEW_ASSIGN: `${ADMIN_BASE_URL}/punjab/ssl/installation/view-assign`,
  VIEW_ASSIGN_ROOT: `${BASE_URL}/punjab/ssl/installation/view-assign`,

  // ── 9. Vendor details ──
  // GET /admin/punjab/ssl/installation/vendor-wise-details/{id}
  VENDOR_WISE_DETAILS: (id: string | number) =>
    `${ADMIN_BASE_URL}/punjab/ssl/installation/vendor-wise-details/${encodeURIComponent(id)}`,
  VENDOR_WISE_DETAILS_ROOT: (id: string | number) =>
    `${BASE_URL}/punjab/ssl/installation/vendor-wise-details/${encodeURIComponent(id)}`,

  // ── 10. Approve assignment ──
  // ANY /admin/punjab/ssl/installation/approval-assign/{id}
  APPROVE_ASSIGN: (id: string | number) =>
    `${ADMIN_BASE_URL}/punjab/ssl/installation/approval-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_ROOT: (id: string | number) =>
    `${BASE_URL}/punjab/ssl/installation/approval-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_ALT: (id: string | number) =>
    `${ADMIN_BASE_URL}/punjab/ssl/installation/approval-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_ALT_ROOT: (id: string | number) =>
    `${BASE_URL}/punjab/ssl/installation/approval-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_LEGACY: (id: string | number) =>
    `${ADMIN_BASE_URL}/punjab/ssl/installation/approvel-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_LEGACY_ROOT: (id: string | number) =>
    `${BASE_URL}/punjab/ssl/installation/approvel-assign/${encodeURIComponent(id)}`,

  // ── 11. List installations ──
  // GET /admin/punjab/ssl/installation/view-installation
  VIEW_INSTALLATION: (page?: number) =>
    `${ADMIN_BASE_URL}/punjab/ssl/installation/view-installation${page ? `?page=${page}` : ''}`,
  VIEW_INSTALLATION_ROOT: (page?: number) =>
    `${BASE_URL}/punjab/ssl/installation/view-installation${page ? `?page=${page}` : ''}`,

  // ── 12. Verify installation ──
  // POST /admin/punjab/ssl/installation/verify-installation-status
  VERIFY_INSTALLATION_STATUS: `${ADMIN_BASE_URL}/punjab/ssl/installation/verify-installation-status`,
  VERIFY_INSTALLATION_STATUS_ROOT: `${BASE_URL}/punjab/ssl/installation/verify-installation-status`,

  // ── 13. Dashboard ──
  // ANY /admin/punjab/ssl/installation/dashboard
  DASHBOARD: `${ADMIN_BASE_URL}/punjab/ssl/installation/dashboard`,
  DASHBOARD_ROOT: `${BASE_URL}/punjab/ssl/installation/dashboard`,

  // ── 14. Drill-down by status and optional volume ──
  // GET /admin/punjab/ssl/installation/view-dashboard/{status?}/{volume?}
  VIEW_DASHBOARD: (status?: string, volume?: string | number) => {
    const s = status ? encodeURIComponent(status) : '';
    const v = volume !== undefined && volume !== '' ? encodeURIComponent(String(volume)) : '';
    if (s && v) return `${ADMIN_BASE_URL}/punjab/ssl/installation/view-dashboard/${s}/${v}`;
    if (s) return `${ADMIN_BASE_URL}/punjab/ssl/installation/view-dashboard/${s}`;
    return `${ADMIN_BASE_URL}/punjab/ssl/installation/view-dashboard`;
  },
  VIEW_DASHBOARD_ROOT: (status?: string, volume?: string | number) => {
    const s = status ? encodeURIComponent(status) : '';
    const v = volume !== undefined && volume !== '' ? encodeURIComponent(String(volume)) : '';
    if (s && v) return `${BASE_URL}/punjab/ssl/installation/view-dashboard/${s}/${v}`;
    if (s) return `${BASE_URL}/punjab/ssl/installation/view-dashboard/${s}`;
    return `${BASE_URL}/punjab/ssl/installation/view-dashboard`;
  },
  DASHBOARD_BY_STATUS: (status: string, volume?: string | number) => {
    const s = encodeURIComponent(status);
    if (volume !== undefined && volume !== '') {
      return `${ADMIN_BASE_URL}/punjab/ssl/installation/view-dashboard/${s}/${encodeURIComponent(String(volume))}`;
    }
    return `${ADMIN_BASE_URL}/punjab/ssl/installation/view-dashboard/${s}`;
  },
  DASHBOARD_BY_STATUS_ROOT: (status: string, volume?: string | number) => {
    const s = encodeURIComponent(status);
    if (volume !== undefined && volume !== '') {
      return `${BASE_URL}/punjab/ssl/installation/view-dashboard/${s}/${encodeURIComponent(String(volume))}`;
    }
    return `${BASE_URL}/punjab/ssl/installation/view-dashboard/${s}`;
  },

  // ── 15. Vendor-wise view data ──
  // GET /admin/punjab/ssl/installation/vendorwise-view-data/{status}/{volume?}/{vendor}
  VENDORWISE_VIEW_DATA: (status: string, vendor: string | number, volume?: string | number) => {
    const s = encodeURIComponent(status);
    const vn = encodeURIComponent(String(vendor));
    if (volume !== undefined && volume !== '') {
      return `${ADMIN_BASE_URL}/punjab/ssl/installation/vendorwise-view-data/${s}/${encodeURIComponent(String(volume))}/${vn}`;
    }
    return `${ADMIN_BASE_URL}/punjab/ssl/installation/vendorwise-view-data/${s}/${vn}`;
  },
  VENDORWISE_VIEW_DATA_ROOT: (status: string, vendor: string | number, volume?: string | number) => {
    const s = encodeURIComponent(status);
    const vn = encodeURIComponent(String(vendor));
    if (volume !== undefined && volume !== '') {
      return `${BASE_URL}/punjab/ssl/installation/vendorwise-view-data/${s}/${encodeURIComponent(String(volume))}/${vn}`;
    }
    return `${BASE_URL}/punjab/ssl/installation/vendorwise-view-data/${s}/${vn}`;
  },

  // ── 16. District-wise view data ──
  // GET /admin/punjab/ssl/installation/districtwise-view-data/{status}/{volume?}/{district}
  DISTRICTWISE_VIEW_DATA: (status: string, district: string, volume?: string | number) => {
    const s = encodeURIComponent(status);
    const d = encodeURIComponent(district);
    if (volume !== undefined && volume !== '') {
      return `${ADMIN_BASE_URL}/punjab/ssl/installation/districtwise-view-data/${s}/${encodeURIComponent(String(volume))}/${d}`;
    }
    return `${ADMIN_BASE_URL}/punjab/ssl/installation/districtwise-view-data/${s}/${d}`;
  },
  DISTRICTWISE_VIEW_DATA_ROOT: (status: string, district: string, volume?: string | number) => {
    const s = encodeURIComponent(status);
    const d = encodeURIComponent(district);
    if (volume !== undefined && volume !== '') {
      return `${BASE_URL}/punjab/ssl/installation/districtwise-view-data/${s}/${encodeURIComponent(String(volume))}/${d}`;
    }
    return `${BASE_URL}/punjab/ssl/installation/districtwise-view-data/${s}/${d}`;
  },
  DISTRICTWISE_BY_STATUS: (status: string, district: string) =>
    `${ADMIN_BASE_URL}/punjab/ssl/installation/districtwise-view-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
  DISTRICTWISE_BY_STATUS_ROOT: (status: string, district: string) =>
    `${BASE_URL}/punjab/ssl/installation/districtwise-view-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
};

export default PUNJAB_VENDOR_API;
