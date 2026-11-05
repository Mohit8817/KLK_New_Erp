import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const BASE_URL = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;

export const BIHAR_VENDOR_API = {
  // SSL Installation
  SSL_DASHBOARD: `${BASE_URL}/v/ssl/installation-dashboard`,
  SSL_VIEW_ASSIGNED: `${BASE_URL}/v/ssl/view-assigned-ssl-site`,
  SSL_ASSIGN_STORE: `${BASE_URL}/bihar/ssl/assign-installation`,
  SSL_VIEW_INSTALLED: `${BASE_URL}/v/ssl/view-ssl-complete-site`,
  SSL_VERIFY_CLAIM: `${BASE_URL}/v/ssl/view-claim-request-deatils`,

  // SRT Installation
  SRT_DASHBOARD: `${BASE_URL}/v/bihar/vendor-srt-installation-dashboard`,
  SRT_ASSIGN_SITES: `${BASE_URL}/v/srt/viewassignsite`,
  SRT_VIEW_INSTALLED: `${BASE_URL}/v/srt/allassignsite`,
  SRT_VERIFY_CLAIM: `${BASE_URL}/v/srt/paymentsrtVendor`,

  // ULA Installation
  ULA_DASHBOARD: `${BASE_URL}/v/bihar/ula-installation-dashboard`,
  ULA_VIEW_ASSIGNED: `${BASE_URL}/v/bihar/ula-installation-view-assign-site`,
  ULA_VIEW_INSTALLED: `${BASE_URL}/v/bihar/ula-installation-view-site`,
  ULA_VERIFY_CLAIM: `${BASE_URL}/v/bihar/ula-installation-claim`,

  // Surveys
  SRT_SURVEY_VIEW: `${BASE_URL}/v/bihar/view-srt200mw-survey`,
  ULA_SURVEY_VIEW: `${BASE_URL}/v/bihar/ula-surveys/view`,
};

export default BIHAR_VENDOR_API;
