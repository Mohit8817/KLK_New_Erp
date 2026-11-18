import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const API_ROOT = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;
export const ROOT_URL = RAW_BASE.replace(/\/api\/?$/, '');
export const RAW_ADMIN_URL = `${ROOT_URL}/admin`;
export const BASE_URL = `${API_ROOT}/admin`;

/**
 * Build candidate URLs for a given route path (supporting web routes, /admin, /api, and root routes)
 * Strips any duplicate /api/admin, /admin, or /api prefixes from the input.
 */
export function buildCandidateUrls(rawPathOrUrl: string): string[] {
  let path = (rawPathOrUrl || '').trim();
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const u = new URL(path);
      path = u.pathname + u.search;
    } catch {
      // ignore
    }
  }

  // Separate query string if present
  let pathname = path;
  let search = '';
  const qIndex = path.indexOf('?');
  if (qIndex !== -1) {
    pathname = path.slice(0, qIndex);
    search = path.slice(qIndex);
  }

  // Strip repeated /api/admin, /admin, /api prefixes until clean
  let cleaned = pathname;
  let changed = true;
  while (changed) {
    changed = false;
    if (cleaned.startsWith('/api/admin/')) {
      cleaned = cleaned.slice('/api/admin'.length);
      changed = true;
    } else if (cleaned.startsWith('/admin/')) {
      cleaned = cleaned.slice('/admin'.length);
      changed = true;
    } else if (cleaned.startsWith('/api/')) {
      cleaned = cleaned.slice('/api'.length);
      changed = true;
    }
  }

  if (!cleaned.startsWith('/')) {
    cleaned = `/${cleaned}`;
  }

  const routePath = `${cleaned}${search}`;

  const candidates: string[] = [
    // 1. API Admin route (e.g. https://klkerp.com/api/admin/goa/srt/installation/...)
    `${BASE_URL}${routePath}`,

    // 2. Direct API route (e.g. https://klkerp.com/api/goa/srt/installation/...)
    `${API_ROOT}${routePath}`,

    // 3. Direct Web / Admin route (e.g. https://klkerp.com/admin/goa/srt/installation/...)
    `${RAW_ADMIN_URL}${routePath}`,

    // 4. Direct Root route (e.g. https://klkerp.com/goa/srt/installation/...)
    `${ROOT_URL}${routePath}`,

    // 5. Relative paths (for dev proxy or same-origin deployment)
    `/api/admin${routePath}`,
    `/api${routePath}`,
    `/admin${routePath}`,
    `${routePath}`,
  ];

  return Array.from(new Set(candidates));
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GOA SRT INSTALLATION - API DOCUMENTATION (24 ROUTES)
 * Controller: App\Http\Controllers\admin\goa\GoaSrtInstallationController
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const GOA_ADMIN_SRT_API = {
  // ── 1. Vendor List ──
  // GET /goa/srt/installation/assign - Params: none
  VENDOR_LIST: `${BASE_URL}/goa/srt/installation/assign`,
  VENDOR_LIST_CANDIDATES: () => [
    ...buildCandidateUrls('/goa/srt/installation/assign'),
    ...buildCandidateUrls('/goa/srt/survey/assign'),
    ...buildCandidateUrls('/goa/srt/installation/view-assign'),
  ],

  // ── 2. Fetch Districts ──
  // GET /goa/srt/installation/fetch-district - Param: state (string, No)
  FETCH_DISTRICTS: (state = 'Goa') =>
    `${BASE_URL}/goa/srt/installation/fetch-district?state=${encodeURIComponent(state)}`,
  FETCH_DISTRICTS_CANDIDATES: (state = 'Goa') => [
    ...buildCandidateUrls(`/goa/srt/installation/fetch-district?state=${encodeURIComponent(state)}`),
    ...buildCandidateUrls('/goa/srt/installation/fetch-district'),
    ...buildCandidateUrls(`/goa/srt/survey/fetch-district?state=${encodeURIComponent(state)}`),
    ...buildCandidateUrls('/goa/srt/survey/assign'),
  ],

  // ── 3. Fetch Sites (unassigned, non-cancelled sites) ──
  // GET /goa/srt/installation/fetch-site - Params: state (string, Yes), district (string, Yes)
  FETCH_SITES: (state = 'Goa', district = '') =>
    `${BASE_URL}/goa/srt/installation/fetch-site?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`,
  FETCH_SITES_CANDIDATES: (state = 'Goa', district = '') => [
    ...buildCandidateUrls(`/goa/srt/installation/fetch-site?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`),
    ...buildCandidateUrls(`/goa/srt/installation/fetch-site?district=${encodeURIComponent(district)}`),
    ...buildCandidateUrls(`/goa/srt/installation/fetch-sites?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`),
    ...buildCandidateUrls(`/goa/srt/installation/fetch-site-name?district=${encodeURIComponent(district)}`),
  ],

  // ── 4. Store Assign (multipart/form-data: vendor, state, district, site[], file, remarks) ──
  // POST /goa/srt/installation/store-assign
  STORE_ASSIGN: `${BASE_URL}/goa/srt/installation/store-assign`,
  STORE_ASSIGN_CANDIDATES: () => [
    ...buildCandidateUrls('/goa/srt/installation/store-assign'),
    ...buildCandidateUrls('/goa/srt/installation/store-assign-site'),
    ...buildCandidateUrls('/goa/srt/installation/store'),
  ],

  // ── 5. View Assign ──
  // GET /goa/srt/installation/view-assign
  VIEW_ASSIGN: `${BASE_URL}/goa/srt/installation/view-assign`,
  VIEW_ASSIGN_CANDIDATES: () => [
    ...buildCandidateUrls('/goa/srt/installation/view-assign'),
    ...buildCandidateUrls('/goa/srt/view'),
    ...buildCandidateUrls('/goa/srt/installation/view-assign-site'),
  ],

  // ── 6. Assign View Details (vendor-wise) ──
  // GET /goa/srt/installation/view-details/{id} - {id} = vendor id
  VIEW_DETAILS: (id: number | string) =>
    `${BASE_URL}/goa/srt/installation/view-details/${encodeURIComponent(id)}`,
  VIEW_DETAILS_CANDIDATES: (id: number | string) =>
    buildCandidateUrls(`/goa/srt/installation/view-details/${encodeURIComponent(id)}`),

  // ── 7. Approve Assignment ──
  // ANY /goa/srt/installation/approval-assign/{id} - {id} = assign_srt id
  APPROVE_ASSIGN: (id: number | string) =>
    `${BASE_URL}/goa/srt/installation/approval-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_CANDIDATES: (id: number | string) => [
    ...buildCandidateUrls(`/goa/srt/installation/approval-assign/${encodeURIComponent(id)}`),
    ...buildCandidateUrls(`/goa/srt/installation/approvel-assign/${encodeURIComponent(id)}`),
  ],

  // ── 8. Edit Assign (fetch data) ──
  // GET /goa/srt/installation/edit-assign/{id}
  EDIT_ASSIGN: (id: number | string) =>
    `${BASE_URL}/goa/srt/installation/edit-assign/${encodeURIComponent(id)}`,
  EDIT_ASSIGN_CANDIDATES: (id: number | string) =>
    buildCandidateUrls(`/goa/srt/installation/edit-assign/${encodeURIComponent(id)}`),

  // ── 9. Update Assign ──
  // ANY /goa/srt/installation/update-assign/{id} (multipart/form-data: vendor, state, district, site[], remarks, file)
  UPDATE_ASSIGN: (id: number | string) =>
    `${BASE_URL}/goa/srt/installation/update-assign/${encodeURIComponent(id)}`,
  UPDATE_ASSIGN_CANDIDATES: (id: number | string) =>
    buildCandidateUrls(`/goa/srt/installation/update-assign/${encodeURIComponent(id)}`),

  // ── 10. View Installation ──
  // GET /goa/srt/installation/view-installation
  VIEW_INSTALLATION: `${BASE_URL}/goa/srt/installation/view-installation`,
  VIEW_INSTALLATION_CANDIDATES: () =>
    buildCandidateUrls('/goa/srt/installation/view-installation'),

  // ── 11. Verify Installation Status ──
  // ANY /goa/srt/installation/verify-installation-status (id: integer, status: 1 or 2)
  VERIFY_INSTALLATION_STATUS: `${BASE_URL}/goa/srt/installation/verify-installation-status`,
  VERIFY_INSTALLATION_STATUS_CANDIDATES: () =>
    buildCandidateUrls('/goa/srt/installation/verify-installation-status'),

  // ── 12. View Claim ──
  // GET /goa/srt/installation/view-claim
  VIEW_CLAIM: `${BASE_URL}/goa/srt/installation/view-claim`,
  VIEW_CLAIM_CANDIDATES: () =>
    buildCandidateUrls('/goa/srt/installation/view-claim'),

  // ── 13. Update Claim Status ──
  // ANY /goa/srt/installation/update-claim-status (id: integer, status: 1 or 2 (2=Approved))
  UPDATE_CLAIM_STATUS: `${BASE_URL}/goa/srt/installation/update-claim-status`,
  UPDATE_CLAIM_STATUS_CANDIDATES: () =>
    buildCandidateUrls('/goa/srt/installation/update-claim-status'),

  // ── 14. Verify Document Submit ──
  // ANY /goa/srt/srt/installation/verify-document-submit (note: "srt" appears twice in controller route)
  VERIFY_DOCUMENT_SUBMIT: `${BASE_URL}/goa/srt/srt/installation/verify-document-submit`,
  VERIFY_DOCUMENT_SUBMIT_CANDIDATES: () => [
    ...buildCandidateUrls('/goa/srt/srt/installation/verify-document-submit'),
    ...buildCandidateUrls('/goa/srt/installation/verify-document-submit'),
  ],

  // ── 15. Inspection Update Status ──
  // ANY /goa/srt/installation/inspection-update-status (id: integer, status: 1 or 2)
  INSPECTION_UPDATE_STATUS: `${BASE_URL}/goa/srt/installation/inspection-update-status`,
  INSPECTION_UPDATE_STATUS_CANDIDATES: () =>
    buildCandidateUrls('/goa/srt/installation/inspection-update-status'),

  // ── 16. View Data (route name: goa-view-srt-inst-data) ──
  // GET /goa/srt/installation/view-data
  VIEW_DATA: `${BASE_URL}/goa/srt/installation/view-data`,
  VIEW_DATA_CANDIDATES: () =>
    buildCandidateUrls('/goa/srt/installation/view-data'),

  // ── 17. Verify Pay 3 ──
  // ANY /goa/srt/installation/verify-pay3 (id: integer, status: 1 or 2 (2=Approved))
  VERIFY_PAY3: `${BASE_URL}/goa/srt/installation/verify-pay3`,
  VERIFY_PAY3_CANDIDATES: () =>
    buildCandidateUrls('/goa/srt/installation/verify-pay3'),

  // ── 18. View Payment ──
  // ANY /goa/srt/installation/view-payment (from_date, to_date, vendor)
  VIEW_PAYMENT: `${BASE_URL}/goa/srt/installation/view-payment`,
  VIEW_PAYMENT_CANDIDATES: (params?: { from_date?: string; to_date?: string; vendor?: number | string }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.vendor) q.append('vendor', String(params.vendor));
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return buildCandidateUrls(`/goa/srt/installation/view-payment${suffix}`);
  },

  // ── 19. Update Payment ──
  // ANY /goa/srt/installation/update-payment (pay1_id/pay2_id/pay3_id, inst_pay1/2/3, dates, remarks)
  UPDATE_PAYMENT: `${BASE_URL}/goa/srt/installation/update-payment`,
  UPDATE_PAYMENT_CANDIDATES: () =>
    buildCandidateUrls('/goa/srt/installation/update-payment'),

  // ── 20. Payment Filter ──
  // GET /goa/srt/installation/payment-filter (from_date, to_date, vendor)
  PAYMENT_FILTER: `${BASE_URL}/goa/srt/installation/payment-filter`,
  PAYMENT_FILTER_CANDIDATES: (params?: { from_date?: string; to_date?: string; vendor?: number | string }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.vendor) q.append('vendor', String(params.vendor));
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return buildCandidateUrls(`/goa/srt/installation/payment-filter${suffix}`);
  },

  // ── 21. Dashboard ──
  // ANY /goa/srt/installation/dashboard (volume)
  DASHBOARD: `${BASE_URL}/goa/srt/installation/dashboard`,
  DASHBOARD_CANDIDATES: (volume?: string) => {
    const q = volume && volume !== 'all' ? `?volume=${encodeURIComponent(volume)}` : '';
    return buildCandidateUrls(`/goa/srt/installation/dashboard${q}`);
  },

  // ── 22. View Dashboard Data (drill-down) ──
  // GET /goa/srt/installation/view-dashboard-data/{status}/{volume?}
  VIEW_DASHBOARD_DATA: (status: string, volume?: string) =>
    volume
      ? `${BASE_URL}/goa/srt/installation/view-dashboard-data/${encodeURIComponent(status)}/${encodeURIComponent(volume)}`
      : `${BASE_URL}/goa/srt/installation/view-dashboard-data/${encodeURIComponent(status)}/all`,
  VIEW_DASHBOARD_DATA_CANDIDATES: (status: string, volume?: string) => [
    ...buildCandidateUrls(
      volume
        ? `/goa/srt/installation/view-dashboard-data/${encodeURIComponent(status)}/${encodeURIComponent(volume)}`
        : `/goa/srt/installation/view-dashboard-data/${encodeURIComponent(status)}/all`
    ),
    ...buildCandidateUrls(`/goa/srt/installation/view-dashboard-data/${encodeURIComponent(status)}`),
    ...buildCandidateUrls(`/goa/srt/installation/dashboard/view-data/${encodeURIComponent(status)}`),
  ],

  // ── 23. Vendor-wise Data ──
  // GET /goa/srt/installation/vendorwise-data/{status}/{volume?}/{vendor}
  VENDORWISE_DATA: (status: string, vendor: number | string, volume?: string) =>
    volume
      ? `${BASE_URL}/goa/srt/installation/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(volume)}/${encodeURIComponent(vendor)}`
      : `${BASE_URL}/goa/srt/installation/vendorwise-data/${encodeURIComponent(status)}/all/${encodeURIComponent(vendor)}`,
  VENDORWISE_DATA_CANDIDATES: (status: string, vendor: number | string, volume?: string) => [
    ...buildCandidateUrls(
      volume
        ? `/goa/srt/installation/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(volume)}/${encodeURIComponent(vendor)}`
        : `/goa/srt/installation/vendorwise-data/${encodeURIComponent(status)}/all/${encodeURIComponent(vendor)}`
    ),
    ...buildCandidateUrls(`/goa/srt/installation/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`),
  ],

  // ── 24. District-wise Data ──
  // GET /goa/srt/installation/districtwise-data/{status}/{volume?}/{district}
  DISTRICTWISE_DATA: (status: string, district: string, volume?: string) =>
    volume
      ? `${BASE_URL}/goa/srt/installation/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(volume)}/${encodeURIComponent(district)}`
      : `${BASE_URL}/goa/srt/installation/districtwise-data/${encodeURIComponent(status)}/all/${encodeURIComponent(district)}`,
  DISTRICTWISE_DATA_CANDIDATES: (status: string, district: string, volume?: string) => [
    ...buildCandidateUrls(
      volume
        ? `/goa/srt/installation/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(volume)}/${encodeURIComponent(district)}`
        : `/goa/srt/installation/districtwise-data/${encodeURIComponent(status)}/all/${encodeURIComponent(district)}`
    ),
    ...buildCandidateUrls(`/goa/srt/installation/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`),
    ...buildCandidateUrls(`/goa/srt/installation/dashboard/districtwise/${encodeURIComponent(status)}/${encodeURIComponent(district)}`),
  ],
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GOA SRT SURVEY APIS (10 ROUTES)
 * Controller: App\Http\Controllers\admin\goa\GoaSrtSurveyController
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const GOA_ADMIN_SURVEY_API = {
  // ── 1. Survey Assign (form data: vendor, districts) ──
  // GET /goa/srt/survey/assign - Params: none
  ASSIGN: `${BASE_URL}/goa/srt/survey/assign`,
  ASSIGN_CANDIDATES: () => buildCandidateUrls('/goa/srt/survey/assign'),

  // ── 2. Fetch Sites (unassigned sites with survey_status = 0) ──
  // GET /goa/srt/survey/fetch-site - Param: district (string, Yes)
  FETCH_SITES: (district: string) =>
    `${BASE_URL}/goa/srt/survey/fetch-site?district=${encodeURIComponent(district)}`,
  FETCH_SITES_CANDIDATES: (district: string) =>
    buildCandidateUrls(`/goa/srt/survey/fetch-site?district=${encodeURIComponent(district)}`),

  // ── 3. Survey Assign Store (multipart/form-data: vendor, state, district, site[], file, remarks) ──
  // POST /goa/srt/survey/assign-store
  ASSIGN_STORE: `${BASE_URL}/goa/srt/survey/assign-store`,
  ASSIGN_STORE_CANDIDATES: () => [
    ...buildCandidateUrls('/goa/srt/survey/assign-store'),
    ...buildCandidateUrls('/goa/srt/survey/store-assign'),
  ],

  // ── 4. Survey Assign View (assigned records & stats) ──
  // GET /goa/srt/survey/assign-view
  ASSIGN_VIEW: `${BASE_URL}/goa/srt/survey/assign-view`,
  ASSIGN_VIEW_CANDIDATES: () => [
    ...buildCandidateUrls('/goa/srt/survey/assign-view'),
    ...buildCandidateUrls('/goa/srt/survey/view-assign'),
  ],

  // ── 5. View Assign Survey (verification list: pending, verify, summary) ──
  // GET /goa/srt/survey/view-assign-survey
  VIEW_ASSIGN_SURVEY: `${BASE_URL}/goa/srt/survey/view-assign-survey`,
  VIEW_ASSIGN_SURVEY_CANDIDATES: () => [
    ...buildCandidateUrls('/goa/srt/survey/view-assign-survey'),
    ...buildCandidateUrls('/goa/srt/survey/view-survey'),
  ],

  // ── 6. Survey Verify Status (id, status: 0 | 1 | 2, remarks) ──
  // POST /goa/srt/survey/survey-verify-status
  SURVEY_VERIFY_STATUS: `${BASE_URL}/goa/srt/survey/survey-verify-status`,
  SURVEY_VERIFY_STATUS_CANDIDATES: () => [
    ...buildCandidateUrls('/goa/srt/survey/survey-verify-status'),
    ...buildCandidateUrls('/goa/srt/survey/verify-status'),
  ],

  // ── 7. Survey Dashboard (stats, districtwise, vendorwises) ──
  // GET /goa/srt/survey/dashboard
  DASHBOARD: `${BASE_URL}/goa/srt/survey/dashboard`,
  DASHBOARD_CANDIDATES: () => buildCandidateUrls('/goa/srt/survey/dashboard'),

  // ── 8. View Dashboard (drill-down by status) ──
  // GET /goa/srt/survey/view-dashboard/{status?}
  VIEW_DASHBOARD: (status?: string) =>
    status
      ? `${BASE_URL}/goa/srt/survey/view-dashboard/${encodeURIComponent(status)}`
      : `${BASE_URL}/goa/srt/survey/view-dashboard`,
  VIEW_DASHBOARD_CANDIDATES: (status?: string) => [
    ...buildCandidateUrls(
      status
        ? `/goa/srt/survey/view-dashboard/${encodeURIComponent(status)}`
        : '/goa/srt/survey/view-dashboard'
    ),
    ...buildCandidateUrls(
      status
        ? `/goa/srt/survey/view-dashboard-data/${encodeURIComponent(status)}`
        : '/goa/srt/survey/view-dashboard-data'
    ),
  ],

  // ── 9. Vendor-wise Dashboard Drill-Down ──
  // GET /goa/srt/survey/vendorwise-dashboard/{status}/{vendor}
  VENDORWISE_DASHBOARD: (status: string, vendor: number | string) =>
    `${BASE_URL}/goa/srt/survey/vendorwise-dashboard/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`,
  VENDORWISE_DASHBOARD_CANDIDATES: (status: string, vendor: number | string) => [
    ...buildCandidateUrls(`/goa/srt/survey/vendorwise-dashboard/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`),
    ...buildCandidateUrls(`/goa/srt/survey/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`),
  ],

  // ── 10. District-wise Dashboard Drill-Down ──
  // GET /goa/srt/survey/districtwise-dashboard/{status}/{district}
  DISTRICTWISE_DASHBOARD: (status: string, district: string) =>
    `${BASE_URL}/goa/srt/survey/districtwise-dashboard/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
  DISTRICTWISE_DASHBOARD_CANDIDATES: (status: string, district: string) => [
    ...buildCandidateUrls(`/goa/srt/survey/districtwise-dashboard/${encodeURIComponent(status)}/${encodeURIComponent(district)}`),
    ...buildCandidateUrls(`/goa/srt/survey/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`),
  ],

  // Backwards-compatibility aliases
  VIEW_ASSIGN: `${BASE_URL}/goa/srt/survey/assign-view`,
  VIEW_ASSIGN_CANDIDATES: () => buildCandidateUrls('/goa/srt/survey/assign-view'),
  VIEW_DATA: `${BASE_URL}/goa/srt/survey/view-dashboard`,
  VIEW_DATA_CANDIDATES: () => buildCandidateUrls('/goa/srt/survey/view-dashboard'),
  VIEW_SURVEY: `${BASE_URL}/goa/srt/survey/view-assign-survey`,
  VIEW_SURVEY_CANDIDATES: () => buildCandidateUrls('/goa/srt/survey/view-assign-survey'),
  STORE_ASSIGN: `${BASE_URL}/goa/srt/survey/assign-store`,
  STORE_ASSIGN_CANDIDATES: () => buildCandidateUrls('/goa/srt/survey/assign-store'),
  VERIFY_STATUS: `${BASE_URL}/goa/srt/survey/survey-verify-status`,
  VERIFY_STATUS_CANDIDATES: () => buildCandidateUrls('/goa/srt/survey/survey-verify-status'),
  DRILLDOWN: (status: string) => `${BASE_URL}/goa/srt/survey/view-dashboard/${encodeURIComponent(status)}`,
  DRILLDOWN_CANDIDATES: (status: string) => buildCandidateUrls(`/goa/srt/survey/view-dashboard/${encodeURIComponent(status)}`),
};

export const GOA_ADMIN_AMC_API = {
  // 1. AMC Assign (form data) - GET /goa/srt/amc/assign
  ASSIGN: `${BASE_URL}/goa/srt/amc/assign`,
  ASSIGN_CANDIDATES: () => [
    ...buildCandidateUrls('/goa/srt/amc/assign'),
    ...buildCandidateUrls('/goa/srt/amc/assign?state=goa'),
    ...buildCandidateUrls('/admin/goa/srt/amc/assign'),
    ...buildCandidateUrls('/goa/srt/installation/amc-assign'),
    ...buildCandidateUrls('/goa/srt/installation/assign-amc'),
    ...buildCandidateUrls('/admin/goa/srt/installation/amc-assign'),
  ],

  // 2. Get Site Name - GET /goa/srt/amc/get-site-name?district=...&amc=...
  GET_SITE_NAME: (district: string, amc: number | string) =>
    `${BASE_URL}/goa/srt/amc/get-site-name?district=${encodeURIComponent(district)}&amc=${encodeURIComponent(amc)}`,
  GET_SITE_NAME_CANDIDATES: (district: string, amc: number | string) => [
    ...buildCandidateUrls(`/goa/srt/amc/get-site-name?district=${encodeURIComponent(district)}&amc=${encodeURIComponent(amc)}`),
    ...buildCandidateUrls(`/goa/srt/amc/get-site-name?district=${encodeURIComponent(district)}&amc=${encodeURIComponent(amc)}&state=goa`),
    ...buildCandidateUrls(`/goa/srt/amc/get-site-names?district=${encodeURIComponent(district)}&amc=${encodeURIComponent(amc)}`),
    ...buildCandidateUrls(`/admin/goa/srt/amc/get-site-name?district=${encodeURIComponent(district)}&amc=${encodeURIComponent(amc)}`),
    ...buildCandidateUrls(`/goa/srt/installation/amc-get-site-name?district=${encodeURIComponent(district)}&amc=${encodeURIComponent(amc)}`),
  ],

  // 3. Store Assign - POST /goa/srt/amc/store-assign
  STORE_ASSIGN: `${BASE_URL}/goa/srt/amc/store-assign`,
  STORE_ASSIGN_CANDIDATES: () => [
    ...buildCandidateUrls('/goa/srt/amc/store-assign'),
    ...buildCandidateUrls('/admin/goa/srt/amc/store-assign'),
    ...buildCandidateUrls('/goa/srt/installation/amc-store-assign'),
    ...buildCandidateUrls('/goa/srt/installation/store-amc-assign'),
    ...buildCandidateUrls('/admin/goa/srt/installation/amc-store-assign'),
  ],

  // 4. View Assign - GET /goa/srt/amc/view-assign
  VIEW_ASSIGN: `${BASE_URL}/goa/srt/amc/view-assign`,
  VIEW_ASSIGN_CANDIDATES: () => [
    ...buildCandidateUrls('/goa/srt/amc/view-assign'),
    ...buildCandidateUrls('/goa/srt/amc/view-assign?state=goa'),
    ...buildCandidateUrls('/admin/goa/srt/amc/view-assign'),
    ...buildCandidateUrls('/goa/srt/amc/assign-view'),
    ...buildCandidateUrls('/admin/goa/srt/amc/assign-view'),
    ...buildCandidateUrls('/goa/srt/installation/view-amc'),
    ...buildCandidateUrls('/goa/srt/installation/view-installation-amc'),
    ...buildCandidateUrls('/admin/goa/srt/installation/view-installation-amc'),
  ],

  // 5. Verify View AMC - GET /goa/srt/amc/verify-view-amc
  VERIFY_VIEW: `${BASE_URL}/goa/srt/amc/verify-view-amc`,
  VERIFY_VIEW_CANDIDATES: () => [
    ...buildCandidateUrls('/goa/srt/amc/verify-view-amc'),
    ...buildCandidateUrls('/goa/srt/amc/verify-view-amc?state=goa'),
    ...buildCandidateUrls('/admin/goa/srt/amc/verify-view-amc'),
    ...buildCandidateUrls('/goa/srt/amc/view-verify'),
    ...buildCandidateUrls('/admin/goa/srt/amc/view-verify'),
    ...buildCandidateUrls('/goa/srt/installation/verify-amc'),
    ...buildCandidateUrls('/admin/goa/srt/installation/verify-amc'),
  ],

  // 6. Verify AMC Status - POST /goa/srt/amc/verify-amc-status
  VERIFY_STATUS: `${BASE_URL}/goa/srt/amc/verify-amc-status`,
  VERIFY_STATUS_CANDIDATES: () => [
    ...buildCandidateUrls('/goa/srt/amc/verify-amc-status'),
    ...buildCandidateUrls('/admin/goa/srt/amc/verify-amc-status'),
    ...buildCandidateUrls('/goa/srt/amc/verify-status'),
    ...buildCandidateUrls('/admin/goa/srt/amc/verify-status'),
    ...buildCandidateUrls('/goa/srt/installation/verify-amc-status'),
    ...buildCandidateUrls('/admin/goa/srt/installation/verify-amc-status'),
  ],

  // 7. Dashboard - GET /goa/srt/amc/dashboard
  DASHBOARD: `${BASE_URL}/goa/srt/amc/dashboard`,
  DASHBOARD_CANDIDATES: () => [
    ...buildCandidateUrls('/goa/srt/amc/dashboard'),
    ...buildCandidateUrls('/goa/srt/amc/dashboard?state=goa'),
    ...buildCandidateUrls('/admin/goa/srt/amc/dashboard'),
    ...buildCandidateUrls('/goa/srt/amc/amc-dashboard'),
    ...buildCandidateUrls('/admin/goa/srt/amc/amc-dashboard'),
    ...buildCandidateUrls('/goa/srt/installation/amc-dashboard'),
    ...buildCandidateUrls('/admin/goa/srt/installation/amc-dashboard'),
  ],

  // Legacy & Drilldown candidate endpoints
  VIEW_DATA: `${BASE_URL}/goa/srt/amc/view-data`,
  VIEW_DATA_CANDIDATES: () => [
    ...buildCandidateUrls('/goa/srt/amc/view-data'),
    ...buildCandidateUrls('/goa/srt/amc/view-data?state=goa'),
    ...buildCandidateUrls('/admin/goa/srt/amc/view-data'),
  ],
  VIEW_VERIFY: `${BASE_URL}/goa/srt/amc/view-verify`,
  DRILLDOWN: (status: string) => `${BASE_URL}/goa/srt/amc/view-dashboard-data/${encodeURIComponent(status)}`,
  DRILLDOWN_CANDIDATES: (status: string) => [
    ...buildCandidateUrls(`/goa/srt/amc/view-dashboard-data/${encodeURIComponent(status)}`),
    ...buildCandidateUrls(`/goa/srt/amc/view-dashboard/${encodeURIComponent(status)}`),
    ...buildCandidateUrls(`/admin/goa/srt/amc/view-dashboard-data/${encodeURIComponent(status)}`),
  ],
};

/**
 * Vendor Portal compatibility object
 */
export const GOA_VENDOR_API = {
  SRT_DASHBOARD: `${RAW_ADMIN_URL}/v/goa/vendor-srt-installation-dashboard`,
  SRT_VIEW_ASSIGNED: `${RAW_ADMIN_URL}/v/goa/srt/viewassignsite`,
  SRT_VIEW_INSTALLED: `${RAW_ADMIN_URL}/v/goa/srt/allassignsite`,
  SRT_VERIFY_CLAIM: `${RAW_ADMIN_URL}/v/goa/srt/paymentsrtVendor`,
  SURVEY_VIEW: `${RAW_ADMIN_URL}/v/goa/view-survey`,
  AMC_VIEW: `${RAW_ADMIN_URL}/v/goa-view-srt-amc`,
};

export default GOA_ADMIN_SRT_API;