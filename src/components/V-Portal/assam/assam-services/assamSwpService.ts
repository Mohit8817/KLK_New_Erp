import { API_BASE_URL, authService } from '../../../../services/authService';
import { ASSAM_SWP_API } from '../../V_Portal_APIS/Assam_API';

/* ── Backend & Media Base URLs ── */
export const BACKEND_BASE = (API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

export const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

export function getAssamMediaCandidates(path?: string | null): string[] {
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

  // SWP specific upload paths per docs
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/assign/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/module/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/inverter_vfd/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/running_water/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/payment/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/assam/installation/swp/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }
  candidates.push(`https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev/${filename}`);

  return Array.from(new Set(candidates));
}

export function resolveAssamMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getAssamMediaCandidates(path);
  return candidates[0] || `${BACKEND_BASE}/${path.replace(/^\/+/, '')}`;
}

/* ═══════════════════ Type Definitions ═══════════════════ */

export interface FarmerNameFather {
  id?: number;
  farmer_name?: string;
  father_name?: string;
}

export interface AssignedSiteItem {
  id: number;
  company_id?: number;
  vendor?: number;
  state?: string;
  project?: string;
  purpose?: string;
  site_id?: string | number[];
  status: number; // 0 = Inactive, 1 = Assigned, 2 = Accepted
  created_at?: string;
  deadline_date?: string;
  remarks?: string;
  file?: string | null;
  vendors?: { id: number; name: string };
  Names?: FarmerNameFather[];
  [key: string]: any;
}

export interface AssignSiteDetailName {
  id: number;
  state?: string;
  district?: string;
  tehsil?: string;
  block?: string;
  village?: string;
  farmer_name?: string;
  farmer_contact?: string;
  father_name?: string;
  customer_no?: string;
  pump_capacity?: string;
  pump_type?: string;
  pump_sub_type?: string;
  [key: string]: any;
}

export interface AssignSiteDetailResponse {
  id: number;
  site_id?: string | number[];
  status: number;
  Names?: AssignSiteDetailName[];
  [key: string]: any;
}

export interface InstallableSiteName {
  site_id: number;
  site_name: string;
}

export interface InstallSiteDetails {
  id: number;
  state?: string;
  district?: string;
  block?: string;
  village?: string;
  tehsil?: string;
  farmer_name?: string;
  father_name?: string;
  customer_no?: string;
  farmer_contact?: string;
  pump_capacity?: string;
  pump_type?: string;
  pump_sub_type?: string;
  [key: string]: any;
}

export interface InstalledSiteItem {
  id: number;
  company_id?: number;
  state?: string;
  district?: string;
  block?: string;
  village?: string;
  tehsil?: string;
  farmer_name?: string;
  father_name?: string;
  farmer_contact?: string;
  customer_no?: string;
  pump_capacity?: string;
  pump_type?: string;
  pump_sub_type?: string;
  inverter_no?: string;
  vfd_no?: string;
  module_serial_no?: string | string[];
  module_image?: string;
  inverter_vfd_image?: string;
  running_water_image?: string;
  inst_latitude?: string;
  inst_longitude?: string;
  inst_remarks?: string;
  inst_status: number; // 0 = Pending, 1 = Installed
  inst_date?: string;
  inst_verify_status: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  inst_verify_remarks?: string;
  inst_doc?: string;
  inst_doc_date?: string;
  inst_doc_status?: number; // 1 = Pending, 2 = Approved, 3 = Rejected
  inst_doc_remarks?: string;
  inst_claim_status: number; // 0 = Not Raised, 1 = Raised, 2 = Approved, 3 = Rejected
  inst_pay_status: number; // 0 = Pending, 1 = Paid, 2 = Partially
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface ViewInstallSiteSummary {
  total: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  doc_approved: number;
  doc_pending: number;
  doc_reject: number;
  claim_approved: number;
  claim_pending: number;
  claim_reject: number;
  paid: number;
  partially: number;
  [key: string]: any;
}

export interface ViewInstallSiteResponse {
  assign: number;
  install_detail: ViewInstallSiteSummary;
  sites: InstalledSiteItem[];
}

export interface SiteUpdateDataResponse {
  ven?: { name: string };
  site: InstalledSiteItem;
}

export interface ClaimItem {
  id: number;
  company_id?: number;
  project?: string;
  vendor_id?: string | number;
  date?: string;
  type?: string;
  state?: string;
  claim_status: number; // 1 = Raised, 2 = Approved, 3 = Rejected
  amount: string | number;
  site_id: string | number[];
  remarks?: string;
  file?: string;
  payment_amount?: string | number;
  payment_balance?: string | number;
  payment_date?: string;
  payment_remarks?: string;
  payment_status?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface ClaimEligibleSite {
  id: number;
  farmer_name: string;
}

export interface ViewClaimResponse {
  data: ClaimItem[];
  sites: ClaimEligibleSite[];
}

export interface DashboardSwpSummary {
  site_count: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  doc_approved: number;
  doc_pending: number;
  doc_reject: number;
  inst_claim_raised: number;
  inst_claim_approved: number;
  inst_claim_reject: number;
  inst_pay_complete: number;
  inst_pay_partially: number;
  inst_pay_pending: number;
  [key: string]: any;
}

export interface DistrictInstallItem {
  district: string;
  inst_complete: number;
}

export interface DistrictWiseDetail {
  district: string;
  site_count: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  doc_approved: number;
  doc_pending: number;
  doc_reject: number;
  inst_claim_raised: number;
  inst_claim_approved: number;
  inst_claim_reject: number;
  inst_pay_complete: number;
  inst_pay_partially: number;
  inst_pay_pending: number;
  [key: string]: any;
}

export interface DistrictMonthItem {
  month_year: string;
  monthly_installations: number;
}

export interface AssamSwpDashboardResponse {
  swp: DashboardSwpSummary;
  district_install?: DistrictInstallItem[];
  districtwise?: DistrictWiseDetail[];
  district_installation_month?: DistrictMonthItem[];
  monthly_installations?: DistrictMonthItem[];
}

export interface ApiResponse<T = any> {
  status?: boolean;
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  error?: string;
  meta?: {
    status?: string;
    count?: number;
    district?: string;
  };
}

/* ═══════════════════ Service Implementation ═══════════════════ */

class AssamSwpService {
  private getHeaders(isMultipart = false): Record<string, string> {
    const token = authService.getToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  private async fetchWithFallback(urlOrEndpoint: string, options: RequestInit = {}): Promise<Response> {
    let urls: string[] = [];
    const baseClean = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
    const altBase = baseClean.endsWith('/api') ? baseClean.slice(0, -4) : `${baseClean}/api`;

    if (urlOrEndpoint.startsWith('http://') || urlOrEndpoint.startsWith('https://')) {
      const u = new URL(urlOrEndpoint);
      const cleanPath = (u.pathname + u.search).replace(/^\/api/, '');
      urls = [
        urlOrEndpoint,
        `${baseClean}${cleanPath}`,
        `${altBase}${cleanPath}`,
        `${baseClean}/v${cleanPath}`,
      ];
      urls = Array.from(new Set(urls));
    } else {
      const cleanEndpoint = urlOrEndpoint.startsWith('/') ? urlOrEndpoint : `/${urlOrEndpoint}`;
      urls = [
        `${baseClean}${cleanEndpoint}`,
        `${altBase}${cleanEndpoint}`,
        `${baseClean}/v${cleanEndpoint}`,
      ];
    }

    let lastError: Error | null = null;
    let lastRes: Response | null = null;

    for (const u of urls) {
      try {
        const res = await fetch(u, options);
        if (res.status === 404) {
          lastRes = res;
          continue;
        }
        return res;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (lastRes) return lastRes;
    throw lastError || new Error(`Failed to request ${urlOrEndpoint}`);
  }

  /**
   * 1. Assigned Installation List
   * GET /assam/swp-view-assign-installation-sites
   */
  async getAssignedInstallationSites(): Promise<AssignedSiteItem[]> {
    const res = await this.fetchWithFallback(ASSAM_SWP_API.ASSIGNED_SITES, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: any = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch assigned installation sites (${res.status})`);
    }
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json)) return json;
    if (json.data && typeof json.data === 'object') return [json.data];
    return [];
  }

  /**
   * 2. Assign Site Detail
   * GET /assam/swp-view-assign-installation-detail?id=12
   */
  async getAssignSiteDetail(id: number | string | { id?: number | string; assign_id?: number | string; assignment_id?: number | string }): Promise<AssignSiteDetailResponse> {
    const rawId =
      typeof id === 'object' && id !== null
        ? (id.assign_id ?? (id as any).assignment_id ?? (id as any).assignId ?? (id as any).assign?.id ?? id.id)
        : id;
    const numId = Number(rawId);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error(`Invalid assignment ID provided (${String(rawId)}). A valid integer assign ID is required.`);
    }
    const cleanId = Math.floor(numId);
    const url = ASSAM_SWP_API.ASSIGN_SITE_DETAIL(cleanId);
    const res = await this.fetchWithFallback(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok && !json.status && !json.success) {
      const errList = json.errors?.id ? json.errors.id.join(', ') : json.message;
      throw new Error(errList || `Failed to fetch assign site detail (${res.status})`);
    }
    return json.data || json;
  }

  /**
   * 3. Accept Installation
   * GET /assam/swp-assign-installation-accept?id=12
   * id (integer): required (assign ka id; backend validation: exists:assigns,id)
   * Effect: assigns.status = 2 set hota hai aur us assign ki sabhi sites me assam_swps.inst_accept = 1 ho jata hai.
   */
  async acceptInstallation(id: number | string | { id?: number | string; assign_id?: number | string; assignment_id?: number | string }): Promise<ApiResponse> {
    const rawId =
      typeof id === 'object' && id !== null
        ? (id.assign_id ?? (id as any).assignment_id ?? (id as any).assignId ?? (id as any).assign?.id ?? id.id)
        : id;
    const numId = Number(rawId);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error(
        `Invalid assignment ID provided: "${String(rawId)}". A valid integer assignment ID (assigns.id) is required.`
      );
    }
    const cleanId = Math.floor(numId);
    const url = ASSAM_SWP_API.ACCEPT_INSTALLATION(cleanId);
    const res = await this.fetchWithFallback(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: ApiResponse = await res.json().catch(() => ({}));
    if (!res.ok || json.status === false || json.success === false) {
      const fieldError = json.errors ? Object.values(json.errors).flat().join(', ') : '';
      const err = new Error(fieldError || json.message || `Failed to accept installation (${res.status})`);
      (err as any).status = res.status;
      (err as any).data = json;
      throw err;
    }
    return json;
  }

  /**
   * 4. Installable Site Name List
   * GET /assam/swp-install-site-name
   */
  async getInstallableSiteNameList(): Promise<InstallableSiteName[]> {
    const res = await this.fetchWithFallback(ASSAM_SWP_API.INSTALL_SITE_NAME_LIST, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: ApiResponse<InstallableSiteName[]> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch installable sites list (${res.status})`);
    }
    return Array.isArray(json.data) ? json.data : [];
  }

  /**
   * 5. Install Site Details
   * GET /assam/swp-install-site-details?site_id=101
   */
  async getInstallSiteDetails(siteId: number | string): Promise<InstallSiteDetails> {
    const url = ASSAM_SWP_API.INSTALL_SITE_DETAILS(siteId);
    const res = await this.fetchWithFallback(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: ApiResponse<InstallSiteDetails> = await res.json();
    if (!res.ok || (json.status === false || json.success === false)) {
      const errList = json.errors?.site_id ? json.errors.site_id.join(', ') : json.message;
      throw new Error(errList || `Failed to fetch install site details (${res.status})`);
    }
    return json.data || (json as any);
  }

  /**
   * 6. Site Install Store
   * POST /assam/swp-install-site-store (multipart/form-data)
   */
  async storeSiteInstall(formData: FormData): Promise<ApiResponse> {
    const res = await this.fetchWithFallback(ASSAM_SWP_API.INSTALL_SITE_STORE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json: ApiResponse = await res.json();
    if (!res.ok || json.status === false || json.success === false) {
      let msg = json.message;
      if (json.errors && Object.keys(json.errors).length > 0) {
        msg = Object.entries(json.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n');
      }
      throw new Error(msg || `Failed to submit installation (${res.status})`);
    }
    return json;
  }

  /**
   * 7. View Install Site (Summary + List)
   * GET /assam/swp-view-install-site
   */
  async getViewInstallSite(): Promise<ViewInstallSiteResponse> {
    const res = await this.fetchWithFallback(ASSAM_SWP_API.VIEW_INSTALL_SITE, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: any = await res.json();
    if (!res.ok && !json.status && !json.success && !Array.isArray(json)) {
      throw new Error(json.message || `Failed to fetch installed sites (${res.status})`);
    }

    // Extract sites array robustly from all backend response formats
    let sites: InstalledSiteItem[] = [];
    if (Array.isArray(json)) {
      sites = json;
    } else if (Array.isArray(json.data)) {
      sites = json.data;
    } else if (Array.isArray(json.sites)) {
      sites = json.sites;
    } else if (Array.isArray(json.data?.sites)) {
      sites = json.data.sites;
    }

    // Normalize site fields (e.g. module_serial_no, latitude, longitude, string status codes)
    sites = sites.map((s: any) => {
      const rawDoc = s.inst_doc || s.doc_file || s.document || s.doc || s.file || '';
      const rawDocStatus = s.inst_doc_status ?? s.doc_status ?? s.document_status;
      const numDocStatus =
        rawDocStatus !== undefined && rawDocStatus !== null && rawDocStatus !== ''
          ? Number(rawDocStatus)
          : (rawDoc ? 1 : 0);

      return {
        ...s,
        inst_doc: rawDoc,
        inst_doc_status: numDocStatus,
        module_serials: s.module_serials || s.module_serial_no || '',
        module_serial_no: s.module_serial_no || s.module_serials || '',
        inst_latitude: s.inst_latitude || s.latitude || '',
        inst_longitude: s.inst_longitude || s.longitude || '',
        latitude: s.latitude || s.inst_latitude || '',
        longitude: s.longitude || s.inst_longitude || '',
        inst_verify_status: Number(s.inst_verify_status ?? s.verify_status ?? 0),
        inst_claim_status: Number(s.inst_claim_status ?? s.claim_status ?? 0),
        inst_status: Number(s.inst_status ?? 0),
      };
    });

    const rawDetail = json.data?.install_detail || json.install_detail;
    const install_detail = rawDetail || {
      total: sites.length,
      complete: sites.filter((s) => Number(s.inst_status) === 1 || Number(s.complete) === 1).length,
      pending: sites.filter((s) => !s.inst_status || Number(s.inst_status) === 0).length,
      verify_approved: sites.filter((s) => Number(s.inst_verify_status) === 1).length,
      verify_pending: sites.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status) === 0).length,
      verify_reject: sites.filter((s) => Number(s.inst_verify_status) === 2).length,
      doc_approved: sites.filter((s) => Number(s.inst_doc_status) === 2).length,
      doc_pending: sites.filter((s) => Number(s.inst_doc_status) === 1).length,
      doc_reject: sites.filter((s) => Number(s.inst_doc_status) === 3).length,
      claim_approved: sites.filter((s) => Number(s.inst_claim_status) === 2).length,
      claim_pending: sites.filter((s) => Number(s.inst_claim_status) === 1).length,
      claim_reject: sites.filter((s) => Number(s.inst_claim_status) === 3).length,
      paid: sites.filter((s) => Number(s.inst_pay_status) === 1).length,
      partially: sites.filter((s) => Number(s.inst_pay_status) === 2).length,
    };

    return {
      assign: Number(json.data?.assign ?? json.assign ?? sites.length),
      install_detail,
      sites,
    };
  }

  /**
   * 8. Update Install Site (Load for Edit)
   * GET /assam/swp-install-site-update?id=101
   */
  async getInstallSiteForUpdate(id: number | string): Promise<SiteUpdateDataResponse> {
    const url = ASSAM_SWP_API.INSTALL_SITE_UPDATE(id);
    const res = await this.fetchWithFallback(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: ApiResponse<SiteUpdateDataResponse> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to load site details for update (${res.status})`);
    }
    return json.data || (json as any);
  }

  /**
   * 9. Update Install Site Store
   * POST /assam/swp-install-site-update-store (multipart/form-data)
   */
  async updateSiteInstall(formData: FormData): Promise<ApiResponse> {
    const res = await this.fetchWithFallback(ASSAM_SWP_API.INSTALL_SITE_UPDATE_STORE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json: ApiResponse = await res.json();
    if (!res.ok || json.status === false || json.success === false) {
      let msg = json.message;
      if (json.errors && Object.keys(json.errors).length > 0) {
        msg = Object.entries(json.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n');
      }
      throw new Error(msg || `Failed to update installation (${res.status})`);
    }
    return json;
  }

  /**
   * 10. Installation Document Submit
   * POST /assam/swp-installation-doc-submit (multipart/form-data)
   * Required payload: site_id, doc_file
   */
  async submitInstallationDoc(formData: FormData): Promise<ApiResponse> {
    // Ensure both site_id and doc_file are populated even if caller supplied alternative keys
    if (!formData.has('site_id') && formData.has('id')) {
      formData.append('site_id', formData.get('id') as string);
    }
    if (!formData.has('doc_file') && formData.has('inst_doc')) {
      formData.append('doc_file', formData.get('inst_doc') as Blob);
    }

    const res = await this.fetchWithFallback(ASSAM_SWP_API.DOC_SUBMIT, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json: ApiResponse = await res.json();
    if (!res.ok || json.status === false || json.success === false) {
      let msg = json.message;
      if (json.errors && Object.keys(json.errors).length > 0) {
        msg = Object.entries(json.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n');
      }
      throw new Error(msg || `Failed to submit installation document (${res.status})`);
    }
    return json;
  }

  /**
   * 11. View Claim
   * GET /assam/swp-installation-claim
   */
  async getViewClaims(): Promise<ViewClaimResponse> {
    const res = await this.fetchWithFallback(ASSAM_SWP_API.VIEW_CLAIM, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: ApiResponse<any> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch claims (${res.status})`);
    }
    const rawData = json.data;
    let claims: ClaimItem[] = [];
    let sites: ClaimEligibleSite[] = [];

    if (Array.isArray(rawData)) {
      claims = rawData;
    } else if (rawData && typeof rawData === 'object') {
      claims = Array.isArray(rawData.data) ? rawData.data : Array.isArray(rawData.claims) ? rawData.claims : [];
      sites = Array.isArray(rawData.sites) ? rawData.sites : [];
    }

    if (Array.isArray(json.sites) && sites.length === 0) {
      sites = json.sites;
    }

    return { data: claims, sites };
  }

  /**
   * 12. Add Claim
   * POST /assam/swp-installation-add-claim (multipart/form-data)
   */
  async addClaim(formData: FormData): Promise<ApiResponse> {
    const res = await this.fetchWithFallback(ASSAM_SWP_API.ADD_CLAIM, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json: ApiResponse = await res.json();
    if (!res.ok || json.status === false || json.success === false) {
      let msg = json.message;
      if (json.errors && Object.keys(json.errors).length > 0) {
        msg = Object.entries(json.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n');
      }
      throw new Error(msg || `Failed to raise payment claim (${res.status})`);
    }
    return json;
  }

  /**
   * 13. Update Claim
   * POST /assam/swp-installation-update-claim (multipart/form-data)
   */
  async updateClaim(formData: FormData): Promise<ApiResponse> {
    // Backend requires 'update_id' field
    if (formData.has('id') && !formData.has('update_id')) {
      const idVal = formData.get('id');
      if (idVal) formData.append('update_id', String(idVal));
    }
    // Backend validates 'site_id' as array. Delete scalar 'site_id' if present alongside 'site_id[]'
    if (formData.has('site_id') && formData.has('site_id[]')) {
      formData.delete('site_id');
    }

    const res = await this.fetchWithFallback(ASSAM_SWP_API.UPDATE_CLAIM, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json: ApiResponse = await res.json();
    if (!res.ok || json.status === false || json.success === false) {
      let msg = json.message;
      if (json.errors && Object.keys(json.errors).length > 0) {
        msg = Object.entries(json.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n');
      }
      throw new Error(msg || `Failed to update claim (${res.status})`);
    }
    return json;
  }

  /**
   * 14. Installation Dashboard
   * GET /assam/swp-installation-dashboard
   */
  async getDashboardData(): Promise<AssamSwpDashboardResponse> {
    const res = await this.fetchWithFallback(ASSAM_SWP_API.DASHBOARD, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: ApiResponse<AssamSwpDashboardResponse> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch dashboard data (${res.status})`);
    }
    const raw = json.data || (json as any);
    return {
      swp: raw.swp || {
        site_count: 0,
        complete: 0,
        pending: 0,
        verify_pending: 0,
        verify_approved: 0,
        verify_reject: 0,
        doc_approved: 0,
        doc_pending: 0,
        doc_reject: 0,
        inst_claim_raised: 0,
        inst_claim_approved: 0,
        inst_claim_reject: 0,
        inst_pay_complete: 0,
        inst_pay_partially: 0,
        inst_pay_pending: 0,
      },
      district_install: Array.isArray(raw.district_install) ? raw.district_install : [],
      districtwise: Array.isArray(raw.districtwise) ? raw.districtwise : [],
      district_installation_month: Array.isArray(raw.district_installation_month)
        ? raw.district_installation_month
        : Array.isArray(raw.monthly_installations)
        ? raw.monthly_installations
        : [],
    };
  }

  /**
   * 15. View Dashboard By Status
   * GET /assam/swp-installation-view-dashboard/{status}
   */
  async getDashboardByStatus(status: string): Promise<{ meta?: any; data: InstalledSiteItem[] }> {
    const url = ASSAM_SWP_API.VIEW_DASHBOARD_BY_STATUS(status);
    const res = await this.fetchWithFallback(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: ApiResponse<InstalledSiteItem[]> = await res.json();
    if (!res.ok || json.status === false || json.success === false) {
      throw new Error(json.message || `Failed to fetch sites by status (${res.status})`);
    }
    return {
      meta: json.meta,
      data: Array.isArray(json.data) ? json.data : [],
    };
  }

  /**
   * 16. Districtwise By Status
   * GET /assam/swp-installation-view-districtwise/{status}/{district}
   */
  async getDistrictwiseByStatus(status: string, district: string): Promise<{ meta?: any; data: InstalledSiteItem[] }> {
    const url = ASSAM_SWP_API.VIEW_DISTRICTWISE_BY_STATUS(status, district);
    const res = await this.fetchWithFallback(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: ApiResponse<InstalledSiteItem[]> = await res.json();
    if (!res.ok || json.status === false || json.success === false) {
      throw new Error(json.message || `Failed to fetch district sites by status (${res.status})`);
    }
    return {
      meta: json.meta,
      data: Array.isArray(json.data) ? json.data : [],
    };
  }
}

export const assamSwpService = new AssamSwpService();
export default assamSwpService;
