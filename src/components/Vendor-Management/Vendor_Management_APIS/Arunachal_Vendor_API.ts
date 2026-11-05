import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const BASE_URL = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;

export const ARUNACHAL_VENDOR_API = {
  SHL_DASHBOARD: `${BASE_URL}/v/arunachal/shl/dashboard`,
  SHL_VIEW_ASSIGNED: `${BASE_URL}/v/arunachal/shl/installation-request`,
  SHL_VIEW_INSTALLED: `${BASE_URL}/v/arunachal/shl/view-installation`,
};

export default ARUNACHAL_VENDOR_API;
