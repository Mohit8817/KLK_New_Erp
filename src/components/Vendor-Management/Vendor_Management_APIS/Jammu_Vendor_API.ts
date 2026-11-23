import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const ROOT_URL = RAW_BASE.replace(/\/api\/?$/, '');
export const API_ROOT = `${ROOT_URL}/api`;
export const BASE_URL = `${ROOT_URL}/api/admin`;
export const ADMIN_BASE_URL = `${ROOT_URL}/api/admin`;

/**
 * Build candidate URLs for a given route path or full URL
 * Strictly targets https://klkerp.com/api/admin/jammu/... with resilience
 */
export function buildCandidateUrls(pathOrUrl: string): string[] {
  let cleanPath = (pathOrUrl || '').trim();
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    try {
      const parsed = new URL(cleanPath);
      cleanPath = parsed.pathname + parsed.search;
    } catch {
      cleanPath = cleanPath.replace(/^https?:\/\/[^\/]+/, '');
    }
  }

  // Strip prefixes to extract canonical relative path
  let relativePath = cleanPath;
  let changed = true;
  while (changed) {
    changed = false;
    if (relativePath.startsWith('/api/admin/')) {
      relativePath = relativePath.slice('/api/admin'.length);
      changed = true;
    } else if (relativePath.startsWith('/admin/')) {
      relativePath = relativePath.slice('/admin'.length);
      changed = true;
    } else if (relativePath.startsWith('/api/')) {
      relativePath = relativePath.slice('/api'.length);
      changed = true;
    }
  }

  const normPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  const candidates: string[] = [];

  // 1. If it was a full URL, add the original URL directly
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    candidates.push(pathOrUrl);
    // Also add variant swapping jk/resco and jammu/resco
    if (pathOrUrl.includes('/jammu/resco/')) {
      candidates.push(pathOrUrl.replace(/\/jammu\/resco\//g, '/jk/resco/'));
    } else if (pathOrUrl.includes('/jk/resco/')) {
      candidates.push(pathOrUrl.replace(/\/jk\/resco\//g, '/jammu/resco/'));
    }
  }

  // 2. Add candidates with /jammu/ and /jk/ variants
  const pathsToTry = [normPath];
  if (normPath.startsWith('/jammu/resco/')) {
    pathsToTry.push(normPath.replace(/^\/jammu\/resco\//, '/jk/resco/'));
  } else if (normPath.startsWith('/jk/resco/')) {
    pathsToTry.push(normPath.replace(/^\/jk\/resco\//, '/jammu/resco/'));
  } else if (normPath.startsWith('/resco/')) {
    pathsToTry.push(`/jammu${normPath}`);
    pathsToTry.push(`/jk${normPath}`);
  }

  for (const p of pathsToTry) {
    candidates.push(`${ADMIN_BASE_URL}${p}`);
    candidates.push(`${API_ROOT}${p}`);
    candidates.push(`${BASE_URL}${p}`);
    candidates.push(`${ROOT_URL}${p}`);
  }

  // Capitalized 'Jammu' variant (case-sensitivity fallback for non-resco)
  if (normPath.includes('/jammu/') && !normPath.includes('/resco/')) {
    const capPath = normPath.replace(/\/jammu\//g, '/Jammu/');
    candidates.push(`${ADMIN_BASE_URL}${capPath}`);
    candidates.push(`${API_ROOT}${capPath}`);
    candidates.push(`${BASE_URL}${capPath}`);
  }

  return Array.from(new Set(candidates));
}


export const JAMMU_VENDOR_API = {
  // ═════════════════════════════════════════════════════════════
  // 1. SUPER ADMIN: Jammu SWP Installation
  // Controller: App\Http\Controllers\admin\jammu\JammuSwpInstallationController
  // ═════════════════════════════════════════════════════════════
  ADMIN_SWP_DASHBOARD: `${ADMIN_BASE_URL}/jammu/swp/installation/dashboard`,
  ADMIN_SWP_VIEW_DASHBOARD: (status: string) =>
    `${ADMIN_BASE_URL}/jammu/swp/installation/view-dashboard/${encodeURIComponent(status)}`,
  ADMIN_SWP_VENDORWISE_DATA: (status: string, vendor: string | number) =>
    `${ADMIN_BASE_URL}/jammu/swp/installation/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`,
  ADMIN_SWP_DISTRICTWISE_DATA: (status: string, district: string) =>
    `${ADMIN_BASE_URL}/jammu/swp/installation/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
  ADMIN_SWP_ASSIGN: `${ADMIN_BASE_URL}/jammu/swp/installation/assign`,
  ADMIN_SWP_FETCH_DISTRICT: (volume: number | string = '1') =>
    `${ADMIN_BASE_URL}/jammu/swp/installation/fetch-district?volume=${encodeURIComponent(volume)}`,
  ADMIN_SWP_FETCH_APPLICANTS: (district: string, volume: number | string = '1') =>
    `${ADMIN_BASE_URL}/jammu/swp/installation/fetch-applicants?district=${encodeURIComponent(district)}&volume=${encodeURIComponent(volume)}`,
  ADMIN_SWP_STORE_ASSIGN: `${ADMIN_BASE_URL}/jammu/swp/installation/store_assign`,
  ADMIN_SWP_STORE_ASSIGN_ALT: `${ADMIN_BASE_URL}/jammu/swp/installation/store-assign`,
  ADMIN_SWP_VIEW_ASSIGN: `${ADMIN_BASE_URL}/jammu/swp/installation/view-assign`,
  ADMIN_SWP_ASSIGN_APPROVE: (id: string | number) =>
    `${ADMIN_BASE_URL}/jammu/swp/installation/assign-approve/${encodeURIComponent(id)}`,
  ADMIN_SWP_EDIT_ASSIGN: (id: string | number) =>
    `${ADMIN_BASE_URL}/jammu/swp/installation/edit-assign/${encodeURIComponent(id)}`,
  ADMIN_SWP_UPDATE_ASSIGN: (id: string | number) =>
    `${ADMIN_BASE_URL}/jammu/swp/installation/update-assign/${encodeURIComponent(id)}`,
  ADMIN_SWP_VIEW_INSTALLATION: `${ADMIN_BASE_URL}/jammu/swp/installation/view-installation`,
  ADMIN_SWP_VERIFY_INSTALLATION: `${ADMIN_BASE_URL}/jammu/swp/installation/verify-installation-status`,
  ADMIN_SWP_VIEW_INSTALLATION_DOCUMENT: `${ADMIN_BASE_URL}/jammu/swp/installation/view-installation-document`,
  ADMIN_SWP_VERIFY_INSTALLATION_DOCUMENT: `${ADMIN_BASE_URL}/jammu/swp/installation/verify-installation-document`,
  ADMIN_SWP_VIEW_CLAIM: `${ADMIN_BASE_URL}/jammu/swp/installation/view-claim`,
  ADMIN_SWP_UPDATE_CLAIM_STATUS: `${ADMIN_BASE_URL}/jammu/swp/installation/update-claim-status`,
  ADMIN_SWP_VIEW_PAYMENT: (params?: { from_date?: string; to_date?: string; vendor?: string | number; status?: string | number }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All') {
      q.append('vendor', String(params.vendor));
    }
    if (params?.status !== undefined && params.status !== '' && params.status !== 'All') {
      q.append('status', String(params.status));
    }
    const qs = q.toString();
    return `${ADMIN_BASE_URL}/jammu/swp/installation/view-payment${qs ? `?${qs}` : ''}`;
  },
  ADMIN_SWP_UPDATE_PAYMENT_STATUS: `${ADMIN_BASE_URL}/jammu/swp/installation/update-payment-status`,
  ADMIN_SWP_UPDATE_PAYMENT_ALT: `${ADMIN_BASE_URL}/jammu/swp/installation/update-payment`,

  // ═════════════════════════════════════════════════════════════
  // 2. SUPER ADMIN: Jammu SRT 70MW Installation
  // Controller: App\Http\Controllers\admin\jammu\JammuSrt70mwInstallationController
  // ═════════════════════════════════════════════════════════════
  ADMIN_SRT70_DASHBOARD: `${ADMIN_BASE_URL}/jammu/srt70mw/installation/dashboard`,
  ADMIN_SRT70_VIEW_DASHBOARD: (status?: string) =>
    status
      ? `${ADMIN_BASE_URL}/jammu/srt70mw/installation/view-dashboard/${encodeURIComponent(status)}`
      : `${ADMIN_BASE_URL}/jammu/srt70mw/installation/view-dashboard`,
  ADMIN_SRT70_VENDORWISE_DATA: (status: string, vendor: string | number) =>
    `${ADMIN_BASE_URL}/jammu/srt70mw/installation/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`,
  ADMIN_SRT70_DISTRICTWISE_DATA: (status: string, district: string) =>
    `${ADMIN_BASE_URL}/jammu/srt70mw/installation/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
  ADMIN_SRT70_ASSIGN_FORM: `${ADMIN_BASE_URL}/jammu/srt70mw/installation/assign`,
  ADMIN_SRT70_FETCH_DISTRICT: (state = 'jammu') =>
    `${ADMIN_BASE_URL}/jammu/srt70mw/installation/fetch-district?state=${encodeURIComponent(state)}`,
  ADMIN_SRT70_FETCH_SITE: (district: string, state = 'jammu') =>
    `${ADMIN_BASE_URL}/jammu/srt70mw/installation/fetch-site?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`,
  ADMIN_SRT70_STORE_ASSIGN: `${ADMIN_BASE_URL}/jammu/srt70mw/installation/store-assign`,
  ADMIN_SRT70_VIEW_ASSIGN: `${ADMIN_BASE_URL}/jammu/srt70mw/installation/view-assign`,
  ADMIN_SRT70_APPROVAL_ASSIGN: (id: string | number) =>
    `${ADMIN_BASE_URL}/jammu/srt70mw/installation/approval-assign/${encodeURIComponent(id)}`,
  ADMIN_SRT70_ASSIGN_VENDOR_DETAILS: (id: string | number) =>
    `${ADMIN_BASE_URL}/jammu/srt70mw/installation/assign-vendor-details/${encodeURIComponent(id)}`,
  ADMIN_SRT70_EDIT_ASSIGN: (id: string | number) =>
    `${ADMIN_BASE_URL}/jammu/srt70mw/installation/edit-assign/${encodeURIComponent(id)}`,
  ADMIN_SRT70_UPDATE_ASSIGN: `${ADMIN_BASE_URL}/jammu/srt70mw/installation/update-assign`,
  ADMIN_SRT70_VIEW_INSTALLATION: `${ADMIN_BASE_URL}/jammu/srt70mw/installation/view-installation`,
  ADMIN_SRT70_VERIFY_INSTALLATION_STATUS: `${ADMIN_BASE_URL}/jammu/srt70mw/installation/verify-installation-status`,
  ADMIN_SRT70_VIEW_CLAIM: `${ADMIN_BASE_URL}/jammu/srt70mw/installation/view-claim`,
  ADMIN_SRT70_VERIFY_CLAIM_STATUS: `${ADMIN_BASE_URL}/jammu/srt70mw/installation/verify-claim-status`,
  ADMIN_SRT70_VERIFY_DOC_SUBMIT: `${ADMIN_BASE_URL}/jammu/srt70mw/installation/verify-insta-doc-submit`,
  ADMIN_SRT70_VIEW_PAYMENT: (params?: { from_date?: string | null; to_date?: string | null; vendor?: string | number | null }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All' && params.vendor !== null) {
      q.append('vendor', String(params.vendor));
    }
    const qs = q.toString();
    return `${ADMIN_BASE_URL}/jammu/srt70mw/installation/view-payment${qs ? `?${qs}` : ''}`;
  },
  ADMIN_SRT70_UPDATE_PAYMENT_STATUS: `${ADMIN_BASE_URL}/jammu/srt70mw/installation/update-payment-status`,

  // ═════════════════════════════════════════════════════════════
  // 3. SUPER ADMIN: Jammu SSL Installation
  // Controller: App\Http\Controllers\admin\jammu\JammuSslInstallationController
  // ═════════════════════════════════════════════════════════════
  ADMIN_SSL_DASHBOARD: `${ADMIN_BASE_URL}/jammu/ssl/installation/dashboard`,
  ADMIN_SSL_VIEW_DASHBOARD: (status: string) =>
    `${ADMIN_BASE_URL}/jammu/ssl/installation/view-dashboard/${encodeURIComponent(status)}`,
  ADMIN_SSL_VENDORWISE_DATA: (status: string, vendor: string | number) =>
    `${ADMIN_BASE_URL}/jammu/ssl/installation/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`,
  ADMIN_SSL_DISTRICTWISE_DATA: (status: string, district: string) =>
    `${ADMIN_BASE_URL}/jammu/ssl/installation/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
  ADMIN_SSL_ASSIGN: `${ADMIN_BASE_URL}/jammu/ssl/installation/assign`,
  ADMIN_SSL_FETCH_DISTRICT: (state = 'jammu') =>
    `${ADMIN_BASE_URL}/jammu/ssl/installation/fetch-district?state=${encodeURIComponent(state)}`,
  ADMIN_SSL_FETCH_BLOCK: (district: string, state = 'jammu') =>
    `${ADMIN_BASE_URL}/jammu/ssl/installation/fetch-block?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`,
  ADMIN_SSL_FETCH_PANCHAYAT: (district: string, block: string, state = 'jammu') =>
    `${ADMIN_BASE_URL}/jammu/ssl/installation/fetch-panchayat?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&block=${encodeURIComponent(block)}`,
  ADMIN_SSL_STORE_ASSIGN: `${ADMIN_BASE_URL}/jammu/ssl/installation/store-assign`,
  ADMIN_SSL_VIEW_ASSIGN: `${ADMIN_BASE_URL}/jammu/ssl/installation/view-assign`,
  ADMIN_SSL_APPROVAL_ASSIGN: (id: string | number) =>
    `${ADMIN_BASE_URL}/jammu/ssl/installation/approval-assign/${encodeURIComponent(id)}`,
  ADMIN_SSL_VIEW_VENDOR_WISE_DETAILS: (id: string | number) =>
    `${ADMIN_BASE_URL}/jammu/ssl/installation/view-vendor-wise-details/${encodeURIComponent(id)}`,
  ADMIN_SSL_EDIT_ASSIGN: (id: string | number) =>
    `${ADMIN_BASE_URL}/jammu/ssl/installation/edit-assign/${encodeURIComponent(id)}`,
  ADMIN_SSL_UPDATE_ASSIGN: `${ADMIN_BASE_URL}/jammu/ssl/installation/update-assign`,
  ADMIN_SSL_VIEW_INSTALLATION: `${ADMIN_BASE_URL}/jammu/ssl/installation/view-installation`,
  ADMIN_SSL_VERIFY_INSTALLATION: `${ADMIN_BASE_URL}/jammu/ssl/installation/verify-installation-status`,
  ADMIN_SSL_BATTERY_IMPORT: `${ADMIN_BASE_URL}/jammu/ssl/installation/state-battery-import`,
  ADMIN_SSL_IMEI_IMPORT: `${ADMIN_BASE_URL}/jammu/ssl/installation/state-imei-import`,
  ADMIN_SSL_PANEL_IMPORT: `${ADMIN_BASE_URL}/jammu/ssl/installation/state-panel-import`,
  ADMIN_SSL_SIM_IMPORT: `${ADMIN_BASE_URL}/jammu/ssl/installation/state-sim-import`,
  ADMIN_SSL_VIEW_CLAIM: `${ADMIN_BASE_URL}/jammu/ssl/installation/view-claim`,
  ADMIN_SSL_UPDATE_CLAIM_STATUS: `${ADMIN_BASE_URL}/jammu/ssl/installation/update-claim-status`,
  ADMIN_SSL_VIEW_PAYMENT: (params?: { from_date?: string; to_date?: string; vendor?: string | number }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All') {
      q.append('vendor', String(params.vendor));
    }
    const qs = q.toString();
    return `${ADMIN_BASE_URL}/jammu/ssl/installation/view-payment${qs ? `?${qs}` : ''}`;
  },
  ADMIN_SSL_VIEW_PAYMENT_FILTER: (params?: { fromdate?: string; todate?: string; vendor?: string | number }) => {
    const q = new URLSearchParams();
    if (params?.fromdate) q.append('fromdate', params.fromdate);
    if (params?.todate) q.append('todate', params.todate);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All') {
      q.append('vendor', String(params.vendor));
    }
    const qs = q.toString();
    return `${ADMIN_BASE_URL}/jammu/ssl/installation/view-payment-filter${qs ? `?${qs}` : ''}`;
  },
  ADMIN_SSL_UPDATE_PAYMENT_STATUS: `${ADMIN_BASE_URL}/jammu/ssl/installation/update-payment-status`,

  // ═════════════════════════════════════════════════════════════
  // 4. SUPER ADMIN: Jammu / JK Resco Installation
  // Controller: App\Http\Controllers\admin\jammu\JammuRescoInstallationController
  // Route Prefix: /api/admin/jk/resco/installation/...
  // ═════════════════════════════════════════════════════════════
  ADMIN_RESCO_DASHBOARD: (volume?: string | number) =>
    `${ADMIN_BASE_URL}/jk/resco/installation/dashboard${volume && volume !== 'all' ? `?volume=${encodeURIComponent(volume)}` : ''}`,
  ADMIN_RESCO_VIEW_DASHBOARD: (status: string, volume: string = 'all') =>
    `${ADMIN_BASE_URL}/jk/resco/installation/view-dashboard/${encodeURIComponent(status)}/${encodeURIComponent(volume || 'all')}`,
  ADMIN_RESCO_VENDORWISE_DATA: (status: string, vendor: string | number, volume: string = 'all') =>
    `${ADMIN_BASE_URL}/jk/resco/installation/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}/${encodeURIComponent(volume || 'all')}`,
  ADMIN_RESCO_DISTRICTWISE_DATA: (status: string, district: string, volume: string = 'all') =>
    `${ADMIN_BASE_URL}/jk/resco/installation/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}/${encodeURIComponent(volume || 'all')}`,
  ADMIN_RESCO_ASSIGN: `${ADMIN_BASE_URL}/jk/resco/installation/assign`,
  ADMIN_RESCO_FETCH_DISTRICT: (volume?: string | number) =>
    `${ADMIN_BASE_URL}/jk/resco/installation/fetch-district${volume !== undefined ? `?volume=${encodeURIComponent(volume)}` : ''}`,
  ADMIN_RESCO_FETCH_SITE: (volume?: string | number, district?: string) => {
    const q = new URLSearchParams();
    if (volume !== undefined && volume !== null) q.append('volume', String(volume));
    if (district !== undefined && district !== null) q.append('district', String(district));
    const qs = q.toString();
    return `${ADMIN_BASE_URL}/jk/resco/installation/fetch-site${qs ? `?${qs}` : ''}`;
  },
  ADMIN_RESCO_STORE_ASSIGN: `${ADMIN_BASE_URL}/jk/resco/installation/store-assign`,
  ADMIN_RESCO_VIEW_ASSIGNED: `${ADMIN_BASE_URL}/jk/resco/installation/view-assign`,
  ADMIN_RESCO_APPROVAL_ASSIGN: (id: string | number) =>
    `${ADMIN_BASE_URL}/jk/resco/installation/approval-assign/${encodeURIComponent(id)}`,
  ADMIN_RESCO_EDIT_ASSIGN: (id: string | number) =>
    `${ADMIN_BASE_URL}/jk/resco/installation/edit-assign/${encodeURIComponent(id)}`,
  ADMIN_RESCO_UPDATE_ASSIGN: (id: string | number) =>
    `${ADMIN_BASE_URL}/jk/resco/installation/update-assign/${encodeURIComponent(id)}`,
  ADMIN_RESCO_VIEW_INSTALLED: `${ADMIN_BASE_URL}/jk/resco/installation/view-installation`,
  ADMIN_RESCO_VERIFY_INSTALLATION: `${ADMIN_BASE_URL}/jk/resco/installation/verify-installation-status`,
  ADMIN_RESCO_VIEW_DOC: `${ADMIN_BASE_URL}/jk/resco/installation/view-installation-document`,
  ADMIN_RESCO_VERIFY_DOC: `${ADMIN_BASE_URL}/jk/resco/installation/verify-document-status`,
  ADMIN_RESCO_VIEW_CLAIM: `${ADMIN_BASE_URL}/jk/resco/installation/view-claim`,
  ADMIN_RESCO_VERIFY_CLAIM: `${ADMIN_BASE_URL}/jk/resco/installation/view-claim`,
  ADMIN_RESCO_CLAIM_STATUS_UPDATE: `${ADMIN_BASE_URL}/jk/resco/installation/claim-status-update`,
  ADMIN_RESCO_VERIFY_CLAIM_STATUS: `${ADMIN_BASE_URL}/jk/resco/installation/claim-status-update`,
  ADMIN_RESCO_VIEW_PAYMENT: (params?: { from_date?: string; to_date?: string; vendor?: string | number; status?: string | number }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All') {
      q.append('vendor', String(params.vendor));
    }
    if (params?.status !== undefined && params.status !== '' && params.status !== 'All') {
      q.append('status', String(params.status));
    }
    const qs = q.toString();
    return `${ADMIN_BASE_URL}/jk/resco/installation/view-payment${qs ? `?${qs}` : ''}`;
  },
  ADMIN_RESCO_UPDATE_PAYMENT: `${ADMIN_BASE_URL}/jk/resco/installation/update-payment-status`,
  ADMIN_RESCO_VIEW_PANEL: (id: string | number) =>
    `${ADMIN_BASE_URL}/jk/resco/installation/view-panel/${encodeURIComponent(id)}`,
  ADMIN_RESCO_VIEW_CREATE_BILL: `${ADMIN_BASE_URL}/jk/resco/installation/view-create-bill`,
  ADMIN_RESCO_VIEW_BILLS: `${ADMIN_BASE_URL}/jk/resco/installation/view-create-bill`,
  ADMIN_RESCO_VERIFY_BILL_STATUS: (id: string | number) =>
    `${ADMIN_BASE_URL}/jk/resco/installation/resco/verify-bill-status/${encodeURIComponent(id)}`,
  ADMIN_RESCO_VIEW_ASSIGN_VENDOR: `${ADMIN_BASE_URL}/jk/resco/installation/view-assign-vendor`,
  ADMIN_RESCO_FETCH_SITE_DETAIL: (srtId: string | number) =>
    `${ADMIN_BASE_URL}/jk/resco/installation/fetch-site-detail?srt_id=${encodeURIComponent(srtId)}`,
  ADMIN_RESCO_STORE_SURVEY: `${ADMIN_BASE_URL}/jk/resco/installation/store`,
  ADMIN_RESCO_UPDATE_SITE_NAME: (id: string | number) =>
    `${ADMIN_BASE_URL}/jk/resco/installation/update-site-name/${encodeURIComponent(id)}`,

  // ═════════════════════════════════════════════════════════════
  // 5. SUPER ADMIN: Jammu Installation Expenses
  // Controller: App\Http\Controllers\admin\jammu\JammuInstalltionExpensesController
  // Route Prefix: /jammu/resco/installation/...
  // ═════════════════════════════════════════════════════════════
  ADMIN_EXPENSES_VIEW_CLAIMS: `${ADMIN_BASE_URL}/jammu/resco/installation/view-claim-expenses`,
  ADMIN_EXPENSES_VERIFY_CLAIM: `${ADMIN_BASE_URL}/jammu/resco/installation/verify-claim-expenses`,
  ADMIN_EXPENSES_VIEW_PAYMENT: (params?: { from_date?: string; to_date?: string; vendor?: string | number; status?: string | number }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.vendor !== undefined && params.vendor !== '' && params.vendor !== 'All' && params.vendor !== null) {
      q.append('vendor', String(params.vendor));
    }
    if (params?.status !== undefined && params.status !== '' && params.status !== 'All' && params.status !== null) {
      q.append('status', String(params.status));
    }
    const qs = q.toString();
    return `${ADMIN_BASE_URL}/jammu/resco/installation/view-expenses-payment${qs ? `?${qs}` : ''}`;
  },
  ADMIN_EXPENSES_VERIFY_PAYMENT: `${ADMIN_BASE_URL}/jammu/resco/installation/verify-payment-expenses`,
  ADMIN_EXPENSES_PAYMENT_DETAILS: (id: string | number) =>
    `${ADMIN_BASE_URL}/jammu/resco/installation/expenses-payment-details/${encodeURIComponent(id)}`,

  // ═════════════════════════════════════════════════════════════
  // 6. SUPER ADMIN: JK RESCO Survey
  // Controller: App\Http\Controllers\admin\jammu\JKRescoSurveyController
  // Route Prefix: /api/admin/jk/resco/survey/...
  // ═════════════════════════════════════════════════════════════
  ADMIN_RESCO_SURVEY_DASHBOARD: `${ADMIN_BASE_URL}/jk/resco/survey/dashboard`,
  ADMIN_RESCO_SURVEY_VIEW_DASHBOARD: (status?: string) => {
    const s = status || 'all';
    return `${ADMIN_BASE_URL}/jk/resco/survey/view-dashboard/${encodeURIComponent(s)}`;
  },
  ADMIN_RESCO_SURVEY_VENDORWISE_DATA: (status: string, vendor: string | number) =>
    `${ADMIN_BASE_URL}/jk/resco/survey/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`,
  ADMIN_RESCO_SURVEY_DISTRICTWISE_DATA: (status: string, district: string) =>
    `${ADMIN_BASE_URL}/jk/resco/survey/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
  ADMIN_RESCO_SURVEY_ASSIGN_FORM: `${ADMIN_BASE_URL}/jk/resco/survey/assign`,
  ADMIN_RESCO_SURVEY_FETCH_DISTRICT: (volume?: string | number) =>
    `${ADMIN_BASE_URL}/jk/resco/survey/fetch-district${volume ? `?volume=${encodeURIComponent(volume)}` : ''}`,
  ADMIN_RESCO_SURVEY_FETCH_SITE: (district: string) =>
    `${ADMIN_BASE_URL}/jk/resco/survey/fetch-site?district=${encodeURIComponent(district)}`,
  ADMIN_RESCO_SURVEY_STORE_ASSIGN: `${ADMIN_BASE_URL}/jk/resco/survey/store-assign`,
  ADMIN_RESCO_SURVEY_VIEW_ASSIGN: `${ADMIN_BASE_URL}/jk/resco/survey/view-assign`,
  ADMIN_RESCO_SURVEY_ASSIGN_VENDOR: `${ADMIN_BASE_URL}/jk/resco/survey/assign-vendor`,
  ADMIN_RESCO_SURVEY_FETCH_SITE_DETAIL: (srtId: string | number) =>
    `${ADMIN_BASE_URL}/jk/resco/survey/fetch-site-detail?srt_id=${encodeURIComponent(srtId)}`,
  ADMIN_RESCO_SURVEY_STORE: `${ADMIN_BASE_URL}/jk/resco/survey/store`,
  ADMIN_RESCO_SURVEY_UPDATE_SITE_NAME: (id: string | number) =>
    `${ADMIN_BASE_URL}/jk/resco/survey/update-site-name/${encodeURIComponent(id)}`,
  ADMIN_RESCO_SURVEY_VIEW_SURVEY: `${ADMIN_BASE_URL}/jk/resco/survey/view-survey`,
  ADMIN_RESCO_SURVEY_VERIFY_STATUS: `${ADMIN_BASE_URL}/jk/resco/survey/verify-status`,
  ADMIN_RESCO_SURVEY_MATERIAL_DISPATCH_STATUS: `${ADMIN_BASE_URL}/jk/resco/survey/material-dispatch-status`,
  ADMIN_RESCO_SURVEY_BOS_STATUS: `${ADMIN_BASE_URL}/jk/resco/survey/bos-status`,

  // ═════════════════════════════════════════════════════════════
  // 7. SUPER ADMIN: Jammu SRT 70MW Survey
  // Controller: App\Http\Controllers\admin\jammu\JammuSrt70mwSurveyController
  // Route Prefix: /api/admin/jammu/srt70mw/survey/...
  // ═════════════════════════════════════════════════════════════
  ADMIN_SRT70_SURVEY_DASHBOARD: `${ADMIN_BASE_URL}/jammu/srt70mw/survey/dashboard`,
  ADMIN_SRT70_SURVEY_ASSIGN_FORM: `${ADMIN_BASE_URL}/jammu/srt70mw/survey/assign`,
  ADMIN_SRT70_SURVEY_FETCH_SITE: (district: string) =>
    `${ADMIN_BASE_URL}/jammu/srt70mw/survey/fetch-site?district=${encodeURIComponent(district)}`,
  ADMIN_SRT70_SURVEY_STORE_ASSIGN: `${ADMIN_BASE_URL}/jammu/srt70mw/survey/store-assign`,
  ADMIN_SRT70_SURVEY_VIEW_ASSIGN: `${ADMIN_BASE_URL}/jammu/srt70mw/survey/view-assign-survey`,
  ADMIN_SRT70_SURVEY_VIEW_SURVEY: `${ADMIN_BASE_URL}/jammu/srt70mw/survey/view-survey`,
  ADMIN_SRT70_SURVEY_VERIFY_STATUS: `${ADMIN_BASE_URL}/jammu/srt70mw/survey/verify-survey-status`,

  // ═════════════════════════════════════════════════════════════
  // 8. COMPATIBILITY ALIASES (Direct Admin Mapping)
  // ═════════════════════════════════════════════════════════════
  SWP_DASHBOARD: `${ADMIN_BASE_URL}/jammu/swp/installation/dashboard`,
  SRT70_DASHBOARD: `${ADMIN_BASE_URL}/jammu/srt70mw/installation/dashboard`,
  SSL_DASHBOARD: `${ADMIN_BASE_URL}/jammu/ssl/installation/dashboard`,
  RESCO_DASHBOARD: (volume?: string | number) =>
    `${ADMIN_BASE_URL}/jk/resco/installation/dashboard${volume && volume !== 'all' ? `?volume=${encodeURIComponent(volume)}` : ''}`,
};

export default JAMMU_VENDOR_API;
