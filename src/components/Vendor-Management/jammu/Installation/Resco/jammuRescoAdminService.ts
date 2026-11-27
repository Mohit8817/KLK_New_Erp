import { API_BASE_URL, authService } from '../../../../../services/authService';
import { JAMMU_VENDOR_API } from '../../../Vendor_Management_APIS/Jammu_Vendor_API';

export { JAMMU_VENDOR_API };

/* ═══════════════════════════════════════════════════════════════════════════
   Base URL & Media URL Resolution (Strictly Jammu)
   ═══════════════════════════════════════════════════════════════════════════ */

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const BASE_ROOT_URL = RAW_BASE.replace(/\/api\/?$/, '');
export const BASE_API_URL = `${BASE_ROOT_URL}/api`;
export const ADMIN_API_URL = `${BASE_ROOT_URL}/api/admin`;
export const ADMIN_ROOT_URL = `${BASE_ROOT_URL}/api/admin`;

export function resolveJammuMediaUrl(path?: string | null): string {
  if (!path) return '';
  let clean = String(path).trim();
  if (
    clean.startsWith('http://') ||
    clean.startsWith('https://') ||
    clean.startsWith('blob:') ||
    clean.startsWith('data:')
  ) {
    return clean;
  }
  clean = clean.replace(/^["']|["']$/g, '').replace(/\\+/g, '/').replace(/^\/+/, '');
  const base = BASE_ROOT_URL.replace(/\/+$/, '');
  return `${base}/${clean}`;
}

export const resolveJammuRescoMediaUrl = resolveJammuMediaUrl;

export function getJammuMediaCandidates(path?: string | null): string[] {
  if (!path) return [];
  const direct = resolveJammuMediaUrl(path);
  const clean = String(path).replace(/^\/+/, '');
  return Array.from(
    new Set([
      direct,
      `https://klkerp.com/${clean}`,
      `https://klkerp.com/api/${clean}`,
      `https://klkerp.com/uploads/${clean.replace(/^uploads\//, '')}`,
    ])
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Universal Auth Token & Headers
   ═══════════════════════════════════════════════════════════════════════════ */

export const getAuthToken = (): string | null => {
  const fromAuth = authService.getToken();
  if (fromAuth) return fromAuth;

  const session = authService.getSession();
  if (session?.token) return session.token;

  try {
    const rawLocal = localStorage.getItem('klk_user_session');
    if (rawLocal) {
      const p = JSON.parse(rawLocal);
      if (p?.token) return p.token;
    }
  } catch {}

  try {
    const rawSession = sessionStorage.getItem('klk_user_session');
    if (rawSession) {
      const p = JSON.parse(rawSession);
      if (p?.token) return p.token;
    }
  } catch {}

  return (
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('klk_auth_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('access_token') ||
    sessionStorage.getItem('klk_auth_token') ||
    null
  );
};

export const getAuthHeaders = (isMultipart = false): Record<string, string> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    const isSynthetic =
      token.startsWith('klk_user_session_token_') ||
      token.startsWith('klk_vendor_session_token_');
    if (!isSynthetic) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  if (typeof document !== 'undefined') {
    const xsrfCookie = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('XSRF-TOKEN='));
    if (xsrfCookie) {
      const xsrfVal = decodeURIComponent(xsrfCookie.split('=')[1] || '');
      if (xsrfVal) {
        headers['X-XSRF-TOKEN'] = xsrfVal;
      }
    }
  }

  return headers;
};

/* ═══════════════════════════════════════════════════════════════════════════
   Candidate URLs for Jammu RESCO Controller
   Controller: App\Http\Controllers\admin\jammu\JammuRescoInstallationController
   ═══════════════════════════════════════════════════════════════════════════ */

export function buildJammuCandidateUrls(rawPathOrUrl: string): string[] {
  let path = (rawPathOrUrl || '').trim();
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const u = new URL(path);
      path = u.pathname + u.search;
    } catch {
      // ignore
    }
  }

  let pathname = path;
  let search = '';
  const qIndex = path.indexOf('?');
  if (qIndex !== -1) {
    pathname = path.slice(0, qIndex);
    search = path.slice(qIndex);
  }

  let cleaned = pathname;
  let changed = true;
  while (changed) {
    changed = false;
    if (cleaned.startsWith('/api/admin/')) {
      cleaned = cleaned.slice('/api/admin'.length);
      changed = true;
    } else if (cleaned.startsWith('/admin/')) {
      cleaned = cleaned.slice('/admin'.length);
      changed = true;
    } else if (cleaned.startsWith('/api/')) {
      cleaned = cleaned.slice('/api'.length);
      changed = true;
    }
  }

  if (!cleaned.startsWith('/')) {
    cleaned = `/${cleaned}`;
  }

  // User requirement: In all RESCO APIs, replace 'jammu' with 'jk' (https://klkerp.com/api/admin/jk/resco/...)
  let jkCleaned = cleaned;
  if (jkCleaned.startsWith('/jammu/resco/')) {
    jkCleaned = jkCleaned.replace(/^\/jammu\/resco\//, '/jk/resco/');
  } else if (jkCleaned.startsWith('/resco/')) {
    jkCleaned = `/jk${jkCleaned}`;
  }

  const jkRoutePath = `${jkCleaned}${search}`;
  const jammuRoutePath = `${cleaned}${search}`;

  const candidates: string[] = [];

  // 1. If incoming URL was absolute, prioritize it first (auto-fixing missing /admin or /api, and ensuring /api/admin/jk/resco)
  if (rawPathOrUrl.startsWith('http://') || rawPathOrUrl.startsWith('https://')) {
    const fixedUrl = rawPathOrUrl
      .replace(/(https?:\/\/[^\/]+)\/api\/admin\/jammu\/resco\//i, '$1/api/admin/jk/resco/')
      .replace(/(https?:\/\/[^\/]+)\/api\/jk\/resco\//i, '$1/api/admin/jk/resco/')
      .replace(/(https?:\/\/[^\/]+)\/admin\/jammu\/resco\//i, '$1/api/admin/jk/resco/')
      .replace(/(https?:\/\/[^\/]+)\/admin\/jk\/resco\//i, '$1/api/admin/jk/resco/')
      .replace(/(https?:\/\/[^\/]+)\/admin\/jammu\//i, '$1/api/admin/jammu/');
    candidates.push(fixedUrl);
  }

  // 2. Strict primary for JK RESCO Admin controller (Strictly https://klkerp.com/api/admin/jk/resco/...)
  candidates.push(`${ADMIN_API_URL}${jkRoutePath}`);

  // 3. Fallback in case backend controller is mounted under /api/admin/jammu/resco/
  if (jkRoutePath !== jammuRoutePath) {
    candidates.push(`${ADMIN_API_URL}${jammuRoutePath}`);
  }

  return Array.from(new Set(candidates));
}

let knownWorkingBase: string | null = null;

async function apiRequest<T = any>(
  pathOrUrl: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; errors?: any; raw?: any }> {
  let urlsToTry = buildJammuCandidateUrls(pathOrUrl);
  if (knownWorkingBase) {
    urlsToTry.sort((a, b) => {
      const aMatch = a.startsWith(knownWorkingBase!) ? -1 : 0;
      const bMatch = b.startsWith(knownWorkingBase!) ? -1 : 0;
      return aMatch - bMatch;
    });
  }

  let lastError: any = null;
  let lastJson: any = null;

  for (const url of urlsToTry) {
    try {
      const isFormData = options.body instanceof FormData;
      const headers = {
        ...getAuthHeaders(isFormData),
        ...((options.headers as Record<string, string>) || {}),
      };

      const res = await fetch(url, {
        credentials: 'include',
        ...options,
        headers,
      });

      const contentType = res.headers.get('content-type') || '';
      let json: any = null;
      if (contentType.includes('application/json')) {
        json = await res.json().catch(() => null);
      } else {
        const text = await res.text().catch(() => '');
        try {
          json = text ? JSON.parse(text) : {};
        } catch {
          json = { rawText: text };
        }
      }
      lastJson = json;

      if (res.ok) {
        try {
          const origin = new URL(url).origin;
          knownWorkingBase = origin;
        } catch {}

        return {
          success: json?.success !== false,
          data: json?.data !== undefined ? json.data : json,
          message: json?.message || 'Success',
          raw: json,
        };
      }

      if (res.status === 404 && url !== urlsToTry[urlsToTry.length - 1]) {
        continue;
      }

      lastError = new Error(json?.message || `HTTP ${res.status}: ${res.statusText}`);
    } catch (err: any) {
      lastError = err;
    }
  }

  return {
    success: false,
    message: lastJson?.message || lastError?.message || 'Failed to fetch from Jammu RESCO API',
    errors: lastJson?.errors || lastError,
    raw: lastJson,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   TypeScript Interfaces for Jammu RESCO Installation Controller
   ═══════════════════════════════════════════════════════════════════════════ */

export interface VendorItem {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  state?: string;
  company_id?: number | string;
  [key: string]: any;
}

export interface VolumeItem {
  volume: string;
}

export interface DistrictItem {
  district: string;
}

export interface SiteItem {
  id: number;
  site_name: string;
  farmer_name?: string;
  unique_id?: string;
  state?: string;
  district?: string;
  division?: string;
  sub_division?: string;
  department?: string;
  location?: string;
  ca_no?: string;
  wo_no?: string;
  capacity_kw?: number;
  plant_sc?: string | number;
  inst_deadline?: string;
  [key: string]: any;
}

export interface RescoAssignRecord {
  id: number;
  vendor: number | string;
  type?: string;
  purpose?: string;
  state: string;
  volume?: string;
  district: string;
  site_name: string | number[];
  sitecount: number;
  assign_date: string;
  file?: string | null;
  remarks?: string | null;
  status: number; // 0 = Approval pending, 1 = Approved
  vendors?: { id: number | string; name: string };
  sites?: Array<{
    id: number;
    farmer_name?: string;
    site_name?: string;
    inst_deadline?: string;
    ca_no?: string;
    sanction_load?: string | number;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface RescoDetailCounts {
  total: number;
  assigned: number;
  not_assigned: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
}

export interface RescoInstallationSite {
  id: number;
  installation_date?: string;
  inst_date?: string;
  uid?: string;
  state: string;
  district: string;
  site_name: string;
  contact_person?: string;
  contact_number?: string;
  solarmeter_no?: string;
  solar_meter_no?: string;
  inverter_no?: string;
  nm_sm_no?: string;
  net_smart_meter_no?: string;
  loger_no?: string;
  panel_no?: string;
  system_image?: string | null;
  inverter_image?: string | null;
  panel_image?: string | null;
  nm_sm_image?: string | null;
  net_meter_image?: string | null;
  loger_image?: string | null;
  latitude?: string | number;
  longitude?: string | number;
  remark?: string;
  inst_remarks?: string;
  inst_status?: number | string;
  installation_status?: string;
  panel_status?: string;
  verify_status?: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  inst_verify_status?: number;
  verify_remarks?: string;
  inst_verify_remarks?: string;
  verify_by?: string | number;
  inst_verify_by?: string | number;
  verify_date?: string;
  inst_verify_date?: string;
  verify_file?: string | null;
  inst_verify_file?: string | null;
  [key: string]: any;
}

export interface RescoDocItem {
  id: number;
  vendor_name?: string;
  vendor?: string;
  state: string;
  district: string;
  site_name: string;
  contact_person?: string;
  contact_number?: string;
  document_file?: string | null;
  inst_doc_file?: string | null;
  file?: string | null;
  submit_date?: string;
  inst_doc_date?: string;
  created_at?: string;
  remarks?: string;
  inst_doc_remarks?: string;
  verify_status?: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  inst_doc_status?: number;
  verify_remarks?: string;
  inst_doc_verify_remarks?: string;
  [key: string]: any;
}

export interface RescoDocDetailCounts {
  total: number;
  assigned: number;
  not_assigned: number;
  complete: number;
  pending: number;
  doc_approved: number;
  doc_pending: number;
  doc_reject: number;
}

export interface RescoClaimRecord {
  id: number;
  vendor_id: number | string;
  date: string;
  amount: string | number;
  payment_type: number; // 1 = 80%, 2 = 20%, 3 = stage 3
  claim_status: number; // 0 = Pending, 1 = Raised, 2 = Approved, 3 = Rejected
  pay_status: number;
  site_id: string | number[];
  vendors?: { id: number | string; name: string };
  sites?: Array<{
    id: number;
    state: string;
    district: string;
    address?: string;
    site_name: string;
    [key: string]: any;
  }>;
  invoice_file?: string | null;
  remarks?: string;
  approved_remarks?: string;
  verify_remarks?: string;
  [key: string]: any;
}

export interface RescoClaimDetailCounts {
  total: number;
  claim_approved: number;
  claim_pending: number;
  claim_reject: number;
}

export interface RescoPaymentRecord {
  id: number;
  vendor_id: number | string;
  amount: string | number;
  payment_type: number;
  pay_status: number; // 0 = Pending, 1 = Complete, 2 = Partially
  allpayment?: Array<{
    id: number;
    claim_id: number;
    amount: string | number;
    balance: string | number;
    date: string;
    pay_remarks?: string;
    [key: string]: any;
  }>;
  vendors?: { id: number | string; name: string };
  sites?: Array<{
    id: number;
    state: string;
    district: string;
    address?: string;
    site_name: string;
    [key: string]: any;
  }>;
  invoice_file?: string | null;
  remarks?: string;
  [key: string]: any;
}

export interface RescoPaymentDetailCounts {
  total: number;
  complete: number;
  partially: number;
  pending: number;
}

export interface RescoBillItem {
  id: number;
  resco_id?: number;
  month_year?: string;
  months_and_year?: string;
  type?: string | number;
  verify_status: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  verify_remarks?: string;
  bill_no?: string;
  bill_amount?: string | number;
  reading?: string | number;
  documents?: string | null;
  file?: string | null;
  state?: string;
  district?: string;
  site_name?: string;
  inverter_no?: string;
  resco?: {
    site_name?: string;
    district?: string;
    state?: string;
    inverter_no?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface RescoDashboardTotals {
  site_count: number;
  assigned: number;
  not_assigned: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  doc_approved: number;
  doc_pending: number;
  doc_reject: number;
  inst_claim1_pending: number;
  inst_claim1_approved: number;
  inst_claim1_reject: number;
  inst_claim2_pending: number;
  inst_claim2_approved: number;
  inst_claim2_reject: number;
  inst_claim3_pending: number;
  inst_claim3_approved: number;
  inst_claim3_reject: number;
  inst_pay1_complete: number;
  inst_pay1_partially: number;
  inst_pay1_pending: number;
  inst_pay2_complete: number;
  inst_pay2_partially: number;
  inst_pay2_pending: number;
  inst_pay3_complete: number;
  inst_pay3_partially: number;
  inst_pay3_pending: number;
  [key: string]: any;
}

export interface RescoDistrictWiseItem {
  district: string;
  site_count: number;
  assigned?: number;
  not_assigned?: number;
  complete?: number;
  pending?: number;
  verify_pending?: number;
  verify_approved?: number;
  verify_reject?: number;
  doc_approved?: number;
  doc_pending?: number;
  doc_reject?: number;
  inst_complete?: number;
  [key: string]: any;
}

export interface RescoVendorWiseItem {
  inst_vendor: string | number;
  name?: string;
  vendor?: number;
  site_count: number;
  assigned?: number;
  complete?: number;
  pending?: number;
  verify_pending?: number;
  verify_approved?: number;
  verify_reject?: number;
  doc_approved?: number;
  doc_pending?: number;
  doc_reject?: number;
  inst_complete?: number;
  today_install?: number;
  [key: string]: any;
}

export interface RescoMonthlyInstallation {
  month_year: string;
  monthly_installations: number;
}

export interface RescoDashboardData {
  loginId?: number;
  loginName?: string;
  company_id?: string | number;
  role?: string;
  state?: string;
  vol: string[];
  resco: RescoDashboardTotals;
  district_install: Array<{ district: string; inst_complete: number }>;
  districtwise: RescoDistrictWiseItem[];
  vendorwises: RescoVendorWiseItem[];
  vendors: Array<{ inst_vendor: string | number; vendor: number; name: string }>;
  vendor_installation_month: RescoMonthlyInstallation[];
  vendor_today_installation: Array<{ inst_vendor: string | number; today_install: number }>;
}

export interface RescoSiteRow {
  id: number;
  uid?: string;
  state: string;
  district: string;
  site_name: string;
  contact_person?: string;
  contact_number?: string;
  inverter_no?: string;
  solar_meter_no?: string;
  solarmeter_no?: string;
  nm_sm_no?: string;
  panel_no?: string;
  loger_no?: string;
  inst_status?: number | string;
  installation_status?: string;
  inst_verify_status?: number;
  verify_status?: number;
  inst_doc_status?: number;
  inst_claim1_status?: number;
  inst_claim2_status?: number;
  inst_claim3_status?: number;
  inst_pay1_status?: number;
  inst_pay2_status?: number;
  inst_pay3_status?: number;
  vendor_name?: string;
  inst_vendor?: string | number;
  volume?: string;
  system_image?: string | null;
  inverter_image?: string | null;
  panel_image?: string | null;
  nm_sm_image?: string | null;
  loger_image?: string | null;
  created_at?: string;
  inst_date?: string;
  installation_date?: string;
  [key: string]: any;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Jammu Resco Admin Service Class — Strictly 27 Live Controller Endpoints
   Controller: App\Http\Controllers\admin\jammu\JammuRescoInstallationController
   ═══════════════════════════════════════════════════════════════════════════ */

class JammuRescoAdminService {
  /**
   * 1. GET /jammu/resco/installation/assign
   * Returns vendor list & volumes
   */
  async getAssignFormData(): Promise<{
    loginId?: number;
    company_id?: number | string;
    role?: string;
    state?: string;
    vendor: VendorItem[];
    volumes: VolumeItem[];
  }> {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_RESCO_ASSIGN, { method: 'GET' });
    const payload = res.data || res.raw?.data || res.raw || {};
    return {
      loginId: payload.loginId,
      company_id: payload.company_id,
      role: payload.role,
      state: payload.state || 'jammu',
      vendor: Array.isArray(payload.vendor) ? payload.vendor : [],
      volumes: Array.isArray(payload.volumes) ? payload.volumes : [],
    };
  }

  /**
   * 2. GET /jammu/resco/installation/fetch-district?volume={volume}
   */
  async fetchDistricts(volume: string | number): Promise<DistrictItem[]> {
    const url =
      typeof JAMMU_VENDOR_API.ADMIN_RESCO_FETCH_DISTRICT === 'function'
        ? JAMMU_VENDOR_API.ADMIN_RESCO_FETCH_DISTRICT(volume)
        : `${JAMMU_VENDOR_API.ADMIN_RESCO_FETCH_DISTRICT}?volume=${encodeURIComponent(volume)}`;
    const res = await apiRequest<any>(url, { method: 'GET' });
    const payload = res.data || res.raw || {};
    const list = payload.districts || payload.district || (Array.isArray(payload) ? payload : []);
    return Array.isArray(list)
      ? list.map((d: any) => ({ district: typeof d === 'string' ? d : d.district || '' }))
      : [];
  }

  /**
   * 3. GET /jammu/resco/installation/fetch-site?volume={volume}&district={district}
   */
  async fetchSites(volume: string | number, district: string): Promise<SiteItem[]> {
    const url =
      typeof JAMMU_VENDOR_API.ADMIN_RESCO_FETCH_SITE === 'function'
        ? JAMMU_VENDOR_API.ADMIN_RESCO_FETCH_SITE(volume, district)
        : `${JAMMU_VENDOR_API.ADMIN_RESCO_FETCH_SITE}?volume=${encodeURIComponent(volume)}&district=${encodeURIComponent(district)}`;
    const res = await apiRequest<any>(url, { method: 'GET' });
    const payload = res.data || res.raw || {};
    const sites = payload.sites || payload.data || (Array.isArray(payload) ? payload : []);
    return Array.isArray(sites)
      ? sites.map((s: any) => ({
          id: Number(s.id),
          site_name: s.site_name || s.farmer_name || `Site #${s.id}`,
          farmer_name: s.farmer_name || s.site_name,
          ...s,
        }))
      : [];
  }

  /**
   * 4. POST /jammu/resco/installation/store-assign (multipart/form-data)
   */
  async storeAssign(formData: FormData): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_RESCO_STORE_ASSIGN, {
      method: 'POST',
      body: formData,
    });
    return {
      success: res.success,
      message: res.message || (res.success ? 'Installation Assigned Successfully.' : 'Failed to assign installation.'),
      data: res.data,
    };
  }

  /**
   * 5. GET /jammu/resco/installation/view-assign
   */
  async getViewAssign(): Promise<{
    assigns: RescoAssignRecord[];
    detail: RescoDetailCounts;
  }> {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_RESCO_VIEW_ASSIGNED, { method: 'GET' });
    const payload = res.data || res.raw?.data || res.raw || {};
    const assigns = payload.assigns || payload.assign || payload.data || (Array.isArray(payload) ? payload : []);
    const detail = payload.detail || payload.stats || {};

    const cleanAssigns: RescoAssignRecord[] = (Array.isArray(assigns) ? assigns : []).map((a: any) => ({
      id: Number(a.id),
      vendor: a.vendor,
      type: a.type || 'resco',
      purpose: a.purpose || 'installation',
      state: 'jammu',
      volume: a.volume,
      district: a.district || 'Jammu',
      site_name: a.site_name,
      sitecount: Number(a.sitecount || (Array.isArray(a.sites) ? a.sites.length : 1)),
      assign_date: a.assign_date || a.created_at || '',
      file: a.file || null,
      remarks: a.remarks || null,
      status: Number(a.status || 0),
      vendors: a.vendors || (a.vendor_name ? { id: a.vendor, name: a.vendor_name } : undefined),
      sites: Array.isArray(a.sites)
        ? a.sites.map((s: any) => ({
            id: Number(s.id),
            farmer_name: s.farmer_name || s.site_name || '',
            site_name: s.site_name || s.farmer_name || '',
            inst_deadline: s.inst_deadline || '',
            ca_no: s.ca_no || '',
            sanction_load: s.sanction_load || '',
            ...s,
          }))
        : [],
      ...a,
    }));

    return {
      assigns: cleanAssigns,
      detail: {
        total: Number(detail.total || cleanAssigns.reduce((acc, curr) => acc + (curr.sitecount || 1), 0)),
        assigned: Number(detail.assigned || cleanAssigns.length),
        not_assigned: Number(detail.not_assigned || 0),
        complete: Number(detail.complete || 0),
        pending: Number(detail.pending || 0),
        verify_approved: Number(detail.verify_approved || 0),
        verify_pending: Number(detail.verify_pending || 0),
        verify_reject: Number(detail.verify_reject || 0),
      },
    };
  }

  /**
   * 6. ANY /jammu/resco/installation/approval-assign/{id}
   */
  async approvalAssign(id: string | number): Promise<{ success: boolean; message: string; data?: any }> {
    const url =
      typeof JAMMU_VENDOR_API.ADMIN_RESCO_APPROVAL_ASSIGN === 'function'
        ? JAMMU_VENDOR_API.ADMIN_RESCO_APPROVAL_ASSIGN(id)
        : `${JAMMU_VENDOR_API.ADMIN_RESCO_APPROVAL_ASSIGN}/${encodeURIComponent(id)}`;
    const res = await apiRequest(url, { method: 'POST' });
    return {
      success: res.success,
      message: res.message || (res.success ? 'Assigned Installation Approved Successfully.' : 'Failed to approve.'),
      data: res.data,
    };
  }

  /**
   * 7. GET /jammu/resco/installation/edit-assign/{id}
   */
  async getEditAssign(id: string | number): Promise<{
    assign: RescoAssignRecord;
    vendor: VendorItem[];
    volumes: VolumeItem[];
    districts: DistrictItem[];
    sites: SiteItem[];
  }> {
    const url =
      typeof JAMMU_VENDOR_API.ADMIN_RESCO_EDIT_ASSIGN === 'function'
        ? JAMMU_VENDOR_API.ADMIN_RESCO_EDIT_ASSIGN(id)
        : `${JAMMU_VENDOR_API.ADMIN_RESCO_EDIT_ASSIGN}/${encodeURIComponent(id)}`;
    const res = await apiRequest<any>(url, { method: 'GET' });
    const payload = res.data || res.raw?.data || res.raw || {};
    return {
      assign: payload.assign || {},
      vendor: Array.isArray(payload.vendor) ? payload.vendor : [],
      volumes: Array.isArray(payload.volumes) ? payload.volumes : [],
      districts: Array.isArray(payload.districts) ? payload.districts : [],
      sites: Array.isArray(payload.sites) ? payload.sites : [],
    };
  }

  /**
   * 8. POST /jammu/resco/installation/update-assign/{id} (multipart/form-data)
   */
  async updateAssign(id: string | number, formData: FormData): Promise<{ success: boolean; message: string; data?: any }> {
    const url =
      typeof JAMMU_VENDOR_API.ADMIN_RESCO_UPDATE_ASSIGN === 'function'
        ? JAMMU_VENDOR_API.ADMIN_RESCO_UPDATE_ASSIGN(id)
        : `${JAMMU_VENDOR_API.ADMIN_RESCO_UPDATE_ASSIGN}/${encodeURIComponent(id)}`;
    const res = await apiRequest(url, {
      method: 'POST',
      body: formData,
    });
    return {
      success: res.success,
      message: res.message || (res.success ? 'Assigned Site Updated Successfully.' : 'Failed to update assignment.'),
      data: res.data,
    };
  }

  /**
   * 9. GET /jammu/resco/installation/view-installation
   */
  async getViewInstallation(): Promise<{
    detail: RescoDetailCounts;
    verify_pending: RescoInstallationSite[];
    verify_complete: RescoInstallationSite[];
  }> {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_RESCO_VIEW_INSTALLED, { method: 'GET' });
    const payload = res.data || res.raw?.data || res.raw || {};
    const detail = payload.detail || payload.stats || {};
    const pendingList: any[] = Array.isArray(payload.verify_pending)
      ? payload.verify_pending
      : Array.isArray(payload.pending)
      ? payload.pending
      : [];
    const completeList: any[] = Array.isArray(payload.verify_complete)
      ? payload.verify_complete
      : Array.isArray(payload.verified)
      ? payload.verified
      : [];

    const normalizeSite = (s: any): RescoInstallationSite => ({
      id: Number(s.id),
      installation_date: s.installation_date || s.inst_date || s.created_at || '',
      uid: s.uid || s.unique_id || `JK-RSC-${s.id}`,
      state: 'jammu',
      district: s.district || 'Jammu',
      site_name: s.site_name || s.farmer_name || '',
      contact_person: s.contact_person || '',
      contact_number: s.contact_number || '',
      solarmeter_no: s.solarmeter_no || s.solar_meter_no || '',
      inverter_no: s.inverter_no || '',
      nm_sm_no: s.nm_sm_no || s.net_smart_meter_no || '',
      loger_no: s.loger_no || '',
      panel_no: s.panel_no || '',
      system_image: s.system_image || null,
      inverter_image: s.inverter_image || null,
      panel_image: s.panel_image || null,
      nm_sm_image: s.nm_sm_image || s.net_meter_image || null,
      loger_image: s.loger_image || null,
      latitude: s.latitude || s.inst_latitude || '',
      longitude: s.longitude || s.inst_longitude || '',
      remark: s.remark || s.inst_remarks || '',
      installation_status: Number(s.inst_status) === 1 ? 'Complete' : 'Pending',
      panel_status: s.panel_status || (s.panel_no ? 'Complete' : 'Pending'),
      verify_status: Number(s.verify_status ?? s.inst_verify_status ?? 0),
      inst_verify_status: Number(s.inst_verify_status ?? s.verify_status ?? 0),
      verify_remarks: s.verify_remarks || s.inst_verify_remarks || '',
      verify_by: s.verify_by || s.inst_verify_by || '',
      verify_date: s.verify_date || s.inst_verify_date || '',
      verify_file: s.verify_file || s.inst_verify_file || null,
      ...s,
    });

    return {
      detail: {
        total: Number(detail.total || pendingList.length + completeList.length),
        assigned: Number(detail.assigned || pendingList.length + completeList.length),
        not_assigned: Number(detail.not_assigned || 0),
        complete: Number(detail.complete || completeList.length),
        pending: Number(detail.pending || pendingList.length),
        verify_approved: Number(detail.verify_approved || completeList.filter((x) => Number(x.verify_status ?? x.inst_verify_status) === 1).length),
        verify_pending: Number(detail.verify_pending || pendingList.length),
        verify_reject: Number(detail.verify_reject || completeList.filter((x) => Number(x.verify_status ?? x.inst_verify_status) === 2).length),
      },
      verify_pending: pendingList.map(normalizeSite),
      verify_complete: completeList.map(normalizeSite),
    };
  }

  /**
   * 10. POST /jammu/resco/installation/verify-installation-status
   * Supports JSON & multipart/form-data for verify file
   */
  async verifyInstallationStatus(data: {
    id: number | string;
    status: number;
    file?: File | null;
    remark?: string;
    remarks?: string;
    inst_verify_remarks?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    let body: any;
    if (data.file) {
      const fd = new FormData();
      fd.append('id', String(data.id));
      fd.append('status', String(data.status));
      fd.append('file', data.file);
      const rem = data.inst_verify_remarks || data.remarks || data.remark || '';
      if (rem) {
        fd.append('inst_verify_remarks', rem);
        fd.append('remark', rem);
        fd.append('remarks', rem);
      }
      body = fd;
    } else {
      body = JSON.stringify({
        id: data.id,
        status: data.status,
        inst_verify_remarks: data.inst_verify_remarks || data.remarks || data.remark,
        remark: data.inst_verify_remarks || data.remarks || data.remark,
        remarks: data.inst_verify_remarks || data.remarks || data.remark,
      });
    }

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_RESCO_VERIFY_INSTALLATION, {
      method: 'POST',
      body,
    });
    return {
      success: res.success,
      message:
        res.message ||
        (res.success
          ? data.status === 1
            ? 'Installation Approved Successfully.'
            : 'Installation Rejected Successfully.'
          : 'Failed to verify installation.'),
      data: res.data,
    };
  }

  /**
   * Helper to get vendor mapping (ID -> Name)
   */
  async getVendorMap(): Promise<Record<string, string>> {
    try {
      const { vendor } = await this.getAssignFormData();
      const map: Record<string, string> = {};
      (vendor || []).forEach((v) => {
        map[String(v.id)] = v.name;
      });
      return map;
    } catch {
      return {};
    }
  }

  /**
   * 11. GET /jammu/resco/installation/view-installation-document
   */
  async getViewInstallationDocument(): Promise<{
    detail: RescoDocDetailCounts;
    verification: RescoDocItem[];
    verified: RescoDocItem[];
  }> {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_RESCO_VIEW_DOC, { method: 'GET' });
    const payload = res.data || res.raw?.data || res.raw || {};
    const detail = payload.detail || payload.stats || {};
    const verList: any[] = Array.isArray(payload.verification)
      ? payload.verification
      : Array.isArray(payload.pending)
      ? payload.pending
      : [];
    const verifiedList: any[] = Array.isArray(payload.verified)
      ? payload.verified
      : Array.isArray(payload.complete)
      ? payload.complete
      : [];

    const normalizeDoc = (d: any): RescoDocItem => {
      const rawDocFile =
        d.inst_doc_file ||
        d.document_file ||
        d.doc_file ||
        d.file ||
        d.inst_doc ||
        d.document ||
        d.hoc_photo ||
        null;
      return {
        ...d,
        id: Number(d.id),
        vendor_name: d.vendor_name || d.vendor || d.firm_name || (d.inst_vendor ? `Vendor #${d.inst_vendor}` : '') || d.vendors?.name || '',
        state: 'jammu',
        district: d.district || 'Jammu',
        site_name: d.site_name || d.farmer_name || '',
        contact_person: d.contact_person || '',
        contact_number: d.contact_number || '',
        document_file: rawDocFile,
        inst_doc_file: rawDocFile,
        submit_date: d.inst_doc_date || d.submit_date || d.doc_date || d.created_at || '',
        remarks: d.inst_doc_remarks || d.remarks || d.inst_remarks || '',
        verify_status: Number(d.inst_doc_status ?? d.verify_status ?? 0),
        inst_doc_status: Number(d.inst_doc_status ?? d.verify_status ?? 0),
        verify_remarks: d.inst_doc_verify_remarks || d.verify_remarks || d.doc_verify_remarks || '',
      };
    };

    return {
      detail: {
        total: Number(detail.total || verList.length + verifiedList.length),
        assigned: Number(detail.assigned || verList.length + verifiedList.length),
        not_assigned: Number(detail.not_assigned || 0),
        complete: Number(detail.complete || verifiedList.length),
        pending: Number(detail.pending || verList.length),
        doc_approved: Number(detail.doc_approved || verifiedList.filter((x) => Number(x.inst_doc_status ?? x.verify_status) === 2).length),
        doc_pending: Number(detail.doc_pending || verList.length),
        doc_reject: Number(detail.doc_reject || verifiedList.filter((x) => Number(x.inst_doc_status ?? x.verify_status) === 3).length),
      },
      verification: verList.map(normalizeDoc),
      verified: verifiedList.map(normalizeDoc),
    };
  }

  /**
   * 12. POST /jammu/resco/installation/verify-document-status
   * Params: { id, status: 1 | 2 | 3, remarks?: string }
   */
  async verifyDocumentStatus(data: {
    id: number | string;
    status: number;
    remarks?: string;
  }): Promise<{ success: boolean; status?: boolean; message: string; data?: any }> {
    const fd = new FormData();
    fd.append('id', String(data.id));
    fd.append('status', String(data.status));
    if (data.remarks) fd.append('remarks', data.remarks);

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_RESCO_VERIFY_DOC, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: fd,
    });
    return {
      success: Boolean(res.success || (res as any).status),
      status: Boolean(res.success || (res as any).status),
      message:
        res.message ||
        (res.success
          ? Number(data.status) === 2 || Number(data.status) === 1
            ? 'Documents Approved Successfully.'
            : 'Documents Rejected Successfully.'
          : 'Failed to verify documents.'),
      data: res.data,
    };
  }

  async verifyInstallationDocument(data: {
    id: number | string;
    status: number;
    remarks?: string;
  }): Promise<{ success: boolean; status?: boolean; message: string; data?: any }> {
    return this.verifyDocumentStatus(data);
  }

  /**
   * 13. GET /jammu/resco/installation/view-claim
   */
  async getViewClaim(): Promise<{
    claims: RescoClaimRecord[];
    claim_details: RescoClaimDetailCounts;
  }> {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_RESCO_VIEW_CLAIM, { method: 'GET' });
    const payload = res.data || res.raw?.data || res.raw || {};
    const claims = Array.isArray(payload.claims)
      ? payload.claims
      : Array.isArray(payload.claimrequest)
      ? payload.claimrequest
      : (Array.isArray(payload) ? payload : []);
    const details = payload.claim_details || payload.stats || {};

    const cleanClaims: RescoClaimRecord[] = claims.map((c: any) => ({
      id: Number(c.id),
      vendor_id: c.vendor_id || c.vendor || '',
      date: c.date || c.inst_claim_date || c.created_at || '',
      amount: c.amount || c.inst_claim_amount || 0,
      payment_type: Number(c.payment_type || 1),
      claim_status: Number(c.claim_status ?? c.inst_claim_status ?? 0),
      pay_status: Number(c.pay_status || 0),
      site_id: c.site_id || [],
      vendors: c.vendors || (c.vendor_name ? { id: c.vendor_id, name: c.vendor_name } : undefined),
      sites: Array.isArray(c.sites)
        ? c.sites.map((s: any) => ({
            id: Number(s.id),
            state: 'jammu',
            district: s.district || 'Jammu',
            address: s.address || '',
            site_name: s.site_name || s.farmer_name || '',
            ...s,
          }))
        : [],
      invoice_file: c.invoice_file || c.file || null,
      remarks: c.remarks || '',
      approved_remarks: c.approved_remarks || c.verify_remarks || '',
      verify_remarks: c.verify_remarks || c.approved_remarks || '',
      ...c,
    }));

    return {
      claims: cleanClaims,
      claim_details: {
        total: Number(details.total || cleanClaims.length),
        claim_approved: Number(details.claim_approved || cleanClaims.filter((x) => x.claim_status === 2 || x.claim_status === 1).length),
        claim_pending: Number(details.claim_pending || cleanClaims.filter((x) => x.claim_status === 0).length),
        claim_reject: Number(details.claim_reject || cleanClaims.filter((x) => x.claim_status === 3).length),
      },
    };
  }

  /**
   * 14. ANY /jammu/resco/installation/claim-status-update
   * Params: { id, status: 1 | 2 | 3, remarks?: string }
   */
  async updateClaimStatus(data: {
    id: number | string;
    status: number;
    remarks?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_RESCO_CLAIM_STATUS_UPDATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return {
      success: res.success,
      message: res.message || (res.success ? 'Claim status updated successfully.' : 'Failed to update claim.'),
      data: res.data,
    };
  }

  async verifyClaimStatus(
    id: number | string,
    status: number,
    remarks?: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    return this.updateClaimStatus({ id, status, remarks });
  }

  /**
   * 15. ANY /jammu/resco/installation/view-payment
   * Params: from_date, to_date, vendor, status
   */
  async getViewPayment(params?: {
    from_date?: string;
    to_date?: string;
    vendor?: string | number;
    status?: string | number;
  }): Promise<{
    payments: RescoPaymentRecord[];
    payments80: any[];
    payments20: any[];
    payment_detail: RescoPaymentDetailCounts;
    vendor: VendorItem[];
    vendors: VendorItem[];
    jammu_resco_pay_done1?: number;
    jammu_resco_pay_pending1?: number;
    jammu_resco_pay_done2?: number;
    jammu_resco_pay_pending2?: number;
  }> {
    const url =
      typeof JAMMU_VENDOR_API.ADMIN_RESCO_VIEW_PAYMENT === 'function'
        ? JAMMU_VENDOR_API.ADMIN_RESCO_VIEW_PAYMENT(params)
        : JAMMU_VENDOR_API.ADMIN_RESCO_VIEW_PAYMENT;
    const res = await apiRequest<any>(url, { method: 'GET' });
    const payload = res.data || res.raw?.data || res.raw || {};
    const payments = Array.isArray(payload.payments) ? payload.payments : [];
    const details = payload.payment_detail || payload.stats || {};
    const vendorList = Array.isArray(payload.vendor)
      ? payload.vendor
      : Array.isArray(payload.vendors)
      ? payload.vendors
      : [];

    const cleanPayments: any[] = payments.map((p: any) => {
      const siteNames = Array.isArray(p.sites) && p.sites.length > 0
        ? p.sites.map((s: any) => s.site_name || s.farmer_name || `Site #${s.id}`).join(', ')
        : p.site_name || `Site #${p.id}`;
      const districtName = Array.isArray(p.sites) && p.sites.length > 0 && p.sites[0].district
        ? p.sites[0].district
        : p.district || 'Jammu';
      const vendorName = p.vendors?.name || p.vendor_name || (p.vendor_id ? `Vendor #${p.vendor_id}` : '—');
      const firstDisbursed = Array.isArray(p.allpayment) && p.allpayment.length > 0 ? p.allpayment[0] : null;
      const secondDisbursed = Array.isArray(p.allpayment) && p.allpayment.length > 1 ? p.allpayment[1] : null;

      return {
        id: Number(p.id),
        vendor_id: p.vendor_id || '',
        vendor_name: vendorName,
        state: 'JAMMU',
        district: districtName,
        site_name: siteNames,
        amount: p.amount || 0,
        inst_claim_amount: p.amount || 0,
        inst_claim_date: p.date || p.inst_claim_date || p.created_at || '',
        inst_claim_invoice: p.invoice_file || p.file || null,
        inst_claim_update_date: p.updated_at || p.date || '',
        inst_claim_update_by: p.verify_by || 'Admin',
        payment_type: Number(p.payment_type || 1),
        pay_status: Number(p.pay_status || 0),
        allpayment: Array.isArray(p.allpayment) ? p.allpayment : [],
        vendors: p.vendors || undefined,
        sites: Array.isArray(p.sites) ? p.sites : [],
        invoice_file: p.invoice_file || p.file || null,
        remarks: p.remarks || '',

        // 80% fields
        inst_pay80: firstDisbursed?.amount ?? (Number(p.pay_status) === 1 ? p.amount : 0),
        inst_pay80_date: firstDisbursed?.date ?? (Number(p.pay_status) === 1 ? p.updated_at : ''),
        inst_pay80_remark: firstDisbursed?.pay_remarks ?? p.remarks ?? '',
        inst_pay80_status: Number(p.pay_status) === 1 ? 1 : 0,

        // 20% fields
        inst_pay20: secondDisbursed?.amount ?? 0,
        inst_pay20_date: secondDisbursed?.date ?? '',
        inst_pay20_remark: secondDisbursed?.pay_remarks ?? '',
        inst_pay20_status: secondDisbursed ? 1 : 0,

        ...p,
      };
    });

    const raw80 = Array.isArray(payload.payments80)
      ? payload.payments80
      : Array.isArray(payload.paymentrequests)
      ? payload.paymentrequests
      : cleanPayments.filter((x: any) => x.payment_type === 1 || !x.payment_type);

    const raw20 = Array.isArray(payload.payments20)
      ? payload.payments20
      : Array.isArray(payload.paymentrequests2)
      ? payload.paymentrequests2
      : cleanPayments.filter((x: any) => x.payment_type === 2);

    const done80 = raw80.filter((p: any) => Number(p.inst_pay80_status ?? p.pay_status) === 1).length;
    const pending80 = raw80.length - done80;
    const done20 = raw20.filter((p: any) => Number(p.inst_pay20_status ?? p.pay_status) === 1).length;
    const pending20 = raw20.length - done20;

    return {
      payments: cleanPayments,
      payments80: raw80.length > 0 ? raw80 : cleanPayments,
      payments20: raw20,
      payment_detail: {
        total: Number(details.total || cleanPayments.length),
        complete: Number(details.complete || done80 + done20),
        partially: Number(details.partially || 0),
        pending: Number(details.pending || pending80 + pending20),
      },
      vendor: vendorList,
      vendors: vendorList,
      jammu_resco_pay_done1: done80,
      jammu_resco_pay_pending1: pending80,
      jammu_resco_pay_done2: done20,
      jammu_resco_pay_pending2: pending20,
    };
  }

  /**
   * 16. ANY /jammu/resco/installation/update-payment-status
   * Supports both milestone { pay80_id, pay20_id } and direct { id, amount, date, remarks }
   */
  async updatePaymentStatus(data: {
    id?: number | string;
    amount?: number | string;
    date?: string;
    remarks?: string;
    pay80_id?: number | string;
    inst_pay80?: number | string;
    inst_pay80_date?: string;
    inst_pay80_remark?: string;
    pay20_id?: number | string;
    inst_pay20?: number | string;
    inst_pay20_date?: string;
    inst_pay20_remark?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    const targetId = data.id ?? data.pay80_id ?? data.pay20_id;
    const targetAmount = data.amount ?? data.inst_pay80 ?? data.inst_pay20 ?? 0;
    const targetDate = data.date ?? data.inst_pay80_date ?? data.inst_pay20_date ?? new Date().toISOString().split('T')[0];
    const targetRemarks = data.remarks ?? data.inst_pay80_remark ?? data.inst_pay20_remark ?? '';

    const fd = new FormData();
    fd.append('id', String(targetId));
    fd.append('claim_id', String(targetId));
    if (data.pay80_id) fd.append('pay80_id', String(data.pay80_id));
    if (data.pay20_id) fd.append('pay20_id', String(data.pay20_id));
    fd.append('amount', String(targetAmount));
    if (data.inst_pay80) fd.append('inst_pay80', String(data.inst_pay80));
    if (data.inst_pay20) fd.append('inst_pay20', String(data.inst_pay20));
    fd.append('date', targetDate);
    if (data.inst_pay80_date) fd.append('inst_pay80_date', data.inst_pay80_date);
    if (data.inst_pay20_date) fd.append('inst_pay20_date', data.inst_pay20_date);
    if (targetRemarks) {
      fd.append('remarks', targetRemarks);
      fd.append('pay_remarks', targetRemarks);
      if (data.inst_pay80_remark) fd.append('inst_pay80_remark', data.inst_pay80_remark);
      if (data.inst_pay20_remark) fd.append('inst_pay20_remark', data.inst_pay20_remark);
    }

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_RESCO_UPDATE_PAYMENT, {
      method: 'POST',
      body: fd,
    });
    return {
      success: res.success,
      message: res.message || (res.success ? 'Payment successfully recorded.' : 'Failed to record payment.'),
      data: res.data,
    };
  }

  /**
   * 17. GET /jammu/resco/installation/view-panel/{id}
   */
  async getViewPanel(id: string | number): Promise<{
    resco: any;
    panels: any[];
  }> {
    const url =
      typeof JAMMU_VENDOR_API.ADMIN_RESCO_VIEW_PANEL === 'function'
        ? JAMMU_VENDOR_API.ADMIN_RESCO_VIEW_PANEL(id)
        : `${JAMMU_VENDOR_API.ADMIN_RESCO_VIEW_PANEL}/${encodeURIComponent(id)}`;
    const res = await apiRequest<any>(url, { method: 'GET' });
    const payload = res.data || res.raw?.data || res.raw || {};
    return {
      resco: payload.resco || {},
      panels: Array.isArray(payload.panels) ? payload.panels : [],
    };
  }

  /**
   * 18. GET /jammu/resco/installation/view-create-bill
   */
  async getViewCreateBill(): Promise<{ bills: RescoBillItem[] }> {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_RESCO_VIEW_CREATE_BILL, { method: 'GET' });
    const payload = res.data || res.raw?.data || res.raw || {};
    const bills = Array.isArray(payload.bills) ? payload.bills : Array.isArray(payload) ? payload : [];
    const cleanBills: RescoBillItem[] = bills.map((b: any) => ({
      id: Number(b.id),
      resco_id: b.resco_id,
      month_year: b.month_year || b.months_and_year || '',
      months_and_year: b.months_and_year || b.month_year || '',
      type: b.type,
      verify_status: Number(b.verify_status || 0),
      verify_remarks: b.verify_remarks || '',
      bill_no: b.bill_no || '',
      bill_amount: b.bill_amount || 0,
      reading: b.reading || '',
      documents: b.documents || b.file || null,
      file: b.file || b.documents || null,
      state: 'jammu',
      district: b.district || b.resco?.district || 'Jammu',
      site_name: b.site_name || b.resco?.site_name || '',
      inverter_no: b.inverter_no || b.resco?.inverter_no || '',
      resco: b.resco,
      ...b,
    }));
    return { bills: cleanBills };
  }

  /**
   * 19. POST /jammu/resco/installation/resco/verify-bill-status/{id}
   * Params: { verify_status: 1 | 2, remarks: string, bill_amount: number | string }
   */
  async verifyBillStatus(
    id: string | number,
    data: {
      verify_status: number;
      remarks: string;
      bill_amount: number | string;
    }
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const url =
      typeof JAMMU_VENDOR_API.ADMIN_RESCO_VERIFY_BILL_STATUS === 'function'
        ? JAMMU_VENDOR_API.ADMIN_RESCO_VERIFY_BILL_STATUS(id)
        : `${JAMMU_VENDOR_API.ADMIN_RESCO_VERIFY_BILL_STATUS}/${encodeURIComponent(id)}`;
    const res = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return {
      success: res.success,
      message:
        res.message ||
        (res.success
          ? data.verify_status === 1
            ? 'Bill verified successfully.'
            : 'Bill rejected successfully.'
          : 'Failed to update bill verification.'),
      data: res.data,
    };
  }

  /**
   * 20. GET /jammu/resco/installation/view-assign-vendor
   * Returns vendors & srtRecords
   */
  async getViewAssignVendor(): Promise<{
    vendors: VendorItem[];
    srtRecords: any[];
  }> {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_RESCO_VIEW_ASSIGN_VENDOR, { method: 'GET' });
    const payload = res.data || res.raw?.data || res.raw || {};
    return {
      vendors: Array.isArray(payload.vendors) ? payload.vendors : [],
      srtRecords: Array.isArray(payload.srtRecords) ? payload.srtRecords : [],
    };
  }

  /**
   * 21. GET /jammu/resco/installation/fetch-site-detail?srt_id={srt_id}
   */
  async fetchSiteDetail(srtId: string | number): Promise<{ success: boolean; srt: any; message?: string }> {
    const url =
      typeof JAMMU_VENDOR_API.ADMIN_RESCO_FETCH_SITE_DETAIL === 'function'
        ? JAMMU_VENDOR_API.ADMIN_RESCO_FETCH_SITE_DETAIL(srtId)
        : `${JAMMU_VENDOR_API.ADMIN_RESCO_FETCH_SITE_DETAIL}?srt_id=${encodeURIComponent(srtId)}`;
    const res = await apiRequest<any>(url, { method: 'GET' });
    const payload = res.data || res.raw || {};
    return {
      success: res.success,
      srt: payload.srt || payload.data || payload,
      message: res.message,
    };
  }

  /**
   * 22. POST /jammu/resco/installation/store (multipart/form-data for Survey Report)
   * Primary route: https://klkerp.com/api/admin/jk/resco/installation/store
   * Fallback candidates: /api/jk/resco/installation/store, /api/jk/resco-survey-store, /api/admin/jk/resco/survey/store
   */
  async storeSurvey(formData: FormData): Promise<{ success: boolean; message: string; data?: any }> {
    const candidateUrls = [
      JAMMU_VENDOR_API.ADMIN_RESCO_STORE_SURVEY,
      'https://klkerp.com/api/jk/resco/installation/store',
      'https://klkerp.com/api/jk/resco-survey-store',
      'https://klkerp.com/api/admin/jk/resco/survey/store',
      'https://klkerp.com/api/admin/jammu/resco/installation/store',
      'https://klkerp.com/api/jammu/resco/installation/store',
    ];

    let lastRes: any = null;

    for (const url of candidateUrls) {
      try {
        // Clone FormData so each attempt starts with fresh unconsumed streams
        const fdClone = new FormData();
        formData.forEach((value, key) => {
          fdClone.append(key, value);
        });

        const res = await apiRequest(url, {
          method: 'POST',
          body: fdClone,
        });

        if (res.success) {
          return {
            success: true,
            message: res.message || 'Survey completed successfully.',
            data: res.data,
          };
        }

        lastRes = res;

        // If the server returned explicit validation errors (HTTP 422), stop and return them
        if (res.errors && typeof res.errors === 'object' && Object.keys(res.errors).length > 0 && res.raw?.status !== 404) {
          break;
        }
      } catch (err: any) {
        lastRes = { success: false, message: err?.message || 'Network error occurred.' };
      }
    }

    return {
      success: false,
      message: lastRes?.message || 'Failed to save survey. Please check site details.',
      data: lastRes?.data,
    };
  }

  /**
   * 23. POST /jammu/resco/installation/update-site-name/{id}
   */
  async updateSiteName(id: string | number, siteName: string): Promise<{ success: boolean; message: string }> {
    const url =
      typeof JAMMU_VENDOR_API.ADMIN_RESCO_UPDATE_SITE_NAME === 'function'
        ? JAMMU_VENDOR_API.ADMIN_RESCO_UPDATE_SITE_NAME(id)
        : `${JAMMU_VENDOR_API.ADMIN_RESCO_UPDATE_SITE_NAME}/${encodeURIComponent(id)}`;
    const res = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ site_name: siteName }),
    });
    return {
      success: res.success,
      message: res.message || (res.success ? 'Site name updated successfully.' : 'Failed to update site name.'),
    };
  }

  /**
   * 24. ANY /jammu/resco/installation/dashboard?volume={volume}
   */
  async getDashboard(volume?: string | number): Promise<RescoDashboardData> {
    const url =
      typeof JAMMU_VENDOR_API.ADMIN_RESCO_DASHBOARD === 'function'
        ? JAMMU_VENDOR_API.ADMIN_RESCO_DASHBOARD(volume)
        : volume && volume !== 'all'
        ? `${JAMMU_VENDOR_API.ADMIN_RESCO_DASHBOARD}?volume=${encodeURIComponent(volume)}`
        : JAMMU_VENDOR_API.ADMIN_RESCO_DASHBOARD;
    const res = await apiRequest<any>(url, { method: 'GET' });
    const payload = res.data || res.raw?.data || res.raw || {};
    const r = payload.resco || payload.stats || {};

    const totals: RescoDashboardTotals = {
      site_count: Number(r.site_count || r.totalsite || 0),
      assigned: Number(r.assigned || r.site_assigned || 0),
      not_assigned: Number(r.not_assigned || r.site_not_assigned || 0),
      complete: Number(r.complete || 0),
      pending: Number(r.pending || 0),
      verify_pending: Number(r.verify_pending || 0),
      verify_approved: Number(r.verify_approved || 0),
      verify_reject: Number(r.verify_reject || 0),
      doc_approved: Number(r.doc_approved || 0),
      doc_pending: Number(r.doc_pending || 0),
      doc_reject: Number(r.doc_reject || 0),
      inst_claim1_pending: Number(r.inst_claim1_pending || 0),
      inst_claim1_approved: Number(r.inst_claim1_approved || 0),
      inst_claim1_reject: Number(r.inst_claim1_reject || 0),
      inst_claim2_pending: Number(r.inst_claim2_pending || 0),
      inst_claim2_approved: Number(r.inst_claim2_approved || 0),
      inst_claim2_reject: Number(r.inst_claim2_reject || 0),
      inst_claim3_pending: Number(r.inst_claim3_pending || 0),
      inst_claim3_approved: Number(r.inst_claim3_approved || 0),
      inst_claim3_reject: Number(r.inst_claim3_reject || 0),
      inst_pay1_complete: Number(r.inst_pay1_complete || 0),
      inst_pay1_partially: Number(r.inst_pay1_partially || 0),
      inst_pay1_pending: Number(r.inst_pay1_pending || 0),
      inst_pay2_complete: Number(r.inst_pay2_complete || 0),
      inst_pay2_partially: Number(r.inst_pay2_partially || 0),
      inst_pay2_pending: Number(r.inst_pay2_pending || 0),
      inst_pay3_complete: Number(r.inst_pay3_complete || 0),
      inst_pay3_partially: Number(r.inst_pay3_partially || 0),
      inst_pay3_pending: Number(r.inst_pay3_pending || 0),
    };

    return {
      loginId: payload.loginId,
      loginName: payload.loginName,
      company_id: payload.company_id,
      role: payload.role,
      state: 'jammu',
      vol: Array.isArray(payload.vol) ? payload.vol.map(String) : [],
      resco: totals,
      district_install: Array.isArray(payload.district_install) ? payload.district_install : [],
      districtwise: Array.isArray(payload.districtwise) ? payload.districtwise : [],
      vendorwises: Array.isArray(payload.vendorwises)
        ? payload.vendorwises
        : Array.isArray(payload.vendorswise)
        ? payload.vendorswise
        : [],
      vendors: Array.isArray(payload.vendors) ? payload.vendors : [],
      vendor_installation_month: Array.isArray(payload.vendor_installation_month) ? payload.vendor_installation_month : [],
      vendor_today_installation: Array.isArray(payload.vendor_today_installation) ? payload.vendor_today_installation : [],
    };
  }

  /**
   * 25. GET /jammu/resco/installation/view-dashboard/{status}/{volume?}
   */
  async getViewDashboard(status: string, volume: string = 'all'): Promise<RescoSiteRow[]> {
    const url =
      typeof JAMMU_VENDOR_API.ADMIN_RESCO_VIEW_DASHBOARD === 'function'
        ? JAMMU_VENDOR_API.ADMIN_RESCO_VIEW_DASHBOARD(status, volume)
        : `${JAMMU_VENDOR_API.ADMIN_RESCO_VIEW_DASHBOARD}/${encodeURIComponent(status)}/${encodeURIComponent(volume || 'all')}`;
    const res = await apiRequest<any>(url, { method: 'GET' });
    const payload = res.data || res.raw?.data || res.raw || {};
    const list = Array.isArray(payload.resco) ? payload.resco : Array.isArray(payload) ? payload : [];
    return list.map((item: any) => ({
      id: Number(item.id),
      state: 'jammu',
      district: item.district || 'Jammu',
      site_name: item.site_name || item.farmer_name || '',
      ...item,
    }));
  }

  /**
   * 26. GET /jammu/resco/installation/vendorwise-data/{status}/{vendor}/{volume?}
   */
  async getVendorwiseData(
    status: string,
    vendor: string | number,
    volume: string = 'all'
  ): Promise<RescoSiteRow[]> {
    const url =
      typeof JAMMU_VENDOR_API.ADMIN_RESCO_VENDORWISE_DATA === 'function'
        ? JAMMU_VENDOR_API.ADMIN_RESCO_VENDORWISE_DATA(status, vendor, volume)
        : `${JAMMU_VENDOR_API.ADMIN_RESCO_VENDORWISE_DATA}/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}/${encodeURIComponent(volume || 'all')}`;
    const res = await apiRequest<any>(url, { method: 'GET' });
    const payload = res.data || res.raw?.data || res.raw || {};
    const list = Array.isArray(payload.resco) ? payload.resco : Array.isArray(payload) ? payload : [];
    return list.map((item: any) => ({
      id: Number(item.id),
      state: 'jammu',
      district: item.district || 'Jammu',
      site_name: item.site_name || item.farmer_name || '',
      ...item,
    }));
  }

  /**
   * 27. GET /jammu/resco/installation/districtwise-data/{status}/{district}/{volume?}
   */
  async getDistrictwiseData(
    status: string,
    district: string,
    volume: string = 'all'
  ): Promise<RescoSiteRow[]> {
    const url =
      typeof JAMMU_VENDOR_API.ADMIN_RESCO_DISTRICTWISE_DATA === 'function'
        ? JAMMU_VENDOR_API.ADMIN_RESCO_DISTRICTWISE_DATA(status, district, volume)
        : `${JAMMU_VENDOR_API.ADMIN_RESCO_DISTRICTWISE_DATA}/${encodeURIComponent(status)}/${encodeURIComponent(district)}/${encodeURIComponent(volume || 'all')}`;
    const res = await apiRequest<any>(url, { method: 'GET' });
    const payload = res.data || res.raw?.data || res.raw || {};
    const list = Array.isArray(payload.resco) ? payload.resco : Array.isArray(payload) ? payload : [];
    return list.map((item: any) => ({
      id: Number(item.id),
      state: 'jammu',
      district: item.district || district,
      site_name: item.site_name || item.farmer_name || '',
      ...item,
    }));
  }
}

export const jammuRescoAdminService = new JammuRescoAdminService();
export default jammuRescoAdminService;
