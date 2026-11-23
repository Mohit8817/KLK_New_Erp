import { API_BASE_URL, authService } from '../../../../services/authService';
import { UP_COMPLAINT_API } from '../../V_Portal_APIS/UP_Complaint_API';
import { extractBackendError } from '../../common-services/vPortalFormUtils';

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

const RAW_BACKEND_BASE = (API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');
const BACKEND_BASE = /^https?:\/\//i.test(RAW_BACKEND_BASE) ? RAW_BACKEND_BASE : 'https://klkerp.com';

const R2_BASE = (
  (import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ||
  'https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev'
).replace(/\/+$/, '');

export function getUpMediaCandidates(path?: string | null): string[] {
  if (!path) return [];
  const trimmed = String(path).trim().replace(/\\/g, '/');
  if (!trimmed || /^(null|undefined|na|n\/a)$/i.test(trimmed)) return [];
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return [trimmed];

  const normalized = trimmed.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  // If path already starts with uploads/, storage/, or public/
  if (normalized.startsWith('uploads/') || normalized.startsWith('storage/') || normalized.startsWith('public/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
    if (!normalized.startsWith('public/')) {
      candidates.push(`${BACKEND_BASE}/public/${normalized}`);
    }
    if (R2_BASE) {
      candidates.push(`${R2_BASE}/${normalized}`);
    }
  }

  // RESCO complaints (e.g. rescocomp_file1_..., rescocomp_r_file1_..., resco_...)
  if (/^rescocomp|^resco/i.test(filename)) {
    candidates.push(`${BACKEND_BASE}/uploads/complaint/resco/${filename}`);
    candidates.push(`${BACKEND_BASE}/public/uploads/complaint/resco/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/complaint/resco/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/complaint/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/image/${filename}`);
    if (R2_BASE) {
      candidates.push(`${R2_BASE}/uploads/complaint/resco/${filename}`);
      candidates.push(`${R2_BASE}/uploads/up/complaint/resco/${filename}`);
    }
  }

  // SSL complaints (e.g. sslcomp..., ssl...)
  if (/^sslcomp|^ssl/i.test(filename)) {
    candidates.push(`${BACKEND_BASE}/uploads/complaint/ssl/${filename}`);
    candidates.push(`${BACKEND_BASE}/public/uploads/complaint/ssl/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/image/${filename}`);
    candidates.push(`${BACKEND_BASE}/public/uploads/image/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/complaint/ssl/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/complaint/${filename}`);
    if (R2_BASE) {
      candidates.push(`${R2_BASE}/uploads/complaint/ssl/${filename}`);
      candidates.push(`${R2_BASE}/uploads/image/${filename}`);
    }
  }

  // KUSUM B complaints
  if (/^kusumb/i.test(filename)) {
    candidates.push(`${BACKEND_BASE}/uploads/complaint/kusumb/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/kusumbcomplaint/${filename}`);
    candidates.push(`${BACKEND_BASE}/public/uploads/complaint/kusumb/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/complaint/kusumb/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/image/${filename}`);
    if (R2_BASE) {
      candidates.push(`${R2_BASE}/uploads/complaint/kusumb/${filename}`);
      candidates.push(`${R2_BASE}/uploads/kusumbcomplaint/${filename}`);
    }
  }

  // ONGRID complaints
  if (/^ongrid/i.test(filename)) {
    candidates.push(`${BACKEND_BASE}/uploads/complaint/ongrid/${filename}`);
    candidates.push(`${BACKEND_BASE}/public/uploads/complaint/ongrid/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/complaint/ongrid/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/image/${filename}`);
  }

  // OFFGRID complaints
  if (/^offgrid/i.test(filename)) {
    candidates.push(`${BACKEND_BASE}/uploads/complaint/offgrid/${filename}`);
    candidates.push(`${BACKEND_BASE}/public/uploads/complaint/offgrid/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/complaint/offgrid/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/image/${filename}`);
  }

  // POWERPACK complaints
  if (/^powerpack/i.test(filename)) {
    candidates.push(`${BACKEND_BASE}/uploads/complaint/powerpack/${filename}`);
    candidates.push(`${BACKEND_BASE}/public/uploads/complaint/powerpack/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/complaint/powerpack/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/image/${filename}`);
  }

  // SWP / SRLMSRT complaints
  if (/^swp|^srlm/i.test(filename)) {
    candidates.push(`${BACKEND_BASE}/uploads/complaint/swp/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/complaint/srlmsrt/${filename}`);
    candidates.push(`${BACKEND_BASE}/public/uploads/complaint/swp/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/complaint/swp/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/image/${filename}`);
  }

  // General fallbacks
  candidates.push(`${BACKEND_BASE}/uploads/complaint/resco/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/complaint/ssl/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/complaint/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/image/${filename}`);
  candidates.push(`${BACKEND_BASE}/public/uploads/image/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);
  candidates.push(`${BACKEND_BASE}/public/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/${normalized}`);
    candidates.push(`${R2_BASE}/uploads/complaint/resco/${filename}`);
    candidates.push(`${R2_BASE}/uploads/complaint/ssl/${filename}`);
    candidates.push(`${R2_BASE}/uploads/image/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }

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
  company_id?: string | null;
  uid?: string | number | null;
  uid_no?: string | number | null;
  uuid_no?: string | number | null;
  ssl_type?: string | null;
  type?: string | null;
  complaint_type?: string | null;
  vendor?: string | number | null;
  complaint_id?: string | number | null;
  complaint_date?: string | null;
  start_date?: string | null;
  close_date?: string | null;
  manual_close_date?: string | null;
  complaint_issue?: string | null;
  issue?: string | null;
  complaint?: string | null;
  complaint_source?: string | null;
  complaint_raised_by?: string | number | null;
  state?: string | null;
  district?: string | null;
  block?: string | null;
  panchayat?: string | null;
  panchyat?: string | null;
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
  r_file?: string | null;
  r_file2?: string | null;
  close_beneficiary_name?: string | null;
  close_beneficiary_contact?: string | null;
  sms?: string | null;
  close_sms?: string | null;
  assigned_to?: string | null;
  close_status?: string | number | null;
  status?: number | string | null;
  complaint_status?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  remarks?: string | null;
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
  f_name?: string | null;
  beneficiary_name?: string | null;
  father_name?: string | null;
  f_father_name?: string | null;
  contact_no?: string | null;
  f_contact?: string | null;
  f_mobile?: string | null;
  contact_number?: string | null;
  lot_no?: string | null;
  invoice_no?: string | null;
  f_invoice_no?: string | null;
  pump_capacity?: string | null;
  pump_capicity?: string | null;
  contractor_name?: string | null;
  c_contractor_name?: string | null;
  contractor_no?: string | null;
  c_contact_no?: string | null;
  contractor_mo_no?: string | null;
  contractor_mobile_no?: string | null;
  installation_date?: string | null;
  inst_date?: string | null;
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
  f_name?: string;
  beneficiary_name?: string;
  name?: string;
  contact_no?: string;
  f_contact?: string;
  f_mobile?: string;
  contact_number?: string;
  mobile?: string;
  c_contact?: string;
  father_name?: string;
  f_father_name?: string;
  lot_no?: string;
  invoice_no?: string;
  f_invoice_no?: string;
  pump_capacity?: string;
  pump_capicity?: string;
  contractor_name?: string;
  c_contractor_name?: string;
  contractor_mobile_no?: string;
  contractor_no?: string;
  c_contact_no?: string;
  contractor_mo_no?: string;
  installation_date?: string;
  inst_date?: string;
  date_of_installation?: string;
  district?: string;
  f_district?: string;
  post?: string;
  f_post?: string;
  village?: string;
  f_village?: string;
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
  sys_installed?: string | null;
  sys_installed_date?: string | null;
  pump_type?: string | null;
  required_pump?: string | null;
  pump_sub_type?: string | null;
  pump_make?: string | null;
  module_make?: string | null;
  spv_capacity?: string | null;
  total_pump_cost?: string | number | null;
  total_pumb_cost?: string | number | null;
  vendor_name?: string | null;
  created_date?: string | null;
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
  sys_installed?: string;
  sys_installed_date?: string;
  total_pump_cost?: string | number;
  total_pumb_cost?: string | number;
  vendor_name?: string;
  district?: string;
  village?: string;
  [key: string]: any;
}

/* ─────────────────────────────────────────────────────────────
   Types: UP Ongrid Complaint
   ───────────────────────────────────────────────────────────── */
export interface UpOngridComplaintItem {
  id: number;
  company_id?: string | null;
  ogid?: number | string | null;
  og_id?: number | string | null;
  complaint_id?: string | number | null;
  complaint_date?: string | null;
  created_date?: string | null;
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
  raised_complaint?: number | null;
  r_mobile?: string | null;
  r_email?: string | null;
  sms?: string | null;
  close_sms?: string | null;
  document?: string | null;
  file?: string | null;
  r_file?: string | null;
  r_file2?: string | null;
  close_date?: string | null;
  manual_close_date?: string | null;
  close_complaint_date?: string | null;
  resolved_by?: string | null;
  assigned_to?: string | null;
  assigned_date?: string | null;
  remarks?: string | null;
  close_status?: number | string | null;
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
  offgrid_id?: string | number | null;
  complaint_date?: string | null;
  complaint?: string | null;
  state?: string | null;
  district?: string | null;
  beneficiary_name?: string | null;
  mobile_no?: string | null;
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
  offgrid_id?: number | string;
  beneficiary_name?: string;
  mobile_no?: string;
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
): Promise<{ status: boolean; httpStatus?: number; message?: string; data?: T; errors?: Record<string, string[]> }> {
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

    if (!res.ok || json?.status === false || json?.success === false || json?.errors) {
      const extracted = extractBackendError(json, `Request failed with status ${res.status}`);
      return {
        status: false,
        httpStatus: res.status,
        message: extracted.message,
        errors: json?.errors || extracted.rawErrors,
        data: json?.data,
      };
    }

    if (json && typeof json === 'object' && !Array.isArray(json)) {
      if (json.status === undefined && json.success !== undefined) {
        return { ...json, status: Boolean(json.success) };
      }
      return json;
    }

    return json || { status: true };
  } catch (err: any) {
    const extracted = extractBackendError(err, err?.message || 'Network error occurred. Please check connection.');
    return {
      status: false,
      message: extracted.message,
    };
  }
}

async function deleteRequest(url: string): Promise<{ status: boolean; message: string }> {
  let res = await apiRequest(url);
  if (!res.status && (res as any).httpStatus === 405) {
    res = await apiRequest(url, { method: 'DELETE' });
  }
  if (!res.status && (res as any).httpStatus === 405) {
    res = await apiRequest(url, { method: 'POST' });
  }
  return {
    status: !!res.status,
    message: res.message || (res.status ? 'Complaint deleted successfully.' : 'Failed to delete complaint.'),
  };
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
  if (!res || res.status === false) return [];

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
  if (!res || res.status === false) return [];

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
              item.kbid ??
              item.kb_id ??
              item.kcid ??
              item.kc_id ??
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
  if (!res || res.status === false) return null;

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
    const keys = Object.keys(res).filter(
      (k) => k !== 'status' && k !== 'message' && k !== 'success' && k !== 'errors'
    );
    if (keys.length > 0) {
      return res as T;
    }
  }

  return null;
}

function extractComplaintList<T>(res: any): T[] {
  if (!res) return [];
  if (res.status === false) {
    throw new Error(res.message || 'Failed to load complaints from server.');
  }
  if (Array.isArray(res)) return res as T[];
  if (Array.isArray(res.data)) return res.data as T[];
  if (res.data && typeof res.data === 'object') {
    if (
      Array.isArray(res.data.open_complaints) ||
      Array.isArray(res.data.closed_complaints) ||
      Array.isArray(res.data.approved_complaints)
    ) {
      return [
        ...(Array.isArray(res.data.open_complaints) ? res.data.open_complaints : []),
        ...(Array.isArray(res.data.approved_complaints) ? res.data.approved_complaints : []),
        ...(Array.isArray(res.data.closed_complaints) ? res.data.closed_complaints : []),
      ] as T[];
    }
    if (Array.isArray(res.data.data)) return res.data.data as T[];
    if (Array.isArray(res.data.complaints)) return res.data.complaints as T[];
    if (Array.isArray(res.data.complaint)) return res.data.complaint as T[];
    if (Array.isArray(res.data.ssl)) return res.data.ssl as T[];
    if (Array.isArray(res.data.report)) return res.data.report as T[];
    if (Array.isArray(res.data.reports)) return res.data.reports as T[];
    if (Array.isArray(res.data.list)) return res.data.list as T[];
    if (Array.isArray(res.data.rows)) return res.data.rows as T[];
  }
  if (Array.isArray(res.complaints)) return res.complaints as T[];
  if (Array.isArray(res.ssl)) return res.ssl as T[];
  return [];
}

function extractAssignedResponse<T extends Record<string, any>>(res: any): UpAssignedDataResponse<T> {
  if (res && (res.status === false || res.success === false)) {
    throw new Error(res.message || 'Failed to load assigned complaints from server.');
  }
  const empty: UpAssignedDataResponse<T> = {
    open: [],
    approved: [],
    close: [],
    total_complaint: 0,
    open_complaint: 0,
    approved_complaint: 0,
    close_complaint: 0,
  };
  if (!res) return empty;

  // 1. Check if response has an object with bucketed complaint arrays (e.g. open_complaints, closed_complaints, open, data, etc.)
  const rawObj =
    res.data && typeof res.data === 'object' && !Array.isArray(res.data)
      ? res.data
      : typeof res === 'object' && !Array.isArray(res)
      ? res
      : null;

  if (rawObj) {
    const hasBucketKey =
      'open_complaints' in rawObj ||
      'open' in rawObj ||
      'openComplaints' in rawObj ||
      'open_complaint' in rawObj ||
      'closed_complaints' in rawObj ||
      'close_complaints' in rawObj ||
      'close' in rawObj ||
      'closed' in rawObj ||
      'closeds' in rawObj ||
      'closedComplaints' in rawObj ||
      'closeComplaints' in rawObj ||
      'approved_complaints' in rawObj ||
      'approved' in rawObj ||
      'approveds' in rawObj ||
      'approvedComplaints' in rawObj ||
      'approved_complaint' in rawObj;

    if (hasBucketKey) {
      let open: T[] = Array.isArray(rawObj.open_complaints)
        ? rawObj.open_complaints
        : Array.isArray(rawObj.open)
        ? rawObj.open
        : Array.isArray(rawObj.openComplaints)
        ? rawObj.openComplaints
        : Array.isArray(rawObj.open_complaint)
        ? rawObj.open_complaint
        : [];

      let approved: T[] = Array.isArray(rawObj.approved_complaints)
        ? rawObj.approved_complaints
        : Array.isArray(rawObj.approved)
        ? rawObj.approved
        : Array.isArray(rawObj.approveds)
        ? rawObj.approveds
        : Array.isArray(rawObj.approvedComplaints)
        ? rawObj.approvedComplaints
        : Array.isArray(rawObj.approved_complaint)
        ? rawObj.approved_complaint
        : [];

      let close: T[] = Array.isArray(rawObj.closed_complaints)
        ? rawObj.closed_complaints
        : Array.isArray(rawObj.close_complaints)
        ? rawObj.close_complaints
        : Array.isArray(rawObj.close)
        ? rawObj.close
        : Array.isArray(rawObj.closed)
        ? rawObj.closed
        : Array.isArray(rawObj.closeds)
        ? rawObj.closeds
        : Array.isArray(rawObj.closedComplaints)
        ? rawObj.closedComplaints
        : Array.isArray(rawObj.closeComplaints)
        ? rawObj.closeComplaints
        : Array.isArray(rawObj.close_complaint)
        ? rawObj.close_complaint
        : Array.isArray(rawObj.closed_complaint)
        ? rawObj.closed_complaint
        : [];

      // If rawObj.data is an array (e.g. in UP RESCO where rawObj.open holds open complaints, and rawObj.data holds closed complaints)
      if (Array.isArray(rawObj.data)) {
        if (close.length === 0 && open.length > 0) {
          close = rawObj.data;
        } else if (open.length === 0 && close.length === 0) {
          const isClosed = (r: T) =>
            Number(r.status) === 2 ||
            Number(r.close_status) === 1 ||
            Number(r.close_status) === 2 ||
            String(r.complaint_status || '').toLowerCase() === 'closed' ||
            String(r.complaint_status || '').toLowerCase() === 'resolved' ||
            Boolean(
              (r.close_date && String(r.close_date).trim() !== '' && String(r.close_date).trim() !== 'null') ||
              (r.manual_close_date && String(r.manual_close_date).trim() !== '' && String(r.manual_close_date).trim() !== 'null') ||
              (r.close_complaint_date && String(r.close_complaint_date).trim() !== '' && String(r.close_complaint_date).trim() !== 'null')
            );
          const isAppr = (r: T) =>
            !isClosed(r) && (Number(r.status) === 1 || String(r.complaint_status || '').toLowerCase() === 'approved');
          const isOpn = (r: T) => !isClosed(r) && !isAppr(r);

          open = rawObj.data.filter(isOpn);
          if (approved.length === 0) approved = rawObj.data.filter(isAppr);
          close = rawObj.data.filter(isClosed);
        }
      }

      const counts = res.counts || rawObj.counts || {};
      const total_complaint = Number(
        counts.total_complaint ??
        counts.total ??
        rawObj.total_complaint ??
        (open.length + approved.length + close.length)
      );
      const open_complaint = Number(
        counts.open_complaint ??
        counts.open ??
        rawObj.open_complaint ??
        open.length
      );
      const approved_complaint = Number(
        counts.approved_complaint ??
        counts.approved ??
        rawObj.approved_complaint ??
        approved.length
      );
      const close_complaint = Number(
        counts.close_complaint ??
        counts.closed_complaint ??
        counts.close ??
        counts.closed ??
        rawObj.close_complaint ??
        close.length
      );

      return {
        open,
        approved,
        close,
        total_complaint,
        open_complaint,
        approved_complaint,
        close_complaint,
      };
    }
  }

  // 2. Single flat list that needs filtering by status
  const arr: T[] | null = Array.isArray(res.data)
    ? res.data
    : Array.isArray(res)
    ? res
    : Array.isArray(res.data?.data)
    ? res.data.data
    : Array.isArray(res.data?.complaints)
    ? res.data.complaints
    : Array.isArray(res.complaints)
    ? res.complaints
    : Array.isArray(res.data?.rows)
    ? res.data.rows
    : Array.isArray(res.rows)
    ? res.rows
    : Array.isArray(res.data?.assigned)
    ? res.data.assigned
    : Array.isArray(res.assigned)
    ? res.assigned
    : null;

  if (arr) {
    const isClosed = (r: T) =>
      Number(r.status) === 2 ||
      Number(r.close_status) === 1 ||
      Number(r.close_status) === 2 ||
      String(r.complaint_status || '').toLowerCase() === 'closed' ||
      String(r.complaint_status || '').toLowerCase() === 'resolved' ||
      Boolean(
        (r.close_date && String(r.close_date).trim() !== '' && String(r.close_date).trim() !== 'null') ||
        (r.manual_close_date && String(r.manual_close_date).trim() !== '' && String(r.manual_close_date).trim() !== 'null') ||
        (r.close_complaint_date && String(r.close_complaint_date).trim() !== '' && String(r.close_complaint_date).trim() !== 'null')
      );
    const isApproved = (r: T) =>
      !isClosed(r) && (Number(r.status) === 1 || String(r.complaint_status || '').toLowerCase() === 'approved');
    const isOpen = (r: T) => !isClosed(r) && !isApproved(r);

    const open = arr.filter(isOpen);
    const approved = arr.filter(isApproved);
    const close = arr.filter(isClosed);

    const counts = res.counts || res.data?.counts || {};
    return {
      open,
      approved,
      close,
      total_complaint: Number(counts.total_complaint ?? counts.total ?? arr.length),
      open_complaint: Number(counts.open_complaint ?? counts.open ?? open.length),
      approved_complaint: Number(counts.approved_complaint ?? counts.approved ?? approved.length),
      close_complaint: Number(counts.close_complaint ?? counts.closed ?? close.length),
    };
  }

  return empty;
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

  async getRescoSiteDetails(
    siteIdOrName: string | number,
    siteName?: string,
    district?: string
  ): Promise<UpRescoSiteDetails | null> {
    const res = await apiRequest(UP_COMPLAINT_API.RESCO.GET_SITE_DETAILS(siteIdOrName, siteName, district));
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
    return extractComplaintList<UpRescoComplaintItem>(res);
  },

  async getRescoAssignedComplaints(): Promise<UpAssignedDataResponse<UpRescoComplaintItem>> {
    const res = await apiRequest(UP_COMPLAINT_API.RESCO.ASSIGNED_COMPLAINTS);
    return extractAssignedResponse<UpRescoComplaintItem>(res);
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

  async getRescoEditComplaint(id: number | string): Promise<UpRescoComplaintItem | null> {
    const res = await apiRequest(UP_COMPLAINT_API.RESCO.EDIT_COMPLAINT(id));
    return extractDetailObject<UpRescoComplaintItem>(res, ['complaint', 'resco', 'data']);
  },

  async updateRescoComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.RESCO.UPDATE_COMPLAINT, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Complaint updated successfully!' : 'Failed to update complaint.'),
      errors: res.errors,
    };
  },

  async deleteRescoComplaint(id: number | string): Promise<{ status: boolean; message: string }> {
    return deleteRequest(UP_COMPLAINT_API.RESCO.DELETE_COMPLAINT(id));
  },

  /* ------------------- SSL APIS ------------------- */
  async getSslAddData(type?: string): Promise<{ status: boolean; districts: string[]; data?: any }> {
    const url = type
      ? `${UP_COMPLAINT_API.SSL.GET_DISTRICTS}?type=${encodeURIComponent(type)}`
      : UP_COMPLAINT_API.SSL.GET_DISTRICTS;
    const res = await apiRequest(url);
    const districts = extractStringList(res, ['districts', 'district']);
    return { status: !!res.status || districts.length > 0, districts, data: res.data ?? districts };
  },

  async getSslDistricts(type?: string): Promise<string[]> {
    const url = type
      ? `${UP_COMPLAINT_API.SSL.GET_DISTRICTS}?type=${encodeURIComponent(type)}`
      : UP_COMPLAINT_API.SSL.GET_DISTRICTS;
    const res = await apiRequest(url);
    return extractStringList(res, ['districts', 'district']);
  },

  async getSslBlocks(district: string, type?: string): Promise<string[]> {
    const res = await apiRequest(UP_COMPLAINT_API.SSL.GET_BLOCKS(district, type));
    return extractStringList(res, ['blocks', 'block']);
  },

  async getSslPanchayats(district: string, block: string, type?: string): Promise<string[]> {
    const res = await apiRequest(UP_COMPLAINT_API.SSL.GET_PANCHAYATS(district, block, type));
    return extractStringList(res, ['panchayats', 'panchyats', 'panchayat', 'panchyat']);
  },

  async getSslBeneficiaryNames(district: string, block: string, panchayat: string, type?: string): Promise<{ id: string | number; name: string }[]> {
    const res = await apiRequest(UP_COMPLAINT_API.SSL.GET_BENEFICIARY_NAMES(district, block, panchayat, type));
    return extractNamedItems(res, ['beneficiaries', 'beneficiary', 'sites', 'site']);
  },

  async getSslBeneficiaryDetails(idOrName: string | number, name?: string, type?: string): Promise<UpSslBeneficiaryDetails | null> {
    const res = await apiRequest(UP_COMPLAINT_API.SSL.GET_BENEFICIARY_DETAILS(idOrName, name, type));
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
    return extractComplaintList<UpSslComplaintItem>(res);
  },

  async getSslAssignedComplaints(): Promise<UpAssignedDataResponse<UpSslComplaintItem>> {
    const res = await apiRequest(UP_COMPLAINT_API.SSL.ASSIGNED_COMPLAINTS);
    return extractAssignedResponse<UpSslComplaintItem>(res);
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

  async getSslEditComplaint(id: number | string): Promise<UpSslComplaintItem | null> {
    const res = await apiRequest(UP_COMPLAINT_API.SSL.EDIT_COMPLAINT(id));
    return extractDetailObject<UpSslComplaintItem>(res, ['complaint', 'ssl', 'data']);
  },

  async updateSslComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.SSL.UPDATE_COMPLAINT, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'SSL Complaint updated successfully!' : 'Failed to update SSL complaint.'),
      errors: res.errors,
    };
  },

  async deleteSslComplaint(id: number | string): Promise<{ status: boolean; message: string }> {
    return deleteRequest(UP_COMPLAINT_API.SSL.DELETE_COMPLAINT(id));
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

  async getKusumCDetails(farmerIdOrName: string | number, name?: string): Promise<UpKusumCDetails | null> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_C.GET_BENEFICIARY_DETAILS(farmerIdOrName, name));
    return extractDetailObject<UpKusumCDetails>(res, ['farmer', 'details', 'detail', 'beneficiary', 'vendor', 'data']);
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
    return extractComplaintList<UpKusumCComplaintItem>(res);
  },

  async getKusumCAssignedComplaints(): Promise<UpAssignedDataResponse<UpKusumCComplaintItem>> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_C.ASSIGN_COMPLAINT);
    return extractAssignedResponse<UpKusumCComplaintItem>(res);
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

  async getKusumCEditComplaint(id: number | string): Promise<UpKusumCComplaintItem | null> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_C.EDIT_COMPLAINT(id));
    return extractDetailObject<UpKusumCComplaintItem>(res, ['complaint', 'swp', 'kusumc', 'data']);
  },

  async updateKusumCComplaint(id: number | string, formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_C.UPDATE_COMPLAINT(id), {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Kusum C Complaint updated successfully!' : 'Failed to update complaint.'),
      errors: res.errors,
    };
  },

  async deleteKusumCComplaint(id: number | string): Promise<{ status: boolean; message: string }> {
    return deleteRequest(UP_COMPLAINT_API.KUSUM_C.DELETE_COMPLAINT(id));
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

  async getKusumBDetails(beneficiaryIdOrName: string | number, name?: string): Promise<UpKusumBDetails | null> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_B.GET_BENEFICIARY_DETAILS(beneficiaryIdOrName, name));
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
    return extractComplaintList<UpKusumBComplaintItem>(res);
  },

  async getKusumBAssignedComplaints(): Promise<UpAssignedDataResponse<UpKusumBComplaintItem>> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_B.ASSIGN_COMPLAINT);
    return extractAssignedResponse<UpKusumBComplaintItem>(res);
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

  async getKusumBEditComplaint(id: number | string): Promise<UpKusumBComplaintItem | null> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_B.EDIT_COMPLAINT(id));
    return extractDetailObject<UpKusumBComplaintItem>(res, ['complaint', 'kusumb', 'data']);
  },

  async updateKusumBComplaint(id: number | string, formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.KUSUM_B.UPDATE_COMPLAINT(id), {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Kusum B Complaint updated successfully!' : 'Failed to update complaint.'),
      errors: res.errors,
    };
  },

  async deleteKusumBComplaint(id: number | string): Promise<{ status: boolean; message: string }> {
    return deleteRequest(UP_COMPLAINT_API.KUSUM_B.DELETE_COMPLAINT(id));
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

  async getOngridDetails(beneficiaryIdOrName: string | number, name?: string): Promise<UpOngridDetails | null> {
    const res = await apiRequest(UP_COMPLAINT_API.ONGRID.GET_BENEFICIARY_DETAILS(beneficiaryIdOrName, name));
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
    return extractComplaintList<UpOngridComplaintItem>(res);
  },

  async getOngridAssignedComplaints(): Promise<UpAssignedDataResponse<UpOngridComplaintItem>> {
    const res = await apiRequest(UP_COMPLAINT_API.ONGRID.ASSIGN_COMPLAINT);
    return extractAssignedResponse<UpOngridComplaintItem>(res);
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

  async getOngridEditComplaint(id: number | string): Promise<UpOngridComplaintItem | null> {
    const res = await apiRequest(UP_COMPLAINT_API.ONGRID.EDIT_COMPLAINT(id));
    return extractDetailObject<UpOngridComplaintItem>(res, ['complaint', 'ongrid', 'data']);
  },

  async updateOngridComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.ONGRID.UPDATE_COMPLAINT, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'On Grid Complaint updated successfully!' : 'Failed to update complaint.'),
      errors: res.errors,
    };
  },

  async deleteOngridComplaint(id: number | string): Promise<{ status: boolean; message: string }> {
    return deleteRequest(UP_COMPLAINT_API.ONGRID.DELETE_COMPLAINT(id));
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

  async getOffgridDetails(beneficiaryIdOrName: string | number, name?: string): Promise<UpOffgridDetails | null> {
    const res = await apiRequest(UP_COMPLAINT_API.OFFGRID.GET_BENEFICIARY_DETAILS(beneficiaryIdOrName, name));
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
    return extractComplaintList<UpOffgridComplaintItem>(res);
  },

  async getOffgridAssignedComplaints(): Promise<UpAssignedDataResponse<UpOffgridComplaintItem>> {
    const res = await apiRequest(UP_COMPLAINT_API.OFFGRID.ASSIGN_COMPLAINT);
    return extractAssignedResponse<UpOffgridComplaintItem>(res);
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

  async getOffgridEditComplaint(id: number | string): Promise<UpOffgridComplaintItem | null> {
    const res = await apiRequest(UP_COMPLAINT_API.OFFGRID.EDIT(id));
    return extractDetailObject<UpOffgridComplaintItem>(res, ['complaint', 'offgrid', 'data']);
  },

  async updateOffgridComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.OFFGRID.UPDATE, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Off Grid Complaint updated successfully!' : 'Failed to update complaint.'),
      errors: res.errors,
    };
  },

  async deleteOffgridComplaint(id: number | string): Promise<{ status: boolean; message: string }> {
    return deleteRequest(UP_COMPLAINT_API.OFFGRID.DELETE(id));
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

  async getPowerpackDetails(idOrName: string | number, name?: string): Promise<UpPowerpackDetails | null> {
    const res = await apiRequest(UP_COMPLAINT_API.POWERPACK.GET_BENEFICIARY_DETAILS(idOrName, name));
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
    return extractComplaintList<UpPowerpackComplaintItem>(res);
  },

  async getPowerpackAssignedComplaints(): Promise<UpAssignedDataResponse<UpPowerpackComplaintItem>> {
    const res = await apiRequest(UP_COMPLAINT_API.POWERPACK.ASSIGN_COMPLAINT);
    return extractAssignedResponse<UpPowerpackComplaintItem>(res);
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

  async getPowerpackEditComplaint(id: number | string): Promise<UpPowerpackComplaintItem | null> {
    const res = await apiRequest(UP_COMPLAINT_API.POWERPACK.EDIT(id));
    return extractDetailObject<UpPowerpackComplaintItem>(res, ['complaint', 'powerpack', 'data']);
  },

  async updatePowerpackComplaint(formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.POWERPACK.UPDATE, {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Power Pack Complaint updated successfully!' : 'Failed to update complaint.'),
      errors: res.errors,
    };
  },

  async deletePowerpackComplaint(id: number | string): Promise<{ status: boolean; message: string }> {
    return deleteRequest(UP_COMPLAINT_API.POWERPACK.DELETE_COMPLAINT(id));
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

  async getSrlmsrtSiteDetails(idOrName: string | number, name?: string): Promise<UpSrlmsrtDetails | null> {
    const res = await apiRequest(UP_COMPLAINT_API.SRLMSRT.GET_SITE_DETAILS(idOrName, name));
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
    return extractComplaintList<UpSrlmsrtComplaintItem>(res);
  },

  async getSrlmsrtAssignedComplaints(): Promise<UpAssignedDataResponse<UpSrlmsrtComplaintItem>> {
    const res = await apiRequest(UP_COMPLAINT_API.SRLMSRT.ASSIGN_COMPLAINT);
    return extractAssignedResponse<UpSrlmsrtComplaintItem>(res);
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

  async getSrlmsrtEditComplaint(id: number | string): Promise<UpSrlmsrtComplaintItem | null> {
    const res = await apiRequest(UP_COMPLAINT_API.SRLMSRT.EDIT_COMPLAINT(id));
    return extractDetailObject<UpSrlmsrtComplaintItem>(res, ['complaint', 'srlmsrt', 'data']);
  },

  async updateSrlmsrtComplaint(id: number | string, formData: FormData): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_COMPLAINT_API.SRLMSRT.UPDATE_COMPLAINT(id), {
      method: 'POST',
      body: formData,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'SRLMSRT Complaint updated successfully!' : 'Failed to update complaint.'),
      errors: res.errors,
    };
  },

  async deleteSrlmsrtComplaint(id: number | string): Promise<{ status: boolean; message: string }> {
    return deleteRequest(UP_COMPLAINT_API.SRLMSRT.DELETE_COMPLAINT(id));
  },
};

export default upComplaintService;
