import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const BASE_URL = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;

export const JAMMU_VENDOR_API = {
  // Resco Installation
  RESCO_DASHBOARD: `${BASE_URL}/v/jammu/installation/resco/dashboard`,
  RESCO_VIEW_ASSIGNED: `${BASE_URL}/v/jammu/installation/resco/assigned-sites`,
  RESCO_VIEW_INSTALLED: `${BASE_URL}/v/jammu/installation/resco/installation-details`,
  RESCO_VERIFY_CLAIM: `${BASE_URL}/v/jammu/installation/resco/claim-request`,

  // SRT 70MW Installation
  SRT70_DASHBOARD: `${BASE_URL}/v/jammu/installation/srt-70mw/dashboard`,
  SRT70_VIEW_ASSIGNED: `${BASE_URL}/v/jammu/installation/srt-70mw/assign-site`,
  SRT70_VIEW_INSTALLED: `${BASE_URL}/v/jammu/installation/srt-70mw/installation-details`,
  SRT70_VERIFY_CLAIM: `${BASE_URL}/v/jammu/installation/srt-70mw/claim-request`,

  // SSL Installation
  SSL_DASHBOARD: `${BASE_URL}/v/jammu/installation/ssl/dashboard`,
  SSL_VIEW_ASSIGNED: `${BASE_URL}/v/jammu/installation/ssl/assign-lights`,
  SSL_VIEW_INSTALLED: `${BASE_URL}/v/jammu/installation/ssl/installation-details`,
  SSL_VERIFY_CLAIM: `${BASE_URL}/v/jammu/installation/ssl/claim-request`,

  // SWP Installation
  SWP_DASHBOARD: `${BASE_URL}/v/jammu/installation/swp/dashboard`,
  SWP_VIEW_ASSIGNED: `${BASE_URL}/v/jammu/installation/swp/installation-request`,
  SWP_VIEW_INSTALLED: `${BASE_URL}/v/jammu/installation/swp/view-installation`,
  SWP_VERIFY_PAYMENT: `${BASE_URL}/v/jammu/installation/swp/view-payment`,
};

export default JAMMU_VENDOR_API;
