import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const BASE_URL = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;

export const GOA_VENDOR_API = {
  // SRT Installation
  SRT_DASHBOARD: `${BASE_URL}/v/goa/vendor-srt-installation-dashboard`,
  SRT_VIEW_ASSIGNED: `${BASE_URL}/v/goa/srt/viewassignsite`,
  SRT_VIEW_INSTALLED: `${BASE_URL}/v/goa/srt/allassignsite`,
  SRT_VERIFY_CLAIM: `${BASE_URL}/v/goa/srt/paymentsrtVendor`,

  // Survey & AMC
  SURVEY_VIEW: `${BASE_URL}/v/goa/view-survey`,
  AMC_VIEW: `${BASE_URL}/v/goa-view-srt-amc`,
};

export default GOA_VENDOR_API;
