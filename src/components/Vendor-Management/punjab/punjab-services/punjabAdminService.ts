import { API_BASE_URL, authService } from '../../../../services/authService';
import { PUNJAB_ADMIN_SSL_API } from '../../Vendor_Management_APIS/Punjab_Vendor_API';

/* ── Backend & Media Base URLs ── */
export const BACKEND_BASE = (API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

export const R2_BASE = (((import.meta as any).env?.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

export function getPunjabMediaCandidates(path?: string | null): string[] {
  if (!path || typeof path !== 'string') return [];
  const clean = path.trim();
  if (!clean) return [];

  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return [clean];
  }

  const normalized = clean.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  if (normalized.startsWith('uploads/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  } else if (normalized.startsWith('storage/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  }

  candidates.push(`${BACKEND_BASE}/uploads/punjab/installation/ssl/assign/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/punjab/installation/ssl/light/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/punjab/installation/ssl/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/punjab/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/punjab/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/ssl/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/punjab/installation/ssl/${filename}`);
    candidates.push(`${R2_BASE}/uploads/punjab/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }
  candidates.push(`https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev/${filename}`);

  return Array.from(new Set(candidates));
}

export function resolvePunjabMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getPunjabMediaCandidates(path);
  return candidates[0] || `${BACKEND_BASE}/${path.replace(/^\/+/, '')}`;
}

export type PunjabDashboardStatus =
  | 'total'
  | 'complete'
  | 'pending'
  | 'verify-pending'
  | 'verify-approved'
  | 'verify-reject'
  | 'claim-applicable'
  | 'claim-raised'
  | 'claim-approved'
  | 'claim-pending'
  | 'pay-done'
  | 'pay-pending';

export function normalizePunjabDashboardStatus(rawStatus: string): PunjabDashboardStatus {
  if (!rawStatus) return 'total';
  const clean = rawStatus.trim().toLowerCase();

  const exactMap: Record<string, PunjabDashboardStatus> = {
    total: 'total',
    all: 'total',
    allocated: 'total',
    complete: 'complete',
    completed: 'complete',
    'inst-complete': 'complete',
    installed: 'complete',
    pending: 'pending',
    'inst-pending': 'pending',
    'verify-pending': 'verify-pending',
    verifypending: 'verify-pending',
    'audit-pending': 'verify-pending',
    'verify-approved': 'verify-approved',
    verifyapproved: 'verify-approved',
    'verify-approve': 'verify-approved',
    approved: 'verify-approved',
    'verify-reject': 'verify-reject',
    verifyreject: 'verify-reject',
    rejected: 'verify-reject',
    'claim-applicable': 'claim-applicable',
    claimapplicable: 'claim-applicable',
    'claim-raised': 'claim-applicable',
    'claim-approved': 'claim-approved',
    claimapproved: 'claim-approved',
    'pay-done': 'pay-done',
    paydone: 'pay-done',
    'pay-complete': 'pay-done',
    'payment-done': 'pay-done',
    'payment-settled': 'pay-done',
    'pay-pending': 'pay-pending',
    'payment-pending': 'pay-pending',
  };

  return exactMap[clean] || 'total';
}

/* ═══════════════════ Type Definitions ═══════════════════ */

export interface VendorItem {
  id: number;
  name: string;
  state?: string;
  company_id?: number;
  email?: string;
  phone?: string;
}

export interface VolumeItem {
  volume: string;
}

export interface DistrictItem {
  district: string;
}

export interface BlockItem {
  block: string;
}

export interface PanchayatItem {
  panchayat: string;
  light_count?: number;
}

export interface AssignFormDataResponse {
  vendors: VendorItem[];
  volumes: VolumeItem[];
}

export interface AssignLightPayload {
  vendor: number | string;
  state: string;
  volume: string;
  district: string;
  block: string;
  panchayat: string[];
  ldate: string; // YYYY-MM-DD
  remark?: string;
}

export interface UpdateAssignPayload {
  id: number | string;
  vendor: number | string;
  state: string;
  volume: string;
  district: string;
  block: string;
  panchayat: string[];
  ldate: string;
  remark?: string;
}

export interface AssignLightRecord {
  id: number;
  company_id?: number;
  vendor: number | string;
  state?: string;
  volume?: string;
  district: string;
  block: string;
  panchayat: string | string[];
  ldate: string; // Deadline date
  created_at?: string;
  updated_at?: string;
  assign_date?: string;
  sitecount?: number;
  site_count?: number;
  remark?: string;
  status?: number; // 0 = Pending, 1 = Approved
  vendors?: {
    id: number;
    name: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface AssignSummaryCounts {
  claimedapplicable: number;
  approvedsite: number;
  verifypending: number;
  rejectsite: number;
  paymentsitecount: number;
  complete: number;
  totalsite: number;
  pendingsite: number;
}

export interface ViewAssignResponse {
  claimedapplicable: number;
  approvedsite: number;
  verifypending: number;
  rejectsite: number;
  paymentsitecount: number;
  complete: number;
  totalsite: number;
  pendingsite: number;
  assignedlight: AssignLightRecord[];
}

export interface EditAssignData {
  assignSsl?: {
    id: number;
    vendor: number;
    volume: string;
    district: string;
    block: string;
    panchayat: string[] | string;
    ldate: string;
    remark?: string;
    state?: string;
  };
  assignShl?: {
    id: number;
    vendor: number;
    volume: string;
    district: string;
    block: string;
    panchayat: string[] | string;
    ldate: string;
    remark?: string;
    state?: string;
  };
  vendor: VendorItem[];
  volumes: Array<string | { volume: string }>;
  districts: DistrictItem[];
  blocks: BlockItem[];
  panchayats: PanchayatItem[];
  loginId?: number;
  loginName?: string;
  company_id?: number;
  role?: string;
  state?: string;
}

export interface LightVerificationItem {
  id: number;
  uid?: string | number;
  unique_id?: string | number;
  company_id?: number | string;
  state?: string;
  phase?: string;
  volume?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  ward_no?: string | number;
  pole_no?: string | number;
  beneficiary_name?: string;
  beneficiary_contact?: string;
  contact_person?: string;
  contact_number?: string;
  sarpanch_name?: string;
  sarpanch_contact?: string;
  latitude?: string | number;
  longitude?: string | number;
  lat?: string | number;
  lng?: string | number;
  uuid_no?: string;
  light_no?: string;
  battery_no?: string;
  panel_no?: string;
  light_file?: string | null;
  file?: string;
  inst_file?: string;
  remark?: string;
  inst_remark?: string | null;
  inst_vendor?: number | string;
  vendor?: number | string;
  vendor_name?: string;
  vendors?: {
    id: number;
    name: string;
  };
  inst_status?: number;
  inst_verify_status?: number; // 0 = Pending / Completed, 1 = Approved, 2 = Rejected
  inst_verify_remarks?: string;
  inst_date?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface ViewInstallationResponse {
  summary: AssignSummaryCounts;
  verification: LightVerificationItem[];
  verified: {
    current_page: number;
    data: LightVerificationItem[];
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface VendorWiseItem {
  inst_vendor: number;
  vendor_name: string;
  light_count: number;
  site_assigned?: number;
  site_not_assigned?: number;
  today_install?: number;
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
}

export interface DistrictWiseItem {
  district: string;
  light_count: number;
  site_assigned?: number;
  site_not_assigned?: number;
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
}

export interface MonthInstallationItem {
  month_year: string;
  monthly_installations: number;
}

export interface TodayInstallationItem {
  inst_vendor: number;
  today_install: number;
  vendor_name: string;
}

export interface SslDashboardData {
  loginId?: number;
  loginName?: string;
  company_id?: number | string;
  role?: string;
  state?: string;
  vol?: string[];
  ssldatas: {
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
  };
  payment_amount: string | number;
  vendors?: Array<{ inst_vendor: number; vendor?: number; name: string }>;
  vendorswise?: VendorWiseItem[];
  districtwise?: DistrictWiseItem[];
  vendor_installation_month?: MonthInstallationItem[];
  vendor_today_installation?: TodayInstallationItem[];
}

export interface AdminApiResponse<T = any> {
  status?: boolean;
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  error?: string;
  vendors?: VendorItem[];
  volumes?: any[];
  districts?: DistrictItem[];
  blocks?: BlockItem[];
  panchayats?: PanchayatItem[];
  verification?: LightVerificationItem[];
  verified?: {
    current_page: number;
    data: LightVerificationItem[];
    per_page: number;
    total: number;
    last_page: number;
  };
}

/* ═══════════════════ Default Punjab Static Data ═══════════════════ */

export const PUNJAB_DISTRICTS: string[] = [
  'Amritsar',
  'Barnala',
  'Bathinda',
  'Faridkot',
  'Fatehgarh Sahib',
  'Fazilka',
  'Firozpur',
  'Gurdaspur',
  'Hoshiarpur',
  'Jalandhar',
  'Kapurthala',
  'Ludhiana',
  'Malerkotla',
  'Mansa',
  'Moga',
  'Muktsar',
  'Pathankot',
  'Patiala',
  'Rupnagar',
  'Sahibzada Ajit Singh Nagar',
  'Sangrur',
  'Shahid Bhagat Singh Nagar',
  'Tarn Taran',
];

export const EMPTY_PUNJAB_SUMMARY: AssignSummaryCounts = {
  totalsite: 0,
  complete: 0,
  pendingsite: 0,
  approvedsite: 0,
  rejectsite: 0,
  verifypending: 0,
  claimedapplicable: 0,
  paymentsitecount: 0,
};

export const DEFAULT_PUNJAB_SUMMARY: AssignSummaryCounts = EMPTY_PUNJAB_SUMMARY;

/* ═══════════════════ Service Class ═══════════════════ */

class PunjabAdminService {
  private getHeaders(): Record<string, string> {
    const token = authService.getToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async safeFetchJson<T = any>(
    primaryUrl: string,
    fallbackUrls: string[] = [],
    options: RequestInit = {}
  ): Promise<{ ok: boolean; status: number; data: T | null; rawText?: string }> {
    const allUrls = [primaryUrl, ...fallbackUrls].filter(Boolean);
    const token = authService.getToken();
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const incomingHeaders = (options.headers as Record<string, string>) || {};
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...incomingHeaders,
    };
    if (token && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // When sending FormData, NEVER specify Content-Type: the browser must set multipart/form-data with the boundary
    if (isFormData) {
      delete headers['Content-Type'];
      delete headers['content-type'];
    } else if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }

    const opts: RequestInit = {
      credentials: 'include',
      ...options,
      headers,
    };

    let lastStatus = 0;
    let lastText = '';

    for (const url of allUrls) {
      try {
        const res = await fetch(url, opts);
        lastStatus = res.status;
        const text = await res.text();
        lastText = text;

        if (res.ok) {
          try {
            const parsed = JSON.parse(text);
            return { ok: true, status: res.status, data: parsed, rawText: text };
          } catch {
            console.warn(`[PunjabAdminService] ${url} returned 200 but body is not JSON:`, text.slice(0, 150));
          }
        } else {
          console.warn(`[PunjabAdminService] ${url} returned status ${res.status}:`, text.slice(0, 150));
        }
      } catch (err) {
        console.warn(`[PunjabAdminService] Network error on ${url}:`, err);
      }
    }

    return { ok: false, status: lastStatus, data: null, rawText: lastText };
  }

  // ── 1. GET /assign (Dropdown Data: Vendors & Volumes) ──
  async getAssignFormData(): Promise<AssignFormDataResponse> {
    try {
      const res = await this.safeFetchJson<any>(
        PUNJAB_ADMIN_SSL_API.ASSIGN_FORM_DATA,
        [PUNJAB_ADMIN_SSL_API.ASSIGN_FORM_DATA_ROOT],
        { method: 'GET' }
      );
      if (res.ok && res.data) {
        const json = res.data;
        const dataObj = json.data || {};
        const rawVendors =
          json.vendors ||
          json.vendor ||
          dataObj.vendors ||
          dataObj.vendor ||
          (Array.isArray(json.data) ? json.data : []) ||
          [];

        const rawVolumes =
          json.volumes ||
          json.volume ||
          dataObj.volumes ||
          dataObj.volume ||
          [];

        let vendors: VendorItem[] = [];
        if (Array.isArray(rawVendors)) {
          vendors = rawVendors.map((v: any) =>
            typeof v === 'string' || typeof v === 'number'
              ? { id: Number(v) || 0, name: String(v) }
              : {
                  id: Number(v.id ?? v.vendor_id ?? v.inst_vendor ?? 0),
                  name: String(v.name ?? v.vendor_name ?? `Vendor ${v.id}`),
                  state: v.state,
                  company_id: v.company_id,
                  email: v.email,
                  phone: v.phone,
                }
          );
        } else if (rawVendors && typeof rawVendors === 'object') {
          // If returned as key-value map: { "142": "Vendor Name" }
          vendors = Object.entries(rawVendors).map(([id, name]) => ({
            id: Number(id) || 0,
            name: String(name),
          }));
        }

        let volumes: VolumeItem[] = [];
        if (Array.isArray(rawVolumes)) {
          volumes = rawVolumes.map((v: any) =>
            typeof v === 'string' || typeof v === 'number'
              ? { volume: String(v) }
              : { volume: String(v.volume ?? v.name ?? v.id ?? '') }
          );
        } else if (rawVolumes && typeof rawVolumes === 'object') {
          volumes = Object.values(rawVolumes).map((v: any) => ({
            volume: typeof v === 'string' ? v : String(v.volume ?? v),
          }));
        }

        // If assign endpoint returned empty vendors/volumes, fall back to live dashboard data
        if (vendors.length === 0 || volumes.length === 0) {
          try {
            const dash = await this.getDashboard();
            if (volumes.length === 0 && Array.isArray(dash.vol) && dash.vol.length > 0) {
              volumes = dash.vol.map((v) => ({ volume: String(v) }));
            }
            if (vendors.length === 0 && Array.isArray(dash.vendors) && dash.vendors.length > 0) {
              vendors = dash.vendors.map((v) => ({ id: v.inst_vendor, name: v.name }));
            }
          } catch {}
        }

        return {
          vendors,
          volumes,
        };
      }
    } catch (e) {
      console.warn('[PunjabAdminService] Failed to load assign form data:', e);
    }

    try {
      const dash = await this.getDashboard();
      const volumes = Array.isArray(dash.vol) ? dash.vol.map((v) => ({ volume: String(v) })) : [];
      const vendors = Array.isArray(dash.vendors) ? dash.vendors.map((v) => ({ id: v.inst_vendor, name: v.name })) : [];
      if (volumes.length > 0 || vendors.length > 0) {
        return { vendors, volumes };
      }
    } catch {}

    return {
      vendors: [],
      volumes: [],
    };
  }

  // ── 2. GET /fetch-district/{volume} ──
  async fetchDistricts(volume: string | number): Promise<DistrictItem[]> {
    const cleanVol = encodeURIComponent(String(volume).trim());
    try {
      const res = await this.safeFetchJson<any>(
        PUNJAB_ADMIN_SSL_API.FETCH_DISTRICT(volume),
        [
          PUNJAB_ADMIN_SSL_API.FETCH_DISTRICT_PATH_ONLY(volume),
          PUNJAB_ADMIN_SSL_API.FETCH_DISTRICT_ROOT(volume),
          PUNJAB_ADMIN_SSL_API.FETCH_DISTRICT_QUERY(volume),
          `${ADMIN_BASE_URL}/punjab/ssl/installation/fetch-district?volume=${cleanVol}&state=punjab`,
        ],
        { method: 'GET' }
      );
      if (res.ok && res.data) {
        const json = res.data;
        const dataObj = json && typeof json === 'object' ? json.data || json : {};
        let rawList: any[] = [];
        if (Array.isArray(json.districts)) rawList = json.districts;
        else if (Array.isArray(json.district)) rawList = json.district;
        else if (Array.isArray(dataObj.districts)) rawList = dataObj.districts;
        else if (Array.isArray(dataObj.district)) rawList = dataObj.district;
        else if (Array.isArray(dataObj.data)) rawList = dataObj.data;
        else if (Array.isArray(json.data)) rawList = json.data;
        else if (Array.isArray(json)) rawList = json;
        else if (dataObj.districts && typeof dataObj.districts === 'object') rawList = Object.values(dataObj.districts);
        else if (dataObj && typeof dataObj === 'object' && !Array.isArray(dataObj)) {
          rawList = Object.values(dataObj).filter((v) => typeof v === 'string' || (v && typeof v === 'object'));
        }

        const districts: DistrictItem[] = rawList
          .map((d: any) => {
            if (typeof d === 'string' || typeof d === 'number') return { district: String(d).trim() };
            return { district: String(d.district || d.district_name || d.name || d.label || '').trim() };
          })
          .filter((d: DistrictItem) => Boolean(d.district));

        if (districts.length > 0) {
          return districts;
        }
      }
    } catch (e) {
      console.warn('[PunjabAdminService] Failed to load districts:', e);
    }

    // Dynamic API fallback: Extract real districts from live dashboard API response
    try {
      const dash = await this.getDashboard();
      if (dash && Array.isArray(dash.districtwise) && dash.districtwise.length > 0) {
        const liveDistricts = Array.from(new Set(dash.districtwise.map((d) => d.district).filter(Boolean)));
        if (liveDistricts.length > 0) {
          return liveDistricts.map((d) => ({ district: d }));
        }
      }
    } catch (e) {
      console.warn('[PunjabAdminService] Fallback to dashboard districts failed:', e);
    }

    return [];
  }

  // ── 3. GET /fetch-block/{district} ──
  async fetchBlocks(volume: string | number, district: string): Promise<BlockItem[]> {
    try {
      const res = await this.safeFetchJson<any>(
        PUNJAB_ADMIN_SSL_API.FETCH_BLOCK(district, volume),
        [
          PUNJAB_ADMIN_SSL_API.FETCH_BLOCK_PATH_ONLY(district),
          PUNJAB_ADMIN_SSL_API.FETCH_BLOCK_TWO_PARAMS(volume, district),
          PUNJAB_ADMIN_SSL_API.FETCH_BLOCK_ROOT(district, volume),
        ],
        { method: 'GET' }
      );
      if (res.ok && res.data) {
        const json = res.data;
        const dataObj = json && typeof json === 'object' ? json.data || json : {};
        let rawList: any[] = [];
        if (Array.isArray(json.blocks)) rawList = json.blocks;
        else if (Array.isArray(json.block)) rawList = json.block;
        else if (Array.isArray(dataObj.blocks)) rawList = dataObj.blocks;
        else if (Array.isArray(dataObj.block)) rawList = dataObj.block;
        else if (Array.isArray(dataObj.data)) rawList = dataObj.data;
        else if (Array.isArray(json.data)) rawList = json.data;
        else if (Array.isArray(json)) rawList = json;
        else if (dataObj.blocks && typeof dataObj.blocks === 'object') rawList = Object.values(dataObj.blocks);
        else if (dataObj && typeof dataObj === 'object' && !Array.isArray(dataObj)) {
          rawList = Object.values(dataObj).filter((v) => typeof v === 'string' || (v && typeof v === 'object'));
        }

        const blocks: BlockItem[] = rawList
          .map((b: any) => {
            if (typeof b === 'string' || typeof b === 'number') return { block: String(b).trim() };
            return { block: String(b.block || b.block_name || b.name || b.label || '').trim() };
          })
          .filter((b: BlockItem) => Boolean(b.block));

        if (blocks.length > 0) {
          return blocks;
        }
      }
    } catch (e) {
      console.warn('[PunjabAdminService] Failed to load blocks:', e);
    }

    // Dynamic Live API fallback: Extract real assigned blocks for this district from view-assign
    try {
      const assignData = await this.getViewAssign();
      if (assignData && Array.isArray(assignData.assignedlight)) {
        const liveBlocks = Array.from(
          new Set(
            assignData.assignedlight
              .filter((a) => String(a.district || '').trim().toLowerCase() === String(district).trim().toLowerCase())
              .map((a) => String(a.block || '').trim())
              .filter(Boolean)
          )
        );
        if (liveBlocks.length > 0) {
          return liveBlocks.map((blk) => ({ block: blk }));
        }
      }
    } catch (e) {
      console.warn('[PunjabAdminService] Fallback to view-assign blocks failed:', e);
    }

    return [];
  }

  // ── 4. GET /fetch-panchayat/{block} ──
  async fetchPanchayats(volume: string | number, district: string, block: string): Promise<PanchayatItem[]> {
    try {
      const res = await this.safeFetchJson<any>(
        PUNJAB_ADMIN_SSL_API.FETCH_PANCHAYAT(block, volume, district),
        [
          PUNJAB_ADMIN_SSL_API.FETCH_PANCHAYAT_PATH_ONLY(block),
          PUNJAB_ADMIN_SSL_API.FETCH_PANCHAYAT_TWO_PARAMS(district, block),
          PUNJAB_ADMIN_SSL_API.FETCH_PANCHAYAT_ROOT(block, volume, district),
        ],
        { method: 'GET' }
      );
      if (res.ok && res.data) {
        const json = res.data;
        const dataObj = json && typeof json === 'object' ? json.data || json : {};
        let rawList: any[] = [];
        if (Array.isArray(json.panchayats)) rawList = json.panchayats;
        else if (Array.isArray(json.panchayat)) rawList = json.panchayat;
        else if (Array.isArray(dataObj.panchayats)) rawList = dataObj.panchayats;
        else if (Array.isArray(dataObj.panchayat)) rawList = dataObj.panchayat;
        else if (Array.isArray(dataObj.data)) rawList = dataObj.data;
        else if (Array.isArray(json.data)) rawList = json.data;
        else if (Array.isArray(json)) rawList = json;
        else if (dataObj.panchayats && typeof dataObj.panchayats === 'object') rawList = Object.values(dataObj.panchayats);
        else if (dataObj && typeof dataObj === 'object' && !Array.isArray(dataObj)) {
          rawList = Object.values(dataObj).filter((v) => typeof v === 'string' || (v && typeof v === 'object'));
        }

        const panchayats: PanchayatItem[] = rawList
          .map((p: any) => {
            if (typeof p === 'string' || typeof p === 'number') return { panchayat: String(p).trim(), light_count: 0 };
            return {
              panchayat: String(p.panchayat || p.panchayat_name || p.name || p.label || '').trim(),
              light_count: Number(p.light_count ?? p.count ?? p.unassigned_count ?? 0),
            };
          })
          .filter((p: PanchayatItem) => Boolean(p.panchayat));

        if (panchayats.length > 0) {
          return panchayats;
        }
      }
    } catch (e) {
      console.warn('[PunjabAdminService] Failed to load panchayats:', e);
    }

    // Dynamic Live API fallback: Extract real assigned panchayats for this block from view-assign
    try {
      const assignData = await this.getViewAssign();
      if (assignData && Array.isArray(assignData.assignedlight)) {
        const livePanchayats: string[] = [];
        assignData.assignedlight
          .filter(
            (a) =>
              String(a.district || '').trim().toLowerCase() === String(district).trim().toLowerCase() &&
              String(a.block || '').trim().toLowerCase() === String(block).trim().toLowerCase()
          )
          .forEach((a) => {
            if (Array.isArray(a.panchayat)) {
              a.panchayat.forEach((p) => livePanchayats.push(String(p).trim()));
            } else if (typeof a.panchayat === 'string') {
              try {
                const parsed = JSON.parse(a.panchayat);
                if (Array.isArray(parsed)) parsed.forEach((p) => livePanchayats.push(String(p).trim()));
                else livePanchayats.push(a.panchayat.trim());
              } catch {
                a.panchayat.split(',').forEach((p) => livePanchayats.push(p.trim()));
              }
            }
          });

        const uniquePanchayats = Array.from(new Set(livePanchayats.filter(Boolean)));
        if (uniquePanchayats.length > 0) {
          return uniquePanchayats.map((p) => ({ panchayat: p, light_count: 0 }));
        }
      }
    } catch (e) {
      console.warn('[PunjabAdminService] Fallback to view-assign panchayats failed:', e);
    }

    return [];
  }

  // ── 5. POST /store-assign ──
  async storeAssign(payload: AssignLightPayload | FormData): Promise<AdminApiResponse> {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const headers = this.getHeaders();
    if (isFormData) {
      delete headers['Content-Type'];
      delete headers['content-type'];
      if (!payload.has('state') || !payload.get('state')) {
        payload.set('state', 'punjab');
      }
    } else if (payload && typeof payload === 'object') {
      const p = payload as any;
      if (!p.state) {
        p.state = 'punjab';
      }
    }

    let res = await this.safeFetchJson<AdminApiResponse>(
      PUNJAB_ADMIN_SSL_API.STORE_ASSIGN,
      [PUNJAB_ADMIN_SSL_API.STORE_ASSIGN_ROOT],
      {
        method: 'POST',
        headers,
        body: isFormData ? payload : JSON.stringify(payload),
      }
    );

    // If FormData failed with 422/404/500 and no file is attached, retry with JSON payload
    if (!res.ok && isFormData && !payload.get('file')) {
      try {
        const jsonObj: Record<string, any> = {};
        const panchayats: string[] = [];
        payload.forEach((value, key) => {
          if (key === 'panchayat[]' || key === 'panchayat') {
            panchayats.push(String(value));
          } else {
            jsonObj[key] = value;
          }
        });
        if (panchayats.length > 0) {
          jsonObj['panchayat'] = panchayats;
        }
        jsonObj['state'] = 'punjab';

        const jsonHeaders = this.getHeaders();
        jsonHeaders['Content-Type'] = 'application/json';
        const retryRes = await this.safeFetchJson<AdminApiResponse>(
          PUNJAB_ADMIN_SSL_API.STORE_ASSIGN,
          [PUNJAB_ADMIN_SSL_API.STORE_ASSIGN_ROOT],
          {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(jsonObj),
          }
        );
        if (retryRes.ok) {
          res = retryRes;
        }
      } catch (retryErr) {
        console.warn('[PunjabAdminService] JSON retry failed:', retryErr);
      }
    }

    const json = res.data || {};
    if (!res.ok || json.success === false || json.status === false) {
      let msg = json.message || 'Failed to assign lights';
      if (json.errors && typeof json.errors === 'object') {
        const errLines = Object.values(json.errors)
          .flat()
          .map(String)
          .filter(Boolean);
        if (errLines.length > 0) {
          msg = `${msg}: ${errLines.join(' ')}`;
        }
      }
      const err: any = new Error(msg);
      err.errors = json.errors;
      throw err;
    }
    return json;
  }

  // ── 6. GET /edit-assign/{id} ──
  async getEditAssign(id: string | number): Promise<EditAssignData> {
    const res = await this.safeFetchJson<any>(
      PUNJAB_ADMIN_SSL_API.EDIT_ASSIGN(id),
      [PUNJAB_ADMIN_SSL_API.EDIT_ASSIGN_ROOT(id)],
      { method: 'GET' }
    );
    if (!res.ok || !res.data) throw new Error(`Failed to load assignment details (${res.status})`);
    const json = res.data;
    return json.data || json;
  }

  // ── 7. POST /update-assign ──
  async updateAssign(payload: UpdateAssignPayload | FormData): Promise<AdminApiResponse> {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const headers = this.getHeaders();
    let assignId: string | number | undefined;

    if (isFormData) {
      delete headers['Content-Type'];
      delete headers['content-type'];
      if (!payload.has('state') || !payload.get('state')) {
        payload.set('state', 'punjab');
      }
      assignId = (payload.get('id') as string) || undefined;
    } else if (payload && typeof payload === 'object') {
      const p = payload as any;
      if (!p.state) {
        p.state = 'punjab';
      }
      assignId = p.id;
    }

    const primaryUrl = assignId
      ? PUNJAB_ADMIN_SSL_API.UPDATE_ASSIGN(assignId)
      : PUNJAB_ADMIN_SSL_API.UPDATE_ASSIGN_BASE;
    const fallbacks = [
      assignId ? PUNJAB_ADMIN_SSL_API.UPDATE_ASSIGN_ROOT(assignId) : '',
      PUNJAB_ADMIN_SSL_API.UPDATE_ASSIGN_BASE,
      PUNJAB_ADMIN_SSL_API.UPDATE_ASSIGN_WITH_ID_ROOT(assignId || ''),
    ].filter(Boolean);

    let res = await this.safeFetchJson<AdminApiResponse>(
      primaryUrl,
      fallbacks,
      {
        method: 'POST',
        headers,
        body: isFormData ? payload : JSON.stringify(payload),
      }
    );

    // If FormData failed and no file is attached, retry with JSON payload
    if (!res.ok && isFormData && !payload.get('file')) {
      try {
        const jsonObj: Record<string, any> = {};
        const panchayats: string[] = [];
        payload.forEach((value, key) => {
          if (key === 'panchayat[]' || key === 'panchayat') {
            panchayats.push(String(value));
          } else {
            jsonObj[key] = value;
          }
        });
        if (panchayats.length > 0) {
          jsonObj['panchayat'] = panchayats;
        }
        jsonObj['state'] = 'punjab';

        const jsonHeaders = this.getHeaders();
        jsonHeaders['Content-Type'] = 'application/json';
        const retryRes = await this.safeFetchJson<AdminApiResponse>(
          primaryUrl,
          fallbacks,
          {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(jsonObj),
          }
        );
        if (retryRes.ok) {
          res = retryRes;
        }
      } catch (retryErr) {
        console.warn('[PunjabAdminService] JSON update retry failed:', retryErr);
      }
    }

    const json = res.data || {};
    if (!res.ok || json.success === false || json.status === false) {
      let msg = json.message || 'Failed to update assignment';
      if (json.errors && typeof json.errors === 'object') {
        const errLines = Object.values(json.errors)
          .flat()
          .map(String)
          .filter(Boolean);
        if (errLines.length > 0) {
          msg = `${msg}: ${errLines.join(' ')}`;
        }
      }
      const err: any = new Error(msg);
      err.errors = json.errors;
      throw err;
    }
    return json;
  }

  // ── 8. GET /view-assign ──
  async getViewAssign(): Promise<ViewAssignResponse> {
    try {
      const res = await this.safeFetchJson<any>(
        PUNJAB_ADMIN_SSL_API.VIEW_ASSIGN,
        [PUNJAB_ADMIN_SSL_API.VIEW_ASSIGN_ROOT],
        { method: 'GET' }
      );
      if (res.ok && res.data) {
        const json = res.data;
        const dataObj = json.data || {};
        const root = typeof json === 'object' && !Array.isArray(json) ? json : {};
        const data = typeof dataObj === 'object' && !Array.isArray(dataObj) ? dataObj : {};
        const merged = { ...root, ...data };

        const rawList =
          (Array.isArray(root.assignedlights) && root.assignedlights) ||
          (Array.isArray(data.assignedlights) && data.assignedlights) ||
          (Array.isArray(root.assignedlight) && root.assignedlight) ||
          (Array.isArray(data.assignedlight) && data.assignedlight) ||
          (Array.isArray(root.assigned_light) && root.assigned_light) ||
          (Array.isArray(data.assigned_light) && data.assigned_light) ||
          (Array.isArray(root.assignedLight) && root.assignedLight) ||
          (Array.isArray(data.assignedLight) && data.assignedLight) ||
          (Array.isArray(root.assigned) && root.assigned) ||
          (Array.isArray(data.assigned) && data.assigned) ||
          (Array.isArray(root.assign) && root.assign) ||
          (Array.isArray(data.assign) && data.assign) ||
          (Array.isArray(root.assigns) && root.assigns) ||
          (Array.isArray(data.assigns) && data.assigns) ||
          (Array.isArray(json.data) && json.data) ||
          (Array.isArray(json) && json) ||
          [];

        return {
          claimedapplicable: Number(merged.claimedapplicable ?? merged.claim_applicable ?? 0),
          approvedsite: Number(merged.approvedlight ?? merged.approvedsite ?? merged.verify_approved ?? merged.approved ?? 0),
          verifypending: Number(merged.verifypending ?? merged.verify_pending ?? 0),
          rejectsite: Number(merged.rejectlight ?? merged.rejectsite ?? merged.verify_reject ?? merged.rejected ?? 0),
          paymentsitecount: Number(merged.paymentlightcount ?? merged.paymentsitecount ?? merged.payment_done ?? merged.inst_pay_done ?? 0),
          complete: Number(merged.complete ?? merged.completed ?? merged.inst_complete ?? 0),
          totalsite: Number(merged.totallight ?? merged.totalsite ?? merged.site_count ?? merged.total ?? rawList.length),
          pendingsite: Number(merged.pendinglight ?? merged.pendingsite ?? merged.pending ?? merged.inst_pending ?? 0),
          assignedlight: rawList,
        };
      }
    } catch (e) {
      console.warn('[PunjabAdminService] Failed to load view assign data:', e);
    }

    return {
      ...EMPTY_PUNJAB_SUMMARY,
      assignedlight: [],
    };
  }

  // ── 9. POST /approval-assign/{id} ──
  async approveAssign(id: string | number): Promise<AdminApiResponse> {
    const res = await this.safeFetchJson<AdminApiResponse>(
      PUNJAB_ADMIN_SSL_API.APPROVE_ASSIGN(id),
      [
        PUNJAB_ADMIN_SSL_API.APPROVE_ASSIGN_ROOT(id),
        PUNJAB_ADMIN_SSL_API.APPROVE_ASSIGN_LEGACY(id),
        PUNJAB_ADMIN_SSL_API.APPROVE_ASSIGN_LEGACY_ROOT(id),
      ],
      { method: 'POST' }
    );
    const json = res.data || {};
    if (!res.ok || json.success === false || json.status === false) {
      throw new Error(json.message || 'Failed to approve assignment');
    }
    return json;
  }

  // ── 9b. GET /vendor-wise-details/{id} ──
  async getVendorWiseDetails(id: string | number): Promise<AdminApiResponse> {
    const res = await this.safeFetchJson<any>(
      PUNJAB_ADMIN_SSL_API.VENDOR_WISE_DETAILS(id),
      [PUNJAB_ADMIN_SSL_API.VENDOR_WISE_DETAILS_ROOT(id)],
      { method: 'GET' }
    );
    if (!res.ok || !res.data) throw new Error(`Failed to load vendor details (${res.status})`);
    return res.data;
  }

  // ── 10. GET /view-installation (?page=1) ──
  async getViewInstallation(page?: number): Promise<ViewInstallationResponse> {
    try {
      const res = await this.safeFetchJson<any>(
        PUNJAB_ADMIN_SSL_API.VIEW_INSTALLATION(page),
        [PUNJAB_ADMIN_SSL_API.VIEW_INSTALLATION_ROOT(page)],
        { method: 'GET' }
      );
      if (res.ok && res.data) {
        const json = res.data;
        const dataObj = json.data || {};
        const root = typeof json === 'object' && !Array.isArray(json) ? json : {};
        const data = typeof dataObj === 'object' && !Array.isArray(dataObj) ? dataObj : {};
        const merged = { ...root, ...data };

        const summary: AssignSummaryCounts = {
          claimedapplicable: Number(merged.claimedapplicable ?? merged.claim_applicable ?? merged.summary?.claimedapplicable ?? 0),
          approvedsite: Number(merged.approvedlight ?? merged.approvedsite ?? merged.verify_approved ?? merged.approved ?? merged.summary?.approvedsite ?? 0),
          verifypending: Number(merged.verifypending ?? merged.verify_pending ?? merged.summary?.verifypending ?? 0),
          rejectsite: Number(merged.rejectlight ?? merged.rejectsite ?? merged.verify_reject ?? merged.rejected ?? merged.summary?.rejectsite ?? 0),
          paymentsitecount: Number(merged.paymentlightcount ?? merged.paymentsitecount ?? merged.payment_done ?? merged.inst_pay_done ?? merged.summary?.paymentsitecount ?? 0),
          complete: Number(merged.complete ?? merged.completed ?? merged.inst_complete ?? merged.summary?.complete ?? 0),
          totalsite: Number(merged.totallight ?? merged.totalsite ?? merged.site_count ?? merged.total ?? merged.summary?.totalsite ?? 0),
          pendingsite: Number(merged.pendinglight ?? merged.pendingsite ?? merged.pending ?? merged.inst_pending ?? merged.summary?.pendingsite ?? 0),
        };

        const verification =
          (Array.isArray(root.verification) && root.verification) ||
          (Array.isArray(data.verification) && data.verification) ||
          (Array.isArray(root.verify_pending) && root.verify_pending) ||
          (Array.isArray(data.verify_pending) && data.verify_pending) ||
          (Array.isArray(root.pending) && root.pending) ||
          (Array.isArray(data.pending) && data.pending) ||
          [];

        let verifiedObj = root.verified || data.verified || root.verify_complete || data.verify_complete;
        let verified: ViewInstallationResponse['verified'] = {
          current_page: 1,
          data: [],
          per_page: 10,
          total: 0,
          last_page: 1,
        };

        if (verifiedObj) {
          if (Array.isArray(verifiedObj)) {
            verified = {
              current_page: 1,
              data: verifiedObj,
              per_page: verifiedObj.length || 10,
              total: verifiedObj.length,
              last_page: 1,
            };
          } else if (Array.isArray(verifiedObj.data)) {
            verified = {
              current_page: Number(verifiedObj.current_page ?? 1),
              data: verifiedObj.data,
              per_page: Number(verifiedObj.per_page ?? 10),
              total: Number(verifiedObj.total ?? verifiedObj.data.length),
              last_page: Number(verifiedObj.last_page ?? 1),
            };
          }
        }

        return {
          summary,
          verification,
          verified,
        };
      }
    } catch (e) {
      console.warn('[PunjabAdminService] Failed to load installation verification data:', e);
    }

    return {
      summary: EMPTY_PUNJAB_SUMMARY,
      verification: [],
      verified: {
        current_page: 1,
        data: [],
        per_page: 10,
        total: 0,
        last_page: 1,
      },
    };
  }

  // ── 11. POST /verify-installation-status ──
  async verifyInstallationStatus(id: number, status: 1 | 2, remark?: string): Promise<AdminApiResponse> {
    const payload: Record<string, any> = { id, status };
    if (remark) {
      payload.remark = remark;
      payload.inst_verify_remarks = remark;
    }
    const res = await this.safeFetchJson<AdminApiResponse>(
      PUNJAB_ADMIN_SSL_API.VERIFY_INSTALLATION_STATUS,
      [PUNJAB_ADMIN_SSL_API.VERIFY_INSTALLATION_STATUS_ROOT],
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    const json = res.data || {};
    if (!res.ok || json.success === false || json.status === false) {
      throw new Error(json.message || 'Failed to update verification status');
    }
    return json;
  }

  // ── 12. GET /dashboard ──
  async getDashboard(): Promise<SslDashboardData> {
    try {
      const res = await this.safeFetchJson<any>(
        PUNJAB_ADMIN_SSL_API.DASHBOARD,
        [PUNJAB_ADMIN_SSL_API.DASHBOARD_ROOT],
        { method: 'GET' }
      );
      if (res.ok && res.data) {
        const json = res.data;
        const dataObj = json.data || {};
        const root = typeof json === 'object' && !Array.isArray(json) ? json : {};
        const data = typeof dataObj === 'object' && !Array.isArray(dataObj) ? dataObj : {};
        const merged = { ...root, ...data };

        const rawSsl =
          merged.ssldatas ||
          merged.shldatas ||
          merged.ssl ||
          merged.stats ||
          merged.summary ||
          {};

        const ssldatas: SslDashboardData['ssldatas'] = {
          site_count: Number(rawSsl.light_count ?? rawSsl.site_count ?? rawSsl.totallight ?? rawSsl.total ?? rawSsl.sitecount ?? merged.site_count ?? merged.totalsite ?? 0),
          site_assigned: Number(rawSsl.site_assigned ?? rawSsl.assigned ?? rawSsl.assign ?? rawSsl.assigned_site ?? merged.site_assigned ?? 0),
          site_not_assigned: Number(rawSsl.site_not_assigned ?? rawSsl.not_assigned ?? merged.site_not_assigned ?? 0),
          complete: Number(rawSsl.complete ?? rawSsl.completed ?? rawSsl.inst_complete ?? merged.complete ?? 0),
          pending: Number(rawSsl.pending ?? rawSsl.pendingsite ?? rawSsl.inst_pending ?? merged.pending ?? 0),
          verify_pending: Number(rawSsl.verify_pending ?? rawSsl.verifypending ?? merged.verify_pending ?? 0),
          verify_approved: Number(rawSsl.verify_approved ?? rawSsl.approvedsite ?? rawSsl.approved ?? rawSsl.verifyapproved ?? merged.verify_approved ?? 0),
          verify_reject: Number(rawSsl.verify_reject ?? rawSsl.rejectsite ?? rawSsl.rejected ?? rawSsl.verifyreject ?? merged.verify_reject ?? 0),
          claim_applicable: Number(rawSsl.claim_applicable ?? rawSsl.claimedapplicable ?? merged.claim_applicable ?? 0),
          claim_raised: Number(rawSsl.claim_raised ?? rawSsl.claimraised ?? merged.claim_raised ?? 0),
          claim_approved: Number(rawSsl.claim_approved ?? rawSsl.claimapproved ?? merged.claim_approved ?? 0),
          claim_pending: Number(rawSsl.claim_pending ?? rawSsl.claimpending ?? merged.claim_pending ?? 0),
          inst_pay_done: Number(rawSsl.inst_pay_done ?? rawSsl.paymentsitecount ?? rawSsl.payment_done ?? rawSsl.pay_done ?? merged.inst_pay_done ?? 0),
          inst_pay_pending: Number(rawSsl.inst_pay_pending ?? rawSsl.payment_pending ?? rawSsl.pay_pending ?? merged.inst_pay_pending ?? 0),
        };

        const rawVendorsList = Array.isArray(merged.vendors) ? merged.vendors : (Array.isArray(merged.vendor) ? merged.vendor : []);
        const vendorLookup: Record<string, string> = {};
        rawVendorsList.forEach((v: any) => {
          const vid = v.inst_vendor ?? v.vendor ?? v.id;
          const vname = v.name ?? v.vendor_name;
          if (vid && vname) {
            vendorLookup[String(vid).trim()] = String(vname).trim();
          }
        });

        // Map today's installation per vendor
        const rawTodayList = Array.isArray(merged.vendor_today_installation)
          ? merged.vendor_today_installation
          : (Array.isArray(merged.today_installation) ? merged.today_installation : []);
        const todayInstallLookup: Record<string, number> = {};
        rawTodayList.forEach((t: any) => {
          const vid = t.inst_vendor ?? t.vendor ?? t.id;
          if (vid !== undefined) {
            todayInstallLookup[String(vid)] = Number(t.today_install ?? 0);
          }
        });

        const rawVendorsWise = Array.isArray(merged.vendorswise) ? merged.vendorswise : (Array.isArray(merged.vendorwise) ? merged.vendorwise : []);
        const vendorswise: VendorWiseItem[] = rawVendorsWise.map((v: any) => {
          const vId = Number(v.inst_vendor ?? v.vendor ?? v.id ?? 0);
          return {
            inst_vendor: vId,
            vendor_name: String(v.vendor_name || v.name || vendorLookup[String(vId)] || `Vendor ${vId || ''}`),
            light_count: Number(v.light_count ?? v.site_assigned ?? v.allocated ?? 0),
            site_assigned: Number(v.site_assigned ?? (v.site_not_assigned !== undefined ? (Number(v.light_count ?? 0) - Number(v.site_not_assigned ?? 0)) : (v.light_count ?? 0))),
            site_not_assigned: Number(v.site_not_assigned ?? 0),
            today_install: todayInstallLookup[String(vId)] ?? Number(v.today_install ?? 0),
            inst_complete: Number(v.complete ?? v.inst_complete ?? v.completed ?? 0),
            inst_pending: Number(v.pending ?? v.inst_pending ?? 0),
            verify_pending: Number(v.verify_pending ?? v.verifypending ?? 0),
            verify_approved: Number(v.verify_approved ?? v.approved ?? 0),
            verify_reject: Number(v.verify_reject ?? v.reject ?? v.claim_reject ?? 0),
            claim_raised: Number(v.claim_raised ?? 0),
            claim_approved: Number(v.claim_approved ?? 0),
            claim_reject: Number(v.claim_reject ?? 0),
            payment_pending: Number(v.inst_pay_pending ?? v.payment_pending ?? 0),
            payment_done: Number(v.inst_pay_done ?? v.payment_done ?? 0),
          };
        });

        const rawDistrictWise = Array.isArray(merged.districtwise) ? merged.districtwise : (Array.isArray(merged.district_wise) ? merged.district_wise : []);
        const districtwise: DistrictWiseItem[] = rawDistrictWise.map((d: any) => ({
          district: String(d.district || d.name || 'Unknown'),
          light_count: Number(d.light_count ?? d.site_assigned ?? d.allocated ?? 0),
          site_assigned: Number(d.site_assigned ?? (d.site_not_assigned !== undefined ? (Number(d.light_count ?? 0) - Number(d.site_not_assigned ?? 0)) : (d.light_count ?? 0))),
          site_not_assigned: Number(d.site_not_assigned ?? 0),
          inst_complete: Number(d.complete ?? d.inst_complete ?? d.completed ?? 0),
          inst_pending: Number(d.pending ?? d.inst_pending ?? 0),
          verify_pending: Number(d.verify_pending ?? d.verifypending ?? 0),
          verify_approved: Number(d.verify_approved ?? d.approved ?? 0),
          verify_reject: Number(d.verify_reject ?? d.reject ?? 0),
          claim_raised: Number(d.claim_raised ?? 0),
          claim_approved: Number(d.claim_approved ?? 0),
          claim_reject: Number(d.claim_reject ?? 0),
          payment_pending: Number(d.inst_pay_pending ?? d.payment_pending ?? 0),
          payment_done: Number(d.inst_pay_done ?? d.payment_done ?? 0),
        }));

        const rawMonthly = Array.isArray(merged.vendor_installation_month)
          ? merged.vendor_installation_month
          : (Array.isArray(merged.month_installation) ? merged.month_installation : []);
        // Sort chronologically ascending
        const vendor_installation_month = [...rawMonthly].sort((a: any, b: any) =>
          String(a.month_year || '').localeCompare(String(b.month_year || ''))
        );

        const vendor_today_installation: TodayInstallationItem[] = rawTodayList.map((t: any) => {
          const vid = Number(t.inst_vendor ?? t.vendor ?? t.id ?? 0);
          return {
            inst_vendor: vid,
            today_install: Number(t.today_install ?? t.install ?? 0),
            vendor_name: String(t.vendor_name || t.name || vendorLookup[String(vid)] || `Vendor ${vid || ''}`),
          };
        });

        return {
          loginId: merged.loginId,
          loginName: merged.loginName,
          company_id: merged.company_id,
          role: merged.role,
          state: merged.state || 'Punjab',
          vol: Array.isArray(merged.vol) ? merged.vol.map(String) : [],
          ssldatas,
          payment_amount: merged.payment_amount ?? 0,
          vendors: rawVendorsList,
          vendorswise,
          districtwise,
          vendor_installation_month,
          vendor_today_installation,
        };
      }
    } catch (e) {
      console.warn('[PunjabAdminService] Failed to load dashboard data:', e);
    }

    return {
      state: 'Punjab',
      ssldatas: {
        site_count: 0,
        site_assigned: 0,
        site_not_assigned: 0,
        complete: 0,
        pending: 0,
        verify_pending: 0,
        verify_approved: 0,
        verify_reject: 0,
        claim_applicable: 0,
        claim_raised: 0,
        claim_approved: 0,
        claim_pending: 0,
        inst_pay_done: 0,
        inst_pay_pending: 0,
      },
      payment_amount: 0,
      vendors: [],
      vendorswise: [],
      districtwise: [],
      vendor_installation_month: [],
      vendor_today_installation: [],
    };
  }

  // ── 14. GET /view-dashboard/{status?}/{volume?} ──
  async getViewDashboard(status?: string, volume?: string | number): Promise<LightVerificationItem[]> {
    try {
      const res = await this.safeFetchJson<any>(
        PUNJAB_ADMIN_SSL_API.VIEW_DASHBOARD(status, volume),
        [
          PUNJAB_ADMIN_SSL_API.VIEW_DASHBOARD_ROOT(status, volume),
          status ? PUNJAB_ADMIN_SSL_API.DASHBOARD_BY_STATUS(status, volume) : '',
          status ? PUNJAB_ADMIN_SSL_API.DASHBOARD_BY_STATUS_ROOT(status, volume) : '',
        ].filter(Boolean),
        { method: 'GET' }
      );
      if (res.ok && res.data) {
        const json = res.data;
        const dataObj = json.data || {};
        const list =
          json.ssl ||
          dataObj.ssl ||
          json.shl ||
          dataObj.shl ||
          json.lights ||
          dataObj.lights ||
          json.installations ||
          dataObj.installations ||
          (Array.isArray(json.data) ? json.data : null) ||
          (Array.isArray(dataObj) ? dataObj : null) ||
          (Array.isArray(json) ? json : null) ||
          [];
        return Array.isArray(list) ? list : [];
      }
    } catch (e) {
      console.warn('[PunjabAdminService] Failed to load dashboard lights for status:', status, e);
    }
    return [];
  }

  // ── 15. GET /vendorwise-view-data/{status}/{volume?}/{vendor} ──
  async getVendorWiseData(status: string, vendor: string | number, volume?: string | number): Promise<LightVerificationItem[]> {
    try {
      const res = await this.safeFetchJson<any>(
        PUNJAB_ADMIN_SSL_API.VENDORWISE_VIEW_DATA(status, vendor, volume),
        [
          PUNJAB_ADMIN_SSL_API.VENDORWISE_VIEW_DATA_ROOT(status, vendor, volume),
          // Fallback without volume param
          `${ADMIN_BASE_URL}/punjab/ssl/installation/vendorwise-view-data/${encodeURIComponent(status)}/${encodeURIComponent(String(vendor))}`,
          `${BASE_URL}/punjab/ssl/installation/vendorwise-view-data/${encodeURIComponent(status)}/${encodeURIComponent(String(vendor))}`,
        ],
        { method: 'GET' }
      );
      if (res.ok && res.data) {
        const json = res.data;
        const dataObj = json.data || {};
        const list =
          json.ssl ||
          dataObj.ssl ||
          json.shl ||
          dataObj.shl ||
          json.vendor_data ||
          dataObj.vendor_data ||
          json.lights ||
          dataObj.lights ||
          (Array.isArray(json.data) ? json.data : null) ||
          (Array.isArray(dataObj) ? dataObj : null) ||
          (Array.isArray(json) ? json : null) ||
          [];
        return Array.isArray(list) ? list : [];
      }
    } catch (e) {
      console.warn('[PunjabAdminService] Failed to load vendor lights:', vendor, e);
    }
    return [];
  }

  // ── 16. GET /districtwise-view-data/{status}/{volume?}/{district} ──
  async getDistrictWiseData(status: string, district: string, volume?: string | number): Promise<LightVerificationItem[]> {
    try {
      const res = await this.safeFetchJson<any>(
        PUNJAB_ADMIN_SSL_API.DISTRICTWISE_VIEW_DATA(status, district, volume),
        [
          PUNJAB_ADMIN_SSL_API.DISTRICTWISE_VIEW_DATA_ROOT(status, district, volume),
          PUNJAB_ADMIN_SSL_API.DISTRICTWISE_BY_STATUS(status, district),
          PUNJAB_ADMIN_SSL_API.DISTRICTWISE_BY_STATUS_ROOT(status, district),
        ],
        { method: 'GET' }
      );
      if (res.ok && res.data) {
        const json = res.data;
        const dataObj = json.data || {};
        const list =
          json.ssl ||
          dataObj.ssl ||
          json.shl ||
          dataObj.shl ||
          json.district_data ||
          dataObj.district_data ||
          json.lights ||
          dataObj.lights ||
          (Array.isArray(json.data) ? json.data : null) ||
          (Array.isArray(dataObj) ? dataObj : null) ||
          (Array.isArray(json) ? json : null) ||
          [];
        return Array.isArray(list) ? list : [];
      }
    } catch (e) {
      console.warn('[PunjabAdminService] Failed to load district lights:', district, e);
    }
    return [];
  }

  // ── Centralized Vendor Lookup & Resolution ──
  private vendorMapCache: Record<string, string> | null = null;
  private vendorMapPromise: Promise<Record<string, string>> | null = null;

  async getVendorMap(forceRefresh = false): Promise<Record<string, string>> {
    if (this.vendorMapCache && !forceRefresh) {
      return this.vendorMapCache;
    }
    if (this.vendorMapPromise && !forceRefresh) {
      return this.vendorMapPromise;
    }

    this.vendorMapPromise = (async () => {
      const vMap: Record<string, string> = {};

      try {
        const [assignData, dashData] = await Promise.allSettled([
          this.getAssignFormData(),
          this.getDashboard(),
        ]);

        if (assignData.status === 'fulfilled' && Array.isArray(assignData.value.vendors)) {
          assignData.value.vendors.forEach((v: any) => {
            const vid = v.id ?? v.vendor ?? v.inst_vendor;
            const vname = v.name ?? v.vendor_name;
            if (vid && vname) {
              vMap[String(vid).trim()] = String(vname).trim();
            }
          });
        }

        if (dashData.status === 'fulfilled') {
          if (Array.isArray(dashData.value.vendorswise)) {
            dashData.value.vendorswise.forEach((v: any) => {
              const vid = v.inst_vendor ?? v.vendor ?? v.id;
              const vname = v.vendor_name ?? v.name;
              if (vid && vname) {
                vMap[String(vid).trim()] = String(vname).trim();
              }
            });
          }
          if (Array.isArray(dashData.value.vendors)) {
            dashData.value.vendors.forEach((v: any) => {
              const vid = v.inst_vendor ?? v.vendor ?? v.id;
              const vname = v.name ?? v.vendor_name;
              if (vid && vname) {
                vMap[String(vid).trim()] = String(vname).trim();
              }
            });
          }
        }
      } catch (e) {
        console.warn('[PunjabAdminService] Error loading vendor map:', e);
      }

      this.vendorMapCache = vMap;
      this.vendorMapPromise = null;
      return vMap;
    })();

    return this.vendorMapPromise;
  }

  resolveVendorName(recordOrId: any, map?: Record<string | number, string> | null): string {
    if (!recordOrId) return '—';
    if (typeof recordOrId === 'string' || typeof recordOrId === 'number') {
      const key = String(recordOrId).trim();
      if (!key || key === '—' || key === '-') return '—';
      if (map && map[key]) return map[key];
      if (this.vendorMapCache && this.vendorMapCache[key]) return this.vendorMapCache[key];
      return `Vendor ${key}`;
    }

    const r = recordOrId;
    if (typeof r.vendors === 'string' && r.vendors.trim()) return r.vendors.trim();
    if (r.vendors && typeof r.vendors === 'object') {
      if (r.vendors.name) return r.vendors.name;
      if (r.vendors.vendor_name) return r.vendors.vendor_name;
    }
    if (r.vendor_name && typeof r.vendor_name === 'string' && r.vendor_name.trim()) {
      return r.vendor_name.trim();
    }
    const vid = r.vendor ?? r.inst_vendor ?? (r.vendors?.id);
    if (vid !== undefined && vid !== null && String(vid).trim() !== '') {
      const key = String(vid).trim();
      if (map && map[key]) return map[key];
      if (this.vendorMapCache && this.vendorMapCache[key]) return this.vendorMapCache[key];
      return `Vendor ${key}`;
    }
    return '—';
  }
}

export const punjabAdminService = new PunjabAdminService();
export default punjabAdminService;
