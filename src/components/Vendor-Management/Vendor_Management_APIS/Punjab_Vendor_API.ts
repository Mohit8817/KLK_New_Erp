import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const BASE_URL = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;

export const PUNJAB_VENDOR_API = {
  SSL_DASHBOARD: `${BASE_URL}/v/punjab/ssl/dashboard`,
  SSL_VIEW_ASSIGNED: `${BASE_URL}/v/punjab/ssl/installation-request`,
  SSL_VIEW_INSTALLED: `${BASE_URL}/v/punjab/ssl/view-installation`,
};

export default PUNJAB_VENDOR_API;
