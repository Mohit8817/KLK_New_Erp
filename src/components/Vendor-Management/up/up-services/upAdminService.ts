import { API_BASE_URL, authService } from '../../../../services/authService';
import {
  UP_ADMIN_SSL18W_API,
  UP_ADMIN_KUSUMC_API,
  UP_ADMIN_RESCO_API,
  UP_ADMIN_RESCO_SURVEY_API,
} from '../../Vendor_Management_APIS/UP_Vendor_API';

/* ── Backend & Media Base URLs ── */
export const BACKEND_BASE = (API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

export const R2_BASE = (
  (import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ||
  'https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev'
).replace(/\/+$/, '');

export function getUpMediaCandidates(path?: string | null, moduleHint?: 'ssl18w' | 'kusumc' | 'resco'): string[] {
  if (!path || typeof path !== 'string') return [];
  const clean = path.trim().replace(/\\/g, '/');
  if (!clean || clean === '—' || clean.toLowerCase() === 'null') return [];

  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return [clean];
  }

  const normalized = clean.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  if (normalized.startsWith('uploads/') || normalized.startsWith('storage/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  } else {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  }

  // Handle folder name variations (e.g. ssl18mw vs ssl18w)
  if (normalized.includes('ssl18mw')) {
    candidates.push(`${BACKEND_BASE}/${normalized.replace(/ssl18mw/g, 'ssl18w')}`);
    candidates.push(`${BACKEND_BASE}/${normalized.replace(/ssl18mw/g, 'ssl')}`);
  } else if (normalized.includes('ssl18w')) {
    candidates.push(`${BACKEND_BASE}/${normalized.replace(/ssl18w/g, 'ssl18mw')}`);
    candidates.push(`${BACKEND_BASE}/${normalized.replace(/ssl18w/g, 'ssl')}`);
  }

  if (moduleHint === 'ssl18w') {
    candidates.push(`${BACKEND_BASE}/uploads/up/installation/ssl18mw/light/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/installation/ssl18w/light/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/ssl18mw/light/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/ssl18w/light/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/installation/ssl18mw/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/installation/ssl18w/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/ssl18w/installation/assignsite/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/ssl18w/installation/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/ssl18w/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/ssl/installation/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/ssl/light/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/light/${filename}`);
  } else if (moduleHint === 'kusumc') {
    candidates.push(`${BACKEND_BASE}/uploads/up/kusumC/installation/assignsite/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/kusumB/installation/assignsite/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/kusumc/installation/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/kusumC/installation/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/kusumC/${filename}`);
  } else if (moduleHint === 'resco') {
    candidates.push(`${BACKEND_BASE}/uploads/up/survey/resco/surveyassign/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/survey/resco/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/survey/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/installation/resco/doc/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/resco/installation/doc/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/installation/resco/assign/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/installation/resco/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/resco/installation/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/resco/doc/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/resco/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/up/doc/${filename}`);
    candidates.push(`${BACKEND_BASE}/uploads/resco/doc/${filename}`);
  }

  candidates.push(`${BACKEND_BASE}/uploads/up/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/${normalized}`);
    if (normalized.includes('ssl18mw')) {
      candidates.push(`${R2_BASE}/${normalized.replace(/ssl18mw/g, 'ssl18w')}`);
    } else if (normalized.includes('ssl18w')) {
      candidates.push(`${R2_BASE}/${normalized.replace(/ssl18w/g, 'ssl18mw')}`);
    }
    candidates.push(`${R2_BASE}/uploads/up/installation/ssl18mw/light/${filename}`);
    candidates.push(`${R2_BASE}/uploads/up/installation/ssl18w/light/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }

  return Array.from(new Set(candidates));
}

export function resolveUpMediaUrl(path?: string | null, moduleHint?: 'ssl18w' | 'kusumc' | 'resco'): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getUpMediaCandidates(path, moduleHint);
  return candidates[0] || `${BACKEND_BASE}/${path.replace(/^\/+/, '')}`;
}

/* ═══════════════════ Common Shared Types ═══════════════════ */

export interface UpVendorItem {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  [key: string]: any;
}

export interface UpApiResponse<T = any> {
  status?: boolean;
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  error?: string;
  [key: string]: any;
}

export interface UpPaymentHistoryItem {
  id: number;
  claim_id: number;
  amount: string | number;
  balance?: string | number;
  date?: string;
  pay_remarks?: string | null;
  remarks?: string | null;
  [key: string]: any;
}

export interface UpPaymentDetailSummary {
  total: number;
  complete: number;
  partially: number;
  pending: number;
}

/* ═══════════════════ UP SSL 18W Types ═══════════════════ */

export interface UpSsl18wDistrictItem {
  district: string;
}

export interface UpSsl18wBlockItem {
  block: string;
}

export interface UpSsl18wPanchayatItem {
  panchayat: string;
  count: number;
}

export interface UpSsl18wAssignRecord {
  id: number;
  vendor: number;
  vendor_name?: string;
  vendors?: { id: number; name: string; [key: string]: any };
  purpose?: string;
  state?: string;
  project?: string;
  district: string;
  block: string;
  status: number; // 0 = Approval pending, 1 = Approved
  volume?: string | number | null;
  village: string[] | string; // panchayat list
  assign_date?: string;
  created_at?: string;
  deadline_date?: string;
  site_count: number;
  file?: string | null;
  remarks?: string | null;
  [key: string]: any;
}

export interface UpSsl18wDetailSummary {
  total: number;
  assigned: number;
  accept: number;
  not_assigned: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
}

export interface UpSsl18wSiteRow {
  id: number;
  uid?: string;
  unique_id?: string;
  vendor_name?: string;
  inst_vendor?: number;
  vendors?: { id: number; name: string };
  inst_date?: string;
  installation_date?: string;
  state?: string;
  phase?: string;
  volume?: string | number;
  district?: string;
  block?: string;
  panchayat?: string;
  ward_no?: string;
  ward?: string;
  pole_no?: string;
  beneficiary_name?: string;
  beneficiary_contact?: string;
  contact_no?: string;
  latitude?: string;
  longitude?: string;
  uuid_no?: string;
  uuid?: string;
  imei_no?: string;
  imei?: string;
  light_no?: string;
  luminary_no?: string;
  battery_no?: string;
  battery_serial_no?: string;
  panel_no?: string;
  module_no?: string;
  light_file?: string | null;
  light_image?: string;
  inst_image?: string;
  image?: string;
  inst_remarks?: string | null;
  remarks?: string | null;
  inst_verify_status?: number; // 0=Pending, 1=Approved, 2=Rejected
  inst_verify_by?: string | number | null;
  inst_verify_remarks?: string | null;
  inst_verify_date?: string | null;
  inst_status?: number;
  inst_accept?: number;
  inst_claim_status?: number;
  inst_pay_status?: number;
  feasible?: number;
  [key: string]: any;
}

export interface UpSsl18wClaimRecord {
  id: number;
  state?: string;
  vendor_id?: number;
  vendor_name?: string;
  vendors?: { id: number; name: string };
  date?: string;
  created_at?: string;
  updated_at?: string;
  site_count?: number;
  light_count?: number;
  site_id?: string | number[];
  site_details?: Array<{ id: number; beneficiary_name?: string; [key: string]: any }>;
  file?: string | null;
  invoice?: string | null;
  amount: string | number;
  claim_status: number; // 1=Pending, 2=Approved, 3=Rejected
  remarks?: string | null;
  approved_remarks?: string | null;
  verify_remarks?: string | null;
  approved_date?: string | null;
  [key: string]: any;
}

export interface UpSsl18wClaimDetailsSummary {
  total: number;
  claim_approved: number;
  claim_pending: number;
  claim_reject: number;
}

export interface UpSsl18wPaymentRecord {
  id: number;
  vendor_id: number;
  vendor_name?: string;
  vendors?: { id: number; name: string };
  date?: string;
  amount: string | number;
  pay_status: number; // 0=Pending, 1=Complete, 2=Partially
  file?: string | null;
  remarks?: string | null;
  allpayment?: UpPaymentHistoryItem[];
  site_details?: Array<{ id: number; beneficiary_name?: string; [key: string]: any }>;
  [key: string]: any;
}

export interface UpSsl18wDashboardData {
  install_detail: {
    total: number;
    assigned: number;
    accept: number;
    not_assigned: number;
    complete: number;
    pending: number;
    verify_approved: number;
    verify_pending: number;
    verify_reject: number;
    claim_applicable: number;
    claim_raised: number;
    claim_not_applicable: number;
    claim_verify_approved: number;
    claim_verify_pending: number;
    claim_verify_reject: number;
    payment_complete: number;
    payment_pending: number;
    payment_partially: number;
  };
  vendors: Array<{ inst_vendor: number; vendor?: number; name: string; [key: string]: any }>;
  vendorswise: Array<{
    inst_vendor: number;
    name?: string;
    assigned: number;
    accept: number;
    complete: number;
    pending: number;
    verify_approved: number;
    verify_pending: number;
    verify_reject: number;
    claim_applicable?: number;
    claim_raised?: number;
    claim_verify_approved?: number;
    claim_verify_pending?: number;
    claim_verify_reject?: number;
    payment_complete?: number;
    payment_pending?: number;
    payment_partially?: number;
    [key: string]: any;
  }>;
  districtwise: Array<{
    district: string;
    total: number;
    assigned: number;
    accept?: number;
    not_assigned?: number;
    complete: number;
    pending: number;
    verify_approved: number;
    verify_pending: number;
    verify_reject: number;
    claim_applicable?: number;
    claim_raised?: number;
    claim_verify_approved?: number;
    claim_verify_pending?: number;
    claim_verify_reject?: number;
    payment_complete?: number;
    payment_pending?: number;
    payment_partially?: number;
    [key: string]: any;
  }>;
  vendor_installation_month: Array<{ month_year: string; monthly_installations: number }>;
  vendor_today_installation: Array<{ inst_vendor: number; today_install: number }>;
}

/* ═══════════════════ UP Kusum C Types ═══════════════════ */

export interface UpKusumCVolumeItem {
  volume: string;
}

export interface UpKusumCDistrictItem {
  f_district: string;
}

export interface UpKusumCApplicantItem {
  id: number;
  f_farmer_name: string;
  f_father_name?: string;
  f_village?: string;
  f_post?: string;
  f_district?: string;
  f_contact?: string;
  [key: string]: any;
}

export interface UpKusumCAssignSiteDetail {
  id: number;
  f_farmer_name: string;
  f_father_name?: string;
  inst_deadline?: string | null;
  mt_bos?: string | null;
  vfd_status?: string | number | null;
  mt_inverter?: string | null;
  mt_structure?: string | null;
  [key: string]: any;
}

export interface UpKusumCAssignRecord {
  id: number;
  vendor: number;
  vendor_name?: string;
  vendors?: { id: number; name: string; [key: string]: any };
  purpose?: string;
  state?: string;
  project?: string;
  district: string;
  volume?: string | number;
  status: number; // 0 = Pending, 1 = Approved, 2 = Accepted
  assign_date?: string;
  created_at?: string;
  deadline_date?: string;
  site_count: number;
  file?: string | null;
  remarks?: string | null;
  site_id?: UpKusumCAssignSiteDetail[] | number[] | string;
  [key: string]: any;
}

export interface UpKusumCDetailSummary {
  total: number;
  ourside_assigned?: number;
  assigned: number;
  not_assigned: number;
  complete: number;
  pending: number;
  verify_approved?: number;
  verify_pending?: number;
  verify_reject?: number;
  doc_approved?: number;
  doc_pending?: number;
  doc_reject?: number;
}

export interface UpKusumCSiteRow {
  id: number;
  vendor_id?: number;
  vendor_name?: string;
  inst_vendor?: number;
  state?: string;
  volume?: string | number;
  phase?: string;
  f_district?: string;
  district?: string;
  f_block?: string;
  f_post?: string;
  block?: string;
  f_village?: string;
  village?: string;
  f_farmer_name?: string;
  farmer_name?: string;
  f_father_name?: string;
  father_name?: string;
  f_contact?: string;
  contact?: string;
  vfd_no?: string;
  inverter_no?: string;
  Inverter_no?: string;
  f_customer_no?: string | null;
  lot_no?: string | null;
  pump_capacity?: string | number | null;
  latitude?: string | null;
  longitude?: string | null;
  module_serial_no?: string | string[];
  module_no?: string | string[];
  farmer_with_module?: string;
  module_image?: string;
  inverter_vfd_with_farmer?: string;
  inverter_vfd_image?: string;
  running_water_with_farmer?: string;
  running_water_image?: string;
  inst_doc?: string | null;
  doc_file?: string | null;
  inst_doc_date?: string | null;
  inst_doc_remarks?: string | null;
  inst_doc_status?: number; // 1=Pending, 2=Approved, 3=Rejected
  inst_doc_verify_remarks?: string | null;
  inst_date?: string | null;
  inst_remarks?: string | null;
  inst_verify_status?: number; // 0=Pending, 1=Approved, 2=Rejected
  inst_verify_by?: string | number | null;
  inst_verify_remarks?: string | null;
  inst_verify_date?: string | null;
  inst_status?: number;
  inst_accept?: number;
  inst_claim_status?: number;
  inst_pay_status?: number;
  mt_bos?: string | null;
  vfd_status?: string | number | null;
  mt_inverter?: string | null;
  mt_structure?: string | null;
  [key: string]: any;
}

export interface UpKusumCClaimRecord {
  id: number;
  date?: string;
  created_at?: string;
  file?: string | null;
  amount: string | number;
  remarks?: string | null;
  approved_remarks?: string | null;
  claim_status: number; // 1=Pending, 2=Approved, 3=Rejected
  vendor_id?: number;
  vendor_name?: string;
  site_details?: Array<{ id: number; f_farmer_name?: string; [key: string]: any }>;
  [key: string]: any;
}

export interface UpKusumCPaymentRecord {
  id: number;
  vendor_id: number;
  vendor_table_id?: number;
  vendor_name?: string;
  date?: string;
  amount: string | number;
  pay_status: number; // 0=Pending, 1=Complete, 2=Partially
  file?: string | null;
  remarks?: string | null;
  allpayment?: UpPaymentHistoryItem[];
  site_details?: Array<{ id: number; f_farmer_name?: string; [key: string]: any }>;
  [key: string]: any;
}

export interface UpKusumCDashboardData {
  kusumc: {
    site_count: number;
    total_site: number;
    complete: number;
    pending: number;
    site_assigned: number;
    accept_pending: number;
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
    f_district: string;
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
    [key: string]: any;
  }>;
  vendors: Array<{ inst_vendor: number; vendor?: number; name: string; [key: string]: any }>;
  vendorswise: Array<{
    inst_vendor: number;
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
    [key: string]: any;
  }>;
  phasewise: Array<{
    phase: string;
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
    [key: string]: any;
  }>;
  vendor_installation_month: Array<{ month_year: string; monthly_installations: number }>;
  vendor_today_installation: Array<{ inst_vendor: number; today_install: number }>;
}

/* ═══════════════════ Shared HTTP Helper ═══════════════════ */

function buildHeaders(isMultipart = false): Record<string, string> {
  let token = '';
  try {
    token = authService.getToken?.() || '';
  } catch {
    // ignore
  }
  if (!token && typeof localStorage !== 'undefined') {
    token =
      localStorage.getItem('klk_auth_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      '';
  }
  const isSynthetic =
    token.startsWith('klk_user_session_token_') ||
    token.startsWith('klk_vendor_session_token_');

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token && !isSynthetic) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

function extractApiError(json: UpApiResponse | null, status: number, fallback: string): string {
  if (json?.errors && typeof json.errors === 'object') {
    const firstMsgs = Object.values(json.errors).flat().filter(Boolean);
    if (firstMsgs.length > 0) return firstMsgs.join(' ');
  }
  if (json?.message && typeof json.message === 'string') return json.message;
  if (json?.error && typeof json.error === 'string') return json.error;
  return `${fallback} (HTTP ${status})`;
}

/**
 * Tries candidate URLs in order. Only falls through on HTTP 404/405 where the
 * server did NOT return a structured business JSON response (e.g., route not found
 * or HTML page). Business 404s like `{ success: false, message: "Record not found." }`
 * and validation 422s return immediately.
 */
async function requestJsonWithFallback<T = any>(
  candidates: string[],
  options: RequestInit = {},
  fallbackErrorMsg = 'Request failed'
): Promise<UpApiResponse<T>> {
  let lastError: Error | null = null;

  for (let i = 0; i < candidates.length; i++) {
    const url = candidates[i];
    try {
      const res = await fetch(url, {
        credentials: 'include',
        ...options,
      });
      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      let json: UpApiResponse<T> | null = null;

      if (isJson) {
        try {
          json = await res.json();
        } catch {
          json = null;
        }
      } else {
        const text = await res.text();
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }
      }

      const isRouteMissing =
        (res.status === 404 || res.status === 405) &&
        (!json ||
          (json.success === undefined &&
            json.status === undefined &&
            typeof json.message === 'string' &&
            /route.*could not be found|not found|method.*not supported/i.test(json.message)));

      if (isRouteMissing && i < candidates.length - 1) {
        lastError = new Error(extractApiError(json, res.status, fallbackErrorMsg));
        continue;
      }

      if (!res.ok) {
        throw new Error(extractApiError(json, res.status, fallbackErrorMsg));
      }

      if (json && json.status === false) {
        throw new Error(extractApiError(json, res.status, fallbackErrorMsg));
      }
      if (json && json.success === false) {
        throw new Error(extractApiError(json, res.status, fallbackErrorMsg));
      }

      return json || ({ success: true } as UpApiResponse<T>);
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // If it was a network error and more candidates exist, try next;
      // if it was an explicit HTTP/business error we threw above, stop immediately.
      if (err && err.name !== 'TypeError') {
        throw lastError;
      }
    }
  }

  throw lastError || new Error(fallbackErrorMsg);
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 1. UP SSL 18W INSTALLATION ADMIN SERVICE (18 ENDPOINTS)
 * ═══════════════════════════════════════════════════════════════════════════ */
class UpSsl18wAdminService {
  // 1. GET /up/ssl-18w/installation/assign
  async getAssignFormData(): Promise<{
    vendors: UpVendorItem[];
    districts: UpSsl18wDistrictItem[];
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_SSL18W_API.ASSIGN_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to load SSL 18W assign form data'
    );
    const data = json.data || json;
    return {
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
      districts: Array.isArray(data?.districts) ? data.districts : [],
    };
  }

  // 2. GET /up/ssl-18w/installation/fetch-block?district=...
  async fetchBlocks(district: string): Promise<UpSsl18wBlockItem[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_SSL18W_API.FETCH_BLOCK_CANDIDATES(district),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch blocks'
    );
    const list = Array.isArray(json.data) ? json.data : Array.isArray(json.blocks) ? json.blocks : [];
    return list;
  }

  // 3. GET /up/ssl-18w/installation/fetch-panchayat?district=...&block=...
  async fetchPanchayats(district: string, block: string): Promise<UpSsl18wPanchayatItem[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_SSL18W_API.FETCH_PANCHAYAT_CANDIDATES(district, block),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch panchayats'
    );
    const list = Array.isArray(json.data) ? json.data : Array.isArray(json.panchayats) ? json.panchayats : [];
    return list.map((p: any) => ({
      panchayat: String(p.panchayat ?? p.name ?? ''),
      count: Number(p.count ?? 0),
    }));
  }

  // 4. POST /up/ssl-18w/installation/store-assign (multipart/form-data)
  async storeAssign(formData: FormData): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_SSL18W_API.STORE_ASSIGN_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(true), body: formData },
      'Failed to store SSL 18W assignment'
    );
  }

  // 5. GET /up/ssl-18w/installation/view-assign
  async getViewAssign(): Promise<{
    assigns: UpSsl18wAssignRecord[];
    detail: UpSsl18wDetailSummary;
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_SSL18W_API.VIEW_ASSIGN_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch SSL 18W assignments'
    );
    const data = json.data || json;
    const assigns: UpSsl18wAssignRecord[] = Array.isArray(data?.assigns) ? data.assigns : [];
    const detail: UpSsl18wDetailSummary = {
      total: Number(data?.detail?.total ?? 0),
      assigned: Number(data?.detail?.assigned ?? 0),
      accept: Number(data?.detail?.accept ?? 0),
      not_assigned: Number(data?.detail?.not_assigned ?? 0),
      complete: Number(data?.detail?.complete ?? 0),
      pending: Number(data?.detail?.pending ?? 0),
      verify_approved: Number(data?.detail?.verify_approved ?? 0),
      verify_pending: Number(data?.detail?.verify_pending ?? 0),
      verify_reject: Number(data?.detail?.verify_reject ?? 0),
    };
    return { assigns, detail };
  }

  // 6. ANY /up/ssl-18w/installation/approval-assign/{id}
  async approveAssign(id: string | number): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_SSL18W_API.APPROVAL_ASSIGN_CANDIDATES(id),
      { method: 'POST', headers: buildHeaders() },
      `Failed to approve SSL 18W assignment #${id}`
    );
  }

  // 7. GET /up/ssl-18w/installation/edit-assign/{id}
  async getEditAssign(id: string | number): Promise<{
    vendors: UpVendorItem[];
    assignedsite: UpSsl18wAssignRecord;
    district: UpSsl18wDistrictItem[];
    block: UpSsl18wBlockItem[];
    panchayat: UpSsl18wPanchayatItem[];
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_SSL18W_API.EDIT_ASSIGN_CANDIDATES(id),
      { method: 'GET', headers: buildHeaders() },
      `Failed to load edit data for assignment #${id}`
    );
    const data = json.data || json;
    return {
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
      assignedsite: data?.assignedsite || data?.assign || {},
      district: Array.isArray(data?.district) ? data.district : Array.isArray(data?.districts) ? data.districts : [],
      block: Array.isArray(data?.block) ? data.block : Array.isArray(data?.blocks) ? data.blocks : [],
      panchayat: Array.isArray(data?.panchayat)
        ? data.panchayat.map((p: any) => ({ panchayat: String(p.panchayat ?? ''), count: Number(p.count ?? 0) }))
        : [],
    };
  }

  // 8. POST /up/ssl-18w/installation/update-assign (multipart/form-data; id in body)
  async updateAssign(formData: FormData): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_SSL18W_API.UPDATE_ASSIGN_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(true), body: formData },
      'Failed to update SSL 18W assignment'
    );
  }

  // 9. GET /up/ssl-18w/installation/view-installation
  async getViewInstallation(): Promise<{
    detail: UpSsl18wDetailSummary;
    verification: UpSsl18wSiteRow[];
    verified: UpSsl18wSiteRow[];
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_SSL18W_API.VIEW_INSTALLATION_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch SSL 18W installations'
    );
    const data = json.data || json;
    return {
      detail: {
        total: Number(data?.detail?.total ?? 0),
        assigned: Number(data?.detail?.assigned ?? 0),
        accept: Number(data?.detail?.accept ?? 0),
        not_assigned: Number(data?.detail?.not_assigned ?? 0),
        complete: Number(data?.detail?.complete ?? 0),
        pending: Number(data?.detail?.pending ?? 0),
        verify_approved: Number(data?.detail?.verify_approved ?? 0),
        verify_pending: Number(data?.detail?.verify_pending ?? 0),
        verify_reject: Number(data?.detail?.verify_reject ?? 0),
      },
      verification: Array.isArray(data?.verification) ? data.verification : [],
      verified: Array.isArray(data?.verified) ? data.verified : [],
    };
  }

  // 10. POST /up/ssl/installation/verify-installation-status
  async verifyInstallationStatus(payload: {
    id: number | string;
    status: 1 | 2;
    inst_verify_remarks?: string;
  }): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_SSL18W_API.VERIFY_INSTALLATION_STATUS_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify(payload) },
      'Failed to verify SSL 18W installation status'
    );
  }

  // 11. GET /up/ssl-18w/installation/view-claim
  async getViewClaim(): Promise<{
    claims: UpSsl18wClaimRecord[];
    claim_details: UpSsl18wClaimDetailsSummary;
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_SSL18W_API.VIEW_CLAIM_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch SSL 18W claims'
    );
    const data = json.data || json;
    const claims: UpSsl18wClaimRecord[] = Array.isArray(data?.claims)
      ? data.claims
      : Array.isArray(data)
      ? data
      : [];
    const cd = data?.claim_details || {};
    return {
      claims,
      claim_details: {
        total: Number(cd.total ?? claims.length),
        claim_approved: Number(cd.claim_approved ?? claims.filter((c) => Number(c.claim_status) === 2).length),
        claim_pending: Number(cd.claim_pending ?? claims.filter((c) => Number(c.claim_status) === 1).length),
        claim_reject: Number(cd.claim_reject ?? claims.filter((c) => Number(c.claim_status) === 3).length),
      },
    };
  }

  // 12. POST /up/ssl-18w/installation/verify-claim-status
  async verifyClaimStatus(payload: {
    id: number | string;
    status: 2 | 3;
    remarks?: string;
  }): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_SSL18W_API.VERIFY_CLAIM_STATUS_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify(payload) },
      'Failed to verify SSL 18W claim status'
    );
  }

  // 13. ANY /up/ssl-18w/installation/view-payment
  async getViewPayment(params?: {
    from_date?: string;
    to_date?: string;
    vendor?: string | number;
    status?: string | number;
  }): Promise<{
    payments: UpSsl18wPaymentRecord[];
    payment_detail: UpPaymentDetailSummary;
    vendors: UpVendorItem[];
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_SSL18W_API.VIEW_PAYMENT_CANDIDATES(params),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch SSL 18W payments'
    );
    const data = json.data || json;
    const payments: UpSsl18wPaymentRecord[] = Array.isArray(data?.payments) ? data.payments : [];
    const pd = data?.payment_detail || {};
    return {
      payments,
      payment_detail: {
        total: Number(pd.total ?? payments.length),
        complete: Number(pd.complete ?? 0),
        partially: Number(pd.partially ?? 0),
        pending: Number(pd.pending ?? 0),
      },
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
    };
  }

  // 14. POST /up/ssl-18w/installation/update-payment-status
  async updatePaymentStatus(payload: {
    id: number | string;
    amount: number;
    date: string;
    remarks?: string;
  }): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_SSL18W_API.UPDATE_PAYMENT_STATUS_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify(payload) },
      'Failed to update SSL 18W payment'
    );
  }

  // 15. GET /up/ssl-18w/installation/dashboard
  async getDashboard(): Promise<UpSsl18wDashboardData> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_SSL18W_API.DASHBOARD_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch SSL 18W dashboard data'
    );
    const data = json.data || json;
    const d = data?.install_detail || {};
    return {
      install_detail: {
        total: Number(d.total ?? 0),
        assigned: Number(d.assigned ?? 0),
        accept: Number(d.accept ?? 0),
        not_assigned: Number(d.not_assigned ?? 0),
        complete: Number(d.complete ?? 0),
        pending: Number(d.pending ?? 0),
        verify_approved: Number(d.verify_approved ?? 0),
        verify_pending: Number(d.verify_pending ?? 0),
        verify_reject: Number(d.verify_reject ?? 0),
        claim_applicable: Number(d.claim_applicable ?? 0),
        claim_raised: Number(d.claim_raised ?? 0),
        claim_not_applicable: Number(d.claim_not_applicable ?? 0),
        claim_verify_approved: Number(d.claim_verify_approved ?? 0),
        claim_verify_pending: Number(d.claim_verify_pending ?? 0),
        claim_verify_reject: Number(d.claim_verify_reject ?? 0),
        payment_complete: Number(d.payment_complete ?? 0),
        payment_pending: Number(d.payment_pending ?? 0),
        payment_partially: Number(d.payment_partially ?? 0),
      },
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
      vendorswise: Array.isArray(data?.vendorswise) ? data.vendorswise : [],
      districtwise: Array.isArray(data?.districtwise) ? data.districtwise : [],
      vendor_installation_month: Array.isArray(data?.vendor_installation_month)
        ? data.vendor_installation_month
        : [],
      vendor_today_installation: Array.isArray(data?.vendor_today_installation)
        ? data.vendor_today_installation
        : [],
    };
  }

  private extractSslRows(raw: any): UpSsl18wSiteRow[] {
    if (Array.isArray(raw)) return raw;
    if (!raw || typeof raw !== 'object') return [];
    const candidateKeys = ['ssl18w', 'ssl', 'lights', 'sites', 'installations', 'records', 'list', 'data'];
    for (const key of candidateKeys) {
      if (Array.isArray(raw[key])) return raw[key];
    }
    return [];
  }

  // 16. GET /up/ssl-18w/installation/view-dashboard/{status}
  async getViewDashboard(status: string): Promise<UpSsl18wSiteRow[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_SSL18W_API.VIEW_DASHBOARD_CANDIDATES(status),
      { method: 'GET', headers: buildHeaders() },
      `Failed to fetch SSL 18W drill-down for "${status}"`
    );
    const data = json.data || json;
    return this.extractSslRows(data);
  }

  // 17. GET /up/ssl-18w/installation/vendorwise-data/{status}/{vendor}
  async getVendorwiseData(status: string, vendor: string | number): Promise<UpSsl18wSiteRow[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_SSL18W_API.VENDORWISE_DATA_CANDIDATES(status, vendor),
      { method: 'GET', headers: buildHeaders() },
      `Failed to fetch vendor-wise SSL 18W data`
    );
    const data = json.data || json;
    return this.extractSslRows(data);
  }

  // 18. GET /up/ssl-18w/installation/districtwise-data/{status}/{district}
  async getDistrictwiseData(status: string, district: string): Promise<UpSsl18wSiteRow[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_SSL18W_API.DISTRICTWISE_DATA_CANDIDATES(status, district),
      { method: 'GET', headers: buildHeaders() },
      `Failed to fetch district-wise SSL 18W data`
    );
    const data = json.data || json;
    return this.extractSslRows(data);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 2. UP KUSUM C INSTALLATION ADMIN SERVICE (23 ENDPOINTS)
 * ═══════════════════════════════════════════════════════════════════════════ */
class UpKusumCAdminService {
  // 1. GET /up/kusumc/installation/assign
  async getAssignFormData(): Promise<{
    vendors: UpVendorItem[];
    volumes: UpKusumCVolumeItem[];
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_KUSUMC_API.ASSIGN_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to load Kusum C assign form data'
    );
    const data = json.data || json;
    return {
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
      volumes: Array.isArray(data?.volumes) ? data.volumes : [],
    };
  }

  // 2. GET /up/kusumc/installation/fetch-district?volume=...
  async fetchDistricts(volume: string | number): Promise<UpKusumCDistrictItem[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_KUSUMC_API.FETCH_DISTRICT_CANDIDATES(volume),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch districts'
    );
    const list = Array.isArray(json.districts)
      ? json.districts
      : Array.isArray(json.data?.districts)
      ? json.data.districts
      : Array.isArray(json.data)
      ? json.data
      : [];
    return list.map((d: any) => ({
      f_district: String(typeof d === 'string' ? d : d.f_district ?? d.district ?? ''),
    })).filter((d: UpKusumCDistrictItem) => Boolean(d.f_district));
  }

  // 3. GET /up/kusumc/installation/fetch-applicant?volume=...&district=...
  async fetchApplicants(volume: string | number, district: string): Promise<UpKusumCApplicantItem[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_KUSUMC_API.FETCH_APPLICANT_CANDIDATES(volume, district),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch applicants'
    );
    const list = Array.isArray(json.applicants)
      ? json.applicants
      : Array.isArray(json.data?.applicants)
      ? json.data.applicants
      : Array.isArray(json.data)
      ? json.data
      : [];
    return list;
  }

  // 4. POST /up/kusumc/installation/store-assign (multipart/form-data)
  async storeAssign(formData: FormData): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_KUSUMC_API.STORE_ASSIGN_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(true), body: formData },
      'Failed to store Kusum C assignment'
    );
  }

  // 5. GET /up/kusumc/installation/view-assign
  async getViewAssign(): Promise<{
    assigns: UpKusumCAssignRecord[];
    detail: UpKusumCDetailSummary;
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_KUSUMC_API.VIEW_ASSIGN_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch Kusum C assignments'
    );
    const data = json.data || json;
    const assigns: UpKusumCAssignRecord[] = Array.isArray(data?.assigns) ? data.assigns : [];
    const d = data?.detail || {};
    return {
      assigns,
      detail: {
        total: Number(d.total ?? 0),
        ourside_assigned: Number(d.ourside_assigned ?? 0),
        assigned: Number(d.assigned ?? 0),
        not_assigned: Number(d.not_assigned ?? 0),
        complete: Number(d.complete ?? 0),
        pending: Number(d.pending ?? 0),
        verify_approved: Number(d.verify_approved ?? 0),
        verify_pending: Number(d.verify_pending ?? 0),
        verify_reject: Number(d.verify_reject ?? 0),
      },
    };
  }

  // 6. POST /up/kusumc/installation/approval-assign/{id}
  async approveAssign(id: string | number): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_KUSUMC_API.APPROVAL_ASSIGN_CANDIDATES(id),
      { method: 'POST', headers: buildHeaders() },
      `Failed to approve Kusum C assignment #${id}`
    );
  }

  // 7. GET /up/kusumc/installation/edit-assign/{id}
  async getEditAssign(id: string | number): Promise<{
    assign: UpKusumCAssignRecord;
    vendors: UpVendorItem[];
    volumes: UpKusumCVolumeItem[];
    districts: UpKusumCDistrictItem[];
    applicant_names: UpKusumCApplicantItem[];
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_KUSUMC_API.EDIT_ASSIGN_CANDIDATES(id),
      { method: 'GET', headers: buildHeaders() },
      `Failed to fetch edit assignment #${id}`
    );
    const data = json.data || json;
    return {
      assign: data?.assign || {},
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
      volumes: Array.isArray(data?.volumes) ? data.volumes : [],
      districts: Array.isArray(data?.districts) ? data.districts : [],
      applicant_names: Array.isArray(data?.applicant_names) ? data.applicant_names : [],
    };
  }

  // 8. GET /up/kusumc/installation/edit-reassign/{id}
  async getEditReassign(id: string | number): Promise<{
    assign: UpKusumCAssignRecord;
    vendors: UpVendorItem[];
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_KUSUMC_API.EDIT_REASSIGN_CANDIDATES(id),
      { method: 'GET', headers: buildHeaders() },
      `Failed to fetch reassign data for #${id}`
    );
    const data = json.data || json;
    return {
      assign: data?.assign || {},
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
    };
  }

  // 9. POST /up/kusumc/installation/update-assign/{id} (multipart/form-data)
  async updateAssign(id: string | number, formData: FormData): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_KUSUMC_API.UPDATE_ASSIGN_CANDIDATES(id),
      { method: 'POST', headers: buildHeaders(true), body: formData },
      `Failed to update Kusum C assignment #${id}`
    );
  }

  // 10. GET /up/kusumc/installation/view-installation
  async getViewInstallation(): Promise<{
    detail: UpKusumCDetailSummary;
    verification: UpKusumCSiteRow[];
    verified: UpKusumCSiteRow[];
    loginId?: number | string;
    loginName?: string;
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_KUSUMC_API.VIEW_INSTALLATION_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch Kusum C installation verification data'
    );
    const data = json.data || json;
    const d = data?.detail || {};
    return {
      detail: {
        total: Number(d.total ?? 0),
        assigned: Number(d.assigned ?? 0),
        not_assigned: Number(d.not_assigned ?? 0),
        complete: Number(d.complete ?? 0),
        pending: Number(d.pending ?? 0),
        verify_approved: Number(d.verify_approved ?? 0),
        verify_pending: Number(d.verify_pending ?? 0),
        verify_reject: Number(d.verify_reject ?? 0),
      },
      verification: Array.isArray(data?.verification) ? data.verification : [],
      verified: Array.isArray(data?.verified) ? data.verified : [],
      loginId: data?.loginId,
      loginName: data?.loginName,
    };
  }

  // 11. POST /up/kusumc/installation/verify-installation-status
  async verifyInstallationStatus(payload: {
    id: number | string;
    status: 1 | 2;
    remarks?: string;
  }): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_KUSUMC_API.VERIFY_INSTALLATION_STATUS_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify(payload) },
      'Failed to verify Kusum C installation status'
    );
  }

  // 12. GET /up/kusumc/installation/view-installation-document
  async getViewInstallationDocument(): Promise<{
    detail: UpKusumCDetailSummary;
    verification: UpKusumCSiteRow[];
    verified: UpKusumCSiteRow[];
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_KUSUMC_API.VIEW_INSTALLATION_DOCUMENT_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch Kusum C installation documents'
    );
    const data = json.data || json;
    const d = data?.detail || {};
    const normalizeDocSite = (s: any): UpRescoSiteRow => {
      const doc = s?.inst_doc_file || s?.inst_doc || s?.document_file || s?.doc_file || s?.document || null;
      return {
        ...s,
        inst_doc_file: doc,
        inst_doc: doc,
      };
    };
    return {
      detail: {
        total: Number(d.total ?? 0),
        assigned: Number(d.assigned ?? 0),
        not_assigned: Number(d.not_assigned ?? 0),
        complete: Number(d.complete ?? 0),
        pending: Number(d.pending ?? 0),
        doc_approved: Number(d.doc_approved ?? 0),
        doc_pending: Number(d.doc_pending ?? 0),
        doc_reject: Number(d.doc_reject ?? 0),
      },
      verification: Array.isArray(data?.verification) ? data.verification.map(normalizeDocSite) : [],
      verified: Array.isArray(data?.verified) ? data.verified.map(normalizeDocSite) : [],
    };
  }

  // 13. POST /up/kusumc/installation/verify-installation-doc-status
  async verifyInstallationDocStatus(payload: {
    id: number | string;
    status: 2 | 3;
    remarks?: string;
  }): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_KUSUMC_API.VERIFY_INSTALLATION_DOC_STATUS_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify(payload) },
      'Failed to verify Kusum C document status'
    );
  }

  // 14. GET /up/kusumc/installation/view-claim
  async getViewClaim(): Promise<UpKusumCClaimRecord[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_KUSUMC_API.VIEW_CLAIM_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch Kusum C claims'
    );
    const data = json.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.claims)) return data.claims;
    return [];
  }

  // 15. POST /up/kusumc/installation/verify-claim-status
  async verifyClaimStatus(payload: {
    id: number | string;
    status: 2 | 3;
    remarks: string;
  }): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_KUSUMC_API.VERIFY_CLAIM_STATUS_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify(payload) },
      'Failed to verify Kusum C claim status'
    );
  }

  // 16. GET /up/kusumc/installation/view-payment
  async getViewPayment(params?: {
    from_date?: string;
    to_date?: string;
    vendor?: string | number;
    status?: string | number;
  }): Promise<{
    payments: UpKusumCPaymentRecord[];
    payment_detail: UpPaymentDetailSummary;
    vendors: UpVendorItem[];
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_KUSUMC_API.VIEW_PAYMENT_CANDIDATES(params),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch Kusum C payments'
    );
    const data = json.data || json;
    const payments: UpKusumCPaymentRecord[] = Array.isArray(data?.payments) ? data.payments : [];
    const pd = data?.payment_detail || {};
    return {
      payments,
      payment_detail: {
        total: Number(pd.total ?? payments.length),
        complete: Number(pd.complete ?? 0),
        partially: Number(pd.partially ?? 0),
        pending: Number(pd.pending ?? 0),
      },
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
    };
  }

  // 17. POST /up/update-kusum-c-installation-payment-status
  async updatePaymentStatus(payload: {
    id: number | string;
    amount: number;
    date: string;
    remarks?: string;
  }): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_KUSUMC_API.UPDATE_PAYMENT_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify(payload) },
      'Failed to update Kusum C payment'
    );
  }

  // 18. POST /up/kusumc/installation/material-status
  async updateMaterialStatus(payload: {
    id: number | string;
    mt_bos?: string;
    vfd_status?: string;
    mt_structure?: string;
    mt_inverter?: string;
  }): Promise<UpApiResponse> {
    const bodyPayload = {
      ...payload,
      ...(payload.vfd_status !== undefined ? { vfd_status: String(payload.vfd_status) } : {}),
    };
    return requestJsonWithFallback(
      UP_ADMIN_KUSUMC_API.MATERIAL_STATUS_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify(bodyPayload) },
      'Failed to update material status'
    );
  }

  // 19. GET /up/kusumc/installation/dashboard
  async getDashboard(): Promise<UpKusumCDashboardData> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_KUSUMC_API.DASHBOARD_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch Kusum C dashboard data'
    );
    const data = json.data || json;
    const k = data?.kusumc || {};
    return {
      kusumc: {
        site_count: Number(k.site_count ?? k.total_site ?? 0),
        total_site: Number(k.total_site ?? 0),
        complete: Number(k.complete ?? 0),
        pending: Number(k.pending ?? 0),
        site_assigned: Number(k.site_assigned ?? 0),
        accept_pending: Number(k.accept_pending ?? 0),
        site_not_assigned: Number(k.site_not_assigned ?? 0),
        verify_pending: Number(k.verify_pending ?? 0),
        verify_approved: Number(k.verify_approved ?? 0),
        verify_reject: Number(k.verify_reject ?? 0),
        claim_applicable: Number(k.claim_applicable ?? 0),
        claim_raised: Number(k.claim_raised ?? 0),
        claim_approved: Number(k.claim_approved ?? 0),
        claim_pending: Number(k.claim_pending ?? 0),
        inst_pay_done: Number(k.inst_pay_done ?? 0),
        inst_pay_partially: Number(k.inst_pay_partially ?? 0),
        inst_pay_pending: Number(k.inst_pay_pending ?? 0),
      },
      payment_amount: Number(data?.payment_amount ?? 0),
      claim_amount: Number(data?.claim_amount ?? 0),
      districtwise: Array.isArray(data?.districtwise) ? data.districtwise : [],
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
      vendorswise: Array.isArray(data?.vendorswise) ? data.vendorswise : [],
      phasewise: Array.isArray(data?.phasewise) ? data.phasewise : [],
      vendor_installation_month: Array.isArray(data?.vendor_installation_month)
        ? data.vendor_installation_month
        : [],
      vendor_today_installation: Array.isArray(data?.vendor_today_installation)
        ? data.vendor_today_installation
        : [],
    };
  }

  private extractSiteRows(raw: any): UpKusumCSiteRow[] {
    if (Array.isArray(raw)) return raw;
    if (!raw || typeof raw !== 'object') return [];
    const candidateKeys = ['kusumc', 'swp', 'sites', 'installations', 'records', 'list', 'data'];
    for (const key of candidateKeys) {
      if (Array.isArray(raw[key])) return raw[key];
    }
    return [];
  }

  // 20. GET /up/kusumc/installation/view-dashboard/{status?}
  async getViewDashboard(status?: string): Promise<UpKusumCSiteRow[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_KUSUMC_API.VIEW_DASHBOARD_CANDIDATES(status),
      { method: 'GET', headers: buildHeaders() },
      `Failed to fetch Kusum C drill-down for "${status || 'total'}"`
    );
    const data = json.data || json;
    return this.extractSiteRows(data);
  }

  // 21. GET /up/kusumc/installation/vendorwise-data/{status}/{vendor}
  async getVendorwiseData(status: string, vendor: string | number): Promise<UpKusumCSiteRow[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_KUSUMC_API.VENDORWISE_DATA_CANDIDATES(status, vendor),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch vendor-wise Kusum C data'
    );
    const data = json.data || json;
    return this.extractSiteRows(data);
  }

  // 22. GET /up/kusumc/installation/districtwise-data/{status}/{district}
  async getDistrictwiseData(status: string, district: string): Promise<UpKusumCSiteRow[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_KUSUMC_API.DISTRICTWISE_DATA_CANDIDATES(status, district),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch district-wise Kusum C data'
    );
    const data = json.data || json;
    return this.extractSiteRows(data);
  }

  // 23. GET /up/kusumc/installation/phasewise-data/{status}/{phase}
  async getPhasewiseData(status: string, phase: string | number): Promise<UpKusumCSiteRow[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_KUSUMC_API.PHASEWISE_DATA_CANDIDATES(status, phase),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch phase-wise Kusum C data'
    );
    const data = json.data || json;
    return this.extractSiteRows(data);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * UP RESCO Types
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface UpRescoAssignSiteItem {
  id: number;
  site_name: string;
  inst_deadline?: string;
  sanction_load?: number | string;
  [key: string]: any;
}

export interface UpRescoAssignRecord {
  id: number;
  vendor: number;
  type?: string;
  purpose?: string;
  state?: string;
  volume?: string | number;
  district: string;
  site_name?: string | number[];
  sitecount: number;
  assign_date?: string;
  deadline_date?: string;
  file?: string | null;
  remarks?: string | null;
  status: number; // 0 = Approval pending, 1 = Approved
  vendors?: { id: number; name: string; [key: string]: any };
  sites?: UpRescoAssignSiteItem[];
  [key: string]: any;
}

export interface UpRescoDetailSummary {
  total: number;
  assigned: number;
  not_assigned: number;
  complete: number;
  pending: number;
  verify_approved?: number;
  verify_pending?: number;
  verify_reject?: number;
  doc_approved?: number;
  doc_pending?: number;
  doc_reject?: number;
}

export interface UpRescoSiteRow {
  id: number;
  unique_id?: string | number;
  state?: string;
  district?: string;
  dept_name?: string;
  site_name: string;
  address?: string;
  ca_no?: string;
  sanction_load?: number | string;
  plant_sc?: string | number;
  inst_vendor?: number;
  vendor_name?: string;
  vendors?: { id: number; name: string };
  inst_accept?: number;
  inst_status?: number;
  inst_date?: string;
  inst_verify_status?: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  inst_verify_date?: string;
  inst_verify_by?: string;
  inst_verify_remarks?: string | null;
  inst_doc?: string | null;
  inst_doc_file?: string | null;
  inst_doc_status?: number; // 1 = Pending, 2 = Approved, 3 = Rejected
  inst_doc_date?: string;
  inst_doc_remarks?: string | null;
  solarmeter_no?: string;
  nm_sm_no?: string;
  loger_no?: string;
  inverter_no?: string;
  Inverter_no?: string;
  panel_no?: string;
  inst_latitude?: number | string;
  inst_longitude?: number | string;
  panel_image?: string | null;
  system_image?: string | null;
  inverter_image?: string | null;
  nm_sm_image?: string | null;
  loger_image?: string | null;
  contact_person?: string;
  contact_number?: string;
  inst_remarks?: string | null;
  inverter_make?: string;
  panel_make?: string;
  panel_wp?: number | string;
  panel_qty?: number | string;
  revised_load?: number | string;
  inst_claim1_status?: number;
  inst_claim2_status?: number;
  inst_claim3_status?: number;
  inst_pay1_status?: number;
  inst_pay2_status?: number;
  inst_pay3_status?: number;
  [key: string]: any;
}

export interface UpRescoClaimRecord {
  id: number;
  vendor_id?: number;
  vendor_name?: string;
  date?: string;
  amount: string | number;
  pay_type: number; // 1 = 1st, 2 = 2nd, 3 = 3rd
  claim_status: number; // 1 = Pending, 2 = Approved, 3 = Rejected
  pay_status: number; // 0 = Pending, 1 = Complete, 2 = Partially
  sites?: Array<{ id: number; site_name?: string; state?: string; district?: string; address?: string }>;
  remarks?: string | null;
  [key: string]: any;
}

export interface UpRescoClaimDetailsSummary {
  total: number;
  claim_approved: number;
  claim_pending: number;
  claim_reject: number;
}

export interface UpRescoPaymentRecord {
  id: number;
  vendor_id?: number;
  amount: string | number;
  pay_type?: number;
  pay_status: number; // 0 = Pending, 1 = Complete, 2 = Partially
  vendor_table_id?: number;
  vendor_name?: string;
  allpayment?: UpPaymentHistoryItem[];
  site_details?: Array<{ id: number; site_name?: string; [key: string]: any }>;
  [key: string]: any;
}

export interface UpRescoPanelItem {
  id: number;
  resco_id: number;
  panel_no?: string;
  panel_wp?: string | number;
  panel_make?: string;
  [key: string]: any;
}

export interface UpRescoBillReadingItem {
  id: number;
  bill_id?: number;
  reading_date?: string;
  start_reading?: string | number;
  end_reading?: string | number;
  unit_generated?: string | number;
  net_reading?: string | number;
  reading_image?: string | null;
  [key: string]: any;
}

export interface UpRescoBillRow {
  id: number;
  resco_id: number;
  bill_no?: string;
  bill_date?: string;
  amount?: string | number;
  verify_status: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  verify_remarks?: string | null;
  readings?: UpRescoBillReadingItem[];
  resco?: UpRescoSiteRow;
  [key: string]: any;
}

export interface UpRescoDashboardData {
  vol?: string[];
  resco: Record<string, number>;
  district_install?: Array<{ district: string; inst_complete?: number }>;
  districtwise?: Array<Record<string, any>>;
  vendorwises?: Array<Record<string, any>>;
  vendors?: Array<{ inst_vendor: number; vendor?: number; name?: string }>;
  vendor_installation_month?: Array<{ month_year: string; monthly_installations?: number }>;
  vendor_today_installation?: Array<{ inst_vendor: number; today_install?: number }>;
  vendor_year_installation?: Array<{ vendor_name: string; year_install?: number }>;
  loginId?: number;
  loginName?: string;
  company_id?: any;
  role?: string;
  state?: string;
  user_type?: any;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * UP RESCO INSTALLATION — ADMIN SERVICE (28 APIS)
 * Controller: App\Http\Controllers\admin\up\UPRescoInstallationController
 * ═══════════════════════════════════════════════════════════════════════════
 */
class UpRescoAdminService {
  private extractSiteRows(data: any): UpRescoSiteRow[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.resco)) return data.resco;
    if (Array.isArray(data.sites)) return data.sites;
    if (Array.isArray(data.verification)) return data.verification;
    if (Array.isArray(data.verified)) return data.verified;
    if (Array.isArray(data.records)) return data.records;
    if (Array.isArray(data.data)) return data.data;
    return [];
  }

  // 1. GET /up/resco/installation/assign
  async getAssignFormData(): Promise<{ vendors: UpVendorItem[]; volumes: string[] }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_API.ASSIGN_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to load Resco assign form data'
    );
    const data = json.data || json;
    const volumesRaw = Array.isArray(data?.volumes) ? data.volumes : [];
    const volumes: string[] = volumesRaw.map((v: any) =>
      typeof v === 'string' ? v : String(v?.volume ?? '')
    ).filter(Boolean);
    return {
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
      volumes,
    };
  }

  // 2. GET /up/resco/installation/fetch-district?volume=...
  async fetchDistricts(volume: string | number): Promise<Array<{ district: string }>> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_API.FETCH_DISTRICT_CANDIDATES(volume),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch districts for volume'
    );
    const data = json.data || json;
    if (!Array.isArray(data)) return [];
    return data.map((d: any) => ({
      district: typeof d === 'string' ? d : String(d?.district || ''),
    })).filter((d) => Boolean(d.district));
  }

  // 3. GET /up/resco/installation/fetch-site?volume=...&district=...
  async fetchSites(volume: string | number, district: string): Promise<Array<{ id: number; site_name: string }>> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_API.FETCH_SITE_CANDIDATES(volume, district),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch unassigned sites'
    );
    const data = json.data || json;
    if (!Array.isArray(data)) return [];
    return data.map((s: any) => ({
      id: Number(s.id),
      site_name: String(s.site_name || `Site #${s.id}`),
    }));
  }

  // 4. POST /up/resco/installation/store-assign (multipart/form-data)
  async storeAssign(payload: FormData | Record<string, any>): Promise<UpApiResponse> {
    let body: BodyInit;
    let headers: Record<string, string> = {};

    if (payload instanceof FormData) {
      body = payload;
      headers = buildHeaders(true);
    } else {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (k === 'site' && Array.isArray(v)) {
          v.forEach((siteId) => fd.append('site[]', String(siteId)));
        } else if (v instanceof File) {
          fd.append(k, v);
        } else {
          fd.append(k, String(v));
        }
      });
      body = fd;
      headers = buildHeaders(true);
    }

    return requestJsonWithFallback(
      UP_ADMIN_RESCO_API.STORE_ASSIGN_CANDIDATES(),
      { method: 'POST', headers, body },
      'Failed to store Resco installation assignment'
    );
  }

  // 5. GET /up/resco/installation/view-assign
  async getViewAssign(): Promise<{ assigns: UpRescoAssignRecord[]; detail: UpRescoDetailSummary }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_API.VIEW_ASSIGN_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to load Resco assigned installations'
    );
    const data = json.data || json;
    const assignsRaw = Array.isArray(data?.assigns) ? data.assigns : [];
    const d = data?.detail || {};
    return {
      assigns: assignsRaw.map((r: any) => ({
        ...r,
        id: Number(r.id),
        status: Number(r.status ?? 0),
        sitecount: Number(r.sitecount ?? r.site_count ?? (Array.isArray(r.sites) ? r.sites.length : 0)),
        sites: Array.isArray(r.sites) ? r.sites : [],
      })),
      detail: {
        total: Number(d.total ?? 0),
        assigned: Number(d.assigned ?? 0),
        not_assigned: Number(d.not_assigned ?? 0),
        complete: Number(d.complete ?? 0),
        pending: Number(d.pending ?? 0),
        verify_approved: Number(d.verify_approved ?? 0),
        verify_pending: Number(d.verify_pending ?? 0),
        verify_reject: Number(d.verify_reject ?? 0),
      },
    };
  }

  // 6. ANY /up/resco/installation/approval-assign/{id}
  async approvalAssign(id: number | string): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_RESCO_API.APPROVAL_ASSIGN_CANDIDATES(id),
      { method: 'POST', headers: buildHeaders() },
      'Failed to approve Resco installation assignment'
    );
  }

  // 7. GET /up/resco/installation/edit-assign/{id}
  async getEditAssign(id: number | string): Promise<{
    assign: any;
    vendors: UpVendorItem[];
    volumes: string[];
    districts: Array<{ district: string }>;
    sites: Array<{ id: number; site_name: string }>;
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_API.EDIT_ASSIGN_CANDIDATES(id),
      { method: 'GET', headers: buildHeaders() },
      'Failed to load Resco assign edit data'
    );
    const data = json.data || json;
    const volumesRaw = Array.isArray(data?.volumes) ? data.volumes : [];
    const volumes: string[] = volumesRaw.map((v: any) =>
      typeof v === 'string' ? v : String(v?.volume ?? '')
    ).filter(Boolean);
    return {
      assign: data?.assign || null,
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
      volumes,
      districts: Array.isArray(data?.districts) ? data.districts : [],
      sites: Array.isArray(data?.sites) ? data.sites : [],
    };
  }

  // 8. POST /up/resco/installation/update-assign/{id}
  async updateAssign(id: number | string, payload: FormData | Record<string, any>): Promise<UpApiResponse> {
    let body: BodyInit;
    let headers: Record<string, string> = {};

    if (payload instanceof FormData) {
      body = payload;
      headers = buildHeaders(true);
    } else {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (k === 'site' && Array.isArray(v)) {
          v.forEach((siteId) => fd.append('site[]', String(siteId)));
        } else if (v instanceof File) {
          fd.append(k, v);
        } else {
          fd.append(k, String(v));
        }
      });
      body = fd;
      headers = buildHeaders(true);
    }

    return requestJsonWithFallback(
      UP_ADMIN_RESCO_API.UPDATE_ASSIGN_CANDIDATES(id),
      { method: 'POST', headers, body },
      'Failed to update Resco installation assignment'
    );
  }

  // 9. GET /up/resco/installation/view-installation
  async getViewInstallation(): Promise<{
    detail: UpRescoDetailSummary;
    verify_pending: UpRescoSiteRow[];
    verify_complete: UpRescoSiteRow[];
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_API.VIEW_INSTALLATION_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch Resco installation verification data'
    );
    const data = json.data || json;
    const d = data?.detail || {};
    return {
      detail: {
        total: Number(d.total ?? 0),
        assigned: Number(d.assigned ?? 0),
        not_assigned: Number(d.not_assigned ?? 0),
        complete: Number(d.complete ?? 0),
        pending: Number(d.pending ?? 0),
        verify_approved: Number(d.verify_approved ?? 0),
        verify_pending: Number(d.verify_pending ?? 0),
        verify_reject: Number(d.verify_reject ?? 0),
      },
      verify_pending: Array.isArray(data?.verify_pending) ? data.verify_pending : [],
      verify_complete: Array.isArray(data?.verify_complete) ? data.verify_complete : [],
    };
  }

  // 10. POST /up/resco/installation/verify-status-installation
  async verifyInstallationStatus(payload: {
    id: number;
    status: 1 | 2; // 1 = Approved, 2 = Rejected
    inst_verify_remarks?: string;
  }): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_RESCO_API.VERIFY_INSTALLATION_STATUS_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify(payload) },
      'Failed to verify Resco installation status'
    );
  }

  // 11. GET /up/resco/installation/view-doc-installation
  async getViewDocInstallation(): Promise<{
    detail: UpRescoDetailSummary;
    verification: UpRescoSiteRow[];
    verified: UpRescoSiteRow[];
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_API.VIEW_DOC_INSTALLATION_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch Resco document verification data'
    );
    const data = json.data || json;
    const d = data?.detail || {};
    const normalizeDocSite = (s: any): UpRescoSiteRow => {
      const doc = s?.inst_doc_file || s?.inst_doc || s?.document_file || s?.doc_file || s?.document || null;
      return {
        ...s,
        inst_doc_file: doc,
        inst_doc: doc,
      };
    };
    return {
      detail: {
        total: Number(d.total ?? 0),
        assigned: Number(d.assigned ?? 0),
        not_assigned: Number(d.not_assigned ?? 0),
        complete: Number(d.complete ?? 0),
        pending: Number(d.pending ?? 0),
        doc_approved: Number(d.doc_approved ?? 0),
        doc_pending: Number(d.doc_pending ?? 0),
        doc_reject: Number(d.doc_reject ?? 0),
      },
      verification: Array.isArray(data?.verification) ? data.verification.map(normalizeDocSite) : [],
      verified: Array.isArray(data?.verified) ? data.verified.map(normalizeDocSite) : [],
    };
  }

  // 12. POST /up/resco/installation/verify-installation-doc-status
  async verifyInstallationDocStatus(payload: {
    id: number;
    status: 2 | 3; // 2 = Approved, 3 = Rejected
    remarks?: string;
  }): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_RESCO_API.VERIFY_INSTALLATION_DOC_STATUS_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify(payload) },
      'Failed to verify Resco document status'
    );
  }

  // 13. GET /up/resco/installation/view-claim
  async getViewClaim(): Promise<{
    claims: UpRescoClaimRecord[];
    claim_details: UpRescoClaimDetailsSummary;
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_API.VIEW_CLAIM_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch Resco installation claim data'
    );
    const data = json.data || json;
    const claimsRaw = Array.isArray(data?.claims) ? data.claims : [];
    const d = data?.claim_details || {};
    return {
      claims: claimsRaw.map((c: any) => ({
        ...c,
        id: Number(c.id),
        pay_type: Number(c.pay_type ?? 1),
        claim_status: Number(c.claim_status ?? 1),
        pay_status: Number(c.pay_status ?? 0),
        sites: Array.isArray(c.sites) ? c.sites : [],
      })),
      claim_details: {
        total: Number(d.total ?? 0),
        claim_approved: Number(d.claim_approved ?? 0),
        claim_pending: Number(d.claim_pending ?? 0),
        claim_reject: Number(d.claim_reject ?? 0),
      },
    };
  }

  // 14. ANY /up/resco/installation/verify-claim-status
  async verifyClaimStatus(payload: {
    id: number;
    status: 2 | 3; // 2 = Approved, 3 = Rejected
    remarks?: string;
  }): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_RESCO_API.VERIFY_CLAIM_STATUS_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify(payload) },
      'Failed to update Resco claim status'
    );
  }

  // 15. ANY /up/resco/installation/view-payment
  async getViewPayment(params?: {
    from_date?: string;
    to_date?: string;
    vendor?: string | number;
    status?: string | number;
  }): Promise<{
    payments: UpRescoPaymentRecord[];
    payment_detail: UpPaymentDetailSummary;
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_API.VIEW_PAYMENT_CANDIDATES(params),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch Resco payment data'
    );
    const data = json.data || json;
    const paymentsRaw = Array.isArray(data?.payments) ? data.payments : [];
    const d = data?.payment_detail || {};
    return {
      payments: paymentsRaw.map((p: any) => ({
        ...p,
        id: Number(p.id),
        pay_type: Number(p.pay_type ?? 1),
        pay_status: Number(p.pay_status ?? 0),
        allpayment: Array.isArray(p.allpayment) ? p.allpayment : [],
        site_details: Array.isArray(p.site_details) ? p.site_details : [],
      })),
      payment_detail: {
        total: Number(d.total ?? 0),
        complete: Number(d.complete ?? 0),
        partially: Number(d.partially ?? 0),
        pending: Number(d.pending ?? 0),
      },
    };
  }

  // 16. ANY /up/resco/installation/payment-update
  async updatePayment(payload: {
    id: number;
    amount: number | string;
    date: string;
    remarks?: string;
  }): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_RESCO_API.PAYMENT_UPDATE_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify(payload) },
      'Failed to update Resco payment'
    );
  }

  // 17. ANY /up/resco/installation/dashboard
  async getDashboard(volume?: string | number): Promise<UpRescoDashboardData> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_API.DASHBOARD_CANDIDATES(volume),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch Resco installation dashboard data'
    );
    const data = json.data || json;
    return {
      vol: Array.isArray(data?.vol) ? data.vol : [],
      resco: (data?.resco && typeof data.resco === 'object') ? data.resco : {},
      district_install: Array.isArray(data?.district_install) ? data.district_install : [],
      districtwise: Array.isArray(data?.districtwise) ? data.districtwise : [],
      vendorwises: Array.isArray(data?.vendorwises) ? data.vendorwises : [],
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
      vendor_installation_month: Array.isArray(data?.vendor_installation_month) ? data.vendor_installation_month : [],
      vendor_today_installation: Array.isArray(data?.vendor_today_installation) ? data.vendor_today_installation : [],
      vendor_year_installation: Array.isArray(data?.vendor_year_installation) ? data.vendor_year_installation : [],
      loginId: data?.loginId,
      loginName: data?.loginName,
      company_id: data?.company_id,
      role: data?.role,
      state: data?.state,
      user_type: data?.user_type,
    };
  }

  // 18. GET /up/resco/installation/view-dashboard/{status}/{volume?}
  async getViewDashboard(status: string, volume?: string | number): Promise<UpRescoSiteRow[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_API.VIEW_DASHBOARD_CANDIDATES(status, volume),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch Resco status register data'
    );
    const data = json.data || json;
    return this.extractSiteRows(data);
  }

  // 19. GET /up/resco/installation/vendor-view-dashboard/{status}/{inst_vendor}/{volume?}
  async getVendorwiseData(status: string, vendor: string | number, volume?: string | number): Promise<UpRescoSiteRow[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_API.VENDOR_VIEW_DASHBOARD_CANDIDATES(status, vendor, volume),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch vendor-wise Resco data'
    );
    const data = json.data || json;
    return this.extractSiteRows(data);
  }

  // 20. GET /up/resco/installation/district-view-dashboard/{status}/{district}/{volume?}
  async getDistrictwiseData(status: string, district: string, volume?: string | number): Promise<UpRescoSiteRow[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_API.DISTRICT_VIEW_DASHBOARD_CANDIDATES(status, district, volume),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch district-wise Resco data'
    );
    const data = json.data || json;
    return this.extractSiteRows(data);
  }

  // 21. GET /up/resco/installation/view-panel/{id}
  async getViewPanel(id: number | string): Promise<{ resco: UpRescoSiteRow | null; panels: UpRescoPanelItem[] }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_API.VIEW_PANEL_CANDIDATES(id),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch Resco panel details'
    );
    const data = json.data || json;
    return {
      resco: data?.resco || null,
      panels: Array.isArray(data?.panels) ? data.panels : [],
    };
  }

  // 22. GET /up/resco/installation/view-create-bill
  async getViewCreateBill(): Promise<UpRescoBillRow[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_API.VIEW_CREATE_BILL_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch Resco bills'
    );
    const data = json.data || json;
    const billsRaw = Array.isArray(data?.bills) ? data.bills : (Array.isArray(data) ? data : []);
    return billsRaw.map((b: any) => ({
      ...b,
      id: Number(b.id),
      resco_id: Number(b.resco_id),
      verify_status: Number(b.verify_status ?? 0),
      readings: Array.isArray(b.readings) ? b.readings : [],
      resco: b.resco || undefined,
    }));
  }

  // 23. GET /up/resco/installation/create-bill-approval/{id}
  async getCreateBillApproval(id: number | string): Promise<{ bill: UpRescoBillRow | null; resco: UpRescoSiteRow | null }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_API.CREATE_BILL_APPROVAL_CANDIDATES(id),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch Resco bill approval details'
    );
    const data = json.data || json;
    return {
      bill: data?.bill || null,
      resco: data?.resco || null,
    };
  }

  // 24. POST /up/resco/installation/bill-verify-status/{id}
  async billVerifyStatus(id: number | string, payload: {
    verify_status: 1 | 2; // 1 = Approve, 2 = Reject
    remarks?: string;
  }): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_RESCO_API.BILL_VERIFY_STATUS_CANDIDATES(id),
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify(payload) },
      'Failed to update Resco bill verify status'
    );
  }

  // 25. GET /up/resco/installation/view-assign-vendor
  async getViewAssignVendor(): Promise<{
    vendors: UpVendorItem[];
    srtRecords: Array<{ id: number; site_name: string; inst_vendor?: number; [key: string]: any }>;
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_API.VIEW_ASSIGN_VENDOR_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch vendor assignment desk data'
    );
    const data = json.data || json;
    return {
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
      srtRecords: Array.isArray(data?.srtRecords) ? data.srtRecords : [],
    };
  }

  // 26. GET /up/resco/installation/fetch-site-detail?srt_id=...
  async fetchSiteDetail(srtId: number | string): Promise<UpRescoSiteRow> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_API.FETCH_SITE_DETAIL_CANDIDATES(srtId),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch site detail'
    );
    const data = json.data || json;
    return data;
  }

  // 27. POST /up/resco/installation/install-store (multipart/form-data)
  async installStore(payload: FormData): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_RESCO_API.INSTALL_STORE_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(true), body: payload },
      'Failed to submit installation details'
    );
  }

  // 28. POST /up/resco/installation/update-view-site-name/{id}
  async updateViewSiteName(id: number | string, siteName: string): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_RESCO_API.UPDATE_VIEW_SITE_NAME_CANDIDATES(id),
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify({ site_name: siteName }) },
      'Failed to update site name'
    );
  }

  async editRescoSiteName(payload: { id: number | string; site_name: string }): Promise<UpApiResponse> {
    return this.updateViewSiteName(payload.id, payload.site_name);
  }
}

export const upSsl18wAdminService = new UpSsl18wAdminService();
export const upKusumCAdminService = new UpKusumCAdminService();
export const upRescoAdminService = new UpRescoAdminService();

/* ═══════════════════════════════════════════════════════════════════════════
 * UP RESCO SURVEY — TYPES & ADMIN SERVICE (17 APIS)
 * Controller: App\Http\Controllers\admin\up\UpRescoSurveyController
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface UpRescoSurveyAssignRecord {
  id: number;
  vendor: number;
  type?: string;
  purpose?: string;
  state?: string;
  volume: string;
  district: string;
  site_name: string; // JSON string e.g. "[801,802]" or comma-separated
  sitecount: number;
  assign_date?: string;
  file?: string | null;
  remarks?: string | null;
  vendors?: { id: number; name: string };
  sites?: Array<{ id: number; site_name: string }>;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface UpRescoSurveySummary {
  totalsite: number;
  assignsite: number;
  not_assign: number;
  complete_survey: number;
  pending_survey: number;
  survey_verify?: number;
  survey_verify_pending?: number;
  survey_verify_reject?: number;
  [key: string]: any;
}

export interface UpRescoSurveySiteRow {
  id: number;
  unique_id?: string;
  site_id?: number | string;
  site_name: string;
  vendor?: number | string;
  survey_vendor?: number | string;
  vendor_name?: string;
  vendors?: { id: number; name: string };
  state?: string;
  district?: string;
  division?: string;
  sub_division?: string;
  department?: string;
  dept_name?: string;
  location?: string;
  site_address?: string;
  ca_no?: string;
  survey_address?: string;
  nearest_landmark?: string;
  landmark?: string;
  agency_contact_person_name?: string;
  agency_person_name?: string;
  agency_contact_number?: string;
  agency_person_contact?: string;
  nodal_person?: string;
  nodal_person_contact?: string;
  contact_nodal?: string;
  survey_date?: string;
  latitude?: string | number;
  longitude?: string | number;
  load_type?: string;
  connection_phase?: string;
  meter_connection_type?: string;
  meter_connection?: string;
  meter_number?: string;
  meter_type?: string;
  sanction_load?: string | number;
  connected_load?: string | number;
  grid_power_availability?: string;
  grid_power?: string;
  three_phase_availability?: string;
  all_3_phase_ltdb?: string;
  missing_phase?: string;
  ltdb_present?: string;
  roof_condition?: string;
  total_roof_area?: string | number;
  area_roof?: string | number;
  free_space_for_solar?: string | number;
  free_space_solar?: string | number;
  free_space_for_control_room?: string | number;
  free_space_inverter?: string | number;
  earth_pit_position?: string;
  earth_pit?: string;
  age_of_building?: string | number;
  building_age?: string | number;
  access_to_roof?: string;
  roof_access?: string;
  rooftop_height?: string | number;
  parapet_height?: string | number;
  no_of_floors?: string | number;
  floors_number?: string | number;
  water_source_for_cleaning?: string;
  water_source?: string;
  access_to_site?: string;
  site_access?: string;
  distance_of_site_from_main_road?: string | number;
  site_distance?: string | number;
  building_image?: string | null;
  roof_image?: string | null;
  control_room_image?: string | null;
  meter_image?: string | null;
  image1?: string | null;
  image2?: string | null;
  image3?: string | null;
  image4?: string | null;
  image5?: string | null;
  other_image?: string | null;
  pdf?: string | null;
  pdf_file?: string | null;
  site_feasible?: string;
  survey_remarks?: string;
  survey_status?: number; // 0=pending, 1=done
  survey_verify_status?: number; // 0=pending, 1=approved, 2=rejected
  verify_status?: number;
  bos_status?: number | string;
  bos_verify_status?: number;
  bos_file?: string | null;
  bos_remarks?: string | null;
  bos_verify_remarks?: string | null;
  material_document?: string | null;
  material_date?: string | null;
  material_dispatch_by?: string | null;
  material_status?: number; // 0=pending, 1=done
  material_remarks?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface UpRescoSurveyDashboardData {
  survey_detail: {
    total: number;
    assigned: number;
    not_assigned: number;
    survey_done: number;
    survey_pending: number;
    survey_verify_pending: number;
    survey_verify_complete: number;
    survey_verify_reject: number;
  };
  districtwise: Array<{
    district: string;
    total: number;
    assigned: number;
    not_assigned: number;
    survey_done: number;
    survey_pending: number;
    survey_verify_pending: number;
    survey_verify_complete: number;
    survey_verify_reject: number;
  }>;
  vendor_wises: Array<{
    survey_vendor: string | number;
    vendor_name?: string;
    assigned: number;
    not_assigned: number;
    survey_done: number;
    survey_pending: number;
    survey_verify_pending: number;
    survey_verify_complete: number;
    survey_verify_reject: number;
  }>;
}

class UpRescoSurveyAdminService {
  // 1. GET /up/resco/survey/assign
  async getAssignFormData(): Promise<{
    vendors: UpVendorItem[];
    volumes: Array<{ volume: string | number }>;
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_SURVEY_API.ASSIGN_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to load Resco survey assign form data'
    );
    const data = json.data || json;
    return {
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
      volumes: Array.isArray(data?.volumes) ? data.volumes : [],
    };
  }

  // 2. GET /up/resco/survey/fetch-district?volume=...
  async fetchDistricts(volume: string | number): Promise<Array<{ district: string }>> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_SURVEY_API.FETCH_DISTRICT_CANDIDATES(volume),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch districts'
    );
    const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
    return list;
  }

  // 3. GET /up/resco/survey/fetch-site?volume=...&district=...
  async fetchSites(volume: string | number, district: string): Promise<Array<{ id: number; site_name: string; connected?: string; [key: string]: any }>> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_SURVEY_API.FETCH_SITE_CANDIDATES(volume, district),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch sites'
    );
    const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
    return list;
  }

  // 4. POST /up/resco/survey/store-assign-survey (multipart/form-data)
  async storeAssignSurvey(payload: FormData): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_RESCO_SURVEY_API.STORE_ASSIGN_SURVEY_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(true), body: payload },
      'Failed to assign survey'
    );
  }

  // 5. GET /up/resco/survey/view-assign-survey
  async getViewAssignSurvey(): Promise<{
    srtRecords: UpRescoSurveyAssignRecord[];
    resco: UpRescoSurveySummary;
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_SURVEY_API.VIEW_ASSIGN_SURVEY_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch assigned surveys'
    );
    const data = json.data || json;
    return {
      srtRecords: Array.isArray(data?.srtRecords) ? data.srtRecords : [],
      resco: data?.resco || { totalsite: 0, assignsite: 0, not_assign: 0, complete_survey: 0, pending_survey: 0 },
    };
  }

  // 6. GET /up/resco/survey/view-install-survey
  async getViewInstallSurvey(): Promise<{
    resco: UpRescoSurveySummary;
    pending: UpRescoSurveySiteRow[];
    verify: UpRescoSurveySiteRow[];
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_SURVEY_API.VIEW_INSTALL_SURVEY_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch installation survey verification data'
    );
    const data = json.data || json;
    return {
      resco: data?.resco || { assignsite: 0, complete_survey: 0, pending_survey: 0, survey_verify: 0, survey_verify_pending: 0, survey_verify_reject: 0 },
      pending: Array.isArray(data?.pending) ? data.pending : [],
      verify: Array.isArray(data?.verify) ? data.verify : [],
    };
  }

  // 7. ANY /up/resco/survey/verify-survey-status (params: id, status: 0 | 1 | 2)
  async verifySurveyStatus(id: number | string, status: number): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_RESCO_SURVEY_API.VERIFY_SURVEY_STATUS_CANDIDATES({ id, status }),
      {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ id: Number(id), status }),
      },
      'Failed to update survey verification status'
    );
  }

  // 8. POST /up/resco/survey/material-dispatch-status (multipart/form-data)
  async materialDispatchStatus(payload: FormData): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_RESCO_SURVEY_API.MATERIAL_DISPATCH_STATUS_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(true), body: payload },
      'Failed to update material dispatch status'
    );
  }

  // 9. POST /up/resco/survey/bos-status
  async bosStatus(id: number | string, bosVerifyRemarks?: string): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_RESCO_SURVEY_API.BOS_STATUS_CANDIDATES(),
      {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ id: Number(id), bos_verify_remarks: bosVerifyRemarks || '' }),
      },
      'Failed to update BOS status'
    );
  }

  // 10. GET /up/resco/survey/dashboard
  async getDashboard(): Promise<UpRescoSurveyDashboardData> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_SURVEY_API.DASHBOARD_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to load survey dashboard data'
    );
    const data = json.data || json;
    return {
      survey_detail: data?.survey_detail || {
        total: 0, assigned: 0, not_assigned: 0, survey_done: 0, survey_pending: 0,
        survey_verify_pending: 0, survey_verify_complete: 0, survey_verify_reject: 0,
      },
      districtwise: Array.isArray(data?.districtwise) ? data.districtwise : [],
      vendor_wises: Array.isArray(data?.vendor_wises) ? data.vendor_wises : [],
    };
  }

  // 11. GET /up/resco/survey/view-dashboard/{status?}
  async getViewDashboard(status?: string): Promise<UpRescoSurveySiteRow[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_SURVEY_API.VIEW_DASHBOARD_CANDIDATES(status),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch dashboard drilldown data'
    );
    const data = json.data || json;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.resco)) return data.resco;
    return [];
  }

  // 12. GET /up/resco/survey/vendor-wise/{status}/{vendor}
  async getVendorWise(status: string, vendor: string | number): Promise<UpRescoSurveySiteRow[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_SURVEY_API.VENDOR_WISE_CANDIDATES(status, vendor),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch vendor-wise survey data'
    );
    const data = json.data || json;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.resco)) return data.resco;
    return [];
  }

  // 13. GET /up/resco/survey/district-wise/{status}/{district}
  async getDistrictWise(status: string, district: string): Promise<UpRescoSurveySiteRow[]> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_SURVEY_API.DISTRICT_WISE_CANDIDATES(status, district),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch district-wise survey data'
    );
    const data = json.data || json;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.resco)) return data.resco;
    return [];
  }

  // 14. GET /up/resco/survey/assign-vendor
  async getAssignVendor(): Promise<{
    vendors: UpVendorItem[];
    srtRecords: UpRescoSurveySiteRow[];
    resco: UpRescoSurveySummary;
  }> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_SURVEY_API.ASSIGN_VENDOR_CANDIDATES(),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch survey assign vendor desk data'
    );
    const data = json.data || json;
    return {
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
      srtRecords: Array.isArray(data?.srtRecords) ? data.srtRecords : [],
      resco: data?.resco || { totalsite: 0, assignsite: 0, not_assign: 0, complete_survey: 0, pending_survey: 0 },
    };
  }

  // 15. GET /up/resco/survey/fetch-site-detail?srt_id=...
  async fetchSiteDetail(srtId: number | string): Promise<UpRescoSurveySiteRow> {
    const json = await requestJsonWithFallback<any>(
      UP_ADMIN_RESCO_SURVEY_API.FETCH_SITE_DETAIL_CANDIDATES(srtId),
      { method: 'GET', headers: buildHeaders() },
      'Failed to fetch survey site details'
    );
    const data = json.data || json;
    return data;
  }

  // 16. POST /up/resco/survey/store (multipart/form-data)
  async store(payload: FormData): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_RESCO_SURVEY_API.STORE_CANDIDATES(),
      { method: 'POST', headers: buildHeaders(true), body: payload },
      'Failed to submit survey details'
    );
  }

  // 17. POST /up/resco/survey/update-site-name/{id}
  async updateSiteName(id: number | string, siteName: string): Promise<UpApiResponse> {
    return requestJsonWithFallback(
      UP_ADMIN_RESCO_SURVEY_API.UPDATE_SITE_NAME_CANDIDATES(id),
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify({ site_name: siteName }) },
      'Failed to update site name'
    );
  }
}

export const upRescoSurveyAdminService = new UpRescoSurveyAdminService();
