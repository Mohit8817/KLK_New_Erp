import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const BASE_URL = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;
export const API_ROOT = BASE_URL;
export const ROOT_URL = RAW_BASE.replace(/\/api\/?$/, '');
export const ADMIN_BASE_URL = `${API_ROOT}/admin`;
export const RAW_ADMIN_URL = `${ROOT_URL}/admin`;

/**
 * Build candidate URLs for UP Admin controller routes.
 * All Super Admin controllers on klkerp.com are mounted under /api/admin/...
 * Do NOT fall back to /api/up/... (V-Portal vendor guard) or root /up/... (web routes).
 */
export function buildUpCandidateUrls(rawPath: string): string[] {
  let path = (rawPath || '').trim();
  let pathname = path;
  let search = '';
  const qIndex = path.indexOf('?');
  if (qIndex !== -1) {
    pathname = path.slice(0, qIndex);
    search = path.slice(qIndex);
  }

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
  return [`${ADMIN_BASE_URL}${routePath}`];
}

/**
 * Legacy / V-Portal UP Vendor APIs (preserved for backward compatibility)
 */
export const UP_VENDOR_API = {
  // Resco Installation
  RESCO_DASHBOARD: `${BASE_URL}/v/up/resco-installation-dashboard`,
  RESCO_VIEW_ASSIGNED: `${BASE_URL}/v/up/resco-view-assign-installation-sites`,
  RESCO_VIEW_INSTALLED: `${BASE_URL}/v/up/resco-view-install-site`,
  RESCO_VERIFY_CLAIM: `${BASE_URL}/v/up/resco-installation-claim`,

  // SSL 18W Installation
  SSL_DASHBOARD: `${BASE_URL}/v/up/ssl-18w-installation-dashboard`,
  SSL_VIEW_ASSIGNED: `${BASE_URL}/v/up/view-18w-assign-installation-sites`,
  SSL_VIEW_INSTALLED: `${BASE_URL}/v/up/ssl-view-installed-18w-light`,
  SSL_VERIFY_CLAIM: `${BASE_URL}/v/up/ssl-view-installation-18w-claim`,

  // Kusum C Installation
  KUSUM_C_DASHBOARD: `${BASE_URL}/v/up/kusum-c-installation-dashboard`,
  KUSUM_C_VIEW_ASSIGNED: `${BASE_URL}/v/up/view-kusum-c-assign-installation-sites`,
  KUSUM_C_VIEW_INSTALLED: `${BASE_URL}/v/up/view-kusum-c-install-site`,
  KUSUM_C_VERIFY_CLAIM: `${BASE_URL}/v/up/kusum-c-installation-claim`,

  // Surveys
  SRT_SURVEY_VIEW: `${BASE_URL}/v/up/srt-surveys/view`,
  RESCO_SURVEY_VIEW: `${BASE_URL}/v/up/view-resco-survey`,
  SSL_SURVEY_VIEW: `${BASE_URL}/v/view-upssl`,
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UP SSL 18W INSTALLATION — SUPER ADMIN APIS (18 ENDPOINTS)
 * Controller: App\Http\Controllers\admin\up\UPSsl18wInstallationController
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const UP_ADMIN_SSL18W_API = {
  // 1. Assign (form data) — GET /up/ssl-18w/installation/assign
  ASSIGN: `${ADMIN_BASE_URL}/up/ssl-18w/installation/assign`,
  ASSIGN_CANDIDATES: () => buildUpCandidateUrls('/up/ssl-18w/installation/assign'),

  // 2. Fetch Block — GET /up/ssl-18w/installation/fetch-block?district=...
  FETCH_BLOCK: (district: string) =>
    `${ADMIN_BASE_URL}/up/ssl-18w/installation/fetch-block?district=${encodeURIComponent(district)}`,
  FETCH_BLOCK_CANDIDATES: (district: string) =>
    buildUpCandidateUrls(`/up/ssl-18w/installation/fetch-block?district=${encodeURIComponent(district)}`),

  // 3. Fetch Panchayat — GET /up/ssl-18w/installation/fetch-panchayat?district=...&block=...
  FETCH_PANCHAYAT: (district: string, block: string) =>
    `${ADMIN_BASE_URL}/up/ssl-18w/installation/fetch-panchayat?district=${encodeURIComponent(district)}&block=${encodeURIComponent(block)}`,
  FETCH_PANCHAYAT_CANDIDATES: (district: string, block: string) =>
    buildUpCandidateUrls(
      `/up/ssl-18w/installation/fetch-panchayat?district=${encodeURIComponent(district)}&block=${encodeURIComponent(block)}`
    ),

  // 4. Store Assign — POST /up/ssl-18w/installation/store-assign (multipart/form-data)
  STORE_ASSIGN: `${ADMIN_BASE_URL}/up/ssl-18w/installation/store-assign`,
  STORE_ASSIGN_CANDIDATES: () => buildUpCandidateUrls('/up/ssl-18w/installation/store-assign'),

  // 5. View Assign — GET /up/ssl-18w/installation/view-assign
  VIEW_ASSIGN: `${ADMIN_BASE_URL}/up/ssl-18w/installation/view-assign`,
  VIEW_ASSIGN_CANDIDATES: () => buildUpCandidateUrls('/up/ssl-18w/installation/view-assign'),

  // 6. Approval Assign — ANY /up/ssl-18w/installation/approval-assign/{id}
  APPROVAL_ASSIGN: (id: string | number) =>
    `${ADMIN_BASE_URL}/up/ssl-18w/installation/approval-assign/${encodeURIComponent(id)}`,
  APPROVAL_ASSIGN_CANDIDATES: (id: string | number) => [
    ...buildUpCandidateUrls(`/up/ssl-18w/installation/approval-assign/${encodeURIComponent(id)}`),
    ...buildUpCandidateUrls(`/up/ssl-18w/installation/approvel-assign/${encodeURIComponent(id)}`),
  ],

  // 7. Edit Assign (fetch data) — GET /up/ssl-18w/installation/edit-assign/{id}
  EDIT_ASSIGN: (id: string | number) =>
    `${ADMIN_BASE_URL}/up/ssl-18w/installation/edit-assign/${encodeURIComponent(id)}`,
  EDIT_ASSIGN_CANDIDATES: (id: string | number) =>
    buildUpCandidateUrls(`/up/ssl-18w/installation/edit-assign/${encodeURIComponent(id)}`),

  // 8. Update Assign — POST /up/ssl-18w/installation/update-assign (id in body)
  UPDATE_ASSIGN: `${ADMIN_BASE_URL}/up/ssl-18w/installation/update-assign`,
  UPDATE_ASSIGN_CANDIDATES: () => buildUpCandidateUrls('/up/ssl-18w/installation/update-assign'),

  // 9. View Installation — GET /up/ssl-18w/installation/view-installation
  VIEW_INSTALLATION: `${ADMIN_BASE_URL}/up/ssl-18w/installation/view-installation`,
  VIEW_INSTALLATION_CANDIDATES: () => buildUpCandidateUrls('/up/ssl-18w/installation/view-installation'),

  // 10. Verify Installation Status — POST /up/ssl/installation/verify-installation-status
  VERIFY_INSTALLATION_STATUS: `${ADMIN_BASE_URL}/up/ssl/installation/verify-installation-status`,
  VERIFY_INSTALLATION_STATUS_CANDIDATES: () => [
    ...buildUpCandidateUrls('/up/ssl/installation/verify-installation-status'),
    ...buildUpCandidateUrls('/up/ssl-18w/installation/verify-installation-status'),
  ],

  // 11. View Claim — GET /up/ssl-18w/installation/view-claim
  VIEW_CLAIM: `${ADMIN_BASE_URL}/up/ssl-18w/installation/view-claim`,
  VIEW_CLAIM_CANDIDATES: () => buildUpCandidateUrls('/up/ssl-18w/installation/view-claim'),

  // 12. Verify Claim Status — POST /up/ssl-18w/installation/verify-claim-status
  VERIFY_CLAIM_STATUS: `${ADMIN_BASE_URL}/up/ssl-18w/installation/verify-claim-status`,
  VERIFY_CLAIM_STATUS_CANDIDATES: () => buildUpCandidateUrls('/up/ssl-18w/installation/verify-claim-status'),

  // 13. View Payment — ANY /up/ssl-18w/installation/view-payment
  VIEW_PAYMENT_CANDIDATES: (params?: {
    from_date?: string;
    to_date?: string;
    vendor?: string | number;
    status?: string | number;
  }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.set('from_date', params.from_date);
    if (params?.to_date) q.set('to_date', params.to_date);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All') {
      q.set('vendor', String(params.vendor));
    }
    if (params?.status !== undefined && params.status !== '' && params.status !== 'All') {
      q.set('status', String(params.status));
    }
    const qs = q.toString();
    return buildUpCandidateUrls(`/up/ssl-18w/installation/view-payment${qs ? `?${qs}` : ''}`);
  },

  // 14. Update Payment — POST /up/ssl-18w/installation/update-payment-status
  UPDATE_PAYMENT_STATUS: `${ADMIN_BASE_URL}/up/ssl-18w/installation/update-payment-status`,
  UPDATE_PAYMENT_STATUS_CANDIDATES: () =>
    buildUpCandidateUrls('/up/ssl-18w/installation/update-payment-status'),

  // 15. Dashboard — GET /up/ssl-18w/installation/dashboard
  DASHBOARD: `${ADMIN_BASE_URL}/up/ssl-18w/installation/dashboard`,
  DASHBOARD_CANDIDATES: () => buildUpCandidateUrls('/up/ssl-18w/installation/dashboard'),

  // 16. View Dashboard (drill-down) — GET /up/ssl-18w/installation/view-dashboard/{status}
  VIEW_DASHBOARD_CANDIDATES: (status: string) =>
    buildUpCandidateUrls(`/up/ssl-18w/installation/view-dashboard/${encodeURIComponent(status)}`),

  // 17. Vendor-wise — GET /up/ssl-18w/installation/vendorwise-data/{status}/{vendor}
  VENDORWISE_DATA_CANDIDATES: (status: string, vendor: string | number) =>
    buildUpCandidateUrls(
      `/up/ssl-18w/installation/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(String(vendor))}`
    ),

  // 18. District-wise — GET /up/ssl-18w/installation/districtwise-data/{status}/{district}
  DISTRICTWISE_DATA_CANDIDATES: (status: string, district: string) =>
    buildUpCandidateUrls(
      `/up/ssl-18w/installation/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`
    ),
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UP KUSUM C INSTALLATION — SUPER ADMIN APIS (23 ENDPOINTS)
 * Controller: App\Http\Controllers\admin\up\UPKusumCInstallationController
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const UP_ADMIN_KUSUMC_API = {
  // 1. Assign (form data) — GET /up/kusumc/installation/assign
  ASSIGN: `${ADMIN_BASE_URL}/up/kusumc/installation/assign`,
  ASSIGN_CANDIDATES: () => buildUpCandidateUrls('/up/kusumc/installation/assign'),

  // 2. Fetch District — GET /up/kusumc/installation/fetch-district?volume=...
  FETCH_DISTRICT_CANDIDATES: (volume: string | number) =>
    buildUpCandidateUrls(`/up/kusumc/installation/fetch-district?volume=${encodeURIComponent(String(volume))}`),

  // 3. Fetch Applicant — GET /up/kusumc/installation/fetch-applicant?volume=...&district=...
  FETCH_APPLICANT_CANDIDATES: (volume: string | number, district: string) =>
    buildUpCandidateUrls(
      `/up/kusumc/installation/fetch-applicant?volume=${encodeURIComponent(String(volume))}&district=${encodeURIComponent(district)}`
    ),

  // 4. Store Assign — POST /up/kusumc/installation/store-assign
  STORE_ASSIGN: `${ADMIN_BASE_URL}/up/kusumc/installation/store-assign`,
  STORE_ASSIGN_CANDIDATES: () => buildUpCandidateUrls('/up/kusumc/installation/store-assign'),

  // 5. View Assign — GET /up/kusumc/installation/view-assign
  VIEW_ASSIGN: `${ADMIN_BASE_URL}/up/kusumc/installation/view-assign`,
  VIEW_ASSIGN_CANDIDATES: () => buildUpCandidateUrls('/up/kusumc/installation/view-assign'),

  // 6. Approval Assign — POST /up/kusumc/installation/approval-assign/{id}
  APPROVAL_ASSIGN_CANDIDATES: (id: string | number) => [
    ...buildUpCandidateUrls(`/up/kusumc/installation/approval-assign/${encodeURIComponent(id)}`),
    ...buildUpCandidateUrls(`/up/kusumc/installation/approvel-assign/${encodeURIComponent(id)}`),
  ],

  // 7. Edit Assign (fetch data) — GET /up/kusumc/installation/edit-assign/{id}
  EDIT_ASSIGN_CANDIDATES: (id: string | number) =>
    buildUpCandidateUrls(`/up/kusumc/installation/edit-assign/${encodeURIComponent(id)}`),

  // 8. Edit Reassign (fetch data) — GET /up/kusumc/installation/edit-reassign/{id}
  EDIT_REASSIGN_CANDIDATES: (id: string | number) =>
    buildUpCandidateUrls(`/up/kusumc/installation/edit-reassign/${encodeURIComponent(id)}`),

  // 9. Update Assign — POST /up/kusumc/installation/update-assign/{id}
  UPDATE_ASSIGN_CANDIDATES: (id: string | number) =>
    buildUpCandidateUrls(`/up/kusumc/installation/update-assign/${encodeURIComponent(id)}`),

  // 10. View Installation — GET /up/kusumc/installation/view-installation
  VIEW_INSTALLATION_CANDIDATES: () => buildUpCandidateUrls('/up/kusumc/installation/view-installation'),

  // 11. Verify Installation Status — POST /up/kusumc/installation/verify-installation-status
  VERIFY_INSTALLATION_STATUS_CANDIDATES: () =>
    buildUpCandidateUrls('/up/kusumc/installation/verify-installation-status'),

  // 12. View Installation Document — GET /up/kusumc/installation/view-installation-document
  VIEW_INSTALLATION_DOCUMENT_CANDIDATES: () =>
    buildUpCandidateUrls('/up/kusumc/installation/view-installation-document'),

  // 13. Verify Installation Doc Status — POST /up/kusumc/installation/verify-installation-doc-status
  VERIFY_INSTALLATION_DOC_STATUS_CANDIDATES: () =>
    buildUpCandidateUrls('/up/kusumc/installation/verify-installation-doc-status'),

  // 14. View Claim — GET /up/kusumc/installation/view-claim
  VIEW_CLAIM_CANDIDATES: () => buildUpCandidateUrls('/up/kusumc/installation/view-claim'),

  // 15. Verify Claim Status — POST /up/kusumc/installation/verify-claim-status
  VERIFY_CLAIM_STATUS_CANDIDATES: () => buildUpCandidateUrls('/up/kusumc/installation/verify-claim-status'),

  // 16. View Payment — GET /up/kusumc/installation/view-payment
  VIEW_PAYMENT_CANDIDATES: (params?: {
    from_date?: string;
    to_date?: string;
    vendor?: string | number;
    status?: string | number;
  }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.set('from_date', params.from_date);
    if (params?.to_date) q.set('to_date', params.to_date);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All') {
      q.set('vendor', String(params.vendor));
    }
    if (params?.status !== undefined && params.status !== '' && params.status !== 'All') {
      q.set('status', String(params.status));
    }
    const qs = q.toString();
    return buildUpCandidateUrls(`/up/kusumc/installation/view-payment${qs ? `?${qs}` : ''}`);
  },

  // 17. Update Payment — POST /up/update-kusum-c-installation-payment-status
  UPDATE_PAYMENT_CANDIDATES: () => [
    ...buildUpCandidateUrls('/up/update-kusum-c-installation-payment-status'),
    ...buildUpCandidateUrls('/up/kusumc/installation/update-payment-status'),
  ],

  // 18. Material Status — POST /up/kusumc/installation/material-status
  MATERIAL_STATUS_CANDIDATES: () => buildUpCandidateUrls('/up/kusumc/installation/material-status'),

  // 19. Dashboard — GET /up/kusumc/installation/dashboard
  DASHBOARD_CANDIDATES: () => buildUpCandidateUrls('/up/kusumc/installation/dashboard'),

  // 20. View Dashboard (drill-down) — GET /up/kusumc/installation/view-dashboard/{status?}
  VIEW_DASHBOARD_CANDIDATES: (status?: string) =>
    buildUpCandidateUrls(
      status
        ? `/up/kusumc/installation/view-dashboard/${encodeURIComponent(status)}`
        : '/up/kusumc/installation/view-dashboard'
    ),

  // 21. Vendor-wise — GET /up/kusumc/installation/vendorwise-data/{status}/{vendor}
  VENDORWISE_DATA_CANDIDATES: (status: string, vendor: string | number) =>
    buildUpCandidateUrls(
      `/up/kusumc/installation/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(String(vendor))}`
    ),

  // 22. District-wise — GET /up/kusumc/installation/districtwise-data/{status}/{district}
  DISTRICTWISE_DATA_CANDIDATES: (status: string, district: string) =>
    buildUpCandidateUrls(
      `/up/kusumc/installation/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`
    ),

  // 23. Phase-wise — GET /up/kusumc/installation/phasewise-data/{status}/{phase}
  PHASEWISE_DATA_CANDIDATES: (status: string, phase: string | number) =>
    buildUpCandidateUrls(
      `/up/kusumc/installation/phasewise-data/${encodeURIComponent(status)}/${encodeURIComponent(String(phase))}`
    ),
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UP RESCO INSTALLATION — SUPER ADMIN APIS (28 ENDPOINTS)
 * Controller: App\Http\Controllers\admin\up\UPRescoInstallationController
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const UP_ADMIN_RESCO_API = {
  // 1. Assign (form data) — GET /up/resco/installation/assign
  ASSIGN: `${ADMIN_BASE_URL}/up/resco/installation/assign`,
  ASSIGN_CANDIDATES: () => buildUpCandidateUrls('/up/resco/installation/assign'),

  // 2. Fetch District — GET /up/resco/installation/fetch-district?volume=...
  FETCH_DISTRICT_CANDIDATES: (volume: string | number) =>
    buildUpCandidateUrls(`/up/resco/installation/fetch-district?volume=${encodeURIComponent(String(volume))}`),

  // 3. Fetch Site — GET /up/resco/installation/fetch-site?volume=...&district=...
  FETCH_SITE_CANDIDATES: (volume: string | number, district: string) =>
    buildUpCandidateUrls(
      `/up/resco/installation/fetch-site?volume=${encodeURIComponent(String(volume))}&district=${encodeURIComponent(district)}`
    ),

  // 4. Store Assign — POST /up/resco/installation/store-assign (multipart/form-data)
  STORE_ASSIGN: `${ADMIN_BASE_URL}/up/resco/installation/store-assign`,
  STORE_ASSIGN_CANDIDATES: () => buildUpCandidateUrls('/up/resco/installation/store-assign'),

  // 5. View Assign — GET /up/resco/installation/view-assign
  VIEW_ASSIGN: `${ADMIN_BASE_URL}/up/resco/installation/view-assign`,
  VIEW_ASSIGN_CANDIDATES: () => buildUpCandidateUrls('/up/resco/installation/view-assign'),

  // 6. Approval Assign — ANY /up/resco/installation/approval-assign/{id}
  APPROVAL_ASSIGN_CANDIDATES: (id: string | number) => [
    ...buildUpCandidateUrls(`/up/resco/installation/approval-assign/${encodeURIComponent(String(id))}`),
    ...buildUpCandidateUrls(`/up/resco/installation/approvel-assign/${encodeURIComponent(String(id))}`),
  ],

  // 7. Edit Assign (fetch data) — GET /up/resco/installation/edit-assign/{id}
  EDIT_ASSIGN_CANDIDATES: (id: string | number) =>
    buildUpCandidateUrls(`/up/resco/installation/edit-assign/${encodeURIComponent(String(id))}`),

  // 8. Update Assign — POST /up/resco/installation/update-assign/{id} (multipart/form-data)
  UPDATE_ASSIGN_CANDIDATES: (id: string | number) =>
    buildUpCandidateUrls(`/up/resco/installation/update-assign/${encodeURIComponent(String(id))}`),

  // 9. View Installation — GET /up/resco/installation/view-installation
  VIEW_INSTALLATION: `${ADMIN_BASE_URL}/up/resco/installation/view-installation`,
  VIEW_INSTALLATION_CANDIDATES: () => buildUpCandidateUrls('/up/resco/installation/view-installation'),

  // 10. Verify Installation Status — POST /up/resco/installation/verify-status-installation
  VERIFY_INSTALLATION_STATUS: `${ADMIN_BASE_URL}/up/resco/installation/verify-status-installation`,
  VERIFY_INSTALLATION_STATUS_CANDIDATES: () =>
    buildUpCandidateUrls('/up/resco/installation/verify-status-installation'),

  // 11. View Doc Installation — GET /up/resco/installation/view-doc-installation
  VIEW_DOC_INSTALLATION: `${ADMIN_BASE_URL}/up/resco/installation/view-doc-installation`,
  VIEW_DOC_INSTALLATION_CANDIDATES: () => buildUpCandidateUrls('/up/resco/installation/view-doc-installation'),

  // 12. Verify Installation Doc Status — POST /up/resco/installation/verify-installation-doc-status
  VERIFY_INSTALLATION_DOC_STATUS: `${ADMIN_BASE_URL}/up/resco/installation/verify-installation-doc-status`,
  VERIFY_INSTALLATION_DOC_STATUS_CANDIDATES: () =>
    buildUpCandidateUrls('/up/resco/installation/verify-installation-doc-status'),

  // 13. View Claim — GET /up/resco/installation/view-claim
  VIEW_CLAIM: `${ADMIN_BASE_URL}/up/resco/installation/view-claim`,
  VIEW_CLAIM_CANDIDATES: () => buildUpCandidateUrls('/up/resco/installation/view-claim'),

  // 14. Verify Claim Status — ANY /up/resco/installation/verify-claim-status
  VERIFY_CLAIM_STATUS: `${ADMIN_BASE_URL}/up/resco/installation/verify-claim-status`,
  VERIFY_CLAIM_STATUS_CANDIDATES: (id?: number | string) => {
    const list = buildUpCandidateUrls('/up/resco/installation/verify-claim-status');
    if (id) {
      list.push(...buildUpCandidateUrls(`/up/resco/installation/verify-claim-status/${id}`));
    }
    list.push(...buildUpCandidateUrls('/up/resco/installation/claim-status-update'));
    if (id) {
      list.push(...buildUpCandidateUrls(`/up/resco/installation/claim-status-update/${id}`));
    }
    return Array.from(new Set(list));
  },

  // 15. View Payment — ANY /up/resco/installation/view-payment
  VIEW_PAYMENT_CANDIDATES: (params?: {
    from_date?: string;
    to_date?: string;
    vendor?: string | number;
    status?: string | number;
  }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.set('from_date', params.from_date);
    if (params?.to_date) q.set('to_date', params.to_date);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All') {
      q.set('vendor', String(params.vendor));
    }
    if (params?.status !== undefined && params.status !== '' && params.status !== 'All') {
      q.set('status', String(params.status));
    }
    const qs = q.toString();
    return buildUpCandidateUrls(`/up/resco/installation/view-payment${qs ? `?${qs}` : ''}`);
  },

  // 16. Payment Update — ANY /up/resco/installation/payment-update
  PAYMENT_UPDATE: `${ADMIN_BASE_URL}/up/resco/installation/payment-update`,
  PAYMENT_UPDATE_CANDIDATES: () => buildUpCandidateUrls('/up/resco/installation/payment-update'),

  // 17. Dashboard — ANY /up/resco/installation/dashboard
  DASHBOARD: `${ADMIN_BASE_URL}/up/resco/installation/dashboard`,
  DASHBOARD_CANDIDATES: (volume?: string | number) =>
    volume && volume !== 'all'
      ? buildUpCandidateUrls(`/up/resco/installation/dashboard?volume=${encodeURIComponent(String(volume))}`)
      : buildUpCandidateUrls('/up/resco/installation/dashboard'),

  // 18. View Dashboard (drill-down) — GET /up/resco/installation/view-dashboard/{status}/{volume?}
  VIEW_DASHBOARD_CANDIDATES: (status: string, volume?: string | number) =>
    volume && volume !== 'all'
      ? buildUpCandidateUrls(
          `/up/resco/installation/view-dashboard/${encodeURIComponent(status)}/${encodeURIComponent(String(volume))}`
        )
      : buildUpCandidateUrls(`/up/resco/installation/view-dashboard/${encodeURIComponent(status)}`),

  // 19. Vendor-wise — GET /up/resco/installation/vendor-view-dashboard/{status}/{inst_vendor}/{volume?}
  VENDOR_VIEW_DASHBOARD_CANDIDATES: (status: string, vendor: string | number, volume?: string | number) =>
    volume && volume !== 'all'
      ? buildUpCandidateUrls(
          `/up/resco/installation/vendor-view-dashboard/${encodeURIComponent(status)}/${encodeURIComponent(String(vendor))}/${encodeURIComponent(String(volume))}`
        )
      : buildUpCandidateUrls(
          `/up/resco/installation/vendor-view-dashboard/${encodeURIComponent(status)}/${encodeURIComponent(String(vendor))}`
        ),

  // 20. District-wise — GET /up/resco/installation/district-view-dashboard/{status}/{district}/{volume?}
  DISTRICT_VIEW_DASHBOARD_CANDIDATES: (status: string, district: string, volume?: string | number) =>
    volume && volume !== 'all'
      ? buildUpCandidateUrls(
          `/up/resco/installation/district-view-dashboard/${encodeURIComponent(status)}/${encodeURIComponent(district)}/${encodeURIComponent(String(volume))}`
        )
      : buildUpCandidateUrls(
          `/up/resco/installation/district-view-dashboard/${encodeURIComponent(status)}/${encodeURIComponent(district)}`
        ),

  // 21. View Panel — GET /up/resco/installation/view-panel/{id}
  VIEW_PANEL_CANDIDATES: (id: string | number) =>
    buildUpCandidateUrls(`/up/resco/installation/view-panel/${encodeURIComponent(String(id))}`),

  // 22. View Create Bill — GET /up/resco/installation/view-create-bill
  VIEW_CREATE_BILL: `${ADMIN_BASE_URL}/up/resco/installation/view-create-bill`,
  VIEW_CREATE_BILL_CANDIDATES: () => buildUpCandidateUrls('/up/resco/installation/view-create-bill'),

  // 23. Create Bill Approval (fetch) — GET /up/resco/installation/create-bill-approval/{id}
  CREATE_BILL_APPROVAL_CANDIDATES: (id: string | number) =>
    buildUpCandidateUrls(`/up/resco/installation/create-bill-approval/${encodeURIComponent(String(id))}`),

  // 24. Bill Verify Status — POST /up/resco/installation/bill-verify-status/{id}
  BILL_VERIFY_STATUS_CANDIDATES: (id: string | number) =>
    buildUpCandidateUrls(`/up/resco/installation/bill-verify-status/${encodeURIComponent(String(id))}`),

  // 25. View Assign Vendor (vendor panel) — GET /up/resco/installation/view-assign-vendor
  VIEW_ASSIGN_VENDOR: `${ADMIN_BASE_URL}/up/resco/installation/view-assign-vendor`,
  VIEW_ASSIGN_VENDOR_CANDIDATES: () => buildUpCandidateUrls('/up/resco/installation/view-assign-vendor'),

  // 26. Fetch Site Detail — GET /up/resco/installation/fetch-site-detail?srt_id=...
  FETCH_SITE_DETAIL_CANDIDATES: (srtId: string | number) =>
    buildUpCandidateUrls(`/up/resco/installation/fetch-site-detail?srt_id=${encodeURIComponent(String(srtId))}`),

  // 27. Install Store (installation submit) — POST /up/resco/installation/install-store (multipart/form-data)
  INSTALL_STORE: `${ADMIN_BASE_URL}/up/resco/installation/install-store`,
  INSTALL_STORE_CANDIDATES: () => buildUpCandidateUrls('/up/resco/installation/install-store'),

  // 28. Update View Site Name — POST /up/resco/installation/update-view-site-name/{id}
  UPDATE_VIEW_SITE_NAME_CANDIDATES: (id: string | number) =>
    buildUpCandidateUrls(`/up/resco/installation/update-view-site-name/${encodeURIComponent(String(id))}`),
};

/**
 * Build candidate URLs for UP Survey controller routes.
 * Supports /api/admin/up/resco/survey/..., /api/up/resco/survey/..., /admin/up/resco/survey/..., and /up/resco/survey/...
 */
export function buildUpSurveyCandidateUrls(rawPath: string): string[] {
  let path = (rawPath || '').trim();
  let pathname = path;
  let search = '';
  const qIndex = path.indexOf('?');
  if (qIndex !== -1) {
    pathname = path.slice(0, qIndex);
    search = path.slice(qIndex);
  }

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
  return [
    `${ADMIN_BASE_URL}${routePath}`,
    `${API_ROOT}${routePath}`,
    `${RAW_ADMIN_URL}${routePath}`,
    `${ROOT_URL}${routePath}`,
  ];
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UP RESCO SURVEY — SUPER ADMIN APIS (17 ENDPOINTS)
 * Controller: App\Http\Controllers\admin\up\UpRescoSurveyController
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const UP_ADMIN_RESCO_SURVEY_API = {
  // 1. Survey Assign (form data) — GET /up/resco/survey/assign
  ASSIGN: `${ADMIN_BASE_URL}/up/resco/survey/assign`,
  ASSIGN_CANDIDATES: () => buildUpSurveyCandidateUrls('/up/resco/survey/assign'),

  // 2. Fetch District — GET /up/resco/survey/fetch-district?volume=...
  FETCH_DISTRICT_CANDIDATES: (volume: string | number) =>
    buildUpSurveyCandidateUrls(`/up/resco/survey/fetch-district?volume=${encodeURIComponent(String(volume))}`),

  // 3. Fetch Site — GET /up/resco/survey/fetch-site?volume=...&district=...
  FETCH_SITE_CANDIDATES: (volume: string | number, district: string) =>
    buildUpSurveyCandidateUrls(
      `/up/resco/survey/fetch-site?volume=${encodeURIComponent(String(volume))}&district=${encodeURIComponent(district)}`
    ),

  // 4. Store Assign Survey — POST /up/resco/survey/store-assign-survey (multipart/form-data)
  STORE_ASSIGN_SURVEY: `${ADMIN_BASE_URL}/up/resco/survey/store-assign-survey`,
  STORE_ASSIGN_SURVEY_CANDIDATES: () => buildUpSurveyCandidateUrls('/up/resco/survey/store-assign-survey'),

  // 5. View Assign Survey — GET /up/resco/survey/view-assign-survey
  VIEW_ASSIGN_SURVEY: `${ADMIN_BASE_URL}/up/resco/survey/view-assign-survey`,
  VIEW_ASSIGN_SURVEY_CANDIDATES: () => buildUpSurveyCandidateUrls('/up/resco/survey/view-assign-survey'),

  // 6. View Install Survey (verification list) — GET /up/resco/survey/view-install-survey
  VIEW_INSTALL_SURVEY: `${ADMIN_BASE_URL}/up/resco/survey/view-install-survey`,
  VIEW_INSTALL_SURVEY_CANDIDATES: () => buildUpSurveyCandidateUrls('/up/resco/survey/view-install-survey'),

  // 7. Verify Survey Status — ANY /up/resco/survey/verify-survey-status
  VERIFY_SURVEY_STATUS: `${ADMIN_BASE_URL}/up/resco/survey/verify-survey-status`,
  VERIFY_SURVEY_STATUS_CANDIDATES: (params?: { id: number | string; status: number }) => {
    if (params) {
      return buildUpSurveyCandidateUrls(
        `/up/resco/survey/verify-survey-status?id=${encodeURIComponent(String(params.id))}&status=${encodeURIComponent(String(params.status))}`
      );
    }
    return buildUpSurveyCandidateUrls('/up/resco/survey/verify-survey-status');
  },

  // 8. Material Dispatch Status — POST /up/resco/survey/material-dispatch-status (multipart/form-data)
  MATERIAL_DISPATCH_STATUS: `${ADMIN_BASE_URL}/up/resco/survey/material-dispatch-status`,
  MATERIAL_DISPATCH_STATUS_CANDIDATES: () => buildUpSurveyCandidateUrls('/up/resco/survey/material-dispatch-status'),

  // 9. BOS Status — POST /up/resco/survey/bos-status
  BOS_STATUS: `${ADMIN_BASE_URL}/up/resco/survey/bos-status`,
  BOS_STATUS_CANDIDATES: () => buildUpSurveyCandidateUrls('/up/resco/survey/bos-status'),

  // 10. Survey Dashboard — GET /up/resco/survey/dashboard
  DASHBOARD: `${ADMIN_BASE_URL}/up/resco/survey/dashboard`,
  DASHBOARD_CANDIDATES: () => buildUpSurveyCandidateUrls('/up/resco/survey/dashboard'),

  // 11. View Dashboard (drill-down) — GET /up/resco/survey/view-dashboard/{status?}
  VIEW_DASHBOARD_CANDIDATES: (status?: string) =>
    status
      ? buildUpSurveyCandidateUrls(`/up/resco/survey/view-dashboard/${encodeURIComponent(status)}`)
      : buildUpSurveyCandidateUrls('/up/resco/survey/view-dashboard'),

  // 12. Vendor-wise — GET /up/resco/survey/vendor-wise/{status}/{vendor}
  VENDOR_WISE_CANDIDATES: (status: string, vendor: string | number) =>
    buildUpSurveyCandidateUrls(`/up/resco/survey/vendor-wise/${encodeURIComponent(status)}/${encodeURIComponent(String(vendor))}`),

  // 13. District-wise — GET /up/resco/survey/district-wise/{status}/{district}
  DISTRICT_WISE_CANDIDATES: (status: string, district: string) =>
    buildUpSurveyCandidateUrls(`/up/resco/survey/district-wise/${encodeURIComponent(status)}/${encodeURIComponent(district)}`),

  // 14. Survey Assign Vendor (vendor panel) — GET /up/resco/survey/assign-vendor
  ASSIGN_VENDOR: `${ADMIN_BASE_URL}/up/resco/survey/assign-vendor`,
  ASSIGN_VENDOR_CANDIDATES: () => buildUpSurveyCandidateUrls('/up/resco/survey/assign-vendor'),

  // 15. Fetch Site Detail — GET /up/resco/survey/fetch-site-detail?srt_id=...
  FETCH_SITE_DETAIL_CANDIDATES: (srtId: string | number) =>
    buildUpSurveyCandidateUrls(`/up/resco/survey/fetch-site-detail?srt_id=${encodeURIComponent(String(srtId))}`),

  // 16. Store (survey submit) — POST /up/resco/survey/store (multipart/form-data)
  STORE: `${ADMIN_BASE_URL}/up/resco/survey/store`,
  STORE_CANDIDATES: () => buildUpSurveyCandidateUrls('/up/resco/survey/store'),

  // 17. Update Site Name — POST /up/resco/survey/update-site-name/{id}
  UPDATE_SITE_NAME_CANDIDATES: (id: string | number) =>
    buildUpSurveyCandidateUrls(`/up/resco/survey/update-site-name/${encodeURIComponent(String(id))}`),
};

export default UP_VENDOR_API;
