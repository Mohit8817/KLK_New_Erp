import { API_BASE_URL, authService } from '../../../../services/authService';
import { UP_COMPLAINT_API } from '../../V_Portal_APIS/UP_Complaint_API';

/**
 * Universal token getter for Vendor session
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

/**
 * Universal company_id getter
 */
export const getCompanyId = (): string => {
  const fromAuth = authService.getCompanyId();
  if (fromAuth) return String(fromAuth).trim();

  const session = authService.getSession() as any;
  const raw = authService.getRawResponse() as any;

  const candidate =
    localStorage.getItem('company_id') ||
    localStorage.getItem('klk_company_id') ||
    sessionStorage.getItem('company_id') ||
    session?.company_id ||
    session?.companyId ||
    session?.vendor?.company_id ||
    session?.user?.company_id ||
    raw?.company_id ||
    raw?.user?.company_id ||
    raw?.data?.company_id ||
    raw?.data?.user?.company_id ||
    '1';

  return String(candidate).trim();
};

const BACKEND_BASE = (API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

export function getUpMediaCandidates(path?: string | null): string[] {
  if (!path) return [];
  const trimmed = String(path).trim();
  if (!trimmed) return [];
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return [trimmed];

  const normalized = trimmed.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  if (normalized.startsWith('uploads/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  } else if (normalized.startsWith('storage/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  }

  candidates.push(`${BACKEND_BASE}/uploads/up/complaint/swp/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/up/complaint/kusumb/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/up/complaint/ongrid/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/up/complaint/resco/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/up/complaint/ssl/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/up/complaint/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/up/complaint/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }
  candidates.push(`https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev/${filename}`);

  return Array.from(new Set(candidates));
}

export function resolveUpMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getUpMediaCandidates(path);
  return candidates[0] || `${BACKEND_BASE}/${path.replace(/^\/+/, '')}`;
}

export const getMediaUrl = (path?: string | null): string => {
  return resolveUpMediaUrl(path);
};

/* ─────────────────────────────────────────────────────────────
   Types: UP RESCO Complaint
   ───────────────────────────────────────────────────────────── */
export interface UpRescoComplaintItem {
  id: number;
  company_id?: string | null;
  resco_id?: number | string | null;
  complaint_id?: string | number | null;
  complaint_date?: string | null;
  start_date?: string | null;
  close_date?: string | null;
  manual_close_date?: string | null;
  close_status?: string | number | null;
  complaint?: string | null;
  state?: string | null;
  district?: string | null;
  dept_name?: string | null;
  department?: string | null;
  site_name?: string | null;
  site_id?: number | string | null;
  address?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  ca_no?: string | null;
  sanction_load?: string | number | null;
  plant_sc?: string | number | null;
  plant_capacity?: string | number | null;
  contact_person?: string | null;
  contact_number?: string | null;
  contact_no?: string | null;
  inverter_no?: string | null;
  solarmeter_no?: string | null;
  solar_meter_no?: string | null;
  nm_sm_no?: string | null;
  loger_no?: string | null;
  logger_no?: string | null;
  panel_no?: string | null;
  wo_no?: string | null;
  phase?: string | null;
  vendor?: number | string | null;
  raised_complaint?: number | string | null;
  assigned_to?: string | number | null;
  resolved_by?: string | null;
  r_mobile?: string | null;
  r_email?: string | null;
  sms?: string | number | null;
  close_sms?: string | null;
  file?: string | null;
  file1?: string | null;
  file2?: string | null;
  r_file1?: string | null;
  r_file2?: string | null;
  document?: string | null;
  status?: number | string | null;
  complaint_status?: string | null;
  remarks?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

export interface UpRescoSiteDetails {
  id?: number | string;
  site_name?: string;
  department?: string;
  dept_name?: string;
  address?: string;
  site_address?: string;
  contact_person?: string;
  contact_number?: string;
  contact_no?: string;
  ca_no?: string;
  sanction_load?: string | number;
  plant_capacity?: string | number;
  plant_sc?: string | number;
  inverter_no?: string;
  solarmeter_no?: string;
  solar_meter_no?: string;
  nm_sm_no?: string;
  logger_no?: string;
  loger_no?: string;
  panel_no?: string;
  wo_no?: string;
  latitude?: string | number;
  longitude?: string | number;
  phase?: string;
  district?: string;
  [key: string]: any;
}

/* ─────────────────────────────────────────────────────────────
   Types: UP SSL Complaint
   ───────────────────────────────────────────────────────────── */
export interface UpSslComplaintItem {
  id: number;
  ssl_type?: string | null;
  type?: string | null;
  complaint_id?: string | number | null;
  complaint_date?: string | null;
  complaint_issue?: string | null;
  issue?: string | null;
  complaint?: string | null;
  complaint_source?: string | null;
  state?: string | null;
  district?: string | null;
  block?: string | null;
  panchayat?: string | null;
  phase?: string | null;
  address?: string | null;
  ward_no?: string | null;
  pole_no?: string | null;
  light_no?: string | null;
  beneficiary_name?: string | null;
  contact_no?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  along_with_pole?: string | null;
  luminary_no?: string | null;
  sim_no?: string | null;
  battery_serial_no?: string | null;
  module_no?: string | null;
  date_of_installation?: string | null;
  installation_date?: string | null;
  file?: string | null;
  document?: string | null;
  status?: number | string | null;
  complaint_status?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

export interface UpSslBeneficiaryDetails {
  id?: number | string;
  beneficiary_name?: string;
  contact_no?: string;
  uid_no?: string;
  uuid_no?: string;
  latitude?: string | number;
  longitude?: string | number;
  along_with_pole?: string;
  luminary_no?: string;
  sim_no?: string;
  battery_serial_no?: string;
  module_no?: string;
  panel_no?: string;
  date_of_installation?: string;
  installation_date?: string;
  ward_no?: string;
  pole_no?: string;
  light_no?: string;
  address?: string;
  phase?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  [key: string]: any;
}

/* ─────────────────────────────────────────────────────────────
   Types: UP Kusum C (SWP) Complaint
   ───────────────────────────────────────────────────────────── */
export interface UpKusumCComplaintItem {
  id: number;
  complaint_id?: string | number | null;
  complaint_date?: string | null;
  complaint?: string | null;
  state?: string | null;
  district?: string | null;
  post?: string | null;
  village?: string | null;
  farmer_name?: string | null;
  father_name?: string | null;
  contact_no?: string | null;
  lot_no?: string | null;
  invoice_no?: string | null;
  pump_capacity?: string | null;
  contractor_name?: string | null;
  contractor_no?: string | null;
  contractor_mobile_no?: string | null;
  installation_date?: string | null;
  document?: string | null;
  file?: string | null;
  assigned_date?: string | null;
  complaint_status?: string | null;
  status?: number | string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

export interface UpKusumCDetails {
  id?: number | string;
  farmer_name?: string;
  contact_no?: string;
  father_name?: string;
  lot_no?: string;
  invoice_no?: string;
  pump_capacity?: string;
  contractor_name?: string;
  contractor_mobile_no?: string;
  contractor_no?: string;
  installation_date?: string;
  district?: string;
  post?: string;
  village?: string;
  [key: string]: any;
}

/* ─────────────────────────────────────────────────────────────
   Types: UP Kusum B Complaint
   ───────────────────────────────────────────────────────────── */
export interface UpKusumBComplaintItem {
  id: number;
  complaint_id?: string | number | null;
  complaint_date?: string | null;
  complaint?: string | null;
  state?: string | null;
  district?: string | null;
  village?: string | null;
  location?: string | null;
  beneficiary_name?: string | null;
  gender?: string | null;
  father_name?: string | null;
  contact_no?: string | null;
  saral_id?: string | null;
  application_no?: string | null;
  category?: string | null;
  aadhar_status?: string | null;
  installation_date?: string | null;
  sys_installed_date?: string | null;
  pump_type?: string | null;
  required_pump?: string | null;
  pump_sub_type?: string | null;
  pump_make?: string | null;
  module_make?: string | null;
  spv_capacity?: string | null;
  total_pump_cost?: string | number | null;
  total_pumb_cost?: string | number | null;
  document?: string | null;
  file?: string | null;
  assigned_date?: string | null;
  complaint_status?: string | null;
  status?: number | string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

export interface UpKusumBDetails {
  id?: number | string;
  beneficiary_name?: string;
  gender?: string;
  contact_no?: string;
  application_no?: string;
  location?: string;
  father_name?: string;
  category?: string;
  aadhar_status?: string;
  saral_id?: string;
  required_pump?: string;
  pump_type?: string;
  pump_sub_type?: string;
  pump_make?: string;
  module_make?: string;
  spv_capacity?: string;
  installation_date?: string;
  sys_installed_date?: string;
  total_pump_cost?: string | number;
  total_pumb_cost?: string | number;
  district?: string;
  village?: string;
  [key: string]: any;
}

/* ─────────────────────────────────────────────────────────────
   Types: UP Ongrid Complaint
   ───────────────────────────────────────────────────────────── */
export interface UpOngridComplaintItem {
  id: number;
  complaint_id?: string | number | null;
  complaint_date?: string | null;
  complaint?: string | null;
  state?: string | null;
  district?: string | null;
  beneficiary_name?: string | null;
  contact_number?: string | null;
  contact_no?: string | null;
  plant_capacity?: string | null;
  work_order_no?: string | null;
  wo_no?: string | null;
  work_order_date?: string | null;
  wo_date?: string | null;
  firm_name?: string | null;
  contractor_name?: string | null;
  contractor_number?: string | null;
  contractor_no?: string | null;
  document?: string | null;
  file?: string | null;
  assigned_date?: string | null;
  complaint_status?: string | null;
  status?: number | string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

export interface UpOngridDetails {
  id?: number | string;
  beneficiary_name?: string;
  contact_no?: string;
  contact_number?: string;
  plant_capacity?: string;
  wo_no?: string;
  work_order_no?: string;
  wo_date?: string;
  work_order_date?: string;
  firm_name?: string;
  contractor_name?: string;
  contractor_no?: string;
  contractor_number?: string;
  district?: string;
  [key: string]: any;
}

export interface UpOffgridComplaintItem {
  id: number | string;
  complaint_id?: string | number | null;
  ogid?: string | number | null;
  complaint_date?: string | null;
  complaint?: string | null;
  state?: string | null;
  district?: string | null;
  beneficiary_name?: string | null;
  contact_number?: string | null;
  contact_no?: string | null;
  plant_capacity?: string | null;
  wo_no?: string | null;
  work_order_no?: string | null;
  wo_date?: string | null;
  work_order_date?: string | null;
  contractor_name?: string | null;
  document?: string | null;
  file?: string | null;
  assigned_date?: string | null;
  complaint_status?: string | null;
  status?: number | string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

export interface UpOffgridDetails {
  id?: number | string;
  ogid?: number | string;
  beneficiary_name?: string;
  contact_no?: string;
  contact_number?: string;
  plant_capacity?: string;
  wo_no?: string;
  work_order_no?: string;
  wo_date?: string;
  work_order_date?: string;
  contractor_name?: string;
  district?: string;
  [key: string]: any;
}

export interface UpPowerpackComplaintItem {
  id: number | string;
  complaint_id?: string | number | null;
  complaint_date?: string | null;
  complaint?: string | null;
  state?: string | null;
  district?: string | null;
  block?: string | null;
  village?: string | null;
  beneficiary_name?: string | null;
  address?: string | null;
  gender?: string | null;
  contact_number?: string | null;
  contact_no?: string | null;
  uid?: string | null;
  uid_no?: string | null;
  empanelled_agency?: string | null;
  empanelled_agencies?: string | null;
  longitude?: string | null;
  latitude?: string | null;
  installation?: string | null;
  installation_status?: string | null;
  installation_date?: string | null;
  contractor_name?: string | null;
  document?: string | null;
  file?: string | null;
  assigned_date?: string | null;
  complaint_status?: string | null;
  status?: number | string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

export interface UpPowerpackDetails {
  id?: number | string;
  district?: string;
  block?: string;
  village?: string;
  beneficiary_name?: string;
  gender?: string;
  contact_no?: string;
  contact_number?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  uid?: string;
  uid_no?: string;
  empanelled_agency?: string;
  empanelled_agencies?: string;
  installation?: string;
  installation_status?: string;
  installation_date?: string;
  contractor_name?: string;
  [key: string]: any;
}

export interface UpSrlmsrtComplaintItem {
  id: number | string;
  complaint_id?: string | number | null;
  complaint_date?: string | null;
  complaint?: string | null;
  state?: string | null;
  district?: string | null;
  block?: string | null;
  site_name?: string | null;
  customer_name?: string | null;
  beneficiary_name?: string | null;
  contact_no?: string | null;
  ca_no?: string | null;
  capacity?: string | null;
  sanction_load?: string | null;
  roof_shed_area?: string | null;
  roof_type?: string | null;
  shadow_free_area?: string | null;
  phase?: string | null;
  installation?: string | null;
  installtion?: string | null;
  installation_date?: string | null;
  installtion_date?: string | null;
  required_sqft?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  document?: string | null;
  file?: string | null;
  assigned_date?: string | null;
  complaint_status?: string | null;
  status?: number | string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

export interface UpSrlmsrtDetails {
  id?: number | string;
  district?: string;
  block?: string;
  site_name?: string;
  customer_name?: string;
  beneficiary_name?: string;
  contact_no?: string;
  ca_no?: string;
  capacity?: string;
  sanction_load?: string;
  roof_shed_area?: string;
  roof_type?: string;
  shadow_free_area?: string;
  phase?: string;
  installation?: string;
  installtion?: string;
  installation_date?: string;
  installtion_date?: string;
  required_sqft?: string;
  latitude?: string;
  longitude?: string;
  [key: string]: any;
}

export interface UpAssignedDataResponse<T> {
  open: T[];
  approved: T[];
  close: T[];
  total_complaint: number;
  open_complaint: number;
  approved_complaint: number;
  close_complaint: number;
}

/* ─────────────────────────────────────────────────────────────
   Common HTTP fetch helper
   ───────────────────────────────────────────────────────────── */
async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ status: boolean; message?: string; data?: T; errors?: Record<string, string[]> }> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, default to application/json
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        status: false,
        message: json?.message || `Request failed with status ${res.status}`,
        errors: json?.errors || undefined,
        data: json?.data,
      };
    }

    return json || { status: true };
  } catch (err: any) {
    return {
      status: false,
      message: err?.message || 'Network error occurred. Please check connection.',
    };
  }
}

/* ─────────────────────────────────────────────────────────────
   Universal Response Parsers (Districts, Dependent Lists, Details)
   Handles all backend shape variations:
   - Root-level arrays: res.district, res.districts, res.posts, etc.
   - Nested arrays: res.data.district, res.data.districts, etc.
   - Object item field variations: f_district, district, name, f_post, post, etc.
   - Filtering empty entries and deduplication
   ───────────────────────────────────────────────────────────── */
export function extractStringList(res: any, preferredKeys: string[] = []): string[] {
  if (!res) return [];

  const checkKeys = Array.from(
    new Set([
      ...preferredKeys,
      'districts',
      'district',
      'f_district',
      'posts',
      'post',
      'f_post',
      'villages',
      'village',
      'f_village',
      'blocks',
      'block',
      'f_block',
      'panchayats',
      'panchyats',
      'panchayat',
      'panchyat',
      'beneficiary_village',
      'data',
      'list',
      'items',
    ])
  );

  const searchCandidates: any[] = [];

  if (Array.isArray(res)) {
    searchCandidates.push(res);
  }

  if (typeof res === 'object') {
    for (const k of checkKeys) {
      if (Array.isArray(res[k])) searchCandidates.push(res[k]);
    }

    if (res.data && typeof res.data === 'object') {
      if (Array.isArray(res.data)) {
        searchCandidates.push(res.data);
      } else {
        for (const k of checkKeys) {
          if (Array.isArray(res.data[k])) searchCandidates.push(res.data[k]);
        }
        if (res.data.data && Array.isArray(res.data.data)) {
          searchCandidates.push(res.data.data);
        }
      }
    }
  }

  if (searchCandidates.length === 0 && typeof res === 'object') {
    for (const val of Object.values(res)) {
      if (Array.isArray(val) && val.length > 0) {
        searchCandidates.push(val);
        break;
      }
    }
  }

  for (const arr of searchCandidates) {
    if (Array.isArray(arr) && arr.length > 0) {
      const extracted = arr
        .map((item: any) => {
          if (item === null || item === undefined) return '';
          if (typeof item === 'string') return item.trim();
          if (typeof item === 'number') return String(item);
          if (typeof item === 'object') {
            const val =
              item.district ??
              item.f_district ??
              item.district_name ??
              item.dist_name ??
              item.post ??
              item.f_post ??
              item.post_office ??
              item.post_name ??
              item.village ??
              item.f_village ??
              item.village_name ??
              item.block ??
              item.f_block ??
              item.block_name ??
              item.panchayat ??
              item.panchyat ??
              item.f_panchayat ??
              item.panchayat_name ??
              item.panchyat_name ??
              item.name ??
              item.title ??
              item.val ??
              item.value ??
              '';
            return String(val ?? '').trim();
          }
          return '';
        })
        .filter((s: string) => s.length > 0 && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'undefined');

      if (extracted.length > 0) {
        return Array.from(new Set(extracted));
      }
    }
  }

  return [];
}

export function extractNamedItems(
  res: any,
  preferredKeys: string[] = []
): { id: string | number; name: string; site_name?: string; [key: string]: any }[] {
  if (!res) return [];

  const checkKeys = Array.from(
    new Set([
      ...preferredKeys,
      'beneficiaries',
      'beneficiary',
      'beneficiary_names',
      'farmers',
      'farmer',
      'sites',
      'site',
      'data',
      'items',
      'list',
    ])
  );

  const searchCandidates: any[] = [];

  if (Array.isArray(res)) searchCandidates.push(res);

  if (typeof res === 'object') {
    for (const k of checkKeys) {
      if (Array.isArray(res[k])) searchCandidates.push(res[k]);
    }
    if (res.data && typeof res.data === 'object') {
      if (Array.isArray(res.data)) {
        searchCandidates.push(res.data);
      } else {
        for (const k of checkKeys) {
          if (Array.isArray(res.data[k])) searchCandidates.push(res.data[k]);
        }
        if (res.data.data && Array.isArray(res.data.data)) {
          searchCandidates.push(res.data.data);
        }
      }
    }
  }

  if (searchCandidates.length === 0 && typeof res === 'object') {
    for (const val of Object.values(res)) {
      if (Array.isArray(val) && val.length > 0) {
        searchCandidates.push(val);
        break;
      }
    }
  }

  for (const arr of searchCandidates) {
    if (Array.isArray(arr) && arr.length > 0) {
      const items = arr
        .map((item: any) => {
          if (!item && item !== 0) return null;
          if (typeof item === 'string' || typeof item === 'number') {
            const str = String(item).trim();
            if (!str) return null;
            return { id: str, name: str, site_name: str };
          }
          if (typeof item === 'object') {
            const name =
              item.name ??
              item.beneficiary_name ??
              item.farmer_name ??
              item.f_name ??
              item.site_name ??
              item.dept_name ??
              item.customer_name ??
              item.title ??
              item.label ??
              '';
            const id =
              item.id ??
              item.beneficiary_id ??
              item.farmer_id ??
              item.f_id ??
              item.site_id ??
              item.ogid ??
              item.uid ??
              item.ca_no ??
              name ??
              '';

            const cleanName = String(name || id || '').trim();
            const cleanId = id !== undefined && id !== null && String(id).trim() !== '' ? id : cleanName;

            if (!cleanName && !cleanId) return null;
            return {
              ...item,
              id: cleanId,
              name: cleanName || String(cleanId),
              site_name: item.site_name || cleanName || String(cleanId),
            };
          }
          return null;
        })
        .filter(Boolean) as { id: string | number; name: string; site_name?: string; [key: string]: any }[];

      if (items.length > 0) {
        return items;
      }
    }
  }

  return [];
}

export function extractDetailObject<T = any>(res: any, preferredKeys: string[] = []): T | null {
  if (!res) return null;

  const checkKeys = Array.from(
    new Set([
      ...preferredKeys,
      'detail',
      'details',
      'beneficiary',
      'farmer',
      'site',
      'data',
    ])
  );

  if (res.data) {
    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data[0] as T;
    }
    if (typeof res.data === 'object' && Object.keys(res.data).length > 0) {
      for (const k of checkKeys) {
        if (res.data[k] && typeof res.data[k] === 'object') {
          if (Array.isArray(res.data[k])) {
            if (res.data[k].length > 0) return res.data[k][0] as T;
          } else {
            return res.data[k] as T;
          }
        }
      }
      return res.data as T;
    }
  }

  for (const k of checkKeys) {
    if (res[k] && typeof res[k] === 'object') {
      if (Array.isArray(res[k])) {
        if (res[k].length > 0) return res[k][0] as T;
      } else {
        return res[k] as T;
      }
    }
  }

  if (Array.isArray(res) && res.length > 0) {
    return res[0] as T;
  }

  if (typeof res === 'object') {
    const keys = Object.keys(res).filter((k) => k !== 'status' && k !== 'message' && k !== 'success');
    if (keys.length > 0) {
      return res as T;
    }
  }

  return null;
}

/* ─────────────────────────────────────────────────────────────
   UP Complaint Service Implementation
   ───────────────────────────────────────────────────────────── */
export const upComplaintService = {
  /* ------------------- RESCO APIS ------------------- */
  async getRescoAddData(): Promise<{ status: boolean; districts: string[]; data?: any }> {
    const res = await apiRequest(UP_COMPLAINT_API.RESCO.ADD_COMPLAINT_PAGE);
    const districts = extractStringList(res, ['districts', 'district']);
    return { status: !!res.status || districts.length > 0, districts, data: res.data ?? res };
  },

  async storeRescoComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    return this.saveRescoComplaint(formData);
  },

  async getRescoSiteNames(district: string): Promise<{ id: string | number; site_name: string }[]> {
    const res = await apiRequest(UP_COMPLAINT_API.RESCO.GET_SITE_NAMES(district));
    const items = extractNamedItems(res, ['sites', 'site']);
    return items.map((item) => ({
      id: item.id,
      site_name: item.site_name || item.name || String(item.id),
    }));
  },

  async getRescoSiteDetails(siteIdOrName: string | number): Promise<UpRescoSiteDetails | null> {
    const res = await apiRequest(UP_COMPLAINT_API.RESCO.GET_SITE_DETAILS(siteIdOrName));
    return extractDetailObject<UpRescoSiteDetails>(res, ['site', 'details', 'detail']);
  },

  async saveRescoComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.RESCO.SAVE_COMPLAINT, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Complaint submitted successfully!' : 'Failed to submit complaint.'),
      errors: res.errors,
    };
  },

  async getRescoViewComplaints(): Promise<UpRescoComplaintItem[]> {
    const res = await apiRequest(UP_COMPLAINT_API.RESCO.VIEW_COMPLAINTS);
    if (res.status && res.data) {
      if (Array.isArray(res.data)) {
        return res.data as UpRescoComplaintItem[];
      }
      if (Array.isArray((res.data as any).complaints)) {
        return (res.data as any).complaints;
      }
    }
    return [];
  },

  async getRescoAssignedComplaints(): Promise<UpAssignedDataResponse<UpRescoComplaintItem>> {
    const res = await apiRequest(UP_COMPLAINT_API.RESCO.ASSIGNED_COMPLAINTS);
    const fallback: UpAssignedDataResponse<UpRescoComplaintItem> = {
      open: [],
      approved: [],
      close: [],
      total_complaint: 0,
      open_complaint: 0,
      approved_complaint: 0,
      close_complaint: 0,
    };

    if (res.status && res.data) {
      if (typeof res.data === 'object' && ('open' in res.data || 'close' in res.data || 'approved' in res.data)) {
        const d = res.data as any;
        const open = Array.isArray(d.open) ? d.open : [];
        const approved = Array.isArray(d.approved) ? d.approved : [];
        const close = Array.isArray(d.close) ? d.close : [];
        return {
          open,
          approved,
          close,
          total_complaint: Number(d.total_complaint ?? (open.length + approved.length + close.length)),
          open_complaint: Number(d.open_complaint ?? open.length),
          approved_complaint: Number(d.approved_complaint ?? approved.length),
          close_complaint: Number(d.close_complaint ?? close.length),
        };
      }
      if (Array.isArray(res.data)) {
        const arr = res.data as UpRescoComplaintItem[];
        const open = arr.filter((r) => !r.status || Number(r.status) === 0 || String(r.complaint_status || '').toLowerCase() === 'open');
        const approved = arr.filter((r) => Number(r.status) === 1 || String(r.complaint_status || '').toLowerCase() === 'approved');
        const close = arr.filter((r) => Number(r.status) === 2 || String(r.complaint_status || '').toLowerCase() === 'closed');
        return {
          open,
          approved,
          close,
          total_complaint: arr.length,
          open_complaint: open.length,
          approved_complaint: approved.length,
          close_complaint: close.length,
        };
      }
    }

    return fallback;
  },

  async closeRescoComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.RESCO.CLOSE_UPDATE_COMPLAINT, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Complaint closed successfully!' : 'Failed to close complaint.'),
      errors: res.errors,
    };
  },

  async deleteRescoComplaint(id: number | string): Promise<{ status: boolean; message: string }> {
    const res = await apiRequest(UP_COMPLAINT_API.RESCO.DELETE_COMPLAINT(id));
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Complaint deleted successfully.' : 'Failed to delete complaint.'),
    };
  },

  /* ------------------- SSL APIS ------------------- */
  async getSslAddData(): Promise<{ status: boolean; districts: string[]; data?: any }> {
    const districts = await this.getSslDistricts();
    return { status: true, districts, data: districts };
  },

  async getSslDistricts(type?: string): Promise<string[]> {
    const url = type
      ? `${UP_COMPLAINT_API.SSL.GET_DISTRICTS}?type=${encodeURIComponent(type)}`
      : UP_COMPLAINT_API.SSL.GET_DISTRICTS;
    const res = await apiRequest(url);
    return extractStringList(res, ['districts', 'district']);
  },

  async getSslBlocks(district: string): Promise<string[]> {
    const res = await apiRequest(UP_COMPLAINT_API.SSL.GET_BLOCKS(district));
    return extractStringList(res, ['blocks', 'block']);
  },

  async getSslPanchayats(district: string, block: string): Promise<string[]> {
    const res = await apiRequest(UP_COMPLAINT_API.SSL.GET_PANCHAYATS(district, block));
    return extractStringList(res, ['panchayats', 'panchyats', 'panchayat', 'panchyat']);
  },

  async getSslBeneficiaryNames(district: string, block: string, panchayat: string): Promise<{ id: string | number; name: string }[]> {
    const res = await apiRequest(UP_COMPLAINT_API.SSL.GET_BENEFICIARY_NAMES(district, block, panchayat));
    return extractNamedItems(res, ['beneficiaries', 'beneficiary', 'sites', 'site']);
  },

  async getSslBeneficiaryDetails(idOrName: string | number): Promise<UpSslBeneficiaryDetails | null> {
    const res = await apiRequest(UP_COMPLAINT_API.SSL.GET_BENEFICIARY_DETAILS(idOrName));
    return extractDetailObject<UpSslBeneficiaryDetails>(res, ['beneficiary', 'details', 'detail']);
  },

  async storeSslComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.SSL.STORE_COMPLAINT, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'SSL Complaint stored successfully!' : 'Failed to store SSL complaint.'),
      errors: res.errors,
    };
  },

  async saveSslComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    return this.storeSslComplaint(formData);
  },

  async getSslViewComplaints(): Promise<UpSslComplaintItem[]> {
    const res = await apiRequest(UP_COMPLAINT_API.SSL.VIEW_DATA);
    if (res.status && res.data) {
      if (Array.isArray(res.data)) {
        return res.data as UpSslComplaintItem[];
      }
      if (Array.isArray((res.data as any).complaints)) {
        return (res.data as any).complaints;
      }
    }
    return [];
  },

  async getSslAssignedComplaints(): Promise<UpAssignedDataResponse<UpSslComplaintItem>> {
    const res = await apiRequest(UP_COMPLAINT_API.SSL.ASSIGNED_COMPLAINTS);
    const fallback: UpAssignedDataResponse<UpSslComplaintItem> = {
      open: [],
      approved: [],
      close: [],
      total_complaint: 0,
      open_complaint: 0,
      approved_complaint: 0,
      close_complaint: 0,
    };

    if (res.status && res.data) {
      if (typeof res.data === 'object' && ('open' in res.data || 'close' in res.data || 'approved' in res.data)) {
        const d = res.data as any;
        const open = Array.isArray(d.open) ? d.open : [];
        const approved = Array.isArray(d.approved) ? d.approved : [];
        const close = Array.isArray(d.close) ? d.close : [];
        return {
          open,
          approved,
          close,
          total_complaint: Number(d.total_complaint ?? (open.length + approved.length + close.length)),
          open_complaint: Number(d.open_complaint ?? open.length),
          approved_complaint: Number(d.approved_complaint ?? approved.length),
          close_complaint: Number(d.close_complaint ?? close.length),
        };
      }
      if (Array.isArray(res.data)) {
        const arr = res.data as UpSslComplaintItem[];
        const open = arr.filter((r) => !r.status || Number(r.status) === 0 || String(r.complaint_status || '').toLowerCase() === 'open');
        const approved = arr.filter((r) => Number(r.status) === 1 || String(r.complaint_status || '').toLowerCase() === 'approved');
        const close = arr.filter((r) => Number(r.status) === 2 || String(r.complaint_status || '').toLowerCase() === 'closed');
        return {
          open,
          approved,
          close,
          total_complaint: arr.length,
          open_complaint: open.length,
          approved_complaint: approved.length,
          close_complaint: close.length,
        };
      }
    }

    return fallback;
  },

  async closeSslComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.SSL.CLOSE_UPDATE_COMPLAINT, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'SSL Complaint closed successfully!' : 'Failed to close SSL complaint.'),
      errors: res.errors,
    };
  },

  async deleteSslComplaint(id: number | string): Promise<{ status: boolean; message: string }> {
    const res = await apiRequest(UP_COMPLAINT_API.SSL.DELETE_COMPLAINT(id));
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'SSL Complaint deleted successfully.' : 'Failed to delete SSL complaint.'),
    };
  },

  /* ------------------- KUSUM C (SWP) APIS ------------------- */
  async getKusumCAddData(): Promise<{ status: boolean; districts: string[]; data?: any }> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_C.ADD_COMPLAINT);
    const districts = extractStringList(res, ['district', 'districts', 'f_district']);
    return { status: !!res.status || districts.length > 0, districts, data: res.data ?? res };
  },

  async getKusumCPosts(district: string): Promise<string[]> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_C.GET_POST(district));
    return extractStringList(res, ['post', 'posts', 'f_post']);
  },

  async getKusumCVillages(district: string, post: string): Promise<string[]> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_C.GET_VILLAGE(district, post));
    return extractStringList(res, ['village', 'villages', 'f_village']);
  },

  async getKusumCFarmerNames(district: string, post: string, village: string): Promise<{ id: string | number; name: string }[]> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_C.GET_BENEFICIARY_NAMES(district, post, village));
    return extractNamedItems(res, ['farmers', 'farmer', 'beneficiaries', 'beneficiary']);
  },

  async getKusumCDetails(farmerIdOrName: string | number): Promise<UpKusumCDetails | null> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_C.GET_BENEFICIARY_DETAILS(farmerIdOrName));
    return extractDetailObject<UpKusumCDetails>(res, ['farmer', 'details', 'detail', 'beneficiary']);
  },

  async storeKusumCComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_C.STORE_COMPLAINT, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Kusum C Complaint submitted successfully!' : 'Failed to submit complaint.'),
      errors: res.errors,
    };
  },

  async saveKusumCComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    return this.storeKusumCComplaint(formData);
  },

  async getKusumCViewComplaints(): Promise<UpKusumCComplaintItem[]> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_C.VIEW_COMPLAINT);
    if (res.status && res.data) {
      if (Array.isArray(res.data)) return res.data as UpKusumCComplaintItem[];
      if (Array.isArray((res.data as any).complaints)) return (res.data as any).complaints;
    }
    return [];
  },

  async getKusumCAssignedComplaints(): Promise<UpAssignedDataResponse<UpKusumCComplaintItem>> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_C.ASSIGN_COMPLAINT);
    const fallback: UpAssignedDataResponse<UpKusumCComplaintItem> = {
      open: [], approved: [], close: [], total_complaint: 0, open_complaint: 0, approved_complaint: 0, close_complaint: 0,
    };
    if (res.status && res.data) {
      if (typeof res.data === 'object' && ('open' in res.data || 'close' in res.data || 'approved' in res.data)) {
        const d = res.data as any;
        const open = Array.isArray(d.open) ? d.open : [];
        const approved = Array.isArray(d.approved) ? d.approved : [];
        const close = Array.isArray(d.close) ? d.close : [];
        return {
          open, approved, close,
          total_complaint: Number(d.total_complaint ?? (open.length + approved.length + close.length)),
          open_complaint: Number(d.open_complaint ?? open.length),
          approved_complaint: Number(d.approved_complaint ?? approved.length),
          close_complaint: Number(d.close_complaint ?? close.length),
        };
      }
      if (Array.isArray(res.data)) {
        const arr = res.data as UpKusumCComplaintItem[];
        const open = arr.filter((r) => !r.status || Number(r.status) === 0 || String(r.complaint_status || '').toLowerCase() === 'open');
        const approved = arr.filter((r) => Number(r.status) === 1 || String(r.complaint_status || '').toLowerCase() === 'approved');
        const close = arr.filter((r) => Number(r.status) === 2 || String(r.complaint_status || '').toLowerCase() === 'closed');
        return { open, approved, close, total_complaint: arr.length, open_complaint: open.length, approved_complaint: approved.length, close_complaint: close.length };
      }
    }
    return fallback;
  },

  async closeKusumCComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_C.CLOSE_UPDATE, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Kusum C Complaint closed successfully!' : 'Failed to close complaint.'),
      errors: res.errors,
    };
  },

  async deleteKusumCComplaint(id: number | string): Promise<{ status: boolean; message: string }> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_C.DELETE_COMPLAINT(id));
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Complaint deleted successfully.' : 'Failed to delete complaint.'),
    };
  },

  /* ------------------- KUSUM B APIS ------------------- */
  async getKusumBAddData(): Promise<{ status: boolean; districts: string[]; data?: any }> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_B.ADD_COMPLAINT);
    const districts = extractStringList(res, ['districts', 'district', 'f_district']);
    return { status: !!res.status || districts.length > 0, districts, data: res.data ?? res };
  },

  async getKusumBVillages(district: string): Promise<string[]> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_B.GET_BENEFICIARY_VILLAGE(district));
    return extractStringList(res, ['villages', 'village', 'beneficiary_village', 'f_village']);
  },

  async getKusumBBeneficiaryNames(district: string, village: string): Promise<{ id: string | number; name: string }[]> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_B.GET_BENEFICIARY_NAMES(district, village));
    return extractNamedItems(res, ['beneficiaries', 'beneficiary', 'farmers', 'farmer']);
  },

  async getKusumBDetails(beneficiaryIdOrName: string | number): Promise<UpKusumBDetails | null> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_B.GET_BENEFICIARY_DETAILS(beneficiaryIdOrName));
    return extractDetailObject<UpKusumBDetails>(res, ['beneficiary', 'details', 'detail', 'farmer']);
  },

  async storeKusumBComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_B.STORE_DATA, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Kusum B Complaint stored successfully!' : 'Failed to store complaint.'),
      errors: res.errors,
    };
  },

  async saveKusumBComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    return this.storeKusumBComplaint(formData);
  },

  async getKusumBViewComplaints(): Promise<UpKusumBComplaintItem[]> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_B.VIEW_COMPLAINT);
    if (res.status && res.data) {
      if (Array.isArray(res.data)) return res.data as UpKusumBComplaintItem[];
      if (Array.isArray((res.data as any).complaints)) return (res.data as any).complaints;
    }
    return [];
  },

  async getKusumBAssignedComplaints(): Promise<UpAssignedDataResponse<UpKusumBComplaintItem>> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_B.ASSIGN_COMPLAINT);
    const fallback: UpAssignedDataResponse<UpKusumBComplaintItem> = {
      open: [], approved: [], close: [], total_complaint: 0, open_complaint: 0, approved_complaint: 0, close_complaint: 0,
    };
    if (res.status && res.data) {
      if (typeof res.data === 'object' && ('open' in res.data || 'close' in res.data || 'approved' in res.data)) {
        const d = res.data as any;
        const open = Array.isArray(d.open) ? d.open : [];
        const approved = Array.isArray(d.approved) ? d.approved : [];
        const close = Array.isArray(d.close) ? d.close : [];
        return {
          open, approved, close,
          total_complaint: Number(d.total_complaint ?? (open.length + approved.length + close.length)),
          open_complaint: Number(d.open_complaint ?? open.length),
          approved_complaint: Number(d.approved_complaint ?? approved.length),
          close_complaint: Number(d.close_complaint ?? close.length),
        };
      }
      if (Array.isArray(res.data)) {
        const arr = res.data as UpKusumBComplaintItem[];
        const open = arr.filter((r) => !r.status || Number(r.status) === 0 || String(r.complaint_status || '').toLowerCase() === 'open');
        const approved = arr.filter((r) => Number(r.status) === 1 || String(r.complaint_status || '').toLowerCase() === 'approved');
        const close = arr.filter((r) => Number(r.status) === 2 || String(r.complaint_status || '').toLowerCase() === 'closed');
        return { open, approved, close, total_complaint: arr.length, open_complaint: open.length, approved_complaint: approved.length, close_complaint: close.length };
      }
    }
    return fallback;
  },

  async closeKusumBComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_B.CLOSE_UPDATE_COMPLAINT, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Kusum B Complaint closed successfully!' : 'Failed to close complaint.'),
      errors: res.errors,
    };
  },

  async deleteKusumBComplaint(id: number | string): Promise<{ status: boolean; message: string }> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_B.DELETE_COMPLAINT(id));
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Complaint deleted successfully.' : 'Failed to delete complaint.'),
    };
  },

  /* ------------------- ONGRID APIS ------------------- */
  async getOngridAddData(): Promise<{ status: boolean; districts: string[]; data?: any }> {
    const res = await apiRequest(UP_COMPLAINT_API.ONGRID.ADD_COMPLAINT);
    const districts = extractStringList(res, ['district', 'districts']);
    return { status: !!res.status || districts.length > 0, districts, data: res.data ?? res };
  },

  async getOngridBeneficiaryNames(district: string): Promise<{ id: string | number; name: string }[]> {
    const res = await apiRequest(UP_COMPLAINT_API.ONGRID.GET_BENEFICIARY_NAMES(district));
    return extractNamedItems(res, ['beneficiaries', 'beneficiary', 'beneficiary_names']);
  },

  async getOngridDetails(beneficiaryIdOrName: string | number): Promise<UpOngridDetails | null> {
    const res = await apiRequest(UP_COMPLAINT_API.ONGRID.GET_BENEFICIARY_DETAILS(beneficiaryIdOrName));
    return extractDetailObject<UpOngridDetails>(res, ['beneficiary', 'details', 'detail']);
  },

  async saveOngridComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.ONGRID.SAVE_COMPLAINT, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'On Grid Complaint registered successfully!' : 'Failed to register complaint.'),
      errors: res.errors,
    };
  },

  async getOngridViewComplaints(): Promise<UpOngridComplaintItem[]> {
    const res = await apiRequest(UP_COMPLAINT_API.ONGRID.VIEW_COMPLAINT);
    if (res.status && res.data) {
      if (Array.isArray(res.data)) return res.data as UpOngridComplaintItem[];
      if (Array.isArray((res.data as any).complaints)) return (res.data as any).complaints;
    }
    return [];
  },

  async getOngridAssignedComplaints(): Promise<UpAssignedDataResponse<UpOngridComplaintItem>> {
    const res = await apiRequest(UP_COMPLAINT_API.ONGRID.ASSIGN_COMPLAINT);
    const fallback: UpAssignedDataResponse<UpOngridComplaintItem> = {
      open: [], approved: [], close: [], total_complaint: 0, open_complaint: 0, approved_complaint: 0, close_complaint: 0,
    };
    if (res.status && res.data) {
      if (typeof res.data === 'object' && ('open' in res.data || 'close' in res.data || 'approved' in res.data)) {
        const d = res.data as any;
        const open = Array.isArray(d.open) ? d.open : [];
        const approved = Array.isArray(d.approved) ? d.approved : [];
        const close = Array.isArray(d.close) ? d.close : [];
        return {
          open, approved, close,
          total_complaint: Number(d.total_complaint ?? (open.length + approved.length + close.length)),
          open_complaint: Number(d.open_complaint ?? open.length),
          approved_complaint: Number(d.approved_complaint ?? approved.length),
          close_complaint: Number(d.close_complaint ?? close.length),
        };
      }
      if (Array.isArray(res.data)) {
        const arr = res.data as UpOngridComplaintItem[];
        const open = arr.filter((r) => !r.status || Number(r.status) === 0 || String(r.complaint_status || '').toLowerCase() === 'open');
        const approved = arr.filter((r) => Number(r.status) === 1 || String(r.complaint_status || '').toLowerCase() === 'approved');
        const close = arr.filter((r) => Number(r.status) === 2 || String(r.complaint_status || '').toLowerCase() === 'closed');
        return { open, approved, close, total_complaint: arr.length, open_complaint: open.length, approved_complaint: approved.length, close_complaint: close.length };
      }
    }
    return fallback;
  },

  async closeOngridComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.ONGRID.CLOSE_STORE, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'On Grid Complaint closed successfully!' : 'Failed to close complaint.'),
      errors: res.errors,
    };
  },

  async deleteOngridComplaint(id: number | string): Promise<{ status: boolean; message: string }> {
    const res = await apiRequest(UP_COMPLAINT_API.ONGRID.DELETE_COMPLAINT(id));
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Complaint deleted successfully.' : 'Failed to delete complaint.'),
    };
  },

  /* ------------------- OFFGRID APIS ------------------- */
  async getOffgridAddData(): Promise<{ status: boolean; districts: string[]; data?: any }> {
    const res = await apiRequest(UP_COMPLAINT_API.OFFGRID.ADD_COMPLAINT);
    const districts = extractStringList(res, ['districts', 'district']);
    return { status: !!res.status || districts.length > 0, districts, data: res.data ?? res };
  },

  async getOffgridBeneficiaryNames(district: string): Promise<{ id: string | number; name: string }[]> {
    const res = await apiRequest(UP_COMPLAINT_API.OFFGRID.GET_BENEFICIARY_NAMES(district));
    return extractNamedItems(res, ['beneficiaries', 'beneficiary', 'beneficiary_names']);
  },

  async getOffgridDetails(beneficiaryIdOrName: string | number): Promise<UpOffgridDetails | null> {
    const res = await apiRequest(UP_COMPLAINT_API.OFFGRID.GET_BENEFICIARY_DETAILS(beneficiaryIdOrName));
    return extractDetailObject<UpOffgridDetails>(res, ['beneficiary', 'details', 'detail']);
  },

  async storeOffgridComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.OFFGRID.STORE, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Off Grid Complaint added successfully!' : 'Failed to add complaint.'),
      errors: res.errors,
    };
  },

  async saveOffgridComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    return this.storeOffgridComplaint(formData);
  },

  async getOffgridViewComplaints(): Promise<UpOffgridComplaintItem[]> {
    const res = await apiRequest(UP_COMPLAINT_API.OFFGRID.VIEW_COMPLAINT);
    if (res.status && res.data) {
      if (Array.isArray(res.data)) return res.data as UpOffgridComplaintItem[];
      if (Array.isArray((res.data as any).complaints)) return (res.data as any).complaints;
    }
    return [];
  },

  async getOffgridAssignedComplaints(): Promise<UpAssignedDataResponse<UpOffgridComplaintItem>> {
    const res = await apiRequest(UP_COMPLAINT_API.OFFGRID.ASSIGN_COMPLAINT);
    const fallback: UpAssignedDataResponse<UpOffgridComplaintItem> = {
      open: [], approved: [], close: [], total_complaint: 0, open_complaint: 0, approved_complaint: 0, close_complaint: 0,
    };
    if (res.status && res.data) {
      if (typeof res.data === 'object' && ('open' in res.data || 'close' in res.data || 'approved' in res.data)) {
        const d = res.data as any;
        const open = Array.isArray(d.open) ? d.open : [];
        const approved = Array.isArray(d.approved) ? d.approved : [];
        const close = Array.isArray(d.close) ? d.close : [];
        return {
          open, approved, close,
          total_complaint: Number(d.total_complaint ?? (open.length + approved.length + close.length)),
          open_complaint: Number(d.open_complaint ?? open.length),
          approved_complaint: Number(d.approved_complaint ?? approved.length),
          close_complaint: Number(d.close_complaint ?? close.length),
        };
      }
      if (Array.isArray(res.data)) {
        const arr = res.data as UpOffgridComplaintItem[];
        const open = arr.filter((r) => !r.status || Number(r.status) === 0 || String(r.complaint_status || '').toLowerCase() === 'open');
        const approved = arr.filter((r) => Number(r.status) === 1 || String(r.complaint_status || '').toLowerCase() === 'approved');
        const close = arr.filter((r) => Number(r.status) === 2 || String(r.complaint_status || '').toLowerCase() === 'closed');
        return { open, approved, close, total_complaint: arr.length, open_complaint: open.length, approved_complaint: approved.length, close_complaint: close.length };
      }
    }
    return fallback;
  },

  async closeOffgridComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.OFFGRID.CLOSE_UPDATE, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Off Grid Complaint closed successfully!' : 'Failed to close complaint.'),
      errors: res.errors,
    };
  },

  async deleteOffgridComplaint(id: number | string): Promise<{ status: boolean; message: string }> {
    const res = await apiRequest(UP_COMPLAINT_API.OFFGRID.DELETE(id));
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Complaint deleted successfully.' : 'Failed to delete complaint.'),
    };
  },

  /* ------------------- POWERPACK APIS ------------------- */
  async getPowerpackAddData(): Promise<{ status: boolean; districts: string[]; data?: any }> {
    const res = await apiRequest(UP_COMPLAINT_API.POWERPACK.ADD_COMPLAINT);
    const districts = extractStringList(res, ['districts', 'district']);
    return { status: !!res.status || districts.length > 0, districts, data: res.data ?? res };
  },

  async getPowerpackBlocks(district: string): Promise<string[]> {
    const res = await apiRequest(UP_COMPLAINT_API.POWERPACK.GET_BLOCK(district));
    return extractStringList(res, ['blocks', 'block']);
  },

  async getPowerpackVillages(district: string, block: string): Promise<string[]> {
    const res = await apiRequest(UP_COMPLAINT_API.POWERPACK.GET_VILLAGE(district, block));
    return extractStringList(res, ['villages', 'village']);
  },

  async getPowerpackBeneficiaryNames(district: string, block: string, village: string): Promise<{ id: string | number; name: string }[]> {
    const res = await apiRequest(UP_COMPLAINT_API.POWERPACK.GET_BENEFICIARY_NAMES(district, block, village));
    return extractNamedItems(res, ['beneficiaries', 'beneficiary', 'beneficiary_names']);
  },

  async getPowerpackDetails(idOrName: string | number): Promise<UpPowerpackDetails | null> {
    const res = await apiRequest(UP_COMPLAINT_API.POWERPACK.GET_BENEFICIARY_DETAILS(idOrName));
    return extractDetailObject<UpPowerpackDetails>(res, ['beneficiary', 'details', 'detail']);
  },

  async savePowerpackComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.POWERPACK.SAVE_COMPLAINT, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Power Pack Complaint stored successfully!' : 'Failed to store complaint.'),
      errors: res.errors,
    };
  },

  async getPowerpackViewComplaints(): Promise<UpPowerpackComplaintItem[]> {
    const res = await apiRequest(UP_COMPLAINT_API.POWERPACK.VIEW_COMPLAINT);
    if (res.status && res.data) {
      if (Array.isArray(res.data)) return res.data as UpPowerpackComplaintItem[];
      if (Array.isArray((res.data as any).complaints)) return (res.data as any).complaints;
    }
    return [];
  },

  async getPowerpackAssignedComplaints(): Promise<UpAssignedDataResponse<UpPowerpackComplaintItem>> {
    const res = await apiRequest(UP_COMPLAINT_API.POWERPACK.ASSIGN_COMPLAINT);
    const fallback: UpAssignedDataResponse<UpPowerpackComplaintItem> = {
      open: [], approved: [], close: [], total_complaint: 0, open_complaint: 0, approved_complaint: 0, close_complaint: 0,
    };
    if (res.status && res.data) {
      if (typeof res.data === 'object' && ('open' in res.data || 'close' in res.data || 'approved' in res.data)) {
        const d = res.data as any;
        const open = Array.isArray(d.open) ? d.open : [];
        const approved = Array.isArray(d.approved) ? d.approved : [];
        const close = Array.isArray(d.close) ? d.close : [];
        return {
          open, approved, close,
          total_complaint: Number(d.total_complaint ?? (open.length + approved.length + close.length)),
          open_complaint: Number(d.open_complaint ?? open.length),
          approved_complaint: Number(d.approved_complaint ?? approved.length),
          close_complaint: Number(d.close_complaint ?? close.length),
        };
      }
      if (Array.isArray(res.data)) {
        const arr = res.data as UpPowerpackComplaintItem[];
        const open = arr.filter((r) => !r.status || Number(r.status) === 0 || String(r.complaint_status || '').toLowerCase() === 'open');
        const approved = arr.filter((r) => Number(r.status) === 1 || String(r.complaint_status || '').toLowerCase() === 'approved');
        const close = arr.filter((r) => Number(r.status) === 2 || String(r.complaint_status || '').toLowerCase() === 'closed');
        return { open, approved, close, total_complaint: arr.length, open_complaint: open.length, approved_complaint: approved.length, close_complaint: close.length };
      }
    }
    return fallback;
  },

  async closePowerpackComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.POWERPACK.CLOSE_UPDATE, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Power Pack Complaint closed successfully!' : 'Failed to close complaint.'),
      errors: res.errors,
    };
  },

  async deletePowerpackComplaint(id: number | string): Promise<{ status: boolean; message: string }> {
    const res = await apiRequest(UP_COMPLAINT_API.POWERPACK.DELETE_COMPLAINT(id));
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Complaint deleted successfully.' : 'Failed to delete complaint.'),
    };
  },

  /* ------------------- SRLMSRT APIS ------------------- */
  async getSrlmsrtAddData(): Promise<{ status: boolean; districts: string[]; data?: any }> {
    const res = await apiRequest(UP_COMPLAINT_API.SRLMSRT.ADD_COMPLAINT);
    const districts = extractStringList(res, ['districts', 'district']);
    return { status: !!res.status || districts.length > 0, districts, data: res.data ?? res };
  },

  async getSrlmsrtBlocks(district: string): Promise<string[]> {
    const res = await apiRequest(UP_COMPLAINT_API.SRLMSRT.GET_BLOCK_NAME(district));
    return extractStringList(res, ['blocks', 'block', 'block_name']);
  },

  async getSrlmsrtSiteNames(district: string, block: string): Promise<{ id: string | number; site_name: string }[]> {
    const res = await apiRequest(UP_COMPLAINT_API.SRLMSRT.GET_SITE_NAME(district, block));
    const items = extractNamedItems(res, ['sites', 'site', 'site_name']);
    return items.map((s) => ({
      id: s.id,
      site_name: s.site_name || s.name || String(s.id),
    }));
  },

  async getSrlmsrtSiteDetails(idOrName: string | number): Promise<UpSrlmsrtDetails | null> {
    const res = await apiRequest(UP_COMPLAINT_API.SRLMSRT.GET_SITE_DETAILS(idOrName));
    return extractDetailObject<UpSrlmsrtDetails>(res, ['site', 'details', 'detail']);
  },

  async saveSrlmsrtComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.SRLMSRT.SAVE_COMPLAINT, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'SRLMSRT Complaint saved successfully!' : 'Failed to save complaint.'),
      errors: res.errors,
    };
  },

  async getSrlmsrtViewComplaints(): Promise<UpSrlmsrtComplaintItem[]> {
    const res = await apiRequest(UP_COMPLAINT_API.SRLMSRT.VIEW_COMPLAINT);
    if (res.status && res.data) {
      if (Array.isArray(res.data)) return res.data as UpSrlmsrtComplaintItem[];
      if (Array.isArray((res.data as any).complaints)) return (res.data as any).complaints;
    }
    return [];
  },

  async getSrlmsrtAssignedComplaints(): Promise<UpAssignedDataResponse<UpSrlmsrtComplaintItem>> {
    const res = await apiRequest(UP_COMPLAINT_API.SRLMSRT.ASSIGN_COMPLAINT);
    const fallback: UpAssignedDataResponse<UpSrlmsrtComplaintItem> = {
      open: [], approved: [], close: [], total_complaint: 0, open_complaint: 0, approved_complaint: 0, close_complaint: 0,
    };
    if (res.status && res.data) {
      if (typeof res.data === 'object' && ('open' in res.data || 'close' in res.data || 'approved' in res.data)) {
        const d = res.data as any;
        const open = Array.isArray(d.open) ? d.open : [];
        const approved = Array.isArray(d.approved) ? d.approved : [];
        const close = Array.isArray(d.close) ? d.close : [];
        return {
          open, approved, close,
          total_complaint: Number(d.total_complaint ?? (open.length + approved.length + close.length)),
          open_complaint: Number(d.open_complaint ?? open.length),
          approved_complaint: Number(d.approved_complaint ?? approved.length),
          close_complaint: Number(d.close_complaint ?? close.length),
        };
      }
      if (Array.isArray(res.data)) {
        const arr = res.data as UpSrlmsrtComplaintItem[];
        const open = arr.filter((r) => !r.status || Number(r.status) === 0 || String(r.complaint_status || '').toLowerCase() === 'open');
        const approved = arr.filter((r) => Number(r.status) === 1 || String(r.complaint_status || '').toLowerCase() === 'approved');
        const close = arr.filter((r) => Number(r.status) === 2 || String(r.complaint_status || '').toLowerCase() === 'closed');
        return { open, approved, close, total_complaint: arr.length, open_complaint: open.length, approved_complaint: approved.length, close_complaint: close.length };
      }
    }
    return fallback;
  },

  async closeSrlmsrtComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.SRLMSRT.CLOSE_UPDATE_COMPLAINT, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'SRLMSRT Complaint closed successfully!' : 'Failed to close complaint.'),
      errors: res.errors,
    };
  },

  async deleteSrlmsrtComplaint(id: number | string): Promise<{ status: boolean; message: string }> {
    const res = await apiRequest(UP_COMPLAINT_API.SRLMSRT.DELETE_COMPLAINT(id));
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Complaint deleted successfully.' : 'Failed to delete complaint.'),
    };
  },
};

export default upComplaintService;
