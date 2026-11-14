import { API_BASE_URL, authService } from '../../../../services/authService';
import { ARUNACHAL_ADMIN_SHL_API } from '../../Vendor_Management_APIS/Arunachal_Vendor_API';

/* ── Backend & Media Base URLs ── */
export const BACKEND_BASE = (API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

export const R2_BASE = (((import.meta as any).env?.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

export function getArunachalMediaCandidates(path?: string | null): string[] {
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

  candidates.push(`${BACKEND_BASE}/uploads/arunachal/installation/shl/assign/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/arunachal/installation/shl/light/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/arunachal/installation/shl/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/arunachal/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/arunachal/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/shl/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/arunachal/installation/shl/${filename}`);
    candidates.push(`${R2_BASE}/uploads/arunachal/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }
  candidates.push(`https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev/${filename}`);

  return Array.from(new Set(candidates));
}

export function resolveArunachalMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getArunachalMediaCandidates(path);
  return candidates[0] || `${BACKEND_BASE}/${path.replace(/^\/+/, '')}`;
}

export type ArunachalDashboardStatus =
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

export function normalizeArunachalDashboardStatus(rawStatus: string): ArunachalDashboardStatus {
  if (!rawStatus) return 'total';
  const clean = rawStatus.trim().toLowerCase();

  const exactMap: Record<string, ArunachalDashboardStatus> = {
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
  [key: string]: any;
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
  count?: number;
  id?: number;
}

export interface AssignFormDataResponse {
  vendors: VendorItem[];
  volumes: VolumeItem[];
}

export interface AssignLightPayload {
  vendor: number;
  state: string;
  volume: string;
  district: string;
  block: string;
  panchayat: string[];
  ldate: string;
  remark?: string;
}

export interface UpdateAssignPayload {
  id: number;
  vendor: number;
  state: string;
  volume: string;
  district: string;
  block: string;
  panchayat: string[];
  ldate: string;
  remark?: string | null;
}

export interface AssignLightRecord {
  id: number;
  company_id?: string | number;
  vendor: number;
  state: string;
  volume: string;
  district: string;
  block: string;
  panchayat: string[] | string;
  sdate?: string;
  ldate: string;
  sitecount: number | string;
  status: number; // 0 = Pending, 1 = Approved, 2 = Accepted
  remark?: string;
  remarks?: string;
  created_by?: string | number;
  updated_by?: string | number | null;
  created_at?: string;
  updated_at?: string;
  match_material?: number;
  insp_code?: string | null;
  uid_file?: string | null;
  battery_no_file?: string | null;
  panel_no_file?: string | null;
  sim_no_file?: string | null;
  imei_no_file?: string | null;
  file?: string | null;
  document?: string | null;
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
  assignShl: {
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
  district?: string;
  block?: string;
  panchayat?: string;
  address?: string;
  village?: string;
  post?: string;
  tehsil?: string;
  pin?: string;
  phase?: string;
  volume?: string;
  inst_vendor?: number | string;
  vendor?: number | string;
  vendor_name?: string;
  vendors?: {
    id: number;
    name: string;
  };
  beneficiary_name?: string;
  contact_person?: string;
  farmer_name?: string;
  customer_name?: string;
  contact_number?: string;
  contact_no?: string;
  phone?: string;
  panel_no?: string;
  module_no?: string;
  uuid_no?: string;
  pole_no?: string;
  battery_serial_no?: string;
  battery_no?: string;
  light_no?: string;
  luminary_no?: string;
  light_file?: string | null;
  file?: string;
  inst_file?: string;
  latitude?: string | number;
  longitude?: string | number;
  lat?: string | number;
  lng?: string | number;
  long?: string | number;
  inst_latitude?: string | number | null;
  inst_longitude?: string | number | null;
  inst_status?: number;
  inspection_status?: number;
  inspection_date?: string;
  inst_verify_status?: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  remark?: string;
  inst_remark?: string | null;
  inst_verify_remarks?: string;
  inst_date?: string;
  inst_verify_date?: string | null;
  inst_verify_by?: string | number | null;
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

export interface ShlDashboardData {
  loginId?: number;
  loginName?: string;
  company_id?: number;
  role?: string;
  state?: string;
  shldatas: {
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
  vendors?: Array<{ inst_vendor: number; vendor: number; name: string }>;
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

/* ═══════════════════ Service Class ═══════════════════ */

class ArunachalAdminService {
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

  private async fetchWithFallback(primaryUrl: string, fallbackUrl?: string, options: RequestInit = {}): Promise<Response> {
    try {
      const res = await fetch(primaryUrl, options);
      if (!res.ok && (res.status === 404 || res.status === 405 || res.status === 500) && fallbackUrl && fallbackUrl !== primaryUrl) {
        console.warn(`[ArunachalAdminService] ${res.status} on ${primaryUrl}, retrying fallback: ${fallbackUrl}`);
        try {
          const fallbackRes = await fetch(fallbackUrl, options);
          if (fallbackRes.ok) return fallbackRes;
        } catch {
          // ignore fallback error, return original response
        }
      }
      return res;
    } catch (err) {
      if (fallbackUrl && fallbackUrl !== primaryUrl) {
        console.warn(`[ArunachalAdminService] Network error on ${primaryUrl}, retrying fallback: ${fallbackUrl}`, err);
        return await fetch(fallbackUrl, options);
      }
      throw err;
    }
  }

  // ── 1. GET /assign (Dropdown Data: Vendors & Volumes) ──
  async getAssignFormData(): Promise<AssignFormDataResponse> {
    const res = await this.fetchWithFallback(
      ARUNACHAL_ADMIN_SHL_API.ASSIGN_FORM_DATA,
      ARUNACHAL_ADMIN_SHL_API.ASSIGN_FORM_DATA_ROOT,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
    if (!res.ok) throw new Error(`Failed to load assign form data (${res.status})`);
    const json: AdminApiResponse = await res.json();

    const rawVendors = json.vendors || (json.data && (json.data as any).vendors) || [];
    const rawVolumes = json.volumes || (json.data && (json.data as any).volumes) || [];

    const normalizedVolumes: VolumeItem[] = rawVolumes.map((v: any) =>
      typeof v === 'string' ? { volume: v } : { volume: String(v.volume ?? v) }
    );

    return {
      vendors: rawVendors,
      volumes: normalizedVolumes,
    };
  }

  // ── 2. GET /fetch-district?volume=... ──
  async fetchDistricts(volume: string | number): Promise<DistrictItem[]> {
    const res = await this.fetchWithFallback(
      ARUNACHAL_ADMIN_SHL_API.FETCH_DISTRICT(volume),
      ARUNACHAL_ADMIN_SHL_API.FETCH_DISTRICT_ROOT(volume),
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
    if (!res.ok) throw new Error(`Failed to load districts (${res.status})`);
    const json: AdminApiResponse = await res.json();
    return json.districts || (json.data && (json.data as any).districts) || json.data || [];
  }

  // ── 3. GET /fetch-block?volume=...&district=... ──
  async fetchBlocks(volume: string | number, district: string): Promise<BlockItem[]> {
    const res = await this.fetchWithFallback(
      ARUNACHAL_ADMIN_SHL_API.FETCH_BLOCK(volume, district),
      ARUNACHAL_ADMIN_SHL_API.FETCH_BLOCK_ROOT(volume, district),
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
    if (!res.ok) throw new Error(`Failed to load blocks (${res.status})`);
    const json: AdminApiResponse = await res.json();
    return json.blocks || (json.data && (json.data as any).blocks) || json.data || [];
  }

  // ── 4. GET /fetch-panchayat?volume=...&district=...&block=... ──
  async fetchPanchayats(volume: string | number, district: string, block: string): Promise<PanchayatItem[]> {
    const res = await this.fetchWithFallback(
      ARUNACHAL_ADMIN_SHL_API.FETCH_PANCHAYAT(volume, district, block),
      ARUNACHAL_ADMIN_SHL_API.FETCH_PANCHAYAT_ROOT(volume, district, block),
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
    if (!res.ok) throw new Error(`Failed to load panchayats (${res.status})`);
    const json: AdminApiResponse = await res.json();
    return json.panchayats || (json.data && (json.data as any).panchayats) || json.data || [];
  }

  // ── 5. POST /store-assign ──
  async storeAssign(payload: AssignLightPayload | FormData): Promise<AdminApiResponse> {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const headers = this.getHeaders();
    if (isFormData) {
      delete headers['Content-Type'];
      // Backend expects lowercase slug 'arunachal' for the installation state filter in view-assign
      if (!payload.has('state') || String(payload.get('state') || '').toLowerCase().includes('arunachal')) {
        payload.set('state', 'arunachal');
      }
    } else if (payload && typeof payload === 'object') {
      const p = payload as any;
      if (!p.state || String(p.state).toLowerCase().includes('arunachal')) {
        p.state = 'arunachal';
      }
    }
    const res = await this.fetchWithFallback(
      ARUNACHAL_ADMIN_SHL_API.STORE_ASSIGN,
      ARUNACHAL_ADMIN_SHL_API.STORE_ASSIGN_ROOT,
      {
        method: 'POST',
        headers,
        body: isFormData ? payload : JSON.stringify(payload),
      }
    );
    const json = await res.json();
    if (!res.ok || json.success === false || json.status === false) {
      const msg = json.message || 'Failed to assign lights';
      const err: any = new Error(msg);
      err.errors = json.errors;
      throw err;
    }
    return json;
  }

  // ── 6. GET /edit-assign/{id} ──
  async getEditAssign(id: string | number): Promise<EditAssignData> {
    const res = await this.fetchWithFallback(
      ARUNACHAL_ADMIN_SHL_API.EDIT_ASSIGN(id),
      ARUNACHAL_ADMIN_SHL_API.EDIT_ASSIGN_ROOT(id),
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
    if (!res.ok) throw new Error(`Failed to load assignment details (${res.status})`);
    const json = await res.json();
    return json.data || json;
  }

  // ── 7. POST /update-assign ──
  async updateAssign(payload: UpdateAssignPayload | FormData): Promise<AdminApiResponse> {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const headers = this.getHeaders();
    let assignId: string | number | undefined;

    if (isFormData) {
      delete headers['Content-Type'];
      if (!payload.has('state') || String(payload.get('state') || '').toLowerCase().includes('arunachal')) {
        payload.set('state', 'arunachal');
      }
      assignId = (payload.get('id') as string) || undefined;
    } else if (payload && typeof payload === 'object') {
      const p = payload as any;
      if (!p.state || String(p.state).toLowerCase().includes('arunachal')) {
        p.state = 'arunachal';
      }
      assignId = p.id;
    }

    let res = await this.fetchWithFallback(
      ARUNACHAL_ADMIN_SHL_API.UPDATE_ASSIGN,
      ARUNACHAL_ADMIN_SHL_API.UPDATE_ASSIGN_ROOT,
      {
        method: 'POST',
        headers,
        body: isFormData ? payload : JSON.stringify(payload),
      }
    );

    // Fallback if backend registered route as /update-assign/{id}
    if ((res.status === 404 || res.status === 405) && assignId) {
      try {
        if (isFormData && !payload.has('_method')) {
          payload.append('_method', 'PUT');
        }
        res = await this.fetchWithFallback(
          ARUNACHAL_ADMIN_SHL_API.UPDATE_ASSIGN_WITH_ID(assignId),
          ARUNACHAL_ADMIN_SHL_API.UPDATE_ASSIGN_WITH_ID_ROOT(assignId),
          {
            method: 'POST',
            headers,
            body: isFormData ? payload : JSON.stringify(payload),
          }
        );
      } catch (e) {
        console.warn('Fallback to UPDATE_ASSIGN_WITH_ID failed:', e);
      }
    }

    const json = await res.json();
    if (!res.ok || json.success === false || json.status === false) {
      const msg = json.message || 'Failed to update assignment';
      const err: any = new Error(msg);
      err.errors = json.errors;
      throw err;
    }
    return json;
  }

  // ── 8. GET /view-assign ──
  async getViewAssign(): Promise<ViewAssignResponse> {
    const res = await this.fetchWithFallback(
      ARUNACHAL_ADMIN_SHL_API.VIEW_ASSIGN_ROOT,
      ARUNACHAL_ADMIN_SHL_API.VIEW_ASSIGN,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
    if (!res.ok) throw new Error(`Failed to load assigned lights (${res.status})`);
    const json = await res.json();
    const data = json.data || {};
    const rawList =
      (Array.isArray(data.assignedlight) && data.assignedlight) ||
      (Array.isArray(data.assigned_light) && data.assigned_light) ||
      (Array.isArray(data.assignedLight) && data.assignedLight) ||
      (Array.isArray(data.assigned) && data.assigned) ||
      (Array.isArray(data.assign) && data.assign) ||
      (Array.isArray(json.assignedlight) && json.assignedlight) ||
      (Array.isArray(json.assigned_light) && json.assigned_light) ||
      (Array.isArray(data) && data) ||
      [];
    return {
      claimedapplicable: Number(data.claimedapplicable ?? 0),
      approvedsite: Number(data.approvedsite ?? 0),
      verifypending: Number(data.verifypending ?? 0),
      rejectsite: Number(data.rejectsite ?? 0),
      paymentsitecount: Number(data.paymentsitecount ?? 0),
      complete: Number(data.complete ?? 0),
      totalsite: Number(data.totalsite ?? 0),
      pendingsite: Number(data.pendingsite ?? 0),
      assignedlight: rawList,
    };
  }

  // ── 9. POST /approvel-assign/{id} (or approval-assign) ──
  async approveAssign(id: string | number): Promise<AdminApiResponse> {
    const res = await this.fetchWithFallback(
      ARUNACHAL_ADMIN_SHL_API.APPROVE_ASSIGN(id),
      ARUNACHAL_ADMIN_SHL_API.APPROVE_ASSIGN_ROOT(id),
      {
        method: 'POST',
        headers: this.getHeaders(),
      }
    );
    const json = await res.json();
    if (!res.ok || json.success === false || json.status === false) {
      throw new Error(json.message || 'Failed to approve assignment');
    }
    return json;
  }

  // ── 10. GET /view-installation (?page=1) ──
  async getViewInstallation(page?: number): Promise<ViewInstallationResponse> {
    const res = await this.fetchWithFallback(
      ARUNACHAL_ADMIN_SHL_API.VIEW_INSTALLATION(page),
      ARUNACHAL_ADMIN_SHL_API.VIEW_INSTALLATION_ROOT(page),
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
    if (!res.ok) throw new Error(`Failed to load installation verification (${res.status})`);
    const json = await res.json();
    const data = json.data || {};
    const summary: AssignSummaryCounts = {
      claimedapplicable: Number(data.claimedapplicable ?? 0),
      approvedsite: Number(data.approvedsite ?? 0),
      verifypending: Number(data.verifypending ?? 0),
      rejectsite: Number(data.rejectsite ?? 0),
      paymentsitecount: Number(data.paymentsitecount ?? 0),
      complete: Number(data.complete ?? 0),
      totalsite: Number(data.totalsite ?? 0),
      pendingsite: Number(data.pendingsite ?? 0),
    };

    const verification = Array.isArray(json.verification) ? json.verification : (Array.isArray(data.verification) ? data.verification : []);

    let verifiedObj = json.verified || data.verified;
    let verified: ViewInstallationResponse['verified'] = {
      current_page: 1,
      data: [],
      per_page: 100,
      total: 0,
      last_page: 1,
    };

    if (verifiedObj) {
      if (Array.isArray(verifiedObj)) {
        verified = {
          current_page: 1,
          data: verifiedObj,
          per_page: verifiedObj.length || 100,
          total: verifiedObj.length,
          last_page: 1,
        };
      } else if (Array.isArray(verifiedObj.data)) {
        verified = {
          current_page: Number(verifiedObj.current_page ?? 1),
          data: verifiedObj.data,
          per_page: Number(verifiedObj.per_page ?? 100),
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

  // ── 11. POST /verify-installation-status ──
  async verifyInstallationStatus(id: number, status: 1 | 2, remark?: string): Promise<AdminApiResponse> {
    const payload: Record<string, any> = { id, status };
    if (remark) {
      payload.remark = remark;
      payload.inst_verify_remarks = remark;
    }
    const res = await this.fetchWithFallback(
      ARUNACHAL_ADMIN_SHL_API.VERIFY_INSTALLATION_STATUS,
      ARUNACHAL_ADMIN_SHL_API.VERIFY_INSTALLATION_STATUS_ROOT,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    if (!res.ok || json.success === false || json.status === false) {
      throw new Error(json.message || 'Failed to update verification status');
    }
    return json;
  }

  // ── 12. GET /dashboard ──
  async getDashboard(): Promise<ShlDashboardData> {
    const res = await this.fetchWithFallback(
      ARUNACHAL_ADMIN_SHL_API.DASHBOARD,
      ARUNACHAL_ADMIN_SHL_API.DASHBOARD_ROOT,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
    if (!res.ok) throw new Error(`Failed to load dashboard (${res.status})`);
    const json = await res.json();
    const data = json.data || {};

    const rawShl = data.shldatas || {};
    const shldatas: ShlDashboardData['shldatas'] = {
      site_count: Number(rawShl.site_count ?? 0),
      site_assigned: Number(rawShl.site_assigned ?? 0),
      site_not_assigned: Number(rawShl.site_not_assigned ?? 0),
      complete: Number(rawShl.complete ?? 0),
      pending: Number(rawShl.pending ?? 0),
      verify_pending: Number(rawShl.verify_pending ?? 0),
      verify_approved: Number(rawShl.verify_approved ?? 0),
      verify_reject: Number(rawShl.verify_reject ?? 0),
      claim_applicable: Number(rawShl.claim_applicable ?? 0),
      claim_raised: Number(rawShl.claim_raised ?? 0),
      claim_approved: Number(rawShl.claim_approved ?? 0),
      claim_pending: Number(rawShl.claim_pending ?? 0),
      inst_pay_done: Number(rawShl.inst_pay_done ?? 0),
      inst_pay_pending: Number(rawShl.inst_pay_pending ?? 0),
    };

    return {
      loginId: data.loginId,
      loginName: data.loginName,
      company_id: data.company_id,
      role: data.role,
      state: data.state || 'arunachal',
      shldatas,
      payment_amount: data.payment_amount ?? 0,
      vendors: Array.isArray(data.vendors) ? data.vendors : [],
      vendorswise: Array.isArray(data.vendorswise) ? data.vendorswise : [],
      districtwise: Array.isArray(data.districtwise) ? data.districtwise : [],
      vendor_installation_month: Array.isArray(data.vendor_installation_month) ? data.vendor_installation_month : [],
      vendor_today_installation: Array.isArray(data.vendor_today_installation) ? data.vendor_today_installation : [],
    };
  }

  // ── 13. GET /view-dashboard/{status} ──
  async getViewDashboard(status: string): Promise<LightVerificationItem[]> {
    const res = await this.fetchWithFallback(
      ARUNACHAL_ADMIN_SHL_API.VIEW_DASHBOARD(status),
      ARUNACHAL_ADMIN_SHL_API.VIEW_DASHBOARD_ROOT(status),
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
    if (!res.ok) throw new Error(`Failed to load lights by status: ${status} (${res.status})`);
    const json = await res.json();
    const data = json.data || {};
    return data.shl || (Array.isArray(data) ? data : []);
  }

  // ── 14. GET /vendorwise-data/{status}/{vendor} ──
  async getVendorWiseData(status: string, vendor: string | number): Promise<LightVerificationItem[]> {
    const primary = ARUNACHAL_ADMIN_SHL_API.VENDORWISE_DATA(status, vendor);
    const typoFallback = ARUNACHAL_ADMIN_SHL_API.VENDORWISE_DATA_TYPO(status, vendor);
    const rootFallback = ARUNACHAL_ADMIN_SHL_API.VENDORWISE_DATA_ROOT(status, vendor);

    let res: Response;
    try {
      res = await this.fetchWithFallback(primary, typoFallback, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.status === 404) {
        res = await fetch(rootFallback, { method: 'GET', headers: this.getHeaders() });
      }
    } catch {
      res = await fetch(rootFallback, { method: 'GET', headers: this.getHeaders() });
    }

    if (!res.ok) throw new Error(`Failed to load vendorwise lights (${res.status})`);
    const json = await res.json();
    const data = json.data || {};
    return data.shl || (Array.isArray(data) ? data : []);
  }

  // ── 15. GET /districtwise-data/{status}/{district} ──
  async getDistrictWiseData(status: string, district: string): Promise<LightVerificationItem[]> {
    const res = await this.fetchWithFallback(
      ARUNACHAL_ADMIN_SHL_API.DISTRICTWISE_DATA(status, district),
      ARUNACHAL_ADMIN_SHL_API.DISTRICTWISE_DATA_ROOT(status, district),
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
    if (!res.ok) throw new Error(`Failed to load districtwise lights (${res.status})`);
    const json = await res.json();
    const data = json.data || {};
    return data.shl || (Array.isArray(data) ? data : []);
  }
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 1734fe6c6a1a76ca36492f9e29deed599b8f9488

  // ── 16. Centralized Vendor Lookup & Resolution ──
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
      const vMap: Record<string, string> = {
        '142': 'App Testing',
        '212': 'mohit',
      };

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
        console.warn('[ArunachalAdminService] Error loading vendor map:', e);
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
      if (key === '142') return 'App Testing';
      if (key === '212') return 'mohit';
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
      if (key === '142') return 'App Testing';
      if (key === '212') return 'mohit';
      return `Vendor ${key}`;
    }
    return '—';
  }
<<<<<<< HEAD
=======
=======
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
>>>>>>> 1734fe6c6a1a76ca36492f9e29deed599b8f9488
}

export const arunachalAdminService = new ArunachalAdminService();
export default arunachalAdminService;
