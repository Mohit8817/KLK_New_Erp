import { API_BASE_URL, authService } from '../../../../../services/authService';
import {
  resolveJammuSslMediaUrl,
  getJammuSslMediaCandidates,
  type JammuSslAssignedLightItem,
  type JammuSslCompletedSiteItem,
  type JammuSslClaimItem,
} from '../../../../V-Portal/jammu/jammu-services/jammuSslService';
import { JAMMU_VENDOR_API, buildCandidateUrls as buildCentralCandidateUrls } from '../../../Vendor_Management_APIS/Jammu_Vendor_API';

export { resolveJammuSslMediaUrl, resolveJammuSslMediaUrl as resolveJammuMediaUrl, getJammuSslMediaCandidates };
export type { JammuSslAssignedLightItem, JammuSslCompletedSiteItem, JammuSslClaimItem };

/* ═══════════════════════════════════════════════════════════════════════════
   TypeScript Interfaces for Jammu SSL Installation
   Controller: App\Http\Controllers\admin\jammu\JammuSslInstallationController
   ═══════════════════════════════════════════════════════════════════════════ */

export interface VendorItem {
  id: number | string;
  name: string;
  state?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  rating?: string;
}

export interface VolumeItem {
  id?: number | string;
  volume: string;
  phase?: string;
  description?: string;
  target_lights?: number;
}

export interface DistrictItem {
  district: string;
}

export interface BlockItem {
  block: string;
}

export interface PanchayatItem {
  panchayat: string;
  count?: number;
  block?: string;
  village?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Dashboard Types & Interfaces
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ShlDashboardTotals {
  site_count: number;
  site_assigned: number;
  site_not_assigned: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  claim_approved: number;
  claim_pending: number;
  inst_pay_done: number;
  inst_pay_pending: number;
}

export interface DistrictWiseItem {
  district: string;
  light_count: number;
  site_count: number;
  inst_complete: number;
  complete: number;
  inst_pending: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  claim_raised: number;
  claim_approved: number;
  claim_reject?: number;
  payment_done: number;
  inst_pay_done: number;
  payment_pending: number;
}

export interface VendorWiseItem {
  inst_vendor: number | string;
  vendor_name: string;
  light_count: number;
  site_count: number;
  inst_complete: number;
  complete: number;
  inst_pending: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  claim_approved: number;
  payment_done: number;
  inst_pay_done: number;
  performance_score?: string;
}

export interface AssignLightPayload {
  id?: number | string;
  vendor: number | string;
  state?: string;
  district: string;
  block: string;
  panchayat: string[] | string;
  sitecount?: number | string;
  total_light?: number | string;
  ldate?: string;
  assign_date?: string;
  remark?: string;
  [key: string]: any;
}

export interface MonthInstallationItem {
  month_year: string;
  monthly_installations: number;
}

export interface TodayInstallationItem {
  inst_vendor: number | string;
  vendor_name: string;
  today_install: number;
}

export interface ShlDashboardData {
  shldatas: ShlDashboardTotals;
  districtwise: DistrictWiseItem[];
  vendorswise: VendorWiseItem[];
  vendor_installation_month: MonthInstallationItem[];
  vendor_today_installation: TodayInstallationItem[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   Assign Light Types
   ═══════════════════════════════════════════════════════════════════════════ */

export interface AdminAssignLightItem {
  id: number;
  company_id?: string;
  vendor: string | number;
  vendor_name: string;
  state: string;
  district: string;
  block: string;
  panchayat: string[];
  village?: string;
  volume?: string;
  count: number;
  sitecount?: number;
  lights_count?: number;
  assign_date?: string;
  ldate?: string;
  status: number; // 0 = pending approval, 1 = approved / active
  uid_file?: string;
  file?: string;
  battery_file?: string;
  sim_file?: string;
  panel_file?: string;
  imei_file?: string;
  remark?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface ViewAssignLightResponse {
  summary: AssignSummaryCounts;
  viewassign: AdminAssignLightItem[];
}

export interface EditAssignData {
  assign?: any;
  assignShl?: any;
  assign_shl?: any;
  vendor?: VendorItem[];
  volumes?: VolumeItem[];
  districts?: DistrictItem[];
  blocks?: BlockItem[];
  panchayats?: PanchayatItem[];
}

export interface AdminApiResponse {
  success: boolean;
  status: boolean;
  message: string;
  data?: any;
  errors?: any;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Verification Desk Types
   ═══════════════════════════════════════════════════════════════════════════ */

export interface LightVerificationItem {
  id: number;
  unique_id?: string;
  uid?: string;
  state?: string;
  district: string;
  block: string;
  panchayat: string;
  address?: string;
  village?: string;
  phase?: string;
  volume?: string;
  inst_vendor?: number | string;
  vendor?: number | string;
  vendor_name?: string;
  vendors?: { id?: number | string; name?: string; vendor_name?: string } | string;
  beneficiary_name?: string;
  contact_person?: string;
  contact_no?: string;
  contact_number?: string;
  phone?: string;
  panel_no?: string;
  module_no?: string;
  pole_no?: string;
  battery_serial_no?: string;
  battery_no?: string;
  light_no?: string;
  luminary_no?: string;
  imei_no?: string;
  sim_no?: string;
  inst_latitude?: string | number;
  latitude?: string | number;
  lat?: string | number;
  inst_longitude?: string | number;
  longitude?: string | number;
  long?: string | number;
  lng?: string | number;
  light_file?: string;
  light_image?: string;
  photo?: string;
  inst_remark?: string;
  inst_verify_remarks?: string;
  remark?: string;
  inst_verify_status?: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  inst_verify_file?: string;
  verify_file?: string;
  inst_verify_date?: string;
  inst_claim_status?: number;
  inst_pay_status?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface AssignSummaryCounts {
  totalsite: number;
  complete: number;
  pendingsite: number;
  approvedsite: number;
  rejectsite: number;
  verifypending: number;
  claimedapplicable: number;
  paymentsitecount: number;
}

export interface ViewInstallationResponse {
  summary: AssignSummaryCounts;
  verification: LightVerificationItem[];
  verified: {
    data: LightVerificationItem[];
    total: number;
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Claim Request Desk Types
   ═══════════════════════════════════════════════════════════════════════════ */

export interface SslClaimDeskItem {
  id: number;
  state?: string;
  claim_id?: string;
  vendor_id?: number | string;
  vendor_name: string;
  volume?: string;
  phase?: string;
  district?: string;
  claim_site_count: number;
  site_count?: number;
  claim_amount: number | string;
  claim_raised_date: string;
  created_at?: string;
  claim_invoice?: string;
  invoice_file?: string;
  ca_certificate?: string;
  claim_status: number; // 1 = Raised / In Audit, 2 = Approved, 3 = Rejected
  status?: number;
  payment_status?: number; // 0 = Pending, 1 = Paid
  payment_date?: string;
  payment_amount?: number | string;
  payment_remark?: string;
  remarks?: string;
  audit_remarks?: string;
  claim_update_date?: string;
  updated_at?: string;
  [key: string]: any;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Payment & Settlement Register Types
   ═══════════════════════════════════════════════════════════════════════════ */

export interface SslPaymentRegisterItem {
  id: number;
  state?: string;
  voucher_no?: string;
  claim_id?: number | string;
  vendor_id?: number | string;
  vendor_name: string;
  site_count?: number;
  claim_site_count?: number;
  claim_invoice?: string;
  claim_amount?: number | string;
  claim_approved_date?: string;
  claim_approved_by?: string;
  payment_date?: string;
  payment_by?: string;
  pay_amount?: number | string;
  payment_amount?: number | string;
  payment_remark?: string;
  payment_remarks?: string;
  bank_name?: string;
  account_no?: string;
  ifsc_code?: string;
  utr_no?: string;
  disbursed_amount?: number | string;
  amount?: number | string;
  disbursed_date?: string;
  date?: string;
  payment_status?: number; // 1 = Paid/Settled, 0 = Pending
  status?: number; // 1 = Paid, 0 = Pending
  payment_mode?: string; // RTGS, NEFT, IMPS
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface ViewPaymentData {
  payment_request: number;
  payment_complete: number;
  payment_pending: number;
  vendors: VendorItem[];
  payments: SslPaymentRegisterItem[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   HTTP Request Helper with Multi-Candidate Fallback & Working-Prefix Cache
   ═══════════════════════════════════════════════════════════════════════════ */

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const BASE_API_URL = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;
export const BASE_ROOT_URL = BASE_API_URL.replace(/\/api\/?$/, '');
export const ADMIN_API_URL = `${BASE_API_URL}/admin`;
export const ADMIN_ROOT_URL = `${BASE_ROOT_URL}/admin`;

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
  return localStorage.getItem('token') || localStorage.getItem('access_token') || null;
};

export const getAuthHeaders = (isFormData = false): Record<string, string> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

let knownWorkingBase: string | null = null;

async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; errors?: any; raw?: any }> {
  let urlsToTry = buildCentralCandidateUrls(path);
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

      if (res.status === 404 && url !== urlsToTry[urlsToTry.length - 1]) {
        continue;
      }

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
          if (getRes.ok) {
            const getJson = await getRes.json().catch(() => ({}));
            return {
              success: getJson?.success ?? true,
              data: getJson?.data !== undefined ? getJson.data : getJson,
              message: getJson?.message || 'Success (GET Fallback)',
              raw: getJson,
            };
          }
        } catch {}
      }

      lastError = new Error(json?.message || `HTTP ${res.status}: ${res.statusText}`);
    } catch (err: any) {
      lastError = err;
    }
  }

  return {
    success: false,
    message: lastError?.message || 'Failed to fetch from Jammu SSL API',
    errors: lastJson?.errors || lastError,
    raw: lastJson,
  };
}

export const normalizeJammuDashboardStatus = (raw?: string): string => {
  if (!raw) return 'total';
  const s = raw.toLowerCase().trim();
  if (s.includes('approve') || s === 'verifyapproved') return 'verify-approved';
  if (s.includes('audit') || s.includes('verifypending')) return 'verify-pending';
  if (s.includes('reject') || s === 'verifyreject') return 'verify-reject';
  if (s.includes('claim')) return 'claim-approved';
  if (s.includes('pay') || s === 'paydone') return 'pay-done';
  if (s.includes('complete') || s === 'installed') return 'complete';
  if (s.includes('pending')) return 'pending';
  return 'total';
};

/* ═══════════════════════════════════════════════════════════════════════════
   Robust Admin SSL Service — 100% Live Backend APIs (Zero Mock Data)
   Controller: App\Http\Controllers\admin\jammu\JammuSslInstallationController
   ═══════════════════════════════════════════════════════════════════════════ */

export const jammuAdminSslService = {
  /**
   * 22. SSL Dashboard Summary
   */
  getDashboard: async (): Promise<ShlDashboardData> => {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SSL_DASHBOARD, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const payload: any = res.data?.ssl ? res.data : res.raw?.data || res.data || {};
    const ssl = payload.ssl || {};

    const totals: ShlDashboardTotals = {
      site_count: Number(ssl.site_count ?? 0),
      site_assigned: Number(ssl.site_assigned ?? ssl.site_count ?? 0),
      site_not_assigned: Number(ssl.site_not_assigned ?? 0),
      complete: Number(ssl.complete ?? 0),
      pending: Number(ssl.pending ?? 0),
      verify_pending: Number(ssl.verify_pending ?? 0),
      verify_approved: Number(ssl.verify_approved ?? 0),
      verify_reject: Number(ssl.verify_reject ?? 0),
      claim_applicable: Number(ssl.claim_applicable ?? 0),
      claim_raised: Number(ssl.claim_raised ?? 0),
      claim_approved: Number(ssl.claim_approved ?? 0),
      claim_pending: Number(
        ssl.claim_pending ?? Math.max(0, Number(ssl.claim_raised ?? 0) - Number(ssl.claim_approved ?? 0))
      ),
      inst_pay_done: Number(ssl.pay_done ?? ssl.inst_pay_done ?? 0),
      inst_pay_pending: Number(ssl.pay_pending ?? ssl.inst_pay_pending ?? 0),
    };

    return {
      shldatas: totals,
      districtwise: (Array.isArray(payload.districtwise) ? payload.districtwise : []).map((d: any) => ({
        ...d,
        light_count: Number(d.light_count ?? d.site_count ?? 0),
        site_count: Number(d.site_count ?? d.light_count ?? 0),
        inst_complete: Number(d.inst_complete ?? d.complete ?? 0),
        complete: Number(d.complete ?? d.inst_complete ?? 0),
        inst_pending: Number(d.inst_pending ?? d.pending ?? 0),
        pending: Number(d.pending ?? d.inst_pending ?? 0),
        payment_done: Number(d.payment_done ?? d.inst_pay_done ?? 0),
        inst_pay_done: Number(d.inst_pay_done ?? d.payment_done ?? 0),
      })),
      vendorswise: (Array.isArray(payload.vendorswise) ? payload.vendorswise : []).map((v: any) => ({
        ...v,
        light_count: Number(v.light_count ?? v.site_count ?? 0),
        site_count: Number(v.site_count ?? v.light_count ?? 0),
        inst_complete: Number(v.inst_complete ?? v.complete ?? 0),
        complete: Number(v.complete ?? v.inst_complete ?? 0),
        inst_pending: Number(v.inst_pending ?? v.pending ?? 0),
        pending: Number(v.pending ?? v.inst_pending ?? 0),
        payment_done: Number(v.payment_done ?? v.inst_pay_done ?? 0),
        inst_pay_done: Number(v.inst_pay_done ?? v.payment_done ?? 0),
      })),
      vendor_installation_month: Array.isArray(payload.vendor_installation_month)
        ? payload.vendor_installation_month
        : [],
      vendor_today_installation: Array.isArray(payload.vendor_today_installation)
        ? payload.vendor_today_installation
        : [],
    };
  },

  /**
   * 23. Drill-down: View Dashboard
   */
  getViewDashboard: async (status: string): Promise<any[]> => {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SSL_VIEW_DASHBOARD(status), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const payload = res.data?.ssl ? res.data.ssl : res.raw?.data?.ssl || res.data || [];
    return Array.isArray(payload) ? payload : [];
  },

  /**
   * 24. Drill-down: Vendor-wise Data
   */
  getVendorWiseData: async (status: string, vendor: string | number): Promise<any[]> => {
    const res = await apiRequest<any>(
      JAMMU_VENDOR_API.ADMIN_SSL_VENDORWISE_DATA(status, vendor),
      { method: 'GET', headers: getAuthHeaders() }
    );
    const payload = res.data?.ssl ? res.data.ssl : res.raw?.data?.ssl || res.data || [];
    return Array.isArray(payload) ? payload : [];
  },

  /**
   * 25. Drill-down: District-wise Data
   */
  getDistrictWiseData: async (status: string, district: string): Promise<any[]> => {
    const res = await apiRequest<any>(
      JAMMU_VENDOR_API.ADMIN_SSL_DISTRICTWISE_DATA(status, district),
      { method: 'GET', headers: getAuthHeaders() }
    );
    const payload = res.data?.ssl ? res.data.ssl : res.raw?.data?.ssl || res.data || [];
    return Array.isArray(payload) ? payload : [];
  },

  /**
   * Universal Drill-down router
   */
  getDrillDownData: async (status: string, vendor?: string | number, district?: string): Promise<any[]> => {
    if (vendor !== undefined && vendor !== '' && vendor !== 'all') {
      return jammuAdminSslService.getVendorWiseData(status, vendor);
    }
    if (district !== undefined && district !== '' && district !== 'all') {
      return jammuAdminSslService.getDistrictWiseData(status, district);
    }
    return jammuAdminSslService.getViewDashboard(status);
  },

  /**
   * 1. Assign Form Data (Vendors)
   */
  getAssignFormData: async (): Promise<{ vendors: VendorItem[]; volumes: VolumeItem[] }> => {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SSL_ASSIGN, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const payload = res.data || res.raw?.data || {};
    const rawVendors = Array.isArray(payload.vendor)
      ? payload.vendor
      : Array.isArray(payload.vendors)
      ? payload.vendors
      : [];

    const vendors: VendorItem[] = rawVendors.map((v: any) => ({
      id: v.id ?? v.vendor ?? v.inst_vendor,
      name: v.name || v.vendor_name || `Vendor #${v.id ?? v.vendor}`,
      state: v.state || 'jammu',
      phone: v.phone || v.contact_number,
      email: v.email,
      contact_person: v.contact_person,
    }));

    const rawVolumes = Array.isArray(payload.volumes)
      ? payload.volumes
      : Array.isArray(payload.volume)
      ? payload.volume
      : [];

    return { vendors, volumes: rawVolumes };
  },

  /**
   * 2. Fetch Districts for Jammu State
   */
  fetchDistricts: async (state = 'jammu'): Promise<DistrictItem[]> => {
    const res = await apiRequest<any>(
      JAMMU_VENDOR_API.ADMIN_SSL_FETCH_DISTRICT(state),
      { method: 'GET', headers: getAuthHeaders() }
    );

    const payload = Array.isArray(res.data) ? res.data : Array.isArray(res.raw?.data) ? res.raw.data : [];
    return payload.map((d: any) => ({
      district: typeof d === 'string' ? d : d.district || d.name || String(d),
    }));
  },

  /**
   * 3. Fetch Blocks for District
   * Accepts (district) or (volume, district)
   */
  fetchBlocks: async (arg1: string, arg2?: string, state = 'jammu'): Promise<BlockItem[]> => {
    const district = arg2 ? arg2 : arg1;
    if (!district) return [];

    const res = await apiRequest<any>(
      JAMMU_VENDOR_API.ADMIN_SSL_FETCH_BLOCK(district, state),
      { method: 'GET', headers: getAuthHeaders() }
    );

    const payload = Array.isArray(res.data) ? res.data : Array.isArray(res.raw?.data) ? res.raw.data : [];
    return payload.map((b: any) => ({
      block: typeof b === 'string' ? b : b.block || b.name || String(b),
    }));
  },

  /**
   * 4. Fetch Panchayats / Villages with Light Counts
   * Accepts (district, block) or (volume, district, block)
   */
  fetchPanchayats: async (
    arg1: string,
    arg2?: string,
    arg3?: string,
    state = 'jammu'
  ): Promise<PanchayatItem[]> => {
    const district = arg3 ? arg2! : arg1;
    const block = arg3 ? arg3 : arg2!;
    if (!district || !block) return [];

    const res = await apiRequest<any>(
      JAMMU_VENDOR_API.ADMIN_SSL_FETCH_PANCHAYAT(district, block, state),
      { method: 'GET', headers: getAuthHeaders() }
    );

    const payload = Array.isArray(res.data) ? res.data : Array.isArray(res.raw?.data) ? res.raw.data : [];
    return payload.map((p: any) => {
      const name = p.village || p.panchayat || p.name || (typeof p === 'string' ? p : 'Unknown');
      const count = Number(p.count ?? p.light_count ?? 0);
      return {
        panchayat: name,
        village: name,
        count,
        block,
      };
    });
  },

  /**
   * 5. Store Assign Light Order
   * Form-Data: sitecount, vendor, state, uid_file, district, block, panchayat[], ldate, remark
   */
  storeAssign: async (payloadOrFormData: AssignLightPayload | FormData): Promise<AdminApiResponse> => {
    let body: FormData;

    if (payloadOrFormData instanceof FormData) {
      body = payloadOrFormData;
      if (!body.has('state')) body.append('state', 'jammu');
    } else {
      body = new FormData();
      const countVal = String(payloadOrFormData.sitecount ?? payloadOrFormData.total_light ?? 0);
      body.append('sitecount', countVal);
      body.append('total_light', countVal);
      body.append('vendor', String(payloadOrFormData.vendor));
      body.append('state', payloadOrFormData.state || 'jammu');
      body.append('district', payloadOrFormData.district);
      body.append('block', payloadOrFormData.block);

      if (Array.isArray(payloadOrFormData.panchayat)) {
        payloadOrFormData.panchayat.forEach((p) => body.append('panchayat[]', p));
      } else if (payloadOrFormData.panchayat) {
        body.append('panchayat[]', String(payloadOrFormData.panchayat));
      }

      const ldate = payloadOrFormData.ldate || payloadOrFormData.assign_date || '';
      if (ldate) {
        body.append('ldate', ldate);
        body.append('assign_date', ldate);
      }
      if (payloadOrFormData.uid_file) {
        body.append('uid_file', payloadOrFormData.uid_file);
        body.append('file', payloadOrFormData.uid_file);
      } else if (payloadOrFormData.file) {
        body.append('uid_file', payloadOrFormData.file);
        body.append('file', payloadOrFormData.file);
      }
      if (payloadOrFormData.remark) {
        body.append('remark', payloadOrFormData.remark);
        body.append('remarks', payloadOrFormData.remark);
      }
    }

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SSL_STORE_ASSIGN, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body,
    });

    return {
      success: res.success,
      status: res.success,
      message: res.message || (res.success ? 'SSL lights assigned successfully.' : 'Failed to assign lights'),
      data: res.data,
      errors: res.errors,
    };
  },

  /**
   * 6. View Assigned Lights
   */
  getViewAssignWithSummary: async (): Promise<ViewAssignLightResponse> => {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SSL_VIEW_ASSIGN, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const payload = res.data || res.raw?.data || {};
    const summary: AssignSummaryCounts = {
      totalsite: Number(payload.totalsite ?? payload.summary?.totalsite ?? 0),
      complete: Number(payload.complete ?? payload.summary?.complete ?? 0),
      pendingsite: Number(payload.pendingsite ?? payload.summary?.pendingsite ?? 0),
      approvedsite: Number(payload.approvedsite ?? payload.summary?.approvedsite ?? 0),
      rejectsite: Number(payload.rejectsite ?? payload.summary?.rejectsite ?? 0),
      verifypending: Number(payload.verifypending ?? payload.summary?.verifypending ?? 0),
      claimedapplicable: Number(payload.claimedapplicable ?? payload.summary?.claimedapplicable ?? 0),
      paymentsitecount: Number(payload.paymentsitecount ?? payload.summary?.paymentsitecount ?? 0),
    };

    const rawList = Array.isArray(payload.assignedsite)
      ? payload.assignedsite
      : Array.isArray(payload.assigned_site)
      ? payload.assigned_site
      : Array.isArray(payload.viewassign)
      ? payload.viewassign
      : Array.isArray(payload.assigned_sites)
      ? payload.assigned_sites
      : Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload)
      ? payload
      : [];

    const viewassign: AdminAssignLightItem[] = rawList.map((item: any) => {
      let parsedPanchayat = item.panchayat;
      if (typeof parsedPanchayat === 'string') {
        try {
          parsedPanchayat = JSON.parse(parsedPanchayat);
        } catch {
          parsedPanchayat = [parsedPanchayat];
        }
      }
      if (!Array.isArray(parsedPanchayat)) {
        parsedPanchayat = parsedPanchayat ? [String(parsedPanchayat)] : [];
      }
      // Filter out literal "null" strings
      parsedPanchayat = parsedPanchayat.filter(
        (p: any) => p && String(p).trim() !== '' && String(p).trim().toLowerCase() !== 'null' && String(p).trim().toLowerCase() !== 'undefined'
      );

      const lightCount = Number(item.sitecount ?? item.total_light ?? item.count ?? item.lights_count ?? 0);

      return {
        id: item.id,
        vendor: item.vendor,
        vendor_name: item.vendors?.name || item.vendor_name || `Vendor ${item.vendor}`,
        state: 'jammu',
        district: item.district,
        block: item.block,
        panchayat: parsedPanchayat,
        village: parsedPanchayat.length > 0 ? parsedPanchayat.join(', ') : (item.village || '—'),
        volume: item.volume || 'Solar Street Light',
        count: lightCount,
        sitecount: lightCount,
        lights_count: lightCount,
        ldate: item.ldate || item.assign_date,
        assign_date: item.assign_date || item.sdate || item.created_at || item.ldate,
        status: Number(item.status ?? 0),
        uid_file: item.uid_file || item.file,
        file: item.uid_file || item.file,
        battery_file: item.battery_no_file || item.battery_file || item.state_battery_no,
        sim_file: item.sim_no_file || item.sim_file || item.state_sim_no,
        panel_file: item.panel_no_file || item.panel_file || item.state_panel_no,
        imei_file: item.imei_no_file || item.imei_file || item.state_imei_no,
        company_id: item.company_id,
        remark: item.remark || item.remarks,
        remarks: item.remarks || item.remark,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
    });

    return { summary, viewassign };
  },

  getViewAssign: async (): Promise<AdminAssignLightItem[]> => {
    const res = await jammuAdminSslService.getViewAssignWithSummary();
    const list: any = res.viewassign;
    list.summary = res.summary;
    return list;
  },

  getViewAssigned: async () => jammuAdminSslService.getViewAssign(),

  /**
   * 7. Approval of Assigned Lights Batch
   */
  approvalAssign: async (id: number | string): Promise<AdminApiResponse> => {
    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SSL_APPROVAL_ASSIGN(id), {
      method: 'POST',
      headers: getAuthHeaders(true),
    });

    return {
      success: res.success,
      status: res.success,
      message: res.message || (res.success ? 'Assignment approved successfully.' : 'Failed to approve assignment'),
      data: res.data,
    };
  },

  /**
   * 8. View Vendor-wise Light Allocation Details
   */
  viewVendorWiseDetails: async (id: number | string): Promise<any[]> => {
    const res = await apiRequest<any>(
      JAMMU_VENDOR_API.ADMIN_SSL_VIEW_VENDOR_WISE_DETAILS(id),
      { method: 'GET', headers: getAuthHeaders() }
    );

    const payload = res.data || res.raw?.data || {};
    return Array.isArray(payload.vendor_details)
      ? payload.vendor_details
      : Array.isArray(payload)
      ? payload
      : [];
  },

  /**
   * 9. Edit Assign Light
   */
  getEditAssign: async (id: number | string): Promise<EditAssignData> => {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SSL_EDIT_ASSIGN(id), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const payload = res.data || res.raw?.data || {};
    return {
      assign: payload.assign || payload.assignShl || payload.assign_shl,
      assignShl: payload.assign || payload.assignShl || payload.assign_shl,
      vendor: payload.vendor || payload.vendors || [],
      districts: payload.district || payload.districts || [],
      blocks: payload.block || payload.blocks || [],
      panchayats: payload.panchayat || payload.panchayats || [],
    };
  },

  /**
   * 10. Update Assign Light (id sent in FormData)
   */
  updateAssign: async (payloadOrFormData: AssignLightPayload | FormData): Promise<AdminApiResponse> => {
    let body: FormData;

    if (payloadOrFormData instanceof FormData) {
      body = payloadOrFormData;
      if (!body.has('state')) body.append('state', 'jammu');
    } else {
      body = new FormData();
      if (payloadOrFormData.id) body.append('id', String(payloadOrFormData.id));
      body.append('vendor', String(payloadOrFormData.vendor));
      body.append('state', payloadOrFormData.state || 'jammu');
      body.append('district', payloadOrFormData.district);
      body.append('block', payloadOrFormData.block);

      if (Array.isArray(payloadOrFormData.panchayat)) {
        payloadOrFormData.panchayat.forEach((p) => body.append('panchayat[]', p));
      } else if (payloadOrFormData.panchayat) {
        body.append('panchayat[]', String(payloadOrFormData.panchayat));
      }

      if (payloadOrFormData.total_light !== undefined) {
        body.append('total_light', String(payloadOrFormData.total_light));
      }
      if (payloadOrFormData.assign_date || payloadOrFormData.ldate) {
        body.append('assign_date', payloadOrFormData.assign_date || payloadOrFormData.ldate || '');
      }
      if (payloadOrFormData.uid_file) {
        body.append('uid_file', payloadOrFormData.uid_file);
      } else if (payloadOrFormData.file) {
        body.append('uid_file', payloadOrFormData.file);
      }
      if (payloadOrFormData.remark) {
        body.append('remark', payloadOrFormData.remark);
      }
    }

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SSL_UPDATE_ASSIGN, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body,
    });

    return {
      success: res.success,
      status: res.success,
      message: res.message || (res.success ? 'Assignment updated successfully.' : 'Failed to update assignment'),
      data: res.data,
      errors: res.errors,
    };
  },

  /**
   * 11. View Installation (Verification Desk)
   */
  getViewInstallation: async (): Promise<ViewInstallationResponse> => {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SSL_VIEW_INSTALLATION, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const payload = res.data || res.raw?.data || {};

    const summary: AssignSummaryCounts = {
      totalsite: Number(payload.totalsite ?? payload.summary?.totalsite ?? 0),
      complete: Number(payload.complete ?? payload.summary?.complete ?? 0),
      pendingsite: Number(payload.pendingsite ?? payload.summary?.pendingsite ?? 0),
      approvedsite: Number(payload.approvedsite ?? payload.summary?.approvedsite ?? 0),
      rejectsite: Number(payload.rejectsite ?? payload.summary?.rejectsite ?? 0),
      verifypending: Number(payload.verifypending ?? payload.summary?.verifypending ?? 0),
      claimedapplicable: Number(payload.claimedapplicable ?? payload.summary?.claimedapplicable ?? 0),
      paymentsitecount: Number(payload.paymentsitecount ?? payload.summary?.paymentsitecount ?? 0),
    };

    const mapItem = (item: any, defaultStatus = 0): LightVerificationItem => {
      let panelClean = item.panel_no || item.module_no;
      if (typeof panelClean === 'string' && panelClean.startsWith('[')) {
        try {
          const parsed = JSON.parse(panelClean);
          panelClean = Array.isArray(parsed) ? parsed.join(', ') : panelClean;
        } catch {}
      }

      return {
        id: item.id,
        unique_id: item.unique_id || item.uid,
        uid: item.uid || item.unique_id,
        state: item.state || 'jammu',
        district: item.district,
        block: item.block,
        panchayat: item.panchayat || item.village,
        address: item.address,
        village: item.village,
        phase: item.phase,
        volume: item.volume,
        inst_vendor: item.inst_vendor ?? item.vendor,
        vendor: item.vendor ?? item.inst_vendor,
        vendor_name: item.vendor_name || (typeof item.vendors === 'object' ? item.vendors?.name : undefined),
        vendors: item.vendors,
        beneficiary_name: item.beneficiary_name || item.contact_person,
        contact_person: item.contact_person || item.beneficiary_name,
        contact_no: item.contact_no || item.contact_number || item.phone,
        contact_number: item.contact_number || item.contact_no || item.phone,
        phone: item.phone || item.contact_no,
        panel_no: panelClean,
        module_no: panelClean,
        pole_no: item.pole_no,
        battery_serial_no: item.battery_serial_no || item.battery_no,
        battery_no: item.battery_no || item.battery_serial_no,
        light_no: item.light_no || item.luminary_no,
        luminary_no: item.luminary_no || item.light_no,
        imei_no: item.imei_no,
        sim_no: item.sim_no,
        inst_latitude: item.inst_latitude ?? item.latitude ?? item.lat,
        latitude: item.latitude ?? item.inst_latitude ?? item.lat,
        lat: item.lat ?? item.latitude,
        inst_longitude: item.inst_longitude ?? item.longitude ?? item.long ?? item.lng,
        longitude: item.longitude ?? item.inst_longitude ?? item.long ?? item.lng,
        long: item.long ?? item.longitude,
        lng: item.lng ?? item.longitude,
        light_file: item.light_file || item.light_image || item.photo,
        light_image: item.light_image || item.light_file || item.photo,
        photo: item.photo || item.light_file,
        inst_remark: item.inst_remark || item.remark,
        inst_verify_remarks: item.inst_verify_remarks || item.remarks || item.verify_remarks,
        remark: item.remark || item.inst_remark,
        inst_verify_status: Number(item.inst_verify_status ?? defaultStatus),
        inst_verify_file: item.inst_verify_file || item.verify_file || item.file,
        verify_file: item.verify_file || item.inst_verify_file || item.file,
        inst_verify_date: item.inst_verify_date,
        inst_claim_status: item.inst_claim_status,
        inst_pay_status: item.inst_pay_status,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
    };

    const verification: LightVerificationItem[] = Array.isArray(payload.verification)
      ? payload.verification.map((x: any) => mapItem(x, 0))
      : [];

    let verifiedList: LightVerificationItem[] = [];
    if (Array.isArray(payload.verified?.data)) {
      verifiedList = payload.verified.data.map((x: any) => mapItem(x, 1));
    } else if (Array.isArray(payload.verified)) {
      verifiedList = payload.verified.map((x: any) => mapItem(x, 1));
    }

    return {
      summary,
      verification,
      verified: {
        data: verifiedList,
        total: payload.verified?.total ?? verifiedList.length,
      },
    };
  },

  /**
   * 12. Verify Installation Status
   * Multipart Form-Data: id, status (1: approve, 2: reject), file, remark
   */
  verifyInstallationStatus: async (payload: {
    id: number | string;
    status: number | string;
    file?: File | null;
    remark?: string;
    inst_verify_remarks?: string;
  }): Promise<AdminApiResponse> => {
    const fd = new FormData();
    fd.append('id', String(payload.id));
    fd.append('status', String(payload.status));

    if (payload.file) {
      fd.append('file', payload.file);
    }
    const remarks = payload.remark || payload.inst_verify_remarks;
    if (remarks) {
      fd.append('remark', remarks);
    }

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SSL_VERIFY_INSTALLATION, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: fd,
    });

    return {
      success: res.success,
      status: res.success,
      message: res.message || (res.success ? 'Verification status updated successfully.' : 'Failed to update status'),
      data: res.data,
      errors: res.errors,
    };
  },

  /**
   * 13. State Battery Import (Excel)
   * Multipart Form-Data: state_battery_no (file), vendor_id, assigned_id
   */
  importBattery: async (
    fileOrFormData: File | FormData,
    vendorId?: string | number,
    assignedId?: string | number
  ): Promise<AdminApiResponse> => {
    let body: FormData;
    if (fileOrFormData instanceof FormData) {
      body = fileOrFormData;
    } else {
      body = new FormData();
      body.append('state_battery_no', fileOrFormData);
      body.append('import_file', fileOrFormData);
      body.append('file', fileOrFormData);
      if (vendorId !== undefined && vendorId !== '') body.append('vendor_id', String(vendorId));
      if (assignedId !== undefined && assignedId !== '') body.append('assigned_id', String(assignedId));
    }

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SSL_BATTERY_IMPORT, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body,
    });

    return {
      success: res.success,
      status: res.success,
      message: res.message || (res.success ? 'Batteries imported successfully.' : 'Failed to import batteries'),
      data: res.data,
      errors: res.errors,
    };
  },

  /**
   * 14. State IMEI Import (Excel)
   * Multipart Form-Data: state_imei_no (file), vendor_id, assigned_id
   */
  importImei: async (
    fileOrFormData: File | FormData,
    vendorId?: string | number,
    assignedId?: string | number
  ): Promise<AdminApiResponse> => {
    let body: FormData;
    if (fileOrFormData instanceof FormData) {
      body = fileOrFormData;
    } else {
      body = new FormData();
      body.append('state_imei_no', fileOrFormData);
      body.append('import_file', fileOrFormData);
      body.append('file', fileOrFormData);
      if (vendorId !== undefined && vendorId !== '') body.append('vendor_id', String(vendorId));
      if (assignedId !== undefined && assignedId !== '') body.append('assigned_id', String(assignedId));
    }

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SSL_IMEI_IMPORT, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body,
    });

    return {
      success: res.success,
      status: res.success,
      message: res.message || (res.success ? 'IMEI records imported successfully.' : 'Failed to import IMEI'),
      data: res.data,
      errors: res.errors,
    };
  },

  /**
   * 15. State Panel Import (Excel)
   * Multipart Form-Data: state_panel_no (file), vendor_id, assigned_id
   */
  importPanel: async (
    fileOrFormData: File | FormData,
    vendorId?: string | number,
    assignedId?: string | number
  ): Promise<AdminApiResponse> => {
    let body: FormData;
    if (fileOrFormData instanceof FormData) {
      body = fileOrFormData;
    } else {
      body = new FormData();
      body.append('state_panel_no', fileOrFormData);
      body.append('import_file', fileOrFormData);
      body.append('file', fileOrFormData);
      if (vendorId !== undefined && vendorId !== '') body.append('vendor_id', String(vendorId));
      if (assignedId !== undefined && assignedId !== '') body.append('assigned_id', String(assignedId));
    }

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SSL_PANEL_IMPORT, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body,
    });

    return {
      success: res.success,
      status: res.success,
      message: res.message || (res.success ? 'Panels imported successfully.' : 'Failed to import panels'),
      data: res.data,
      errors: res.errors,
    };
  },

  /**
   * 16. State SIM Import (Excel)
   * Multipart Form-Data: state_sim_no (file), vendor_id, assigned_id
   */
  importSim: async (
    fileOrFormData: File | FormData,
    vendorId?: string | number,
    assignedId?: string | number
  ): Promise<AdminApiResponse> => {
    let body: FormData;
    if (fileOrFormData instanceof FormData) {
      body = fileOrFormData;
    } else {
      body = new FormData();
      body.append('state_sim_no', fileOrFormData);
      body.append('import_file', fileOrFormData);
      body.append('file', fileOrFormData);
      if (vendorId !== undefined && vendorId !== '') body.append('vendor_id', String(vendorId));
      if (assignedId !== undefined && assignedId !== '') body.append('assigned_id', String(assignedId));
    }

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SSL_SIM_IMPORT, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body,
    });

    return {
      success: res.success,
      status: res.success,
      message: res.message || (res.success ? 'SIM cards imported successfully.' : 'Failed to import SIM cards'),
      data: res.data,
      errors: res.errors,
    };
  },

  /**
   * 17. View Claim Desk
   * GET /jammu/ssl/installation/view-claim
   * Columns: Sr. No., State, Vendor Name, Claim Raised Date, Site Count, Claim Invoice, Claim Amount, Claim Update Date, Action
   */
  getViewClaim: async (): Promise<SslClaimDeskItem[]> => {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SSL_VIEW_CLAIM, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const payload = res.data || res.raw?.data || {};
    const rawClaims = Array.isArray(payload.claims)
      ? payload.claims
      : Array.isArray(payload)
      ? payload
      : [];

    return rawClaims.map((c: any) => ({
      id: c.id,
      state: c.state || 'jammu',
      claim_id: c.claim_id || `JK-CLM-${c.id}`,
      vendor_id: c.vendor_id ?? c.vendor,
      vendor_name: c.vendor_name || (typeof c.vendor === 'object' ? c.vendor?.name : `Vendor ${c.vendor_id ?? c.vendor ?? c.id}`),
      volume: c.volume || 'Solar Street Light',
      phase: c.phase,
      district: c.district,
      claim_site_count: Number(c.site_count ?? c.claim_site_count ?? c.total_sites ?? 1),
      site_count: Number(c.site_count ?? c.claim_site_count ?? c.total_sites ?? 1),
      claim_amount: c.claim_amount ?? c.amount ?? 0,
      claim_raised_date: c.claim_raised_date || c.created_at || c.date || '',
      created_at: c.created_at || c.claim_raised_date,
      claim_invoice: c.claim_invoice || c.invoice_file || c.invoice,
      invoice_file: c.invoice_file || c.claim_invoice || c.invoice,
      ca_certificate: c.ca_certificate || c.certificate,
      claim_status: Number(c.claim_status ?? c.status ?? 1),
      status: Number(c.status ?? c.claim_status ?? 1),
      payment_status: Number(c.payment_status ?? 0),
      payment_date: c.payment_date,
      payment_amount: c.payment_amount,
      remarks: c.remarks || c.remark,
      audit_remarks: c.audit_remarks || c.remarks,
      claim_update_date: c.claim_update_date || c.updated_at || '',
      updated_at: c.updated_at || c.claim_update_date,
    }));
  },

  getClaimRequests: async () => jammuAdminSslService.getViewClaim(),

  /**
   * 18. Update Claim Status (Audit Claim)
   * POST /jammu/ssl/installation/update-claim-status
   * Body: id, status (2=Approve, 3=Reject), remarks
   */
  updateClaimStatus: async (payload: {
    id: number | string;
    status: number | string;
    remarks?: string;
  }): Promise<AdminApiResponse> => {
    const fd = new FormData();
    fd.append('id', String(payload.id));
    fd.append('status', String(payload.status));
    if (payload.remarks) {
      fd.append('remarks', payload.remarks);
      fd.append('remark', payload.remarks);
    }

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SSL_UPDATE_CLAIM_STATUS, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: fd,
    });

    return {
      success: res.success,
      status: res.success,
      message: res.message || (res.success ? 'Claim audit status updated.' : 'Failed to update claim'),
      data: res.data,
      errors: res.errors,
    };
  },

  auditClaimRequest: async (id: number | string, status: number | string, remarks?: string) => {
    return jammuAdminSslService.updateClaimStatus({ id, status, remarks });
  },

  /**
   * 19. View Payment Desk
   * GET /jammu/ssl/installation/view-payment?from_date=...&to_date=...&vendor=...
   * Top stats: Payment Request, Payment Complete, Payment Pending
   * Columns: Sr. No., State, Vendor Name, Site Count, Claim Invoice, Claim Amount, Claim Approved Date, Claim Approved by, Payment Date, Payment By, Pay Amount, Payment Remark, Action
   */
  getViewPayment: async (params?: {
    from_date?: string;
    to_date?: string;
    vendor?: string | number;
  }): Promise<ViewPaymentData> => {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SSL_VIEW_PAYMENT(params), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const payload = res.data || res.raw?.data || {};
    const rawPayments = Array.isArray(payload.payments)
      ? payload.payments
      : Array.isArray(payload)
      ? payload
      : [];

    const payments: SslPaymentRegisterItem[] = rawPayments.map((p: any) => ({
      id: p.id,
      state: p.state || 'jammu',
      voucher_no: p.voucher_no || `JK-VCH-${p.id}`,
      claim_id: p.claim_id ?? p.id,
      vendor_id: p.vendor_id ?? p.vendor ?? p.inst_vendor,
      vendor_name: p.vendor_name || (typeof p.vendor === 'object' ? p.vendor?.name : `Vendor ${p.vendor_id ?? p.vendor ?? p.id}`),
      site_count: Number(p.site_count ?? p.claim_site_count ?? p.total_sites ?? 1),
      claim_site_count: Number(p.claim_site_count ?? p.site_count ?? p.total_sites ?? 1),
      claim_invoice: p.claim_invoice || p.invoice_file || p.invoice,
      claim_amount: p.claim_amount ?? p.amount ?? 0,
      claim_approved_date: p.claim_approved_date || p.approved_date || p.claim_update_date || '',
      claim_approved_by: p.claim_approved_by || p.approved_by || 'Admin',
      payment_date: p.payment_date || p.disbursed_date || '',
      payment_by: p.payment_by || p.disbursed_by || 'Finance',
      pay_amount: p.pay_amount ?? p.payment_amount ?? p.disbursed_amount ?? 0,
      payment_amount: p.payment_amount ?? p.pay_amount ?? p.disbursed_amount ?? 0,
      payment_remark: p.payment_remark || p.payment_remarks || p.remarks,
      payment_remarks: p.payment_remarks || p.payment_remark || p.remarks,
      bank_name: p.bank_name,
      account_no: p.account_no,
      ifsc_code: p.ifsc_code,
      utr_no: p.utr_no,
      disbursed_amount: p.disbursed_amount ?? p.pay_amount ?? p.payment_amount ?? p.amount ?? 0,
      amount: p.amount ?? p.disbursed_amount ?? p.pay_amount ?? 0,
      disbursed_date: p.disbursed_date || p.payment_date || p.date,
      date: p.date || p.payment_date || p.disbursed_date,
      payment_status: Number(p.status ?? p.payment_status ?? (p.pay_amount || p.payment_date ? 1 : 0)),
      status: Number(p.status ?? p.payment_status ?? (p.pay_amount || p.payment_date ? 1 : 0)),
      payment_mode: p.payment_mode || 'RTGS',
      remarks: p.remarks || p.payment_remark || p.payment_remarks,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    const rawVendors = Array.isArray(payload.vendors)
      ? payload.vendors
      : Array.isArray(payload.vendor)
      ? payload.vendor
      : [];

    return {
      payment_request: Number(payload.payment_request ?? payload.totalsite ?? payments.length),
      payment_complete: Number(payload.payment_complete ?? payments.filter((x) => x.status === 1).length),
      payment_pending: Number(payload.payment_pending ?? payments.filter((x) => x.status !== 1).length),
      vendors: rawVendors.map((v: any) => ({
        id: v.id ?? v.vendor,
        name: v.name || v.vendor_name || `Vendor #${v.id ?? v.vendor}`,
        state: v.state || 'jammu',
      })),
      payments,
    };
  },

  getPaymentSettlements: async (params?: any) => jammuAdminSslService.getViewPayment(params),

  /**
   * 20. View Payment Filter
   */
  getViewPaymentFilter: async (params: {
    fromdate?: string;
    todate?: string;
    vendor?: string | number;
  }): Promise<ViewPaymentData> => {
    return jammuAdminSslService.getViewPayment({
      from_date: params.fromdate,
      to_date: params.todate,
      vendor: params.vendor,
    });
  },

  /**
   * 21. Update Payment Status
   * POST /jammu/ssl/installation/update-payment-status
   * Body: update_id, payment_amount, payment_remarks (supports id, amount, date, remarks)
   */
  updatePaymentStatus: async (payload: {
    id?: number | string;
    update_id?: number | string;
    amount?: number | string;
    payment_amount?: number | string;
    date?: string;
    remarks?: string;
    payment_remarks?: string;
  }): Promise<AdminApiResponse> => {
    const fd = new FormData();
    const targetId = payload.update_id ?? payload.id;
    if (targetId) {
      fd.append('update_id', String(targetId));
      fd.append('id', String(targetId));
    }
    const amt = payload.payment_amount ?? payload.amount;
    if (amt !== undefined) {
      fd.append('payment_amount', String(amt));
      fd.append('amount', String(amt));
    }
    if (payload.date) {
      fd.append('date', payload.date);
      fd.append('payment_date', payload.date);
    }
    const rem = payload.payment_remarks ?? payload.remarks;
    if (rem) {
      fd.append('payment_remarks', rem);
      fd.append('remarks', rem);
    }

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SSL_UPDATE_PAYMENT_STATUS, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: fd,
    });

    return {
      success: res.success,
      status: res.success,
      message: res.message || (res.success ? 'Payment successfully recorded.' : 'Failed to record payment'),
      data: res.data,
      errors: res.errors,
    };
  },

  recordPaymentSettlement: async (
    claimId: number | string,
    arg2?:
      | {
          utr_no?: string;
          bank_name?: string;
          account_no?: string;
          ifsc_code?: string;
          disbursed_amount?: number | string;
          payment_mode?: string;
          remarks?: string;
        }
      | string,
    _payment_mode?: string,
    date?: string,
    remarks?: string
  ) => {
    let payDate = date || new Date().toISOString().slice(0, 10);
    let rem = remarks || '';
    let amount: number | string = 0;

    if (typeof arg2 === 'object' && arg2 !== null) {
      amount = arg2.disbursed_amount ?? 0;
      rem = arg2.remarks || (arg2.utr_no ? `UTR: ${arg2.utr_no}` : '');
    } else if (typeof arg2 === 'string') {
      rem = remarks ? `${remarks} (UTR: ${arg2})` : `UTR: ${arg2}`;
    }

    return jammuAdminSslService.updatePaymentStatus({
      update_id: claimId,
      id: claimId,
      payment_amount: amount,
      amount,
      date: payDate,
      payment_remarks: rem,
      remarks: rem,
    });
  },

  /**
   * Vendor Map Lookup
   */
  getVendorMap: async (): Promise<Record<string, string>> => {
    try {
      const { vendors } = await jammuAdminSslService.getAssignFormData();
      const map: Record<string, string> = {};
      vendors.forEach((v) => {
        map[String(v.id)] = v.name;
      });
      return map;
    } catch {
      return {};
    }
  },
};

export const jammuSslAdminService = jammuAdminSslService;
export default jammuAdminSslService;
