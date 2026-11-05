import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const BASE_URL = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;
export const ROOT_URL = RAW_BASE.replace(/\/api\/?$/, '');

/**
 * Super Admin Master Vendor Management APIs
 */
export const VENDOR_MANAGEMENT_COMMON_API = {
  // Vendor Master & Directory
  LIST_VENDORS: `${BASE_URL}/admin/vendors`,
  CREATE_VENDOR: `${BASE_URL}/admin/vendors/store`,
  FETCH_VENDOR_PROFILE: (id: string | number) => `${BASE_URL}/admin/vendors/${encodeURIComponent(id)}`,
  UPDATE_VENDOR_STATUS: `${BASE_URL}/admin/vendors/update-status`,
  RESET_VENDOR_PASSWORD: `${BASE_URL}/admin/vendors/reset-password`,

  // Allotment & Work Orders
  ASSIGN_WORK_ORDER: `${BASE_URL}/admin/vendor-assign-work-order`,
  ALL_ALLOTTED_SITES: `${BASE_URL}/admin/vendor-allotted-sites`,
  REVOKE_WORK_ORDER: `${BASE_URL}/admin/vendor-revoke-work-order`,

  // Daily Reports Tracking
  ALL_DAILY_REPORTS: `${BASE_URL}/vendor-daily-view-progress`,
  VIEW_REPORT_DETAIL: (id: string | number) => `${BASE_URL}/vendor-view-progress?id=${encodeURIComponent(id)}`,

  // Claims & Payments
  ALL_CLAIMS: `${BASE_URL}/admin/vendor-claims`,
  APPROVE_CLAIM: `${BASE_URL}/admin/vendor-approve-claim`,
  RECORD_PAYMENT: `${BASE_URL}/admin/vendor-record-payment`,

  // Vendor Complaints
  ALL_COMPLAINTS: `${BASE_URL}/vendor-view-complaint`,
  UPDATE_COMPLAINT_STATUS: `${BASE_URL}/assignvendor-save-complaint`,

  // Sub-Users / Field Technicians
  ALL_VENDOR_USERS: `${BASE_URL}/vendor-view-user`,
  SAVE_VENDOR_USER: `${BASE_URL}/vendor-save-user`,
};

export default VENDOR_MANAGEMENT_COMMON_API;
