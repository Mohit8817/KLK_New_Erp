import { API_BASE_URL, authService } from '../../../../../services/authService';
import {
  resolveJammuSwpMediaUrl,
  getJammuSwpMediaCandidates,
  type JammuSwpDashboardData,
  type JammuSwpDistrictInstall,
  type JammuSwpDistrictwiseRow,
  type JammuSwpMonthlyInstall,
  type JammuSwpInstalledSiteItem,
  type JammuSwpAssignItem,
  type JammuSwpClaimItem,
} from '../../../../V-Portal/jammu/jammu-services';
import { JAMMU_VENDOR_API, buildCandidateUrls as buildCentralCandidateUrls } from '../../../Vendor_Management_APIS/Jammu_Vendor_API';

export { resolveJammuSwpMediaUrl, getJammuSwpMediaCandidates };

export const JAMMU_SWP_DISTRICTS = [
  'Jammu',
  'Samba',
  'Kathua',
  'Udhampur',
  'Reasi',
  'Rajouri',
  'Poonch',
  'Doda',
  'Ramban',
  'Kishtwar',
  'Srinagar',
  'Baramulla',
  'Anantnag',
  'Pulwama',
  'Kupwara',
  'Budgam',
  'Ganderbal',
  'Kulgam',
  'Bandipora',
  'Shopian',
] as const;
export type {
  JammuSwpDashboardData,
  JammuSwpDistrictInstall,
  JammuSwpDistrictwiseRow,
  JammuSwpMonthlyInstall,
  JammuSwpInstalledSiteItem,
  JammuSwpAssignItem,
  JammuSwpClaimItem,
};

/* ═══════════════════════════════════════════════════════════════════════════
   TypeScript Interfaces for Jammu SWP Installation
   Controller: App\Http\Controllers\admin\jammu\JammuSwpInstallationController
   ═══════════════════════════════════════════════════════════════════════════ */

export interface JammuSwpVendorItem {
  id: number;
  name: string;
  state?: string;
  company_id?: number;
  email?: string;
  phone?: string;
}

export interface JammuSwpVolumeItem {
  id?: number;
  volume: string;
  scheme_name?: string;
  target?: number;
}

export interface JammuSwpDistrictItem {
  id?: number;
  district: string;
}

export interface JammuSwpFarmerSiteItem {
  id: number;
  f_farmer_name: string;
  f_farmer_id?: string;
  f_father_name?: string;
  contact_no?: string;
  f_district?: string;
  f_block?: string;
  f_village?: string;
  pump_capacity?: string;
  pump_type?: string;
  pump_subtype?: string;
  [key: string]: any;
}

export interface JammuSwpAssignSiteItem {
  id: number;
  farmer_name?: string;
  f_farmer_name?: string;
  inst_deadline?: string;
  [key: string]: any;
}

export interface JammuSwpAssignRecord {
  id: number;
  vendor: number | string;
  purpose?: string;
  state: string;
  project?: string;
  district: string;
  block?: string | null;
  village?: string | null;
  volume: string;
  status: number; // 0 = Pending, 1 = Approved, 2 = Accepted
  site_id: number[] | string;
  site_count?: number;
  assign_date?: string;
  deadline_date?: string;
  file?: string | null;
  remarks?: string | null;
  vendors?: { id: number; name: string };
  sites?: JammuSwpAssignSiteItem[];
  site_details?: JammuSwpFarmerSiteItem[];
  created_at?: string;
  [key: string]: any;
}

export interface JammuSwpPaymentInstallment {
  id: number;
  claim_id: number;
  amount: number | string;
  balance?: number | string;
  date?: string;
  pay_remarks?: string;
  [key: string]: any;
}

export interface JammuSwpPaymentRecord {
  id: number;
  vendor_id?: number;
  vendor?: string;
  vendor_name?: string;
  claim_id?: number;
  claim_no?: string;
  amount: number | string;
  pay_status: number; // 0 = Pending, 1 = Complete, 2 = Partially
  total_sites?: number;
  claim_amount?: number;
  paid_amount?: number;
  balance_amount?: number;
  status?: number;
  allpayment?: JammuSwpPaymentInstallment[];
  sites?: Array<{ id: number; farmer_name?: string }>;
  payment_date?: string;
  utr_no?: string;
  payment_mode?: string;
  file?: string | null;
  remarks?: string | null;
  [key: string]: any;
}

export interface JammuSwpDashboardResponseData {
  swp: {
    site_count: number;
    complete: number;
    pending: number;
    site_assigned: number;
    site_not_assigned: number;
    verify_pending: number;
    verify_approved: number;
    verify_reject: number;
    claim_applicable: number;
    claim_raised: number;
    claim_approved: number;
    claim_pending: number;
    inst_pay_done: number;
    inst_pay_partially: number;
    inst_pay_pending: number;
  };
  payment_amount: number;
  claim_amount: number;
  districtwise: Array<{
    district: string;
    total: number;
    total_assigned: number;
    inst_complete: number;
    inst_pending: number;
    verify_pending: number;
    verify_approved: number;
    verify_reject: number;
    claim_raised: number;
    claim_approved: number;
    claim_reject: number;
    payment_pending: number;
    payment_done: number;
    payment_partially: number;
  }>;
  vendors: Array<{
    inst_vendor: string | number;
    vendor: number;
    name: string;
  }>;
  vendorswise: Array<{
    inst_vendor: string | number;
    vendor_name: string;
    site_count: number;
    inst_complete: number;
    inst_pending: number;
    verify_pending: number;
    verify_approved: number;
    verify_reject: number;
    claim_raised: number;
    claim_approved: number;
    claim_reject: number;
    payment_pending: number;
    payment_done: number;
    payment_partially: number;
  }>;
  vendor_installation_month: Array<{
    month_year: string;
    monthly_installations: number;
  }>;
  vendor_today_installation: Array<{
    inst_vendor: string | number;
    today_install: number;
  }>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   HTTP Request Helper with Multi-Candidate Fallback & Working-Prefix Cache
   ═══════════════════════════════════════════════════════════════════════════ */

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api/admin').replace(/\/+$/, '');
export const BASE_API_URL = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api/admin`;
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
    message: lastError?.message || 'Failed to fetch from Jammu SWP API',
    errors: lastJson?.errors || lastError,
    raw: lastJson,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Robust Admin SWP Service — 100% Live Backend APIs (Zero Mock Data)
   ═══════════════════════════════════════════════════════════════════════════ */

export const jammuAdminSwpService = {
  /**
   * 17. Dashboard Summary
   */
  getDashboard: async (): Promise<JammuSwpDashboardResponseData> => {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SWP_DASHBOARD, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const payload: any = res.data?.swp ? res.data : res.raw?.data || res.data || {};

    return {
      swp: {
        site_count: Number(payload.swp?.site_count ?? 0),
        complete: Number(payload.swp?.complete ?? 0),
        pending: Number(payload.swp?.pending ?? 0),
        site_assigned: Number(payload.swp?.site_assigned ?? 0),
        site_not_assigned: Number(payload.swp?.site_not_assigned ?? 0),
        verify_pending: Number(payload.swp?.verify_pending ?? 0),
        verify_approved: Number(payload.swp?.verify_approved ?? 0),
        verify_reject: Number(payload.swp?.verify_reject ?? 0),
        claim_applicable: Number(payload.swp?.claim_applicable ?? 0),
        claim_raised: Number(payload.swp?.claim_raised ?? 0),
        claim_approved: Number(payload.swp?.claim_approved ?? 0),
        claim_pending: Number(payload.swp?.claim_pending ?? 0),
        inst_pay_done: Number(payload.swp?.inst_pay_done ?? 0),
        inst_pay_partially: Number(payload.swp?.inst_pay_partially ?? 0),
        inst_pay_pending: Number(payload.swp?.inst_pay_pending ?? 0),
      },
      payment_amount: Number(payload.payment_amount ?? 0),
      claim_amount: Number(payload.claim_amount ?? 0),
      districtwise: Array.isArray(payload.districtwise) ? payload.districtwise : [],
      vendors: Array.isArray(payload.vendors) ? payload.vendors : [],
      vendorswise: Array.isArray(payload.vendorswise) ? payload.vendorswise : [],
      vendor_installation_month: Array.isArray(payload.vendor_installation_month)
        ? payload.vendor_installation_month
        : [],
      vendor_today_installation: Array.isArray(payload.vendor_today_installation)
        ? payload.vendor_today_installation
        : [],
    };
  },

  /**
   * 18. Drill-down: View Dashboard
   */
  getViewDashboard: async (status: string): Promise<any[]> => {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SWP_VIEW_DASHBOARD(status), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const payload = res.data?.swp ? res.data.swp : res.raw?.data?.swp || res.data || [];
    return Array.isArray(payload) ? payload : [];
  },

  /**
   * 19. Drill-down: Vendor-wise Data
   */
  getVendorWiseData: async (status: string, vendor: string | number): Promise<any[]> => {
    const res = await apiRequest<any>(
      JAMMU_VENDOR_API.ADMIN_SWP_VENDORWISE_DATA(status, vendor),
      { method: 'GET', headers: getAuthHeaders() }
    );
    const payload = res.data?.swp ? res.data.swp : res.raw?.data?.swp || res.data || [];
    return Array.isArray(payload) ? payload : [];
  },

  /**
   * 20. Drill-down: District-wise Data
   */
  getDistrictWiseData: async (status: string, district: string): Promise<any[]> => {
    const res = await apiRequest<any>(
      JAMMU_VENDOR_API.ADMIN_SWP_DISTRICTWISE_DATA(status, district),
      { method: 'GET', headers: getAuthHeaders() }
    );
    const payload = res.data?.swp ? res.data.swp : res.raw?.data?.swp || res.data || [];
    return Array.isArray(payload) ? payload : [];
  },

  /**
   * Universal Drill-down router
   */
  getDrillDownData: async (status: string, vendor?: string | number, district?: string): Promise<any[]> => {
    if (vendor !== undefined && vendor !== '' && vendor !== 'all') {
      return jammuAdminSwpService.getVendorWiseData(status, vendor);
    }
    if (district !== undefined && district !== '' && district !== 'all') {
      return jammuAdminSwpService.getDistrictWiseData(status, district);
    }
    return jammuAdminSwpService.getViewDashboard(status);
  },

  /**
   * 1. Assign Form Data (vendor & volumes list)
   */
  getAssignFormData: async (): Promise<{
    vendors: JammuSwpVendorItem[];
    volumes: JammuSwpVolumeItem[];
    loginId?: number;
    company_id?: number;
    role?: string;
    state?: string;
  }> => {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SWP_ASSIGN, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const payload = res.data?.vendor !== undefined ? res.data : res.raw?.data || res.data || {};

    const rawVendors = Array.isArray(payload.vendor) ? payload.vendor : Array.isArray(payload.vendors) ? payload.vendors : [];
    const vendors: JammuSwpVendorItem[] = rawVendors.map((v: any) => ({
      id: Number(v.id || v.vendor_id || v.inst_vendor || 0),
      name: v.name || v.vendor_name || `Vendor #${v.id}`,
      state: v.state || 'jammu',
      company_id: v.company_id,
      email: v.email,
      phone: v.phone || v.mobile,
    }));

    const rawVolumes = Array.isArray(payload.volumes) ? payload.volumes : [];
    const volumes: JammuSwpVolumeItem[] = rawVolumes.map((vol: any, idx: number) => ({
      id: vol.id ?? idx + 1,
      volume: String(vol.volume ?? vol),
      scheme_name: vol.scheme_name,
      target: vol.target,
    }));

    return {
      vendors,
      volumes,
      loginId: payload.loginId,
      company_id: payload.company_id,
      role: payload.role,
      state: payload.state || 'jammu',
    };
  },

  /**
   * 2. Fetch District by Volume
   */
  fetchDistricts: async (volume: string | number = '1'): Promise<JammuSwpDistrictItem[]> => {
    const res = await apiRequest<any>(
      JAMMU_VENDOR_API.ADMIN_SWP_FETCH_DISTRICT(volume),
      { method: 'GET', headers: getAuthHeaders() }
    );
    const rawList = Array.isArray(res.data) ? res.data : Array.isArray(res.raw?.data) ? res.raw.data : [];
    return rawList.map((item: any, idx: number) => ({
      id: item.id ?? idx + 1,
      district: item.district || String(item),
    }));
  },

  /**
   * 3. Fetch Applicants by District & Volume
   */
  fetchApplicants: async (
    district: string,
    volume: string | number = '1'
  ): Promise<JammuSwpFarmerSiteItem[]> => {
    const res = await apiRequest<any>(
      JAMMU_VENDOR_API.ADMIN_SWP_FETCH_APPLICANTS(district, volume),
      { method: 'GET', headers: getAuthHeaders() }
    );
    const rawList = Array.isArray(res.data) ? res.data : Array.isArray(res.raw?.data) ? res.raw.data : [];
    return rawList.map((a: any) => ({
      id: a.id,
      f_farmer_name: a.f_farmer_name || a.farmer_name || `Applicant #${a.id}`,
      f_farmer_id: a.f_farmer_id || a.farmer_id || `SWP-${a.id}`,
      f_father_name: a.f_father_name || a.father_name || '—',
      contact_no: a.contact_no || a.mobile || a.phone || '—',
      f_district: a.f_district || a.district || district,
      f_block: a.f_block || a.block || '—',
      f_village: a.f_village || a.village || '—',
      pump_capacity: a.pump_capacity || a.capacity || '—',
      pump_type: a.pump_type || '—',
      pump_subtype: a.pump_subtype || '—',
    }));
  },

  /**
   * Alias for fetchApplicants
   */
  fetchFarmers: async (district: string, volume: string | number = '1'): Promise<JammuSwpFarmerSiteItem[]> => {
    return jammuAdminSwpService.fetchApplicants(district, volume);
  },

  /**
   * 4. Store Assign (multipart/form-data)
   */
  storeAssign: async (
    formData: FormData
  ): Promise<{ success: boolean; status: boolean; message: string; data?: any; errors?: any }> => {
    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SWP_STORE_ASSIGN, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    return {
      success: res.success,
      status: res.success,
      message: res.message || (res.success ? 'Site Assigned Successfully!' : 'Failed to assign site'),
      data: res.data,
      errors: res.errors,
    };
  },

  /**
   * 5. View Assign
   */
  getViewAssign: async (): Promise<{
    assigns: JammuSwpAssignRecord[];
    detail?: {
      total: number;
      assigned: number;
      not_assigned: number;
      complete: number;
      pending: number;
      verify_approved: number;
      verify_pending: number;
      verify_reject: number;
    };
    summary?: any;
  }> => {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SWP_VIEW_ASSIGN, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const payload: any = res.data?.assigns !== undefined || res.data?.assign !== undefined || res.data?.detail !== undefined
      ? res.data
      : res.raw?.data || res.data || {};
    const rawAssigns = Array.isArray(payload.assigns)
      ? payload.assigns
      : Array.isArray(payload.assign)
      ? payload.assign
      : Array.isArray(payload.assignments)
      ? payload.assignments
      : Array.isArray(payload.viewassign)
      ? payload.viewassign
      : Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload)
      ? payload
      : [];

    const assigns: JammuSwpAssignRecord[] = rawAssigns.map((row: any) => {
      let siteIds: number[] = [];
      if (Array.isArray(row.site_id)) {
        siteIds = row.site_id.map(Number);
      } else if (typeof row.site_id === 'string') {
        try {
          const parsed = JSON.parse(row.site_id);
          if (Array.isArray(parsed)) siteIds = parsed.map(Number);
        } catch {
          siteIds = row.site_id.split(',').map((s: string) => Number(s.trim())).filter(Boolean);
        }
      }

      return {
        id: row.id,
        vendor: row.vendor,
        purpose: row.purpose || 'Installation',
        state: row.state || 'jammu',
        project: row.project || 'swp',
        district: row.district || '—',
        block: row.block || null,
        village: row.village || null,
        volume: String(row.volume ?? '1'),
        status: Number(row.status ?? 0),
        site_id: siteIds,
        site_count: Number(row.site_count ?? siteIds.length),
        assign_date: row.assign_date || row.created_at || '—',
        deadline_date: row.deadline_date || row.inst_deadline || '—',
        file: row.file ? resolveJammuSwpMediaUrl(row.file) : null,
        remarks: row.remarks || '',
        vendors: row.vendors || (row.vendor_name ? { id: Number(row.vendor), name: row.vendor_name } : undefined),
        sites: Array.isArray(row.sites)
          ? row.sites.map((s: any) => ({
              id: s.id,
              farmer_name: s.farmer_name || s.f_farmer_name || `Farmer #${s.id}`,
              f_farmer_name: s.f_farmer_name || s.farmer_name || `Farmer #${s.id}`,
              f_father_name: s.f_father_name || s.father_name || '',
              contact_no: s.contact_no || s.mobile || '',
              f_district: s.f_district || s.district || row.district,
              f_block: s.f_block || s.block || row.block || '',
              f_village: s.f_village || s.village || row.village || '',
              pump_capacity: s.pump_capacity || s.capacity || '',
              inst_deadline: s.inst_deadline || s.deadline_date || row.deadline_date,
            }))
          : [],
        site_details: Array.isArray(row.sites)
          ? row.sites.map((s: any) => ({
              id: s.id,
              f_farmer_name: s.farmer_name || s.f_farmer_name || `Farmer #${s.id}`,
              f_father_name: s.f_father_name || s.father_name || '',
              contact_no: s.contact_no || s.mobile || '',
              f_district: s.f_district || s.district || row.district,
              f_block: s.f_block || s.block || row.block || '',
              f_village: s.f_village || s.village || row.village || '',
            }))
          : [],
        created_at: row.created_at,
      };
    });

    const rawDetail = payload.detail || res.raw?.detail || res.raw?.data?.detail || res.data?.detail;
    const detail = {
      total: Number(rawDetail?.total ?? 0),
      assigned: Number(rawDetail?.assigned ?? 0),
      not_assigned: Number(rawDetail?.not_assigned ?? 0),
      complete: Number(rawDetail?.complete ?? 0),
      pending: Number(rawDetail?.pending ?? 0),
      verify_approved: Number(rawDetail?.verify_approved ?? 0),
      verify_pending: Number(rawDetail?.verify_pending ?? 0),
      verify_reject: Number(rawDetail?.verify_reject ?? 0),
    };

    return {
      assigns,
      detail,
      summary: detail,
    };
  },

  /**
   * 6. Assign Approve
   */
  approveAssign: async (id: number | string): Promise<{ success: boolean; status: boolean; message: string; data?: any }> => {
    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SWP_ASSIGN_APPROVE(id), {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return {
      success: res.success,
      status: res.success,
      message: res.message || (res.success ? 'Assigned Installation Approved Successfully.' : 'Failed to approve'),
      data: res.data,
    };
  },

  /**
   * 7. Edit Assign (Fetch data)
   */
  getEditAssign: async (id: number | string): Promise<any> => {
    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SWP_EDIT_ASSIGN(id), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return res.data?.assign !== undefined ? res.data : res.raw?.data || res.data || {};
  },

  /**
   * 8. Update Assign
   */
  updateAssign: async (
    id: number | string,
    formData: FormData
  ): Promise<{ success: boolean; status: boolean; message: string; data?: any }> => {
    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SWP_UPDATE_ASSIGN(id), {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    return {
      success: res.success,
      status: res.success,
      message: res.message || (res.success ? 'Assigned Site Updated Successfully!' : 'Failed to update assigned site'),
      data: res.data,
    };
  },

  /**
   * 9. View Installation
   */
  getViewInstallation: async (): Promise<{
    detail: any;
    verification: any[];
    verified: any[];
    sites?: JammuSwpInstalledSiteItem[];
    summary?: any;
  }> => {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SWP_VIEW_INSTALLATION, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const payload: any = res.data?.verification !== undefined || res.data?.verified !== undefined || res.data?.detail !== undefined
      ? res.data
      : res.raw?.data || res.data || {};

    const rawDetail = payload.detail || res.raw?.detail || res.raw?.data?.detail || res.data?.detail;
    const detail = {
      total: Number(rawDetail?.total ?? 0),
      assigned: Number(rawDetail?.assigned ?? 0),
      not_assigned: Number(rawDetail?.not_assigned ?? 0),
      complete: Number(rawDetail?.complete ?? 0),
      pending: Number(rawDetail?.pending ?? 0),
      verify_approved: Number(rawDetail?.verify_approved ?? 0),
      verify_pending: Number(rawDetail?.verify_pending ?? 0),
      verify_reject: Number(rawDetail?.verify_reject ?? 0),
    };
    const verification = Array.isArray(payload.verification)
      ? payload.verification
      : Array.isArray(payload.pending)
      ? payload.pending
      : [];
    const verified = Array.isArray(payload.verified)
      ? payload.verified
      : Array.isArray(payload.approved)
      ? payload.approved
      : [];

    const mapRowToSite = (item: any, defaultSt = 0): JammuSwpInstalledSiteItem => ({
      id: item.id,
      vendor_name: item.vendor_name || item.vendor || (item.inst_vendor ? `Vendor #${item.inst_vendor}` : '—'),
      f_farmer_name: item.f_farmer_name || item.farmer_name || item.applicant_name || `Farmer #${item.id}`,
      f_farmer_id: item.f_farmer_id || item.farmer_id || `SWP-${item.id}`,
      contact_no: item.contact_no || item.mobile || item.phone || '—',
      state: item.state || 'jammu',
      district: item.district || item.f_district || '—',
      block: item.block || item.f_block || '—',
      post: item.post || '—',
      village: item.village || item.f_village || '—',
      pump_capacity: item.pump_capacity || item.capacity || '—',
      pump_type: item.pump_type || '—',
      pump_subtype: item.pump_subtype || '—',
      pump_sr_no: item.pump_sr_no || item.pump_no || '—',
      controller_sr_no: item.controller_sr_no || item.vfd_no || item.controller_no || '—',
      module_sr_no: Array.isArray(item.jammu_modulee || item.jammuModulee || item.modules)
        ? (item.jammu_modulee || item.jammuModulee || item.modules).map((m: any) => m.sr_no || m.module_no || m.serial_no).filter(Boolean).join(', ')
        : item.module_sr_no || '—',
      farmer_with_module: (item.module_image || item.farmer_with_module || item.farmer_module_image) ? resolveJammuSwpMediaUrl(item.module_image || item.farmer_with_module || item.farmer_module_image) : undefined,
      inverter_vfd: (item.vfd_image || item.inverter_vfd || item.inverter_vfd_farmer_image) ? resolveJammuSwpMediaUrl(item.vfd_image || item.inverter_vfd || item.inverter_vfd_farmer_image) : undefined,
      running_water: (item.running_water_image || item.running_water || item.running_water_farmer_image) ? resolveJammuSwpMediaUrl(item.running_water_image || item.running_water || item.running_water_farmer_image) : undefined,
      hoc_photo: (item.pole_image || item.hoc_photo || item.inst_doc) ? resolveJammuSwpMediaUrl(item.pole_image || item.hoc_photo || item.inst_doc) : undefined,
      verify_status: Number(item.inst_verify_status ?? defaultSt),
      verify_file: (item.inst_doc || item.inst_verify_file || item.verify_file || item.file || item.verify_doc || item.document || item.doc_file) ? resolveJammuSwpMediaUrl(item.inst_doc || item.inst_verify_file || item.verify_file || item.file || item.verify_doc || item.document || item.doc_file) : undefined,
      verify_remarks: item.inst_verify_remarks || item.verify_remarks || item.remark || item.remarks || '',
      doc_verify_status: Number(item.inst_doc_status ?? 1),
      doc_verify_remarks: item.inst_doc_remarks || item.doc_verify_remarks || '',
      created_at: item.created_at,
    });

    const unifiedSites: JammuSwpInstalledSiteItem[] = [
      ...verification.map((x: any) => mapRowToSite(x, 0)),
      ...verified.map((x: any) => mapRowToSite(x, 1)),
    ];

    return {
      detail,
      verification,
      verified,
      sites: unifiedSites,
      summary: detail,
    };
  },

  /**
   * Alias for getInstalledSites
   */
  getInstalledSites: async () => {
    return jammuAdminSwpService.getViewInstallation();
  },

  /**
   * 10. Verify Installation Status
   */
  verifyInstallationStatus: async (payload: {
    id: number | string;
    status: number | string;
    file?: File | null;
    inst_verify_remarks?: string;
    remarks?: string;
    remark?: string;
  }): Promise<{ success: boolean; status: boolean; message: string; data?: any }> => {
    const fd = new FormData();
    fd.append('id', String(payload.id));
    fd.append('status', String(payload.status));
    if (payload.file) {
      fd.append('file', payload.file);
    }
    const remarks = payload.inst_verify_remarks || payload.remarks || payload.remark || '';
    if (remarks) {
      fd.append('inst_verify_remarks', remarks);
      fd.append('remarks', remarks);
      fd.append('remark', remarks);
    }

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SWP_VERIFY_INSTALLATION, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: fd,
    });

    return {
      success: res.success,
      status: res.success,
      message: res.message || (res.success ? 'Status Updated Successfully.' : 'Failed to update status'),
      data: res.data,
    };
  },

  /**
   * 11. View Installation Document
   */
  getViewInstallationDocument: async (): Promise<{
    detail: any;
    verification: any[];
    verified: any[];
    sites?: JammuSwpInstalledSiteItem[];
    summary?: any;
  }> => {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SWP_VIEW_INSTALLATION_DOCUMENT, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const payload: any = res.data?.verification !== undefined || res.data?.verified !== undefined || res.data?.detail !== undefined
      ? res.data
      : res.raw?.data || res.data || {};

    const rawDetail = payload.detail || res.raw?.detail || res.raw?.data?.detail || res.data?.detail;
    const detail = {
      total: Number(rawDetail?.total ?? 0),
      assigned: Number(rawDetail?.assigned ?? 0),
      not_assigned: Number(rawDetail?.not_assigned ?? 0),
      complete: Number(rawDetail?.complete ?? 0),
      pending: Number(rawDetail?.pending ?? 0),
      doc_approved: Number(rawDetail?.doc_approved ?? 0),
      doc_pending: Number(rawDetail?.doc_pending ?? 0),
      doc_reject: Number(rawDetail?.doc_reject ?? 0),
    };
    const verification = Array.isArray(payload.verification)
      ? payload.verification
      : Array.isArray(payload.pending)
      ? payload.pending
      : [];
    const verified = Array.isArray(payload.verified)
      ? payload.verified
      : Array.isArray(payload.approved)
      ? payload.approved
      : [];

    const mapDocRow = (item: any, defaultSt = 1): JammuSwpInstalledSiteItem => ({
      id: item.id,
      vendor_name: item.vendor_name || item.vendor || (item.inst_vendor ? `Vendor #${item.inst_vendor}` : '—'),
      f_farmer_name: item.f_farmer_name || item.farmer_name || item.applicant_name || `Farmer #${item.id}`,
      f_farmer_id: item.f_farmer_id || item.farmer_id || `SWP-${item.id}`,
      contact_no: item.contact_no || item.mobile || item.phone || '—',
      state: item.state || 'jammu',
      district: item.district || item.f_district || '—',
      block: item.block || item.f_block || '—',
      post: item.post || '—',
      village: item.village || item.f_village || '—',
      pump_capacity: item.pump_capacity || item.capacity || '—',
      pump_type: item.pump_type || '—',
      pump_subtype: item.pump_subtype || '—',
      pump_sr_no: item.pump_sr_no || item.pump_no || '—',
      controller_sr_no: item.controller_sr_no || item.vfd_no || item.controller_no || '—',
      module_sr_no: Array.isArray(item.jammu_modulee || item.jammuModulee || item.modules)
        ? (item.jammu_modulee || item.jammuModulee || item.modules).map((m: any) => m.sr_no || m.module_no || m.serial_no).filter(Boolean).join(', ')
        : item.module_sr_no || '—',
      farmer_with_module: (item.module_image || item.farmer_with_module || item.farmer_module_image) ? resolveJammuSwpMediaUrl(item.module_image || item.farmer_with_module || item.farmer_module_image) : undefined,
      inverter_vfd: (item.vfd_image || item.inverter_vfd || item.inverter_vfd_farmer_image) ? resolveJammuSwpMediaUrl(item.vfd_image || item.inverter_vfd || item.inverter_vfd_farmer_image) : undefined,
      running_water: (item.running_water_image || item.running_water || item.running_water_farmer_image) ? resolveJammuSwpMediaUrl(item.running_water_image || item.running_water || item.running_water_farmer_image) : undefined,
      hoc_photo: (item.inst_doc || item.pole_image || item.hoc_photo || item.doc_file || item.document_file || item.file) ? resolveJammuSwpMediaUrl(item.inst_doc || item.pole_image || item.hoc_photo || item.doc_file || item.document_file || item.file) : undefined,
      verify_status: Number(item.inst_verify_status ?? 1),
      verify_remarks: item.inst_verify_remarks || '',
      doc_verify_status: Number(item.inst_doc_status ?? defaultSt),
      doc_verify_remarks: item.remarks || item.inst_doc_remarks || item.doc_verify_remarks || '',
      created_at: item.created_at,
    });

    const unifiedSites: JammuSwpInstalledSiteItem[] = [
      ...verification.map((x: any) => mapDocRow(x, 1)),
      ...verified.map((x: any) => mapDocRow(x, 2)),
    ];

    return {
      detail,
      verification,
      verified,
      sites: unifiedSites,
      summary: detail,
    };
  },

  /**
   * 12. Verify Installation Document
   */
  verifyInstallationDocument: async (payload: {
    id: number | string;
    status: number;
    remarks?: string;
  }): Promise<{ success: boolean; status: boolean; message: string; data?: any }> => {
    const fd = new FormData();
    fd.append('id', String(payload.id));
    fd.append('status', String(payload.status));
    if (payload.remarks) {
      fd.append('remarks', payload.remarks);
    }

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SWP_VERIFY_INSTALLATION_DOCUMENT, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: fd,
    });

    return {
      success: res.success,
      status: res.success,
      message: res.message || (res.success ? 'Document verification status updated successfully.' : 'Failed to update document'),
      data: res.data,
    };
  },

  /**
   * Alias for verifyDocumentStatus
   */
  verifyDocumentStatus: async (payload: { id: number | string; status: number; remarks: string }) => {
    return jammuAdminSwpService.verifyInstallationDocument(payload);
  },

  /**
   * 13. View Claim
   */
  getViewClaim: async (): Promise<{ claims: any[]; sites?: any[] }> => {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SWP_VIEW_CLAIM, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const rawClaims = Array.isArray(res.data) ? res.data : Array.isArray(res.raw?.data) ? res.raw.data : [];
    return {
      claims: rawClaims,
      sites: [],
    };
  },

  /**
   * Alias for getClaims
   */
  getClaims: async () => {
    return jammuAdminSwpService.getViewClaim();
  },

  /**
   * 14. Update Claim Status
   */
  updateClaimStatus: async (payload: {
    id: number | string;
    status: number;
    remarks?: string;
  }): Promise<{ success: boolean; status: boolean; message: string; data?: any }> => {
    const fd = new FormData();
    fd.append('id', String(payload.id));
    fd.append('status', String(payload.status));
    if (payload.remarks) {
      fd.append('remarks', payload.remarks);
    }

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SWP_UPDATE_CLAIM_STATUS, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: fd,
    });

    return {
      success: res.success,
      status: res.success,
      message: res.message || (res.success ? 'Claim status updated successfully.' : 'Failed to update claim'),
      data: res.data,
    };
  },

  /**
   * Alias for approveClaim
   */
  approveClaim: async (payload: { id: number | string; status: number; remarks: string }) => {
    return jammuAdminSwpService.updateClaimStatus(payload);
  },

  /**
   * 15. View Payment
   */
  getViewPayment: async (params?: {
    from_date?: string;
    to_date?: string;
    vendor?: string | number;
    status?: string | number;
  }): Promise<{
    payments: JammuSwpPaymentRecord[];
    payment_detail?: { total: number; complete: number; partially: number; pending: number };
    vendor?: any[];
  }> => {
    const res = await apiRequest<any>(JAMMU_VENDOR_API.ADMIN_SWP_VIEW_PAYMENT(params), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const payload: any = res.data?.payments !== undefined ? res.data : res.raw?.data || res.data || {};
    const rawPayments = Array.isArray(payload.payments) ? payload.payments : [];

    const payments: JammuSwpPaymentRecord[] = rawPayments.map((p: any) => ({
      id: p.id,
      vendor_id: p.vendor_id,
      vendor: p.vendor_name || `Vendor #${p.vendor_id}`,
      vendor_name: p.vendor_name || `Vendor #${p.vendor_id}`,
      claim_id: p.id,
      amount: p.amount,
      pay_status: Number(p.pay_status ?? 0),
      total_sites: Array.isArray(p.sites) ? p.sites.length : 0,
      claim_amount: Number(p.amount ?? 0),
      allpayment: Array.isArray(p.allpayment) ? p.allpayment : [],
      sites: Array.isArray(p.sites) ? p.sites : [],
      payment_date: p.date,
      remarks: p.remarks,
    }));

    return {
      payments,
      payment_detail: payload.payment_detail || { total: 0, complete: 0, partially: 0, pending: 0 },
      vendor: Array.isArray(payload.vendor) ? payload.vendor : [],
    };
  },

  /**
   * Alias for getPayments
   */
  getPayments: async (params?: any) => {
    return jammuAdminSwpService.getViewPayment(params);
  },

  /**
   * 16. Update Payment Status
   */
  updatePaymentStatus: async (payload: {
    id: number | string;
    amount: number | string;
    date: string;
    remarks?: string;
  }): Promise<{ success: boolean; status: boolean; message: string; data?: any }> => {
    const fd = new FormData();
    fd.append('id', String(payload.id));
    fd.append('amount', String(payload.amount));
    fd.append('date', payload.date);
    if (payload.remarks) {
      fd.append('remarks', payload.remarks);
    }

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SWP_UPDATE_PAYMENT_STATUS, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: fd,
    });

    return {
      success: res.success,
      status: res.success,
      message: res.message || (res.success ? 'Payment successfully recorded.' : 'Failed to record payment'),
      data: res.data,
    };
  },

  /**
   * Alias for disbursePayment
   */
  disbursePayment: async (payload: {
    id: number | string;
    amount: number | string;
    utr_no?: string;
    payment_date?: string;
    date?: string;
    payment_mode?: string;
    remarks?: string;
  }) => {
    return jammuAdminSwpService.updatePaymentStatus({
      id: payload.id,
      amount: payload.amount,
      date: payload.date || payload.payment_date || new Date().toISOString().slice(0, 10),
      remarks: payload.remarks || (payload.utr_no ? `UTR: ${payload.utr_no}` : ''),
    });
  },
};

export const jammuSwpAdminService = jammuAdminSwpService;
export default jammuAdminSwpService;
