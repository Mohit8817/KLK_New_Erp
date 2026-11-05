import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const BASE_URL = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;

export const KARNATAKA_VENDOR_API = {
  SWP_DASHBOARD: `${BASE_URL}/v/karnataka/swp/dashboard`,
  SWP_VIEW_ASSIGNED: `${BASE_URL}/v/karnataka/swp/installation-request`,
  SWP_VIEW_INSTALLED: `${BASE_URL}/v/karnataka/swp/view-installation`,
  SWP_VERIFY_PAYMENT: `${BASE_URL}/v/karnataka/swp/view-payment`,
};

export default KARNATAKA_VENDOR_API;
