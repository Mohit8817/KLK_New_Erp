import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
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
  PAYMENT_VIEW: (params?: { from_date?: string; to_date?: string; vendor?: string | number; status?: string | number }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All') q.append('vendor', String(params.vendor));
    if (params?.status !== undefined && params.status !== '' && params.status !== 'All') q.append('status', String(params.status));
    const qs = q.toString();
    return `${BASE_URL}/karnataka/swp/installation/payment-view${qs ? `?${qs}` : ''}`;
  },
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
  SWP_DASHBOARD: `${API_ROOT}/v/karnataka/swp/dashboard`,
  SWP_VIEW_ASSIGNED: `${API_ROOT}/v/karnataka/swp/installation-request`,
  SWP_VIEW_INSTALLED: `${API_ROOT}/v/karnataka/swp/view-installation`,
  SWP_VERIFY_PAYMENT: `${API_ROOT}/v/karnataka/swp/view-payment`,
};

export default KARNATAKA_VENDOR_API;
