import { API_BASE_URL, authService } from '../../../../../services/authService';
import { resolveJammuMediaUrl, getJammuMediaCandidates } from '../../../../V-Portal/jammu/jammu-services/jammuSrt70mwService';
import { JAMMU_VENDOR_API, buildCandidateUrls as buildCentralCandidateUrls } from '../../../Vendor_Management_APIS/Jammu_Vendor_API';

export { resolveJammuMediaUrl, getJammuMediaCandidates, JAMMU_VENDOR_API };

/**
 * Base URL resolution:
 * Ensures requests target the correct API route prefix.
 */
const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const BASE_API_URL = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;
export const BASE_ROOT_URL = BASE_API_URL.replace(/\/api\/?$/, '');
export const ADMIN_API_URL = `${BASE_API_URL}/admin`;
export const ADMIN_ROOT_URL = `${BASE_ROOT_URL}/admin`;

/**
 * Universal token getter
 */
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

  // Include XSRF-TOKEN if present in document cookies for Laravel Sanctum SPA
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

/**
 * Build candidate URLs for Jammu SRT 70MW Admin Controller.
 * Super Admin controllers on klkerp.com are mounted under /api/admin/...
 * Controller: App\Http\Controllers\admin\jammu\JammuSrt70mwInstallationController
 */
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

  // Separate query string if present
  let pathname = path;
  let search = '';
  const qIndex = path.indexOf('?');
  if (qIndex !== -1) {
    pathname = path.slice(0, qIndex);
    search = path.slice(qIndex);
  }

  // Strip repeated /api/admin, /admin, /api prefixes until clean
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

  const routePath = `${cleaned}${search}`;
  const capitalizedPath = `${cleaned.replace(/\/jammu\//i, '/Jammu/')}${search}`;

  const candidates: string[] = [
    // 1. API Admin route: e.g. https://klkerp.com/api/admin/jammu/srt70mw/installation/... (PRIMARY for Admin Controllers)
    `${ADMIN_API_URL}${routePath}`,

    // 2. Direct API route: e.g. https://klkerp.com/api/jammu/srt70mw/installation/...
    `${BASE_API_URL}${routePath}`,

    // 3. Web Admin route: e.g. https://klkerp.com/admin/jammu/srt70mw/installation/...
    `${ADMIN_ROOT_URL}${routePath}`,

    // 4. Direct Root route: e.g. https://klkerp.com/jammu/srt70mw/installation/...
    `${BASE_ROOT_URL}${routePath}`,

    // 5. Capitalized 'Jammu' variants (Laravel sometimes has case-sensitive folder routes)
    `${ADMIN_API_URL}${capitalizedPath}`,
    `${BASE_API_URL}${capitalizedPath}`,

    // 6. Relative paths (for dev proxy or same-origin)
    `/api/admin${routePath}`,
    `/api${routePath}`,
    `/admin${routePath}`,
    `${routePath}`,
  ];

  return Array.from(new Set(candidates));
}

/* ═══════════════════════════════════════════════════════════════════════════
   TypeScript Interfaces for Admin Jammu SRT 70MW Installation Controller
   ═══════════════════════════════════════════════════════════════════════════ */

export interface VendorItem {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  state?: string;
  company_id?: number;
}

export interface DistrictItem {
  district: string;
}

export interface SiteItem {
  id: number;
  site_name: string;
  site_code?: string;
  ca_no?: string;
  sanction_load?: string | number;
  division?: string;
  subdivision?: string;
  address?: string;
  contact_person?: string;
  contact_number?: string;
  inst_deadline?: string;
}

// 1. Assign Form Data Response
export interface AssignFormDataResponse {
  loginId: number;
  loginName: string;
  company_id: number;
  role: string;
  state: string;
  user_type: string;
  vendor: VendorItem[];
}

// 5. View Assign Response
export interface AmcSrtRecord {
  id: number;
  vendor: number;
  purpose: string;
  state: string;
  district: string;
  site_name: string; // JSON string e.g. "[901,902]" or plain string
  sitecount: number;
  assign_date: string;
  file?: string | null;
  remarks?: string | null;
  status: number; // 0 = Approval pending, 1 = Approved
  vendors?: { id: number; name: string };
  sites?: Array<{
    id: number;
    site_name: string;
    site_code?: string;
    inst_deadline?: string;
    ca_no?: string;
    sanction_load?: string | number;
    division?: string;
    address?: string;
  }>;
  [key: string]: any;
}

export interface ViewAssignData {
  amcsrtRecords: AmcSrtRecord[];
  claimedapplicable: number;
  approvedsite: number;
  verifypending: number;
  rejectsite: number;
  paymentsitecount: number;
  payment80: number;
  payment20: number;
  docsubmit: number;
  claimraised: number;
  complete: number;
  totalsite: number;
  pendingsite: number;
}

// 7. Assign Vendor Details Response
export interface AssignVendorDetailsData {
  vendor: VendorItem;
  claimedapplicable: number;
  approvedsite: number;
  verifypending: number;
  rejectsite: number;
  paymentsitecount: number;
  payment80: number;
  payment20: number;
  docsubmit: number;
  claimraised: number;
  complete: number;
  totalsite: number;
  pendingsite: number;
  paymentsite: any[];
  completesite: any[];
}

// 8. Edit Assign Response
export interface EditAssignData {
  assignSrt: {
    id: number;
    vendor: number;
    state: string;
    district: string;
    site_name: string;
    file?: string | null;
    remarks?: string | null;
    purpose?: string;
  };
  vendor: VendorItem[];
  districts: DistrictItem[];
  sites: SiteItem[];
}

// 10. View Installation Response
export interface InstallationVerificationItem {
  id: number;
  vendor_name: string;
  inst_vendor: number;
  state: string;
  district: string;
  site_name: string;
  contact_person: string;
  contact_number: string;
  solarmeter_no?: string;
  inverter_no?: string;
  nm_sm_no?: string;
  panel_no?: string;
  loger_no?: string;
  system_image?: string | null;
  inverter_image?: string | null;
  panel_image?: string | null;
  nm_sm_image?: string | null;
  loger_image?: string | null;
  inst_latitude?: string;
  inst_longitude?: string;
  inst_remarks?: string;
  inst_verify_file?: string | null;
  inst_verify_remark?: string | null;
  inst_verify_status: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  [key: string]: any;
}

export interface ViewInstallationData {
  totalsite: number;
  complete: number;
  pendingsite: number;
  approvedsite: number;
  rejectsite: number;
  verifypending: number;
  claimedapplicable: number;
  claimraised: number;
  docsubmit: number;
  payment80: number;
  payment20: number;
  paymentsitecount: number;
  verification: InstallationVerificationItem[];
  verified: InstallationVerificationItem[];
}

// 12. View Claim Response
export interface ClaimRequestItem {
  id: number;
  state: string;
  district: string;
  site_name: string;
  inst_claim_date: string;
  inst_claim_invoice?: string | null;
  inst_claim_amount: string | number;
  inst_claim_update_date?: string | null;
  inst_claim_update_by?: number | string | null;
  inst_claim_status: number; // 0 = Not raised, 1 = Raised / Pending, 2 = Approved, 3 = Rejected
  inst_doc_submit: number; // 0 = Pending, 1 = Submitted, 2 = Approved, 3 = Rejected
  vendor_name?: string;
  [key: string]: any;
}

export interface ViewClaimData {
  claimrequest: ClaimRequestItem[];
}

// 15. View Payment Response
export interface Payment80Item {
  id: number;
  vendor_name: string;
  state: string;
  district: string;
  site_name: string;
  inst_claim_date: string;
  inst_claim_invoice?: string | null;
  inst_claim_amount: string | number;
  inst_claim_update_date?: string | null;
  inst_claim_update_by?: number | string | null;
  inst_pay80_date?: string | null;
  inst_pay80?: string | number | null;
  inst_pay80_remark?: string | null;
  inst_pay80_status: number; // 0 = Pending, 1 = Paid
  [key: string]: any;
}

export interface Payment20Item {
  id: number;
  vendor_name: string;
  state: string;
  district: string;
  site_name: string;
  inst_claim_date: string;
  inst_claim_invoice?: string | null;
  inst_claim_amount: string | number;
  inst_claim_update_date?: string | null;
  inst_claim_update_by?: number | string | null;
  inst_doc_submit?: number;
  inst_pay20_date?: string | null;
  inst_pay20?: string | number | null;
  inst_pay20_remark?: string | null;
  inst_pay20_status: number; // 0 = Pending, 1 = Paid
  [key: string]: any;
}

export interface ViewPaymentData {
  vendors: VendorItem[];
  paymentrequests: any[];
  jammu_srt70mw_pay_pending1: number;
  jammu_srt70mw_pay_pending2: number;
  total_jammu_srt70mw_pay_pending: number;
  jammu_srt70mw_pay_done1: number;
  jammu_srt70mw_pay_done2: number;
  total_jammu_srt70mw_pay_done: number;
  payments80: Payment80Item[];
  payments20: Payment20Item[];
  filters: {
    from_date?: string | null;
    to_date?: string | null;
    vendor?: string | number | null;
  };
}

// 17. Dashboard Response
export interface DashboardSrtOverview {
  site_count: number;
  material_dispatch: number;
  material_pending: number;
  site_assigned: number;
  site_not_assigned: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  inst_doc_complete: number;
  inst_doc_pending: number;
  inst_pay80_complete: number;
  inst_pay20_complete: number;
  inst_pay80_pending: number;
  inst_pay20_pending: number;
  inst_pay80_amount: number;
  inst_pay20_amount: number;
}

export interface DashboardVendorItem {
  inst_vendor: number | string;
  vendor: number | string;
  name: string;
}

export interface DashboardVendorWiseItem {
  inst_vendor: number | string;
  site_count: number;
  material_dispatch: number;
  material_pending: number;
  inst_complete: number;
  inst_pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  inst_pay80_complete: number;
  inst_pay20_complete: number;
  inst_pay80_pending: number;
  inst_pay20_pending: number;
}

export interface DashboardDistrictWiseItem {
  district: string;
  site_count: number;
  total_assigned: number;
  material_dispatch: number;
  material_pending: number;
  inst_complete: number;
  inst_pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  inst_pay80_complete: number;
  inst_pay20_complete: number;
  inst_pay80_pending: number;
  inst_pay20_pending: number;
}

export interface DashboardMonthlyInstallation {
  month_year: string;
  monthly_installations: number;
}

export interface DashboardTodayInstallation {
  inst_vendor: number | string;
  today_install: number;
}

export interface DashboardData {
  jammu_srt70mws: DashboardSrtOverview;
  vendors: DashboardVendorItem[];
  vendorswise: DashboardVendorWiseItem[];
  districtwise: DashboardDistrictWiseItem[];
  vendor_installation_month: DashboardMonthlyInstallation[];
  vendor_today_installation: DashboardTodayInstallation[];
}

export interface JammuSrtSiteRow {
  id: number;
  state?: string;
  department_name?: string;
  dept_name?: string;
  district?: string;
  location?: string;
  address?: string;
  site_name?: string;
  site_code?: string;
  firm_name?: string;
  work_order_no?: string;
  work_date?: string;
  loa_no?: string;
  phase?: string;
  sanction_load?: string | number;
  connection_phase?: string;
  ca_no?: string;
  material_status?: number | string;
  material_dispatch_date?: string;
  inst_vendor?: number | string;
  vendor_name?: string;
  vendors?: { id?: number; name?: string };
  inst_date?: string;
  installation_date?: string;
  contact_person?: string;
  contact_person_phone?: string;
  contact_number?: string;
  solar_meter_no?: string;
  inverter_no?: string;
  net_smart_meter_no?: string;
  nm_sm_no?: string;
  panel_no?: string | string[];
  loger_no?: string;
  system_image?: string;
  inverter_image?: string;
  panel_image?: string;
  net_smart_meter_image?: string;
  nm_sm_image?: string;
  loger_image?: string;
  latitude?: string | number;
  longitude?: string | number;
  lat?: string | number;
  long?: string | number;
  inst_remarks?: string;
  site_inst_status?: number | string;
  inst_status?: number | string;
  inst_verify_status?: number | string;
  inst_claim_status?: number | string;
  inst_pay80_status?: number | string;
  inst_pay80?: number | string;
  inst_pay80_date?: string;
  inst_pay20_status?: number | string;
  inst_pay20?: number | string;
  inst_pay20_date?: string;
  [key: string]: any;
}

export interface DrillDownResponse {
  loginId?: number;
  company_id?: number;
  jammusrt70mw: JammuSrtSiteRow[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   HTTP Request Helper with Multi-Candidate Fallback & Working-Prefix Cache
   ═══════════════════════════════════════════════════════════════════════════ */

let knownWorkingBase: string | null = null;

async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; errors?: any; raw?: any }> {
  let urlsToTry = buildJammuCandidateUrls(path);
  if (knownWorkingBase) {
    urlsToTry.sort((a, b) => {
      const aMatch = a.startsWith(knownWorkingBase!) ? -1 : 0;
      const bMatch = b.startsWith(knownWorkingBase!) ? -1 : 0;
      return aMatch - bMatch;
    });
  }

  let lastError: any = null;
  let lastJson: any = null;
  const isPost = (options.method || 'GET').toUpperCase() === 'POST';

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
        // Record which base prefix worked
        for (const base of [ADMIN_API_URL, BASE_API_URL, ADMIN_ROOT_URL, BASE_ROOT_URL]) {
          if (url.startsWith(base)) {
            knownWorkingBase = base;
            break;
          }
        }
        return {
          success: json?.success ?? true,
          data: json?.data !== undefined ? json.data : json,
          message: json?.message || 'Success',
          raw: json,
        };
      }

      // If 404 and we still have another URL variant, continue trying
      if (res.status === 404 && url !== urlsToTry[urlsToTry.length - 1]) {
        continue;
      }

      // If 405 Method Not Allowed on POST (Laravel web route expecting GET)
      if (res.status === 405 && isPost) {
        let queryParams = '';
        if (options.body instanceof FormData) {
          const q = new URLSearchParams();
          options.body.forEach((val, key) => {
            if (typeof val === 'string') q.append(key, val);
          });
          queryParams = q.toString();
        }
        const getUrl = queryParams ? `${url}${url.includes('?') ? '&' : '?'}${queryParams}` : url;
        try {
          const getRes = await fetch(getUrl, {
            method: 'GET',
            credentials: 'include',
            headers: getAuthHeaders(false),
          });
          const getJson = await getRes.json().catch(() => null);
          if (getRes.ok) {
            return {
              success: getJson?.success ?? true,
              data: getJson?.data !== undefined ? getJson.data : getJson,
              message: getJson?.message || 'Success',
              raw: getJson,
            };
          }
        } catch {
          // ignore fallback error
        }
      }

      // Special handling for 422 validation errors
      if (res.status === 422) {
        for (const base of [ADMIN_API_URL, BASE_API_URL, ADMIN_ROOT_URL, BASE_ROOT_URL]) {
          if (url.startsWith(base)) {
            knownWorkingBase = base;
            break;
          }
        }
        return {
          success: false,
          message: json?.message || 'Validation failed',
          errors: json?.errors || {},
          raw: json,
        };
      }

      // WhatsApp failure inside response
      if (json?.error && typeof json.error === 'string' && json.error.includes('SMS')) {
        return {
          success: false,
          message: json.error,
          errors: { notification: [json.error] },
          raw: json,
        };
      }

      return {
        success: false,
        message: json?.message || json?.error || `HTTP ${res.status}: ${res.statusText}`,
        errors: json?.errors,
        raw: json,
      };
    } catch (err: any) {
      lastError = err;
    }
  }

  return {
    success: false,
    message: lastError?.message || lastJson?.message || 'Network request failed',
    raw: lastJson,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Default Fallback Datasets (Ensures high resilience when backend is cold)
   ═══════════════════════════════════════════════════════════════════════════ */

export const FALLBACK_VENDORS: VendorItem[] = [];

export const FALLBACK_DISTRICTS: DistrictItem[] = [];
export const FALLBACK_SITES: SiteItem[] = [];

export class JammuSrt70mwAdminService {
  /**
   * 1. Assign (form data)
   */
  async getAssignFormData(): Promise<AssignFormDataResponse> {
    const res = await apiRequest<AssignFormDataResponse>(JAMMU_VENDOR_API.ADMIN_SRT70_ASSIGN_FORM, {
      method: 'GET',
    });

    const root = res.data || (res.raw as any) || {};
    const vendorArr = Array.isArray(root.vendor)
      ? root.vendor
      : Array.isArray((res.raw as any)?.vendor)
      ? (res.raw as any).vendor
      : Array.isArray((res.raw as any)?.vendors)
      ? (res.raw as any).vendors
      : Array.isArray(root.vendors)
      ? root.vendors
      : [];

    return {
      loginId: root.loginId ?? (res.raw as any)?.loginId ?? 0,
      loginName: root.loginName ?? (res.raw as any)?.loginName ?? '',
      company_id: root.company_id ?? (res.raw as any)?.company_id ?? 0,
      role: root.role ?? (res.raw as any)?.role ?? '',
      state: 'jammu', // Strictly 'jammu' (never 'kashmir')
      user_type: root.user_type ?? (res.raw as any)?.user_type ?? '',
      vendor: vendorArr,
    };
  }

  /**
   * 2. Fetch District
   */
  async fetchDistricts(state: string = 'jammu'): Promise<DistrictItem[]> {
    const cleanState = !state || state.toLowerCase() === 'kashmir' ? 'jammu' : state;
    const res = await apiRequest<{ districts: DistrictItem[] }>(JAMMU_VENDOR_API.ADMIN_SRT70_FETCH_DISTRICT(cleanState), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (res.success && Array.isArray((res.raw as any)?.districts)) {
      return (res.raw as any).districts;
    }
    if (res.success && Array.isArray((res.data as any)?.districts)) {
      return (res.data as any).districts;
    }
    if (res.success && Array.isArray(res.data)) {
      return res.data as DistrictItem[];
    }

    return [];
  }

  /**
   * 3. Fetch Site
   */
  async fetchSites(state: string = 'jammu', district: string = 'Jammu'): Promise<SiteItem[]> {
    const cleanState = !state || state.toLowerCase() === 'kashmir' ? 'jammu' : state;
    const res = await apiRequest<{ sites: SiteItem[] }>(JAMMU_VENDOR_API.ADMIN_SRT70_FETCH_SITE(district, cleanState), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (res.success && Array.isArray((res.raw as any)?.sites)) {
      return (res.raw as any).sites;
    }
    if (res.success && Array.isArray((res.data as any)?.sites)) {
      return (res.data as any).sites;
    }
    if (res.success && Array.isArray(res.data)) {
      return res.data as SiteItem[];
    }

    return [];
  }

  /**
   * 4. Store Assign (multipart/form-data)
   */
  async storeAssign(formData: FormData): Promise<{ success: boolean; message: string; errors?: any }> {
    // Enforce state = 'jammu' strictly (never 'kashmir')
    if (!formData.get('state') || String(formData.get('state')).toLowerCase() === 'kashmir') {
      formData.set('state', 'jammu');
    }
    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SRT70_STORE_ASSIGN, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    return {
      success: res.success,
      message: res.message || (res.success ? 'Success' : 'Validation failed'),
      errors: res.errors,
    };
  }

  /**
   * 5. View Assign
   */
  async getViewAssign(): Promise<ViewAssignData> {
    const res = await apiRequest<ViewAssignData>(JAMMU_VENDOR_API.ADMIN_SRT70_VIEW_ASSIGN, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const root: any = res.data || (res.raw as any)?.data || (res.raw as any) || {};
    const rawList =
      (Array.isArray(root.amcsrtRecords) && root.amcsrtRecords) ||
      (Array.isArray(root.amcsrt_records) && root.amcsrt_records) ||
      (Array.isArray(root.assignedsite) && root.assignedsite) ||
      (Array.isArray(root.assigned_site) && root.assigned_site) ||
      (Array.isArray(root.assigned_sites) && root.assigned_sites) ||
      (Array.isArray(root.viewassign) && root.viewassign) ||
      (Array.isArray((res.raw as any)?.amcsrtRecords) && (res.raw as any).amcsrtRecords) ||
      (Array.isArray((res.raw as any)?.assignedsite) && (res.raw as any).assignedsite) ||
      (Array.isArray(res.data) && res.data) ||
      [];

    return {
      amcsrtRecords: rawList,
      claimedapplicable: Number(root.claimedapplicable || 0),
      approvedsite: Number(root.approvedsite || 0),
      verifypending: Number(root.verifypending || 0),
      rejectsite: Number(root.rejectsite || 0),
      paymentsitecount: Number(root.paymentsitecount || 0),
      payment80: Number(root.payment80 || 0),
      payment20: Number(root.payment20 || 0),
      docsubmit: Number(root.docsubmit || 0),
      claimraised: Number(root.claimraised || 0),
      complete: Number(root.complete || 0),
      totalsite: Number(root.totalsite || 0),
      pendingsite: Number(root.pendingsite || 0),
    };
  }

  /**
   * 6. Approval Assign
   */
  async approvalAssign(id: number | string): Promise<{ success: boolean; message: string }> {
    const targetUrl = JAMMU_VENDOR_API.ADMIN_SRT70_APPROVAL_ASSIGN(id);
    const res = await apiRequest(targetUrl, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (res.success) {
      return { success: true, message: res.message || 'Success' };
    }

    // Try GET if POST returned 405 Method Not Allowed
    if (!res.success && res.message?.includes('405')) {
      const getRes = await apiRequest(targetUrl, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return { success: getRes.success, message: getRes.message || 'Success' };
    }

    return { success: res.success, message: res.message || 'Failed to approve assigned SRT record.' };
  }

  /**
   * 7. Assign Vendor Details
   */
  async getAssignVendorDetails(id: number | string): Promise<AssignVendorDetailsData | null> {
    const res = await apiRequest<AssignVendorDetailsData>(JAMMU_VENDOR_API.ADMIN_SRT70_ASSIGN_VENDOR_DETAILS(id), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return res.success && res.data ? res.data : null;
  }

  /**
   * 8. Edit Assign (fetch data)
   */
  async getEditAssign(id: number | string): Promise<EditAssignData | null> {
    const res = await apiRequest<EditAssignData>(JAMMU_VENDOR_API.ADMIN_SRT70_EDIT_ASSIGN(id), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return res.success && res.data ? res.data : null;
  }

  /**
   * 9. Update Assign
   */
  async updateAssign(formData: FormData): Promise<{ success: boolean; message: string; errors?: any }> {
    // Enforce state = 'jammu' strictly (never 'kashmir')
    if (!formData.get('state') || String(formData.get('state')).toLowerCase() === 'kashmir') {
      formData.set('state', 'jammu');
    }
    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SRT70_UPDATE_ASSIGN, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    return {
      success: res.success,
      message: res.message || (res.success ? 'Assigned Site Updated Successfully' : 'Validation failed'),
      errors: res.errors,
    };
  }

  /**
   * 10. View Installation
   */
  async getViewInstallation(): Promise<ViewInstallationData> {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SRT70_VIEW_INSTALLATION, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const payload: any =
      res?.data?.verification !== undefined || res?.data?.verified !== undefined
        ? res.data
        : res?.data?.data || res?.raw?.data || res?.data || res?.raw || {};

    return {
      totalsite: Number(payload.totalsite ?? payload.totalsites ?? payload.total ?? 0),
      complete: Number(payload.complete ?? 0),
      pendingsite: Number(payload.pendingsite ?? payload.pending ?? 0),
      approvedsite: Number(payload.approvedsite ?? payload.approved ?? 0),
      rejectsite: Number(payload.rejectsite ?? payload.reject ?? 0),
      verifypending: Number(payload.verifypending ?? payload.verify_pending ?? 0),
      claimedapplicable: Number(payload.claimedapplicable ?? payload.claim_applicable ?? 0),
      claimraised: Number(payload.claimraised ?? payload.claim_raised ?? 0),
      docsubmit: Number(payload.docsubmit ?? payload.doc_submit ?? 0),
      payment80: Number(payload.payment80 ?? payload.inst_pay80_complete ?? 0),
      payment20: Number(payload.payment20 ?? payload.inst_pay20_complete ?? 0),
      paymentsitecount: Number(payload.paymentsitecount ?? payload.payment_site_count ?? 0),
      verification: Array.isArray(payload.verification)
        ? payload.verification
        : Array.isArray(payload.pending_verification)
        ? payload.pending_verification
        : [],
      verified: Array.isArray(payload.verified)
        ? payload.verified
        : Array.isArray(payload.approved_verification)
        ? payload.approved_verification
        : [],
    };
  }

  /**
   * 11. Verify Installation Status
   */
  async verifyInstallationStatus(formData: FormData): Promise<{ success: boolean; message: string; errors?: any }> {
    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SRT70_VERIFY_INSTALLATION_STATUS, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    return {
      success: res.success,
      message: res.message || (res.success ? 'Success' : 'Failed to update verification status'),
      errors: res.errors,
    };
  }

  /**
   * 12. View Claim
   */
  async getViewClaim(): Promise<ViewClaimData> {
    const res = await apiRequest<ViewClaimData>(JAMMU_VENDOR_API.ADMIN_SRT70_VIEW_CLAIM, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (res.success && res.data) {
      return {
        claimrequest: Array.isArray(res.data.claimrequest) ? res.data.claimrequest : [],
      };
    }

    return {
      claimrequest: [],
    };
  }

  /**
   * 13. Verify Claim Status
   */
  async verifyClaimStatus(id: number | string, status: number, remarks?: string): Promise<{ success: boolean; message: string }> {
    const fd = new FormData();
    fd.append('id', String(id));
    fd.append('status', String(status));
    if (remarks) {
      fd.append('remarks', remarks);
      fd.append('verify_remarks', remarks);
      fd.append('inst_claim_remark', remarks);
    }

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SRT70_VERIFY_CLAIM_STATUS, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: fd,
    });

    if (res.success) {
      return { success: true, message: res.message || 'Status updated successfully' };
    }

    // Try JSON body if FormData was rejected
    const jsonRes = await apiRequest(JAMMU_VENDOR_API.ADMIN_SRT70_VERIFY_CLAIM_STATUS, {
      method: 'POST',
      headers: getAuthHeaders(false),
      body: JSON.stringify({ id: Number(id), status: Number(status), remarks: remarks || undefined }),
    });

    return {
      success: jsonRes.success,
      message: jsonRes.message || (jsonRes.success ? 'Status updated successfully' : 'Failed to update claim status'),
    };
  }

  /**
   * 14. Verify Doc Submit
   */
  async verifyInstaDocSubmit(id: number | string, status: number): Promise<{ success: boolean; message: string }> {
    const fd = new FormData();
    fd.append('id', String(id));
    fd.append('status', String(status));

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SRT70_VERIFY_DOC_SUBMIT, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: fd,
    });

    if (res.success) {
      return { success: true, message: res.message || 'Status updated successfully' };
    }

    // Try JSON body
    const jsonRes = await apiRequest(JAMMU_VENDOR_API.ADMIN_SRT70_VERIFY_DOC_SUBMIT, {
      method: 'POST',
      headers: getAuthHeaders(false),
      body: JSON.stringify({ id: Number(id), status: Number(status) }),
    });

    return {
      success: jsonRes.success,
      message: jsonRes.message || (jsonRes.success ? 'Status updated successfully' : 'Failed to update document status'),
    };
  }

  /**
   * 15. View Payment
   */
  async getViewPayment(filters?: {
    from_date?: string | null;
    to_date?: string | null;
    vendor?: string | number | null;
  }): Promise<ViewPaymentData> {
    const res = await apiRequest<ViewPaymentData>(JAMMU_VENDOR_API.ADMIN_SRT70_VIEW_PAYMENT(filters), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (res.success && res.data) {
      const d = res.data;
      const p80 = Array.isArray(d.payments80) && d.payments80.length > 0
        ? d.payments80
        : Array.isArray(d.paymentrequests)
        ? d.paymentrequests
        : Array.isArray((d as any).paymentrequests1)
        ? (d as any).paymentrequests1
        : [];
      const p20 = Array.isArray(d.payments20) && d.payments20.length > 0
        ? d.payments20
        : Array.isArray((d as any).paymentrequests2)
        ? (d as any).paymentrequests2
        : Array.isArray((d as any).payment2requests)
        ? (d as any).payment2requests
        : Array.isArray((d as any).payment_requests2)
        ? (d as any).payment_requests2
        : [];

      return {
        vendors: Array.isArray(d.vendors) ? d.vendors : [],
        paymentrequests: Array.isArray(d.paymentrequests) ? d.paymentrequests : p80,
        jammu_srt70mw_pay_pending1: Number(d.jammu_srt70mw_pay_pending1 || 0),
        jammu_srt70mw_pay_pending2: Number(d.jammu_srt70mw_pay_pending2 || 0),
        total_jammu_srt70mw_pay_pending: Number(d.total_jammu_srt70mw_pay_pending || 0),
        jammu_srt70mw_pay_done1: Number(d.jammu_srt70mw_pay_done1 || 0),
        jammu_srt70mw_pay_done2: Number(d.jammu_srt70mw_pay_done2 || 0),
        total_jammu_srt70mw_pay_done: Number(d.total_jammu_srt70mw_pay_done || 0),
        payments80: p80,
        payments20: p20,
        filters: d.filters || {},
      };
    }

    return {
      vendors: [],
      paymentrequests: [],
      jammu_srt70mw_pay_pending1: 0,
      jammu_srt70mw_pay_pending2: 0,
      total_jammu_srt70mw_pay_pending: 0,
      jammu_srt70mw_pay_done1: 0,
      jammu_srt70mw_pay_done2: 0,
      total_jammu_srt70mw_pay_done: 0,
      payments80: [],
      payments20: [],
      filters: {},
    };
  }

  /**
   * 16. Update Payment Status
   */
  async updatePaymentStatus(data: {
    pay80_id?: number | string;
    inst_pay80?: number | string;
    inst_pay80_date?: string;
    inst_pay80_remark?: string;
    pay20_id?: number | string;
    inst_pay20?: number | string;
    inst_pay20_date?: string;
    inst_pay20_remark?: string;
  }): Promise<{ success: boolean; message: string }> {
    const fd = new FormData();
    if (data.pay80_id !== undefined) {
      fd.append('pay80_id', String(data.pay80_id));
      if (data.inst_pay80 !== undefined) fd.append('inst_pay80', String(data.inst_pay80));
      if (data.inst_pay80_date) fd.append('inst_pay80_date', data.inst_pay80_date);
      if (data.inst_pay80_remark) fd.append('inst_pay80_remark', data.inst_pay80_remark);
    } else if (data.pay20_id !== undefined) {
      fd.append('pay20_id', String(data.pay20_id));
      if (data.inst_pay20 !== undefined) fd.append('inst_pay20', String(data.inst_pay20));
      if (data.inst_pay20_date) fd.append('inst_pay20_date', data.inst_pay20_date);
      if (data.inst_pay20_remark) fd.append('inst_pay20_remark', data.inst_pay20_remark);
    }

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SRT70_UPDATE_PAYMENT_STATUS, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: fd,
    });

    if (res.success) {
      return { success: true, message: res.message || 'Payment updated successfully.' };
    }

    // Try JSON
    const jsonRes = await apiRequest(JAMMU_VENDOR_API.ADMIN_SRT70_UPDATE_PAYMENT_STATUS, {
      method: 'POST',
      headers: getAuthHeaders(false),
      body: JSON.stringify(data),
    });

    return {
      success: jsonRes.success,
      message: jsonRes.message || (jsonRes.success ? 'Payment updated successfully.' : 'Payment record not found.'),
    };
  }

  /**
   * 17. Dashboard
   */
  async getDashboard(): Promise<DashboardData> {
    const res = await apiRequest<DashboardData>(JAMMU_VENDOR_API.ADMIN_SRT70_DASHBOARD, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const payload: any =
      res.data?.jammu_srt70mws ? res.data :
      (res.data as any)?.data?.jammu_srt70mws ? (res.data as any).data :
      res.raw?.data?.jammu_srt70mws ? res.raw.data :
      res.raw?.jammu_srt70mws ? res.raw : null;

    if (payload && payload.jammu_srt70mws) {
      return payload;
    }

    return {
      jammu_srt70mws: {
        site_count: 0,
        material_dispatch: 0,
        material_pending: 0,
        site_assigned: 0,
        site_not_assigned: 0,
        complete: 0,
        pending: 0,
        verify_pending: 0,
        verify_approved: 0,
        verify_reject: 0,
        claim_applicable: 0,
        claim_raised: 0,
        inst_doc_complete: 0,
        inst_doc_pending: 0,
        inst_pay80_complete: 0,
        inst_pay20_complete: 0,
        inst_pay80_pending: 0,
        inst_pay20_pending: 0,
        inst_pay80_amount: 0,
        inst_pay20_amount: 0,
      },
      vendors: [],
      vendorswise: [],
      districtwise: [],
      vendor_installation_month: [],
      vendor_today_installation: [],
    };
  }

  /**
   * 18. View Dashboard (drill-down)
   */
  async getViewDashboard(status?: string): Promise<DrillDownResponse> {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SRT70_VIEW_DASHBOARD(status), {
      method: 'GET',
    });

    const root = res.data !== undefined ? res.data : res.raw !== undefined ? res.raw : {};
    let list: JammuSrtSiteRow[] = [];
    if (Array.isArray(root)) {
      list = root;
    } else if (Array.isArray(root.jammusrt70mw)) {
      list = root.jammusrt70mw;
    } else if (Array.isArray(root.jammusrt70mws)) {
      list = root.jammusrt70mws;
    } else if (Array.isArray(root.jammu_srt70mws)) {
      list = root.jammu_srt70mws;
    } else if (Array.isArray(root.sites)) {
      list = root.sites;
    } else if (Array.isArray((res.raw as any)?.jammusrt70mw)) {
      list = (res.raw as any).jammusrt70mw;
    }

    return {
      loginId: root.loginId ?? (res.raw as any)?.loginId ?? 0,
      company_id: root.company_id ?? (res.raw as any)?.company_id ?? 0,
      jammusrt70mw: list,
    };
  }

  /**
   * 19. Vendor-wise
   */
  async getVendorwiseData(status: string, vendor: number | string): Promise<DrillDownResponse> {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SRT70_VENDORWISE_DATA(status, vendor), {
      method: 'GET',
    });

    const root = res.data !== undefined ? res.data : res.raw !== undefined ? res.raw : {};
    let list: JammuSrtSiteRow[] = [];
    if (Array.isArray(root)) {
      list = root;
    } else if (Array.isArray(root.jammusrt70mw)) {
      list = root.jammusrt70mw;
    } else if (Array.isArray(root.jammusrt70mws)) {
      list = root.jammusrt70mws;
    } else if (Array.isArray(root.jammu_srt70mws)) {
      list = root.jammu_srt70mws;
    } else if (Array.isArray(root.sites)) {
      list = root.sites;
    } else if (Array.isArray((res.raw as any)?.jammusrt70mw)) {
      list = (res.raw as any).jammusrt70mw;
    }

    return {
      loginId: root.loginId ?? (res.raw as any)?.loginId ?? 0,
      company_id: root.company_id ?? (res.raw as any)?.company_id ?? 0,
      jammusrt70mw: list,
    };
  }

  /**
   * 20. District-wise
   */
  async getDistrictwiseData(status: string, district: string): Promise<DrillDownResponse> {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SRT70_DISTRICTWISE_DATA(status, district), {
      method: 'GET',
    });

    const root = res.data !== undefined ? res.data : res.raw !== undefined ? res.raw : {};
    let list: JammuSrtSiteRow[] = [];
    if (Array.isArray(root)) {
      list = root;
    } else if (Array.isArray(root.jammusrt70mw)) {
      list = root.jammusrt70mw;
    } else if (Array.isArray(root.jammusrt70mws)) {
      list = root.jammusrt70mws;
    } else if (Array.isArray(root.jammu_srt70mws)) {
      list = root.jammu_srt70mws;
    } else if (Array.isArray(root.sites)) {
      list = root.sites;
    } else if (Array.isArray((res.raw as any)?.jammusrt70mw)) {
      list = (res.raw as any).jammusrt70mw;
    }

    return {
      loginId: root.loginId ?? (res.raw as any)?.loginId ?? 0,
      company_id: root.company_id ?? (res.raw as any)?.company_id ?? 0,
      jammusrt70mw: list,
    };
  }
}

export const jammuSrt70mwAdminService = new JammuSrt70mwAdminService();
export default jammuSrt70mwAdminService;
