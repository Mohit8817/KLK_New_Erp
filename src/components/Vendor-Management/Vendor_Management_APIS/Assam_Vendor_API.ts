import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
const API_ROOT = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;
export const BASE_URL = `${API_ROOT}/admin`;
export const ROOT_URL = RAW_BASE.replace(/\/api\/?$/, '');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ASSAM SWP INSTALLATION - SUPER ADMIN PORTAL APIS
 * Controller: AssamSwpInstallationController
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const ASSAM_ADMIN_SWP_API = {
  // ── A. Assign Installation ──
  // 1. Assign Form Data (Vendors with assam_swp permission & Volumes)
  ASSIGN_FORM_DATA: `${BASE_URL}/assam/swp/installation/assign`,

  // 2. Fetch Districts for given volume
  FETCH_DISTRICTS: (volume: string | number) =>
    `${BASE_URL}/assam/swp/installation/fetch-district?volume=${encodeURIComponent(String(volume).trim())}`,

  // 3. Fetch Farmers (Unassigned sites: inst_status=0, inst_accept=0)
  FETCH_FARMERS: (district: string) =>
    `${BASE_URL}/assam/swp/installation/fetch-farmer?district=${encodeURIComponent(String(district).trim())}`,

  // 4. Store Assign (multipart/form-data: vendor, volume, district, site[], deadline_date, file, remarks)
  STORE_ASSIGN: `${BASE_URL}/assam/swp/installation/store-assign`,

  // 5. View Assign (All assigns with vendor relation & site details + summary counts)
  VIEW_ASSIGN: `${BASE_URL}/assam/swp/installation/view-assign`,

  // 6. Approve Assign (Status -> 1 so vendor sees it)
  APPROVE_ASSIGN: (id: string | number) =>
    `${BASE_URL}/assam/swp/installation/approval-assign/${encodeURIComponent(id)}`,
  APPROVE_ASSIGN_LEGACY: (id: string | number) =>
    `${BASE_URL}/assam/swp/installation/approvel-assign/${encodeURIComponent(id)}`,

  // 7. Edit Assign (Load existing assign, vendors, volumes, districts, sites)
  EDIT_ASSIGN: (id: string | number) =>
    `${BASE_URL}/assam/swp/installation/edit-assign/${encodeURIComponent(id)}`,

  // 8. Update Assign (PUT / POST with _method=PUT)
  UPDATE_ASSIGN: (id: string | number) =>
    `${BASE_URL}/assam/swp/installation/update-assign/${encodeURIComponent(id)}`,

  // ── B. Installation Verify ──
  // 9. View Installation (verify_pending & verify_complete lists + summary detail)
  VIEW_INSTALLATION: `${BASE_URL}/assam/swp/installation/view-installation`,

  // 10. Verify Installation Status (id, status: 0=Pending, 1=Approved, 2=Rejected, inst_verify_remarks)
  VERIFY_INSTALLATION_STATUS: `${BASE_URL}/assam/swp/installation/verify-installation-status`,

  // 11. View Installation Document (verification=pending & verified lists + summary detail)
  VIEW_INSTALLATION_DOCUMENT: `${BASE_URL}/assam/swp/installation/view-installation-document`,

  // 12. Verify Installation Document Status (id, status: 1=Pending, 2=Approved, 3=Rejected, remarks)
  VERIFY_INSTALLATION_DOC_STATUS: `${BASE_URL}/assam/swp/installation/verify-installation-doc-status`,

  // ── C. Claim & Payment ──
  // 13. View Claims (All vendor claims)
  VIEW_CLAIM: `${BASE_URL}/assam/swp/installation/view-claim`,

  // 14. Approve Claim (id, status: 1=Raised, 2=Approved, 3=Rejected, remarks)
  APPROVE_CLAIM: `${BASE_URL}/assam/swp/installation/approval-claim`,
  APPROVE_CLAIM_LEGACY: `${BASE_URL}/assam/swp/installation/approvel-claim`,

  // 15. Payment View (Approved claims with filters: from_date, to_date, vendor, status)
  PAYMENT_VIEW: (params?: { from_date?: string; to_date?: string; vendor?: string | number; status?: string | number }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All') q.append('vendor', String(params.vendor));
    if (params?.status !== undefined && params.status !== '' && params.status !== 'All') q.append('status', String(params.status));
    const qs = q.toString();
    return `${BASE_URL}/assam/swp/installation/payment-view${qs ? `?${qs}` : ''}`;
  },

  // 16. Payment Update (id, amount, date, remarks)
  PAYMENT_UPDATE: `${BASE_URL}/assam/swp/installation/payment-update`,

  // ── D. Dashboard & Drilldowns ──
  // 17. Dashboard (swp metrics, district_install, districtwise, vendorwises, district_installation_month)
  DASHBOARD: `${BASE_URL}/assam/swp/installation/dashboard`,

  // 18. Dashboard View Data by status
  DASHBOARD_VIEW_DATA: (status: string) =>
    `${BASE_URL}/assam/swp/installation/dashboard-view-data/${encodeURIComponent(String(status).toLowerCase().trim())}`,

  // 19. Vendor-wise View Data
  VENDOR_WISE_VIEW_DATA: (status: string, vendor: string | number) =>
    `${BASE_URL}/assam/swp/installation/vendor-wise-view-data/${encodeURIComponent(String(status).toLowerCase().trim())}/${encodeURIComponent(String(vendor).trim())}`,

  // 20. District-wise View Data
  DISTRICT_WISE_VIEW_DATA: (status: string, district: string) =>
    `${BASE_URL}/assam/swp/installation/district-wise-view-data/${encodeURIComponent(String(status).toLowerCase().trim())}/${encodeURIComponent(String(district).trim())}`,
};

export const ASSAM_VENDOR_SWP_API = ASSAM_ADMIN_SWP_API;

export default ASSAM_ADMIN_SWP_API;
