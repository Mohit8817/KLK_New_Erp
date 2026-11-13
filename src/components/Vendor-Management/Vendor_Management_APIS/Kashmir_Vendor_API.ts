import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
const API_ROOT = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;
export const BASE_URL = `${API_ROOT}/admin`;
export const ROOT_URL = RAW_BASE.replace(/\/api\/?$/, '');

export const KASHMIR_ADMIN_SRT_API = {
  // ── Assignment APIs ──
  // 1. GET /assign
  ASSIGN_FORM_DATA: `${BASE_URL}/kashmir/srt70mw/installation/assign`,
  ASSIGN_FORM_DATA_ALT: `${API_ROOT}/kashmir/srt70mw/installation/assign`,
  ASSIGN_FORM_DATA_DIRECT: `${RAW_BASE}/kashmir/srt70mw/installation/assign`,

  // 2. GET /fetch-district
  FETCH_DISTRICTS: `${BASE_URL}/kashmir/srt70mw/installation/fetch-district`,
  FETCH_DISTRICTS_ALT: `${API_ROOT}/kashmir/srt70mw/installation/fetch-district`,
  FETCH_DISTRICTS_DIRECT: `${RAW_BASE}/kashmir/srt70mw/installation/fetch-district`,

  // 3. GET /fetch-site?district=...
  FETCH_SITES: (district: string) =>
    `${BASE_URL}/kashmir/srt70mw/installation/fetch-site?district=${encodeURIComponent(String(district).trim())}`,
  FETCH_SITES_ALT: (district: string) =>
    `${API_ROOT}/kashmir/srt70mw/installation/fetch-site?district=${encodeURIComponent(String(district).trim())}`,
  FETCH_SITES_DIRECT: (district: string) =>
    `${RAW_BASE}/kashmir/srt70mw/installation/fetch-site?district=${encodeURIComponent(String(district).trim())}`,

  // 4. POST /store-assign
  STORE_ASSIGN: `${BASE_URL}/kashmir/srt70mw/installation/store-assign`,
  STORE_ASSIGN_ALT: `${API_ROOT}/kashmir/srt70mw/installation/store-assign`,
  STORE_ASSIGN_DIRECT: `${RAW_BASE}/kashmir/srt70mw/installation/store-assign`,

  // 5. GET /edit-assign/{id}
  EDIT_ASSIGN: (id: string | number) =>
    `${BASE_URL}/kashmir/srt70mw/installation/edit-assign/${encodeURIComponent(id)}`,
  EDIT_ASSIGN_ALT: (id: string | number) =>
    `${API_ROOT}/kashmir/srt70mw/installation/edit-assign/${encodeURIComponent(id)}`,
  EDIT_ASSIGN_DIRECT: (id: string | number) =>
    `${RAW_BASE}/kashmir/srt70mw/installation/edit-assign/${encodeURIComponent(id)}`,

  // 6. POST /update-assign
  UPDATE_ASSIGN: `${BASE_URL}/kashmir/srt70mw/installation/update-assign`,
  UPDATE_ASSIGN_ALT: `${API_ROOT}/kashmir/srt70mw/installation/update-assign`,
  UPDATE_ASSIGN_DIRECT: `${RAW_BASE}/kashmir/srt70mw/installation/update-assign`,

  // ── View and approve assignment ──
  // 7. GET /view-assign
  VIEW_ASSIGN: `${BASE_URL}/kashmir/srt70mw/installation/view-assign`,
  VIEW_ASSIGN_ALT: `${API_ROOT}/kashmir/srt70mw/installation/view-assign`,
  VIEW_ASSIGN_DIRECT: `${RAW_BASE}/kashmir/srt70mw/installation/view-assign`,

  // 8. GET /view-installation-vendor-wise/{id}  (Prefix /kashmir/srt70mw/ without installation)
  VIEW_INSTALLATION_VENDOR_WISE: (id: string | number) =>
    `${BASE_URL}/kashmir/srt70mw/view-installation-vendor-wise/${encodeURIComponent(id)}`,
  VIEW_INSTALLATION_VENDOR_WISE_ALT: (id: string | number) =>
    `${API_ROOT}/kashmir/srt70mw/view-installation-vendor-wise/${encodeURIComponent(id)}`,
  VIEW_INSTALLATION_VENDOR_WISE_DIRECT: (id: string | number) =>
    `${RAW_BASE}/kashmir/srt70mw/view-installation-vendor-wise/${encodeURIComponent(id)}`,

  // 9. ANY /approval-assign/{id}
  APPROVE_ASSIGN: (id: string | number) =>
    `${BASE_URL}/kashmir/srt70mw/installation/approval-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_ALT: (id: string | number) =>
    `${API_ROOT}/kashmir/srt70mw/installation/approval-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_DIRECT: (id: string | number) =>
    `${RAW_BASE}/kashmir/srt70mw/installation/approval-assign/${encodeURIComponent(id)}`,

  // ── Installation and verification ──
  // 10. GET /view-installation
  VIEW_INSTALLATION: `${BASE_URL}/kashmir/srt70mw/installation/view-installation`,
  VIEW_INSTALLATION_ALT: `${API_ROOT}/kashmir/srt70mw/installation/view-installation`,
  VIEW_INSTALLATION_DIRECT: `${RAW_BASE}/kashmir/srt70mw/installation/view-installation`,

  // 11. ANY /verify-installation-status
  VERIFY_INSTALLATION_STATUS: `${BASE_URL}/kashmir/srt70mw/installation/verify-installation-status`,
  VERIFY_INSTALLATION_STATUS_ALT: `${API_ROOT}/kashmir/srt70mw/installation/verify-installation-status`,
  VERIFY_INSTALLATION_STATUS_DIRECT: `${RAW_BASE}/kashmir/srt70mw/installation/verify-installation-status`,

  // 12. ANY /verify-doc-status
  VERIFY_DOC_STATUS: `${BASE_URL}/kashmir/srt70mw/installation/verify-doc-status`,
  VERIFY_DOC_STATUS_ALT: `${API_ROOT}/kashmir/srt70mw/installation/verify-doc-status`,
  VERIFY_DOC_STATUS_DIRECT: `${RAW_BASE}/kashmir/srt70mw/installation/verify-doc-status`,

  // ── Claims and 80/20 payments ──
  // 13. GET /view-claim
  VIEW_CLAIM: `${BASE_URL}/kashmir/srt70mw/installation/view-claim`,
  VIEW_CLAIM_ALT: `${API_ROOT}/kashmir/srt70mw/installation/view-claim`,
  VIEW_CLAIM_DIRECT: `${RAW_BASE}/kashmir/srt70mw/installation/view-claim`,

  // 14. ANY /claim-status-update
  CLAIM_STATUS_UPDATE: `${BASE_URL}/kashmir/srt70mw/installation/claim-status-update`,
  CLAIM_STATUS_UPDATE_ALT: `${API_ROOT}/kashmir/srt70mw/installation/claim-status-update`,
  CLAIM_STATUS_UPDATE_DIRECT: `${RAW_BASE}/kashmir/srt70mw/installation/claim-status-update`,

  // 15. ANY /view-payment
  VIEW_PAYMENT: (params?: { from_date?: string; to_date?: string; vendor?: string | number }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All') q.append('vendor', String(params.vendor));
    const qs = q.toString();
    return `${BASE_URL}/kashmir/srt70mw/installation/view-payment${qs ? `?${qs}` : ''}`;
  },
  VIEW_PAYMENT_ALT: (params?: { from_date?: string; to_date?: string; vendor?: string | number }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All') q.append('vendor', String(params.vendor));
    const qs = q.toString();
    return `${API_ROOT}/kashmir/srt70mw/installation/view-payment${qs ? `?${qs}` : ''}`;
  },
  VIEW_PAYMENT_DIRECT: (params?: { from_date?: string; to_date?: string; vendor?: string | number }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All') q.append('vendor', String(params.vendor));
    const qs = q.toString();
    return `${RAW_BASE}/kashmir/srt70mw/installation/view-payment${qs ? `?${qs}` : ''}`;
  },

  // 16. ANY /update-payment-status
  UPDATE_PAYMENT_STATUS: `${BASE_URL}/kashmir/srt70mw/installation/update-payment-status`,
  UPDATE_PAYMENT_STATUS_ALT: `${API_ROOT}/kashmir/srt70mw/installation/update-payment-status`,
  UPDATE_PAYMENT_STATUS_DIRECT: `${RAW_BASE}/kashmir/srt70mw/installation/update-payment-status`,

  // ── Dashboard APIs ──
  // 17. GET /dashboard
  DASHBOARD: `${BASE_URL}/kashmir/srt70mw/installation/dashboard`,
  DASHBOARD_ALT: `${API_ROOT}/kashmir/srt70mw/installation/dashboard`,
  DASHBOARD_DIRECT: `${RAW_BASE}/kashmir/srt70mw/installation/dashboard`,

  // 18. GET /view-dashboard/{status?}
  VIEW_DASHBOARD: (status?: string) =>
    status
      ? `${BASE_URL}/kashmir/srt70mw/installation/view-dashboard/${encodeURIComponent(status)}`
      : `${BASE_URL}/kashmir/srt70mw/installation/view-dashboard`,
  VIEW_DASHBOARD_ALT: (status?: string) =>
    status
      ? `${API_ROOT}/kashmir/srt70mw/installation/view-dashboard/${encodeURIComponent(status)}`
      : `${API_ROOT}/kashmir/srt70mw/installation/view-dashboard`,
  VIEW_DASHBOARD_DIRECT: (status?: string) =>
    status
      ? `${RAW_BASE}/kashmir/srt70mw/installation/view-dashboard/${encodeURIComponent(status)}`
      : `${RAW_BASE}/kashmir/srt70mw/installation/view-dashboard`,

  // 19. GET /vendorwise-data/{status}/{vendor}
  VENDOR_WISE_DATA: (status: string, vendor: string | number) =>
    `${BASE_URL}/kashmir/srt70mw/installation/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`,
  VENDOR_WISE_DATA_ALT: (status: string, vendor: string | number) =>
    `${API_ROOT}/kashmir/srt70mw/installation/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`,
  VENDOR_WISE_DATA_DIRECT: (status: string, vendor: string | number) =>
    `${RAW_BASE}/kashmir/srt70mw/installation/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`,

  // 20. GET /districtwise-data/{status}/{district}
  DISTRICT_WISE_DATA: (status: string, district: string) =>
    `${BASE_URL}/kashmir/srt70mw/installation/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
  DISTRICT_WISE_DATA_ALT: (status: string, district: string) =>
    `${API_ROOT}/kashmir/srt70mw/installation/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
  DISTRICT_WISE_DATA_DIRECT: (status: string, district: string) =>
    `${RAW_BASE}/kashmir/srt70mw/installation/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,

  // ── Expenses APIs (KashmirInstalltionExpensesController) ──
  // 21. GET /view-expenses
  VIEW_EXPENSES: `${BASE_URL}/kashmir/srt70mw/installation/view-expenses`,
  VIEW_EXPENSES_ALT: `${API_ROOT}/kashmir/srt70mw/installation/view-expenses`,
  VIEW_EXPENSES_DIRECT: `${RAW_BASE}/kashmir/srt70mw/installation/view-expenses`,

  // 22. POST /verify-expenses-claim-status
  VERIFY_EXPENSES_CLAIM_STATUS: `${BASE_URL}/kashmir/srt70mw/installation/verify-expenses-claim-status`,
  VERIFY_EXPENSES_CLAIM_STATUS_ALT: `${API_ROOT}/kashmir/srt70mw/installation/verify-expenses-claim-status`,
  VERIFY_EXPENSES_CLAIM_STATUS_DIRECT: `${RAW_BASE}/kashmir/srt70mw/installation/verify-expenses-claim-status`,

  // 23. GET /expenses-payment-details/{id}
  EXPENSES_PAYMENT_DETAILS: (id: string | number) =>
    `${BASE_URL}/kashmir/srt70mw/installation/expenses-payment-details/${encodeURIComponent(id)}`,
  EXPENSES_PAYMENT_DETAILS_ALT: (id: string | number) =>
    `${API_ROOT}/kashmir/srt70mw/installation/expenses-payment-details/${encodeURIComponent(id)}`,
  EXPENSES_PAYMENT_DETAILS_DIRECT: (id: string | number) =>
    `${RAW_BASE}/kashmir/srt70mw/installation/expenses-payment-details/${encodeURIComponent(id)}`,

  // 24. ANY /view-expenses-payment
  VIEW_EXPENSES_PAYMENT: (params?: { from_date?: string; to_date?: string; vendor?: string | number; status?: string | number }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All') q.append('vendor', String(params.vendor));
    if (params?.status !== undefined && params.status !== '' && params.status !== 'All') q.append('status', String(params.status));
    const qs = q.toString();
    return `${BASE_URL}/kashmir/srt70mw/installation/view-expenses-payment${qs ? `?${qs}` : ''}`;
  },
  VIEW_EXPENSES_PAYMENT_ALT: (params?: { from_date?: string; to_date?: string; vendor?: string | number; status?: string | number }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All') q.append('vendor', String(params.vendor));
    if (params?.status !== undefined && params.status !== '' && params.status !== 'All') q.append('status', String(params.status));
    const qs = q.toString();
    return `${API_ROOT}/kashmir/srt70mw/installation/view-expenses-payment${qs ? `?${qs}` : ''}`;
  },
  VIEW_EXPENSES_PAYMENT_DIRECT: (params?: { from_date?: string; to_date?: string; vendor?: string | number; status?: string | number }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All') q.append('vendor', String(params.vendor));
    if (params?.status !== undefined && params.status !== '' && params.status !== 'All') q.append('status', String(params.status));
    const qs = q.toString();
    return `${RAW_BASE}/kashmir/srt70mw/installation/view-expenses-payment${qs ? `?${qs}` : ''}`;
  },

  // 25. POST /installasrttion-expenses-payment-status  (handles route without 'installation/' in middle, and both spellings)
  EXPENSES_PAYMENT_STATUS: `${BASE_URL}/kashmir/srt70mw/installasrttion-expenses-payment-status`,
  EXPENSES_PAYMENT_STATUS_ALT: `${API_ROOT}/kashmir/srt70mw/installasrttion-expenses-payment-status`,
  EXPENSES_PAYMENT_STATUS_DIRECT: `${RAW_BASE}/kashmir/srt70mw/installasrttion-expenses-payment-status`,
  EXPENSES_PAYMENT_STATUS_CORRECT: `${BASE_URL}/kashmir/srt70mw/installation-expenses-payment-status`,
  EXPENSES_PAYMENT_STATUS_CORRECT_ALT: `${API_ROOT}/kashmir/srt70mw/installation-expenses-payment-status`,
  EXPENSES_PAYMENT_STATUS_WITH_PATH: `${BASE_URL}/kashmir/srt70mw/installation/installasrttion-expenses-payment-status`,
};

export const KASHMIR_VENDOR_API = KASHMIR_ADMIN_SRT_API;
export default KASHMIR_ADMIN_SRT_API;
