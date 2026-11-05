import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const BASE_URL = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;

export const KASHMIR_VENDOR_API = {
  // SRT 70MW Installation
  SRT70_DASHBOARD: `${BASE_URL}/v/kashmir/srt/70mw/installation/dashboard`,
  SRT70_VIEW_ASSIGNED: `${BASE_URL}/v/kashmir/srt/70mw/installation/assign-site`,
  SRT70_VIEW_INSTALLED: `${BASE_URL}/v/kashmir/srt/70mw/view-install-sites`,
  SRT70_VERIFY_CLAIM: `${BASE_URL}/v/kashmir/srt70mw/view-claim-request`,

  // Installation Expenses
  EXPENSES_VIEW: `${BASE_URL}/v/kashmir/srt70mw/installation-expenses`,
  EXPENSES_PAYMENT_VIEW: `${BASE_URL}/v/kashmir/srt70mw/installation-expenses-view-payment`,
};

export default KASHMIR_VENDOR_API;
