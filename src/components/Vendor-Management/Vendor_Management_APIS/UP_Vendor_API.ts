import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const BASE_URL = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;

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

export default UP_VENDOR_API;
