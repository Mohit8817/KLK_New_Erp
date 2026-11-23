import { API_BASE_URL, authService } from '../../../../services/authService';
import { JAMMU_VENDOR_API } from '../../Vendor_Management_APIS/Jammu_Vendor_API';

export { JAMMU_VENDOR_API };

/* ═══════════════════════════════════════════════════════════════════════════════
   Base URL & Media URL Resolution (Strictly Jammu Survey)
   ═══════════════════════════════════════════════════════════════════════════════ */

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const BASE_ROOT_URL = RAW_BASE.replace(/\/api\/?$/, '');
export const BASE_API_URL = `${BASE_ROOT_URL}/api`;
export const ADMIN_API_URL = `${BASE_ROOT_URL}/api/admin`;
export const ADMIN_ROOT_URL = `${BASE_ROOT_URL}/api/admin`;

export function resolveJammuSurveyMediaUrl(
  path?: string | null,
  category: 'resco_image' | 'resco_pdf' | 'resco_bos' | 'srt_image' | 'srt_pdf' | 'resco_doc' = 'resco_image'
): string {
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

  const filename = clean.split('/').pop() || clean;

  if (category === 'resco_image' && !clean.includes('/')) {
    return `${base}/uploads/jammu/survey/resco/images/${filename}`;
  }
  if (category === 'resco_pdf' && !clean.includes('/')) {
    return `${base}/uploads/jammu/survey/resco/pdf/${filename}`;
  }
  if (category === 'resco_bos' && !clean.includes('/')) {
    return `${base}/uploads/jammu/survey/resco/bos/${filename}`;
  }
  if (category === 'srt_image' && !clean.includes('/')) {
    return `${base}/uploads/jammu/survey/srt/images/${filename}`;
  }
  if (category === 'srt_pdf' && !clean.includes('/')) {
    return `${base}/uploads/jammu/survey/srt/pdf/${filename}`;
  }

  return `${base}/${clean}`;
}

export function getJammuSurveyMediaCandidates(
  path?: string | null,
  category: 'resco_image' | 'resco_pdf' | 'resco_bos' | 'srt_image' | 'srt_pdf' | 'resco_doc' = 'resco_image'
): string[] {
  if (!path) return [];
  const direct = resolveJammuSurveyMediaUrl(path, category);
  const clean = String(path).replace(/^\/+/, '');
  const filename = clean.split('/').pop() || clean;
  const base = BASE_ROOT_URL.replace(/\/+$/, '');

  return Array.from(
    new Set([
      direct,
      `${base}/${clean}`,
      `${base}/uploads/jammu/survey/resco/images/${filename}`,
      `${base}/uploads/jammu/survey/resco/pdf/${filename}`,
      `${base}/uploads/jammu/survey/resco/bos/${filename}`,
      `${base}/uploads/jammu/survey/srt/images/${filename}`,
      `${base}/uploads/jammu/survey/srt/pdf/${filename}`,
      `${base}/uploads/jammu/survey/resco/surveyassign/${filename}`,
      `${base}/uploads/jammu/survey/srt/surveyassign/${filename}`,
      `${base}/uploads/${filename}`,
      `https://klkerp.com/${clean}`,
      `https://klkerp.com/api/${clean}`,
    ])
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Universal Auth Token & Headers
   ═══════════════════════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════════════════════
   Candidate URLs Builder for Jammu Survey Endpoints (Strictly official routes)
   ═══════════════════════════════════════════════════════════════════════════════ */

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

  // Normalize any stray /jammu/resco/ or /resco/ to official /jk/resco/
  if (cleaned.startsWith('/jammu/resco/')) {
    cleaned = cleaned.replace(/^\/jammu\/resco\//, '/jk/resco/');
  } else if (cleaned.startsWith('/resco/')) {
    cleaned = `/jk${cleaned}`;
  }

  // Handle bare /view-dashboard without status (Laravel Route::get('/jk/resco/survey/view-dashboard/{status}', ...) requires status slug)
  if (cleaned.endsWith('/view-dashboard') || cleaned.endsWith('/view-dashboard/')) {
    cleaned = cleaned.replace(/\/view-dashboard\/?$/, '/view-dashboard/all');
  }

  const route = `${cleaned}${search}`;
  const candidates: string[] = [
    // 1. Official Super Admin prefix: https://klkerp.com/api/admin/...
    `${ADMIN_API_URL}${route}`,
    // 2. Direct API prefix (if route defined without admin group): https://klkerp.com/api/...
    `${BASE_API_URL}${route}`,
  ];

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
      const isMultipart = options.body instanceof FormData;
      const headers = {
        ...getAuthHeaders(isMultipart),
        ...(options.headers as Record<string, string> | undefined),
      };

      const res = await fetch(url, {
        ...options,
        headers,
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (res.ok) {
        try {
          const u = new URL(url);
          knownWorkingBase = `${u.protocol}//${u.host}`;
        } catch {}

        return {
          success: json?.success ?? true,
          data: (json?.data !== undefined ? json.data : json) as T,
          message: json?.message,
          raw: json,
        };
      }

      lastJson = json;
      if (res.status === 422) {
        const errorMsg =
          json?.message ||
          (json?.errors && Object.values(json.errors).flat().join(', ')) ||
          'Validation failed (422)';
        throw new Error(errorMsg);
      }

      if (res.status === 404) {
        const isBusinessError =
          json &&
          typeof json.message === 'string' &&
          json.message !== 'Not Found' &&
          !json.message.includes('could not be found') &&
          !json.message.includes('Endpoint not found');
        if (isBusinessError) {
          lastError = new Error(json.message);
        } else {
          lastError = new Error(json?.message || `Endpoint not found: ${url} (404)`);
        }
        continue;
      }

      if (res.status === 401 || res.status === 403) {
        throw new Error(json?.message || `Session expired or unauthorized (${res.status}).`);
      }

      if (res.status >= 500) {
        lastError = new Error(json?.message || `Server error (${res.status}) on ${url}`);
        continue;
      }

      throw new Error(json?.message || `Request failed (${res.status}) on ${url}`);
    } catch (err: any) {
      if (
        err?.message?.includes('Validation failed') ||
        err?.message?.includes('already verified') ||
        err?.message?.includes('Session expired')
      ) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error(lastJson?.message || 'Failed to communicate with Jammu Survey API.');
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TypeScript Interfaces: JK RESCO Survey
   Controller: App\Http\Controllers\admin\jammu\JKRescoSurveyController
   ═══════════════════════════════════════════════════════════════════════════════ */

export interface JKRescoSurveyStats {
  total?: number;
  assigned?: number;
  not_assigned?: number;
  survey_done?: number;
  survey_pending?: number;
  survey_verify_pending?: number;
  survey_verify_complete?: number;
  survey_verify_reject?: number;
  totalsite?: number;
  assignsite?: number;
  not_assign?: number;
  complete_survey?: number;
  pending_survey?: number;
  survey_verify?: number;
}

export interface JKRescoSurveyDistrictwise {
  district: string;
  total?: number;
  assigned?: number;
  not_assigned?: number;
  survey_done?: number;
  survey_pending?: number;
  survey_verify_pending?: number;
  survey_verify_complete?: number;
  survey_verify_reject?: number;
}

export interface JKRescoSurveyVendorwise {
  survey_vendor: string | number;
  vendor_name?: string;
  total?: number;
  assigned?: number;
  not_assigned?: number;
  survey_done?: number;
  survey_pending?: number;
  survey_verify_pending?: number;
  survey_verify_complete?: number;
  survey_verify_reject?: number;
}

export interface JKRescoSurveyDashboardData {
  survey_detail?: JKRescoSurveyStats;
  districtwise?: JKRescoSurveyDistrictwise[];
  vendor_wises?: JKRescoSurveyVendorwise[];
  loginId?: number;
  company_id?: string | number;
  role?: string;
  state?: string;
}

export interface JKRescoSurveyVendorOption {
  id: number;
  name: string;
}

export interface JKRescoSurveyVolumeOption {
  volume: string | number;
}

export interface JKRescoSurveyAssignFormData {
  vendor: JKRescoSurveyVendorOption[];
  volumes: JKRescoSurveyVolumeOption[];
  loginId?: number;
  company_id?: string | number;
  role?: string;
  state?: string;
}

export interface JKRescoSurveyDistrictItem {
  district: string;
}

export interface JKRescoSurveySiteItem {
  id: number;
  site_name: string;
  connected?: string;
  ca_no?: string;
  dept_name?: string;
  district?: string;
}

export interface JKRescoSurveyAssignRecord {
  id: number;
  vendor?: number | string;
  type?: string;
  purpose?: string;
  state?: string;
  volume?: string | number;
  district?: string;
  site_name?: string;
  sitecount?: number;
  site_count?: number;
  assign_date?: string;
  file?: string | null;
  document?: string | null;
  remarks?: string | null;
  remark?: string | null;
  vendors?: {
    id: number;
    name: string;
  };
  site_details?: Array<{ id: number; site_name: string }>;
  site_names?: string[];
  status?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export type JKRescoSurveyRecord = JKRescoSurveyAssignRecord;

export interface JKRescoSurveyViewAssignData {
  srtRecords?: JKRescoSurveyAssignRecord[];
  assign_surveys?: JKRescoSurveyAssignRecord[];
  resco?: JKRescoSurveyStats;
}

export interface JKRescoSurveyItem {
  id: number;
  unique_id?: string;
  company_id?: string;
  survey_id?: number | null;
  survey_status?: number;
  survey_by?: number | null;
  survey_date?: string | null;
  survey_vendor?: string | number | null;
  survey_verify_status?: number;
  survey_verify_remarks?: string | null;
  survey_verify_date?: string | null;
  survey_verify_by?: number | null;
  verify_status?: number;
  verify_remarks?: string | null;
  verify_date?: string | null;
  material_status?: number;
  material_dispatch_date?: string | null;
  material_dispatch_file?: string | null;
  material_dispatch_remarks?: string | null;
  bos_verify_status?: number;
  bos_verify_by?: number | null;
  bos_verify_date?: string | null;
  bos_verify_remarks?: string | null;
  volume?: string;
  phase?: string;
  state?: string;
  district?: string;
  site_name?: string;
  dept_name?: string;
  address?: string;
  site_address?: string;
  nearest_landmark?: string;
  landmark?: string;
  latitude?: string | number;
  longitude?: string | number;
  firm_name?: string;
  ca_no?: string;
  sanction_load?: string | number;
  connected_load?: string | number;
  load_type?: string;
  connection_phase?: string;
  meter_connection?: string;
  meter_number?: string;
  meter_type?: string;
  grid_power?: string;
  ltdb_present?: string;
  all_3_phase_ltdb?: string;
  missing_phase?: string;
  roof_condition?: string;
  area_roof?: string | number;
  total_roof_area?: string | number;
  free_space_solar?: string | number;
  free_space_inverter?: string | number;
  earth_pit?: string;
  earth_pit_position?: string;
  site_feasible?: string;
  survey_remarks?: string;
  building_age?: string | number;
  age_of_building?: string | number;
  roof_access?: string;
  rooftop_height?: string | number;
  floors_number?: string | number;
  water_source?: string;
  site_access?: string;
  site_distance?: string | number;
  parapet_height?: string | number;
  contact_person?: string;
  contact_number?: string;
  agency_person_name?: string;
  agency_person_contact?: string;
  nodal_person?: string;
  contact_nodal?: string;
  building_image?: string | null;
  roof_image?: string | null;
  control_room_image?: string | null;
  image1?: string | null;
  image2?: string | null;
  image3?: string | null;
  image4?: string | null;
  image5?: string | null;
  pdf?: string | null;
  pdf_file?: string | null;
  vendor_name?: string;
  vendor?: string | number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface JKRescoSurveyViewSurveyData {
  resco?: JKRescoSurveyStats;
  pending?: JKRescoSurveyItem[];
  verify?: JKRescoSurveyItem[];
}

export interface JKRescoSurveyAssignVendorData {
  vendors: Array<{ id: number; name: string }>;
  srtRecords: Array<{ id: number; site_name: string; survey_vendor?: string | number }>;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TypeScript Interfaces: Jammu SRT 70MW Survey
   Controller: App\Http\Controllers\admin\jammu\JammuSrt70mwSurveyController
   ═══════════════════════════════════════════════════════════════════════════════ */

export interface JammuSrt70SurveyStats {
  total?: number;
  assigned?: number;
  not_assigned?: number;
  survey_done?: number;
  survey_pending?: number;
  survey_verify_pending?: number;
  survey_verify_complete?: number;
  survey_verify_reject?: number;
  totalsite?: number;
  assignsite?: number;
  not_assign?: number;
  complete_survey?: number;
  pending_survey?: number;
  survey_verify?: number;
}

export interface JammuSrt70SurveyDistrictwise {
  district: string;
  total?: number;
  assigned?: number;
  not_assigned?: number;
  survey_done?: number;
  survey_pending?: number;
  survey_verify_pending?: number;
  survey_verify_complete?: number;
  survey_verify_reject?: number;
}

export interface JammuSrt70SurveyVendorwise {
  survey_vendor: string | number;
  vendor_name?: string;
  total?: number;
  assigned?: number;
  not_assigned?: number;
  survey_done?: number;
  survey_pending?: number;
  survey_verify_pending?: number;
  survey_verify_complete?: number;
  survey_verify_reject?: number;
}

export interface JammuSrt70SurveyDashboardData {
  survey_detail?: JammuSrt70SurveyStats;
  districtwise?: JammuSrt70SurveyDistrictwise[];
  vendor_wises?: JammuSrt70SurveyVendorwise[];
  loginId?: number;
  company_id?: string | number;
  role?: string;
  state?: string;
}

export interface JammuSrt70SurveyAssignFormData {
  vendor: Array<{ id: number; name: string }>;
  districts: Array<{ district: string }>;
}

export interface JammuSrt70SurveySiteItem {
  id: number;
  site_name: string;
  [key: string]: any;
}

export interface JammuSrt70SurveyAssignRecord {
  id: number;
  vendor?: number | string;
  type?: string;
  purpose?: string;
  state?: string;
  district?: string;
  site_name?: string;
  sitecount?: number;
  site_count?: number;
  assign_date?: string;
  file?: string | null;
  document?: string | null;
  remarks?: string | null;
  remark?: string | null;
  vendors?: {
    id: number;
    name: string;
  };
  site_details?: Array<{ id: number; site_name: string }>;
  site_names?: string[];
  status?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export type JKRescoSurveyRecord = JKRescoSurveyAssignRecord;

export interface JammuSrt70SurveyViewAssignData {
  assign_surveys?: JammuSrt70SurveyAssignRecord[];
  srts?: JammuSrt70SurveyStats;
}

export interface JammuSrt70SurveyItem {
  id: number;
  uid?: string | number;
  unique_id?: string;
  company_id?: string;
  survey_id?: number | null;
  survey_status?: number;
  survey_vendor?: string | number;
  survey_verify_status?: number;
  survey_verify_remarks?: string | null;
  survey_verify_date?: string | null;
  survey_verify_by?: number | null;
  verify_status?: number;
  verify_remarks?: string | null;
  verify_date?: string | null;
  state?: string;
  district?: string;
  dept_name?: string;
  department?: string;
  site_name?: string;
  address?: string;
  survey_site_address?: string;
  site_address?: string;
  near_landmark?: string;
  nearest_landmark?: string;
  contact_person?: string;
  contact_person_name?: string;
  contact_no?: string;
  contact_person_mobile?: string;
  proposed_capacity?: string | number;
  latitude?: string | number;
  longitude?: string | number;
  load_type?: string;
  connection_phase?: string;
  connection_type?: string;
  meter_connection_type?: string;
  meter_no?: string;
  meter_number?: string;
  ca_no?: string;
  sanction_load?: string | number;
  instantaneous_load?: string | number;
  grid_availability?: string;
  three_phase_available?: string;
  missing_phase?: string;
  ltdb_status?: string;
  ltdb_present?: string;
  existing_dg_set?: string | number;
  dg_set_available?: string | number;
  dg_set_capacity?: string | null;
  dg_set_make?: string | null;
  roof_condition?: string;
  roof_area?: string | number;
  total_roof_area?: string | number;
  roof_type?: string;
  structure_type?: string;
  solar_free_space?: string | number;
  free_space_solar?: string | number;
  control_room_free_space?: string | number;
  free_space_inverter?: string | number;
  earth_pit?: string;
  earth_pit_position?: string;
  ac_cable_routing?: string | number;
  building_age?: string | number;
  age_of_building?: string | number;
  roof_access?: string;
  rooftop_height?: string | number;
  parapet_height?: string | number;
  number_of_floors?: string | number;
  no_of_floors?: string | number;
  site_access?: string;
  site_distance?: string | number;
  distance_main_road?: string | number;
  image1?: string | null;
  image2?: string | null;
  image3?: string | null;
  image4?: string | null;
  building_image?: string | null;
  roof_image?: string | null;
  control_room_image?: string | null;
  other_image?: string | null;
  pdf_file?: string | null;
  pdf?: string | null;
  vendor_name?: string;
  vendor?: string | number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface JammuSrt70SurveyViewSurveyData {
  srt70mw?: JammuSrt70SurveyStats;
  pending?: JammuSrt70SurveyItem[];
  verify?: JammuSrt70SurveyItem[];
  loginId?: number;
  loginName?: string;
  company_id?: string;
  role?: string;
  state?: string;
  user_type?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Central Jammu Survey Admin Service
   ═══════════════════════════════════════════════════════════════════════════════ */

export const jammuSurveyAdminService = {
  /* ─────────────────────────────────────────────────────────────────────────────
     1. JK RESCO Survey (17 official endpoints)
     Controller: App\Http\Controllers\admin\jammu\JKRescoSurveyController
     ───────────────────────────────────────────────────────────────────────────── */

  /**
   * 1. Resco Survey Dashboard
   * GET /api/admin/jk/resco/survey/dashboard
   */
  async getRescoSurveyDashboard(): Promise<JKRescoSurveyDashboardData> {
    const res = await apiRequest<JKRescoSurveyDashboardData>(
      JAMMU_VENDOR_API.ADMIN_RESCO_SURVEY_DASHBOARD,
      { method: 'GET' }
    );
    return res.data || {};
  },

  /**
   * 2. View Dashboard (drilldown by status)
   * GET /api/admin/jk/resco/survey/view-dashboard/{status?}
   */
  async getRescoSurveyViewDashboard(status?: string): Promise<JKRescoSurveyItem[]> {
    const effectiveStatus = status || 'all';
    const url = JAMMU_VENDOR_API.ADMIN_RESCO_SURVEY_VIEW_DASHBOARD(effectiveStatus);
    const res = await apiRequest<{ verification?: JKRescoSurveyItem[]; resco?: JKRescoSurveyItem[]; sites?: JKRescoSurveyItem[] }>(url, { method: 'GET' });
    const list = (res.data as any)?.verification || res.data?.resco || (res.data as any)?.sites || (Array.isArray(res.data) ? res.data : []);
    return list;
  },

  /**
   * 3. Vendorwise Survey Drilldown Data
   * GET /api/admin/jk/resco/survey/vendorwise-data/{status}/{vendor}
   */
  async getRescoSurveyVendorwiseData(status: string, vendor: string | number): Promise<JKRescoSurveyItem[]> {
    const url = JAMMU_VENDOR_API.ADMIN_RESCO_SURVEY_VENDORWISE_DATA(status, vendor);
    const res = await apiRequest<{ verification?: JKRescoSurveyItem[]; resco?: JKRescoSurveyItem[]; sites?: JKRescoSurveyItem[] }>(url, { method: 'GET' });
    return (res.data as any)?.verification || res.data?.resco || (res.data as any)?.sites || (Array.isArray(res.data) ? res.data : []);
  },

  /**
   * 4. Districtwise Survey Drilldown Data
   * GET /api/admin/jk/resco/survey/districtwise-data/{status}/{district}
   */
  async getRescoSurveyDistrictwiseData(status: string, district: string): Promise<JKRescoSurveyItem[]> {
    const url = JAMMU_VENDOR_API.ADMIN_RESCO_SURVEY_DISTRICTWISE_DATA(status, district);
    const res = await apiRequest<{ verification?: JKRescoSurveyItem[]; resco?: JKRescoSurveyItem[]; sites?: JKRescoSurveyItem[] }>(url, { method: 'GET' });
    return (res.data as any)?.verification || res.data?.resco || (res.data as any)?.sites || (Array.isArray(res.data) ? res.data : []);
  },

  /**
   * 5. Survey Assign Form Data (vendors & volumes)
   * GET /api/admin/jk/resco/survey/assign
   */
  async getRescoSurveyAssignFormData(): Promise<JKRescoSurveyAssignFormData> {
    const res = await apiRequest<JKRescoSurveyAssignFormData>(
      JAMMU_VENDOR_API.ADMIN_RESCO_SURVEY_ASSIGN_FORM,
      { method: 'GET' }
    );
    return {
      vendor: Array.isArray(res.data?.vendor) ? res.data!.vendor : [],
      volumes: Array.isArray(res.data?.volumes) ? res.data!.volumes : [],
      loginId: res.data?.loginId,
      company_id: res.data?.company_id,
      role: res.data?.role,
      state: res.data?.state,
    };
  },

  /**
   * 6. Fetch District for selected Volume
   * GET /api/admin/jk/resco/survey/fetch-district?volume={volume}
   */
  async fetchRescoSurveyDistrict(volume?: string | number): Promise<string[]> {
    const url = JAMMU_VENDOR_API.ADMIN_RESCO_SURVEY_FETCH_DISTRICT(volume);
    const res = await apiRequest<{ districts?: Array<{ district: string }> }>(url, { method: 'GET' });
    const raw = res.data?.districts || (Array.isArray(res.data) ? res.data : []);
    return raw
      .map((d: any) => (typeof d === 'string' ? d : d?.district || ''))
      .filter((d: string) => Boolean(d && d.trim()));
  },

  /**
   * 7. Fetch Sites for selected District (unassigned sites)
   * GET /api/admin/jk/resco/survey/fetch-site?district={district}
   */
  async fetchRescoSurveySite(district: string): Promise<JKRescoSurveySiteItem[]> {
    const url = JAMMU_VENDOR_API.ADMIN_RESCO_SURVEY_FETCH_SITE(district);
    const res = await apiRequest<{ sites?: JKRescoSurveySiteItem[] }>(url, { method: 'GET' });
    return Array.isArray(res.data?.sites) ? res.data!.sites : (Array.isArray(res.data) ? res.data : []);
  },

  /**
   * 8. Store Assign Survey
   * POST /api/admin/jk/resco/survey/store-assign (multipart/form-data)
   */
  async storeRescoSurveyAssign(formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_RESCO_SURVEY_STORE_ASSIGN, {
      method: 'POST',
      body: formData,
    });
    return {
      success: res.success,
      message: res.message || 'Survey assigned successfully.',
    };
  },

  /**
   * 9. View Assign Survey (assigned batches list)
   * GET /api/admin/jk/resco/survey/view-assign
   */
  async viewRescoSurveyAssign(): Promise<JKRescoSurveyViewAssignData> {
    try {
      const res = await apiRequest<JKRescoSurveyViewAssignData>(
        JAMMU_VENDOR_API.ADMIN_RESCO_SURVEY_VIEW_ASSIGN,
        { method: 'GET' }
      );
      const records = res.data?.srtRecords || res.data?.assign_surveys || [];
      return {
        srtRecords: records,
        assign_surveys: records,
        resco: res.data?.resco || {},
      };
    } catch (primaryErr: any) {
      // If view-assign endpoints returned 404, fallback to live assign-vendor + view-survey
      try {
        const [assignVendorRes, viewSurveyRes] = await Promise.allSettled([
          this.getRescoSurveyAssignVendor(),
          this.viewRescoSurvey(),
        ]);

        let records: JKRescoSurveyRecord[] = [];
        let rescoStats: JKRescoSurveyStats = {};

        if (viewSurveyRes.status === 'fulfilled') {
          rescoStats = viewSurveyRes.value.resco || {};
        }

        if (assignVendorRes.status === 'fulfilled' && Array.isArray(assignVendorRes.value.srtRecords)) {
          const vendorsMap = new Map<number, string>();
          (assignVendorRes.value.vendors || []).forEach((v) => {
            if (v.id) vendorsMap.set(Number(v.id), v.name);
          });

          records = assignVendorRes.value.srtRecords.map((site: any, idx: number) => ({
            id: site.id || idx + 1,
            vendor: site.survey_vendor || site.vendor_id || site.vendor,
            type: 'resco',
            purpose: 'survey',
            state: site.state || 'jammu',
            volume: site.volume || '1',
            district: site.district || '',
            site_name: site.site_name || '',
            sitecount: 1,
            assign_date: site.assign_date || site.created_at || '',
            remarks: site.remarks || '',
            vendors: site.vendors || (site.survey_vendor ? { id: Number(site.survey_vendor), name: vendorsMap.get(Number(site.survey_vendor)) || `Vendor #${site.survey_vendor}` } : undefined),
            site_details: [{ id: site.id, site_name: site.site_name || '' }],
            site_names: [site.site_name || ''],
            status: site.survey_status ?? 0,
          }));
        }

        if (records.length > 0 || rescoStats.totalsite || rescoStats.assignsite) {
          return {
            srtRecords: records,
            assign_surveys: records,
            resco: rescoStats,
          };
        }
      } catch {}

      throw primaryErr;
    }
  },

  /**
   * 10. Survey Assign Vendor (pending survey sites for vendor portal/admin)
   * GET /api/admin/jk/resco/survey/assign-vendor
   */
  async getRescoSurveyAssignVendor(): Promise<JKRescoSurveyAssignVendorData> {
    const res = await apiRequest<any>(
      JAMMU_VENDOR_API.ADMIN_RESCO_SURVEY_ASSIGN_VENDOR,
      { method: 'GET' }
    );
    const d = res.data;
    const raw = res.raw;

    const vendors =
      (Array.isArray(d?.vendors) && d.vendors) ||
      (Array.isArray(d?.vendor) && d.vendor) ||
      (Array.isArray(raw?.vendors) && raw.vendors) ||
      (Array.isArray(raw?.data?.vendors) && raw.data.vendors) ||
      [];

    const rawList: any[] = [];
    if (Array.isArray(d?.assign_surveys)) rawList.push(...d.assign_surveys);
    if (Array.isArray(d?.survey)) rawList.push(...d.survey);
    if (Array.isArray(d?.surveys)) rawList.push(...d.surveys);
    if (Array.isArray(d?.srtRecords)) rawList.push(...d.srtRecords);
    if (Array.isArray(d?.srt_records)) rawList.push(...d.srt_records);
    if (Array.isArray(d?.sites)) rawList.push(...d.sites);
    if (Array.isArray(d?.records)) rawList.push(...d.records);
    if (Array.isArray(d?.pending)) rawList.push(...d.pending);
    if (Array.isArray(raw?.data?.assign_surveys)) rawList.push(...raw.data.assign_surveys);
    if (Array.isArray(raw?.data?.survey)) rawList.push(...raw.data.survey);
    if (Array.isArray(raw?.data?.srtRecords)) rawList.push(...raw.data.srtRecords);
    if (Array.isArray(raw?.srtRecords)) rawList.push(...raw.srtRecords);
    if (Array.isArray(d)) rawList.push(...d);

    const srtRecords = Array.from(
      new Map(
        rawList
          .filter((item) => item && typeof item === 'object')
          .map((item, idx) => [item.id !== undefined && item.id !== null ? String(item.id) : `idx_${idx}`, item])
      ).values()
    );

    return {
      vendors,
      srtRecords,
    };
  },

  /**
   * 11. Fetch Single Site Detail for Survey Entry
   * GET /api/admin/jk/resco/survey/fetch-site-detail?srt_id={srt_id}
   */
  async fetchRescoSurveySiteDetail(srtId: string | number): Promise<JKRescoSurveyItem> {
    const url = JAMMU_VENDOR_API.ADMIN_RESCO_SURVEY_FETCH_SITE_DETAIL(srtId);
    const res = await apiRequest<{ srt?: JKRescoSurveyItem }>(url, { method: 'GET' });
    const detail = res.data?.srt || res.data || ({} as JKRescoSurveyItem);
    return detail;
  },

  /**
   * 12. Store Survey Submission
   * POST /api/admin/jk/resco/survey/store (multipart/form-data)
   */
  async storeRescoSurvey(formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_RESCO_SURVEY_STORE, {
      method: 'POST',
      body: formData,
    });
    return {
      success: res.success,
      message: res.message || 'Survey completed successfully.',
    };
  },

  /**
   * 13. Update Site Name
   * POST /api/admin/jk/resco/survey/update-site-name/{id}
   */
  async updateRescoSurveySiteName(
    id: string | number,
    siteName: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const url = JAMMU_VENDOR_API.ADMIN_RESCO_SURVEY_UPDATE_SITE_NAME(id);
    const res = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ site_name: siteName }),
    });
    return {
      success: res.success,
      message: res.message || 'Site name updated successfully.',
      data: res.data,
    };
  },

  /**
   * 14. View Survey (Verification list)
   * GET /api/admin/jk/resco/survey/view-survey
   */
  async viewRescoSurvey(): Promise<JKRescoSurveyViewSurveyData> {
    const res = await apiRequest<JKRescoSurveyViewSurveyData>(
      JAMMU_VENDOR_API.ADMIN_RESCO_SURVEY_VIEW_SURVEY,
      { method: 'GET' }
    );
    return {
      resco: res.data?.resco || {},
      pending: Array.isArray(res.data?.pending) ? res.data!.pending : [],
      verify: Array.isArray(res.data?.verify) ? res.data!.verify : [],
    };
  },

  /**
   * 15. Verify Survey Status (Approve = 1, Reject = 2)
   * ANY /api/admin/jk/resco/survey/verify-status
   */
  async verifyRescoSurveyStatus(
    id: string | number,
    status: number,
    remarks?: string
  ): Promise<{ success: boolean; message: string }> {
    const numId = Number(id);
    const numStatus = Number(status);
    const params = new URLSearchParams();
    params.set('id', String(numId));
    params.set('status', String(numStatus));
    if (remarks && remarks.trim() !== '') {
      params.set('remarks', remarks.trim());
    }

    const baseEndpoint = JAMMU_VENDOR_API.ADMIN_RESCO_SURVEY_VERIFY_STATUS;
    const urlWithQuery = `${baseEndpoint}?${params.toString()}`;
    const payload = {
      id: numId,
      status: numStatus,
      ...(remarks ? { remarks: remarks.trim() } : {}),
    };

    // 1. Try POST first with JSON body and query string
    try {
      const res = await apiRequest(urlWithQuery, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return {
        success: res.success,
        message: res.message || 'Survey verification status updated successfully.',
      };
    } catch (postErr: any) {
      // 2. Fallback to GET if POST returned 405 Method Not Allowed
      if (
        postErr?.message?.includes('not supported') ||
        postErr?.message?.includes('405') ||
        postErr?.message?.includes('The POST method is not supported')
      ) {
        const res = await apiRequest(urlWithQuery, { method: 'GET' });
        return {
          success: res.success,
          message: res.message || 'Survey verification status updated successfully.',
        };
      }
      throw postErr;
    }
  },

  /**
   * 16. Material Dispatch Status
   * POST /api/admin/jk/resco/survey/material-dispatch-status (multipart/form-data)
   */
  async materialDispatchRescoSurvey(
    formData: FormData
  ): Promise<{ success: boolean; message: string }> {
    const res = await apiRequest(
      JAMMU_VENDOR_API.ADMIN_RESCO_SURVEY_MATERIAL_DISPATCH_STATUS,
      {
        method: 'POST',
        body: formData,
      }
    );
    return {
      success: res.success,
      message: res.message || 'Material dispatched successfully!',
    };
  },

  /**
   * 17. BOS Status
   * POST /api/admin/jk/resco/survey/bos-status
   */
  async bosStatusRescoSurvey(
    id: string | number,
    bosVerifyRemarks?: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const payload = {
      id: Number(id),
      bos_verify_remarks: bosVerifyRemarks || null,
    };
    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_RESCO_SURVEY_BOS_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return {
      success: res.success,
      message: res.message || 'BOS verification successfully!',
      data: res.data,
    };
  },

  /* ─────────────────────────────────────────────────────────────────────────────
     2. Jammu SRT 70MW Survey (7 official endpoints)
     Controller: App\Http\Controllers\admin\jammu\JammuSrt70mwSurveyController
     ───────────────────────────────────────────────────────────────────────────── */

  /**
   * 1. Survey Dashboard
   * GET /api/admin/jammu/srt70mw/survey/dashboard
   */
  async getSrt70SurveyDashboard(): Promise<JammuSrt70SurveyDashboardData> {
    const res = await apiRequest<JammuSrt70SurveyDashboardData>(
      JAMMU_VENDOR_API.ADMIN_SRT70_SURVEY_DASHBOARD,
      { method: 'GET' }
    );
    return res.data || {};
  },

  /**
   * 2. Survey Assign Form Data (vendors & districts)
   * GET /api/admin/jammu/srt70mw/survey/assign
   */
  async getSrt70SurveyAssignFormData(): Promise<JammuSrt70SurveyAssignFormData> {
    const res = await apiRequest<JammuSrt70SurveyAssignFormData>(
      JAMMU_VENDOR_API.ADMIN_SRT70_SURVEY_ASSIGN_FORM,
      { method: 'GET' }
    );
    return {
      vendor: Array.isArray(res.data?.vendor) ? res.data!.vendor : [],
      districts: Array.isArray(res.data?.districts) ? res.data!.districts : [],
    };
  },

  /**
   * 3. Fetch Sites for District (unassigned sites)
   * GET /api/admin/jammu/srt70mw/survey/fetch-site?district={district}
   */
  async fetchSrt70SurveySite(district: string): Promise<JammuSrt70SurveySiteItem[]> {
    const url = JAMMU_VENDOR_API.ADMIN_SRT70_SURVEY_FETCH_SITE(district);
    const res = await apiRequest<{ sites?: JammuSrt70SurveySiteItem[] }>(url, { method: 'GET' });
    return Array.isArray(res.data?.sites) ? res.data!.sites : (Array.isArray(res.data) ? res.data : []);
  },

  /**
   * 4. Store Survey Assign
   * POST /api/admin/jammu/srt70mw/survey/store-assign (multipart/form-data)
   */
  async storeSrt70SurveyAssign(formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_SRT70_SURVEY_STORE_ASSIGN, {
      method: 'POST',
      body: formData,
    });
    return {
      success: res.success,
      message: res.message || 'Survey assigned successfully.',
    };
  },

  /**
   * 5. View Assign Survey
   * GET /api/admin/jammu/srt70mw/survey/view-assign-survey
   */
  async viewSrt70SurveyAssign(): Promise<JammuSrt70SurveyViewAssignData> {
    const res = await apiRequest<JammuSrt70SurveyViewAssignData>(
      JAMMU_VENDOR_API.ADMIN_SRT70_SURVEY_VIEW_ASSIGN,
      { method: 'GET' }
    );
    return {
      assign_surveys: Array.isArray(res.data?.assign_surveys) ? res.data!.assign_surveys : [],
      srts: res.data?.srts || {},
    };
  },

  /**
   * 6. View Survey (Verification list)
   * GET /api/admin/jammu/srt70mw/survey/view-survey
   */
  async viewSrt70Survey(): Promise<JammuSrt70SurveyViewSurveyData> {
    const res = await apiRequest<JammuSrt70SurveyViewSurveyData>(
      JAMMU_VENDOR_API.ADMIN_SRT70_SURVEY_VIEW_SURVEY,
      { method: 'GET' }
    );
    const d = res.data || (res.raw as any)?.data || (res.raw as any) || {};
    return {
      srt70mw: d?.srt70mw || d?.stats || d?.detail || {},
      pending: Array.isArray(d?.pending) ? d.pending : (Array.isArray(d?.records) ? d.records : []),
      verify: Array.isArray(d?.verify) ? d.verify : (Array.isArray(d?.verified) ? d.verified : []),
      loginId: d?.loginId,
      loginName: d?.loginName,
      company_id: d?.company_id,
      role: d?.role,
      state: d?.state,
      user_type: d?.user_type,
    };
  },

  /**
   * 7. Verify Survey Status (Approve = 1, Reject = 2)
   * ANY /api/admin/jammu/srt70mw/survey/verify-survey-status
   * Supports both object payload and positional arguments.
   * Employs multi-strategy candidate matching: GET query params, path param ({id}),
   * alternate route verify-status, and POST JSON/FormData fallbacks.
   */
  async verifySrt70SurveyStatus(
    idOrPayload:
      | string
      | number
      | { id: string | number; status: number | string; vendor?: string | number; remarks?: string },
    statusParam?: number | string,
    vendorParam?: string | number,
    remarksParam?: string
  ): Promise<{ success: boolean; message: string }> {
    let id: string | number;
    let status: number | string;
    let vendor: string | number | undefined;
    let remarks: string | undefined;

    if (typeof idOrPayload === 'object' && idOrPayload !== null) {
      id = idOrPayload.id;
      status = idOrPayload.status;
      vendor = idOrPayload.vendor;
      remarks = idOrPayload.remarks;
    } else {
      id = idOrPayload;
      status = statusParam ?? 1;
      vendor = vendorParam;
      remarks = remarksParam;
    }

    const idStr = String(id);
    const numId = Number(id);
    const numStatus = Number(status);

    const qs = new URLSearchParams();
    qs.set('id', idStr);
    qs.set('survey_id', idStr);
    qs.set('srt_id', idStr);
    qs.set('site_id', idStr);
    qs.set('status', String(numStatus));
    if (vendor !== undefined && vendor !== null && String(vendor).trim() !== '' && String(vendor) !== '0') {
      qs.set('vendor', String(vendor));
    }
    if (remarks && remarks.trim() !== '') {
      qs.set('remarks', remarks.trim());
    }
    const queryString = qs.toString();

    // Comprehensive list of candidate paths to attempt
    const candidateEndpoints = [
      // 1. Primary documented endpoint with query params
      `${ADMIN_API_URL}/jammu/srt70mw/survey/verify-survey-status?${queryString}`,
      `${BASE_API_URL}/jammu/srt70mw/survey/verify-survey-status?${queryString}`,

      // 2. Path parameter endpoint (/verify-survey-status/{id})
      `${ADMIN_API_URL}/jammu/srt70mw/survey/verify-survey-status/${idStr}?${queryString}`,
      `${BASE_API_URL}/jammu/srt70mw/survey/verify-survey-status/${idStr}?${queryString}`,

      // 3. Alternate route name: verify-status (matching RESCO pattern)
      `${ADMIN_API_URL}/jammu/srt70mw/survey/verify-status?${queryString}`,
      `${BASE_API_URL}/jammu/srt70mw/survey/verify-status?${queryString}`,
      `${ADMIN_API_URL}/jammu/srt70mw/survey/verify-status/${idStr}?${queryString}`,
      `${BASE_API_URL}/jammu/srt70mw/survey/verify-status/${idStr}?${queryString}`,
    ];

    let lastErrorMessage = '';

    // Step 1: Attempt GET on all candidates
    for (const endpoint of candidateEndpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: getAuthHeaders(false),
        });

        let json: any = null;
        try {
          json = await res.json();
        } catch {
          json = null;
        }

        if (res.ok) {
          return {
            success: json?.success ?? true,
            message: json?.message || 'Survey verification status updated successfully.',
          };
        }

        if (res.status === 422) {
          const msg =
            json?.message ||
            (json?.errors && Object.values(json.errors).flat().join(', ')) ||
            'Validation failed (422)';
          return { success: false, message: msg };
        }

        if (json && typeof json.message === 'string' && json.message !== 'Not Found' && !json.message.includes('could not be found')) {
          lastErrorMessage = json.message;
        }

        // If GET returned 405 Method Not Allowed, attempt POST immediately on this endpoint
        if (res.status === 405) {
          const rawUrl = endpoint.split('?')[0];
          const payload = {
            id: numId,
            survey_id: numId,
            srt_id: numId,
            site_id: numId,
            status: numStatus,
            ...(vendor ? { vendor: Number(vendor) || vendor } : {}),
            ...(remarks ? { remarks: remarks.trim() } : {}),
          };

          // Try POST JSON
          const postRes = await fetch(rawUrl, {
            method: 'POST',
            headers: getAuthHeaders(false),
            body: JSON.stringify(payload),
          });
          let postJson: any = null;
          try {
            postJson = await postRes.json();
          } catch {}

          if (postRes.ok) {
            return {
              success: postJson?.success ?? true,
              message: postJson?.message || 'Survey verification status updated successfully.',
            };
          }

          if (postJson && typeof postJson.message === 'string' && postJson.message !== 'Not Found') {
            lastErrorMessage = postJson.message;
          }

          // Try POST FormData
          const fd = new FormData();
          fd.append('id', idStr);
          fd.append('survey_id', idStr);
          fd.append('srt_id', idStr);
          fd.append('site_id', idStr);
          fd.append('status', String(numStatus));
          if (vendor) fd.append('vendor', String(vendor));
          if (remarks) fd.append('remarks', remarks.trim());

          const fdRes = await fetch(rawUrl, {
            method: 'POST',
            headers: getAuthHeaders(true),
            body: fd,
          });
          let fdJson: any = null;
          try {
            fdJson = await fdRes.json();
          } catch {}

          if (fdRes.ok) {
            return {
              success: fdJson?.success ?? true,
              message: fdJson?.message || 'Survey verification status updated successfully.',
            };
          }

          if (fdJson && typeof fdJson.message === 'string' && fdJson.message !== 'Not Found') {
            lastErrorMessage = fdJson.message;
          }
        }
      } catch (err: any) {
        if (err?.message && !err.message.includes('Failed to fetch')) {
          lastErrorMessage = err.message;
        }
      }
    }

    return {
      success: false,
      message:
        lastErrorMessage ||
        'Survey record not found or endpoint returned 404. Please verify the survey record ID.',
    };
  },
};

export default jammuSurveyAdminService;
